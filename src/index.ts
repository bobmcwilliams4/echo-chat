// Echo Chat - Universal AI Chat Worker
// ONE worker that serves as the AI chat backend for EVERY website and program
// Built by Bobby Don McWilliams II | Echo Omega Prime

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, ChatRequest, ChatResponse, SiteConfig, RelayCommand } from './types';
import { authenticateUser, isCommanderRequest, updateUserAuthority } from './bloodline';
import { detectEmotion, selectPersonalityByEmotion, getEmotionTag } from './emotion';
import { getPersonalityForSite, listPersonalities, getPersonality } from './personalities';
import { engageEchoMode } from './echo-mode';
import { routeLLM } from './llm';
import { loadFullContext, storeToAllMemory, searchAllMemory, getCortexHealth, buildCortexContextString } from './cortex';
import { getOrCreateUser, getSiteConfig, getConversationHistory, storeMessage, getMemories, storeMemory, auditLog, getStats, registerSite, updateSite } from './memory';
import { buildSystemPrompt, buildMessagesArray } from './prompt-builder';
import { generateVoice } from './voice';
import { executeRelayCommand, canUseRelay, getRelayStatus, detectRelayCommand } from './relay';
import { querySwarmTrinity, querySwarmProcess, getSwarmStatus, getFullInfrastructureStatus, checkServiceHealth } from './services';

type HonoEnv = { Bindings: Env };
const app = new Hono<HonoEnv>();

// --- CORS ---
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Echo-API-Key', 'X-Site-ID', 'X-User-ID'],
  maxAge: 86400,
}));

// --- Helper: generate session ID ---
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// --- Helper: auth from request ---
function getApiKey(c: { req: { header: (name: string) => string | undefined } }): string | undefined {
  return c.req.header('X-Echo-API-Key') ?? c.req.header('Authorization')?.replace('Bearer ', '');
}

// ============================================================
// POST /chat - Main chat endpoint
// ============================================================
app.post('/chat', async (c) => {
  const start = Date.now();
  const env = c.env;

  let body: ChatRequest;
  try {
    body = await c.req.json<ChatRequest>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { message, user_id, site_id, session_id, personality: reqPersonality, mode, enable_voice, command, email } = body;
  if (!message || !user_id || !site_id) {
    return c.json({ error: 'message, user_id, and site_id are required' }, 400);
  }

  const currentSessionId = session_id ?? generateSessionId();

  try {
    // 1. Get or create user profile
    const user = await getOrCreateUser(env.DB, user_id, email);

    // 2. Authenticate user (bloodline check)
    const auth = authenticateUser(user, email ?? user.email ?? undefined, env.COMMANDER_EMAIL);

    // 3. Update authority if Commander detected
    if (auth.is_commander && user.is_commander !== 1) {
      c.executionCtx.waitUntil(updateUserAuthority(env.DB, user_id, email, env.COMMANDER_EMAIL));
    }

    // 4. Load site config
    const siteConfig = await getSiteConfig(env.DB, site_id, env.CACHE);

    // 5. Get conversation history
    const maxHistory = siteConfig?.max_history ?? 40;
    const history = await getConversationHistory(env.DB, user_id, site_id, maxHistory);

    // 6. Load memory cortex (all 5 systems in parallel)
    const cortex = await loadFullContext(env, user_id, message);

    // 7. Detect emotion
    const emotion = detectEmotion(message);

    // 8. Select personality
    const selectedPersonalityId = selectPersonalityByEmotion(
      emotion,
      reqPersonality ?? user.preferred_personality,
      siteConfig?.default_personality ?? env.DEFAULT_PERSONALITY,
      auth.is_commander,
    );
    const personality = getPersonalityForSite(siteConfig, reqPersonality ?? selectedPersonalityId);

    // 9. Commander relay command check
    let relayResult: unknown = undefined;
    if (auth.is_commander && command) {
      const result = await executeRelayCommand(env, auth, command);
      relayResult = result;
    } else if (auth.is_commander) {
      const detected = detectRelayCommand(message);
      if (detected) {
        const result = await executeRelayCommand(env, auth, detected);
        relayResult = result;
      }
    }

    // 10. Echo Mode (doctrine lookup)
    const echoMode = await engageEchoMode(env, message, mode);

    // 11. Swarm mode
    let swarmResult = null;
    if (mode === 'swarm') {
      swarmResult = await querySwarmTrinity(env, message);
    }

    // 12. Load local memories for context
    const localMems = await getMemories(env.DB, user_id, 10);
    const localMemoriesStr = localMems.length > 0
      ? localMems.map(m => `[${m.memory_type}] ${m.content}`).join('\n')
      : '';

    // 13. Build system prompt (12 layers)
    const systemPrompt = buildSystemPrompt({
      personality,
      auth,
      cortex,
      doctrineContext: echoMode.doctrineContext,
      swarmResult,
      siteConfig,
      voiceEnabled: enable_voice ?? (siteConfig?.voice_enabled === 1),
      env,
      localMemories: localMemoriesStr,
    });

    // 14. Build messages array
    const messages = buildMessagesArray(systemPrompt, history, message, maxHistory);

    // If relay result, inject it
    if (relayResult) {
      const relayContent = `[RELAY RESULT]: ${JSON.stringify(relayResult, null, 2)}`;
      messages.splice(messages.length - 1, 0, {
        role: 'system',
        content: `The Commander issued a relay command. Here is the result:\n${relayContent}\nIncorporate this into your response.`,
      });
    }

    // 15. Route to LLM
    const llmResponse = await routeLLM(messages, env, personality, mode);

    // 16. Extract emotion from response
    const responseEmotion = emotion.dominant;

    // 17. Store messages to D1
    c.executionCtx.waitUntil(
      storeMessage(
        env.DB, user_id, site_id, 'user', message, personality.id, emotion.dominant,
        currentSessionId, mode ?? 'chat',
      )
    );
    c.executionCtx.waitUntil(
      storeMessage(
        env.DB, user_id, site_id, 'assistant', llmResponse.content, personality.id, responseEmotion,
        currentSessionId, mode ?? 'chat', echoMode.confidence,
        echoMode.doctrines.length, llmResponse.provider, llmResponse.tokens_used, llmResponse.latency_ms,
      )
    );

    // 18. Fire-and-forget: store to cloud memory
    c.executionCtx.waitUntil(
      storeToAllMemory(
        env, user_id,
        `User (${site_id}): ${message}\nAssistant (${personality.id}): ${llmResponse.content.slice(0, 500)}`,
        5,
        ['chat', site_id, personality.id],
      )
    );

    // 19. Fire-and-forget: extract memories
    if (history.length > 0 && history.length % 5 === 0) {
      c.executionCtx.waitUntil(extractMemoriesBackground(env, user_id, site_id, message, llmResponse.content));
    }

    // 20. Voice generation (if requested)
    let voiceUrl: string | undefined;
    if (enable_voice || siteConfig?.voice_enabled === 1) {
      const voiceResult = await generateVoice(
        llmResponse.content, personality, responseEmotion, env,
        siteConfig?.voice_provider,
      );
      voiceUrl = voiceResult.audio_url;
    }

    // 21. Audit log
    c.executionCtx.waitUntil(
      auditLog(env.DB, user_id, site_id, 'chat', JSON.stringify({
        personality: personality.id, mode, emotion: emotion.dominant,
        doctrine_engaged: echoMode.engaged, provider: llmResponse.provider,
      }))
    );

    const response: ChatResponse = {
      response: llmResponse.content,
      emotion: responseEmotion,
      personality: personality.id,
      confidence: echoMode.confidence || undefined,
      doctrine_count: echoMode.doctrines.length || undefined,
      voice_url: voiceUrl,
      session_id: currentSessionId,
      swarm_consensus: swarmResult ?? undefined,
      relay_result: relayResult ?? undefined,
      latency_ms: Date.now() - start,
      llm_provider: llmResponse.provider,
      tokens_used: llmResponse.tokens_used,
    };

    return c.json(response);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    c.executionCtx.waitUntil(auditLog(env.DB, user_id, site_id, 'chat_error', errorMsg));
    return c.json({ error: 'Chat processing failed', detail: errorMsg }, 500);
  }
});

// ============================================================
// GET /history/:userId - Conversation history
// ============================================================
app.get('/history/:userId', async (c) => {
  const userId = c.req.param('userId');
  const siteId = c.req.query('site_id') ?? '*';
  const limit = parseInt(c.req.query('limit') ?? '40');

  if (siteId === '*') {
    const rows = await c.env.DB.prepare(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).bind(userId, limit).all();
    return c.json({ history: rows.results ?? [] });
  }

  const history = await getConversationHistory(c.env.DB, userId, siteId, limit);
  return c.json({ history });
});

// ============================================================
// GET /user/:userId - User profile
// ============================================================
app.get('/user/:userId', async (c) => {
  const userId = c.req.param('userId');
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

// ============================================================
// POST /memory/extract - Trigger memory extraction
// ============================================================
app.post('/memory/extract', async (c) => {
  const { user_id, site_id } = await c.req.json<{ user_id: string; site_id: string }>();
  const history = await getConversationHistory(c.env.DB, user_id, site_id, 20);
  const lastMessages = history.slice(-10);
  const conversationText = lastMessages.map(m => `${m.role}: ${m.content}`).join('\n');

  // Simple keyword-based memory extraction (no LLM needed)
  const memories = extractSimpleMemories(conversationText);
  for (const mem of memories) {
    await storeMemory(c.env.DB, user_id, site_id, mem.type, mem.content, mem.importance);
  }

  return c.json({ extracted: memories.length, memories });
});

// ============================================================
// GET /memories/:userId - Get user memories
// ============================================================
app.get('/memories/:userId', async (c) => {
  const userId = c.req.param('userId');
  const local = await getMemories(c.env.DB, userId);
  return c.json({ memories: local });
});

// ============================================================
// POST /memory/search - Search all 5 memory systems
// ============================================================
app.post('/memory/search', async (c) => {
  const { query, limit } = await c.req.json<{ query: string; limit?: number }>();
  const results = await searchAllMemory(c.env, query, limit ?? 10);
  return c.json({ results });
});

// ============================================================
// POST /tts - Generate voice (returns raw audio or JSON with base64)
// ============================================================
app.post('/tts', async (c) => {
  const { text, personality: pId, emotion, provider, format } = await c.req.json<{
    text: string; personality?: string; emotion?: string; provider?: string; format?: string;
  }>();
  const personality = getPersonality(pId ?? 'EP') ?? getPersonality('EP')!;
  const result = await generateVoice(text, personality, emotion ?? 'neutral', c.env, provider);

  // If we have base64 audio, return it as raw audio bytes for direct playback
  if (result.audio_base64 && format !== 'json') {
    const binary = atob(result.audio_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Response(bytes, {
      headers: {
        'Content-Type': result.content_type || 'audio/wav',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return c.json(result);
});

// ============================================================
// GET /personalities - List all personalities
// ============================================================
app.get('/personalities', (c) => {
  return c.json({ personalities: listPersonalities() });
});

// ============================================================
// GET /site/:siteId - Get site config
// ============================================================
app.get('/site/:siteId', async (c) => {
  const siteId = c.req.param('siteId');
  const site = await getSiteConfig(c.env.DB, siteId, c.env.CACHE);
  if (!site) return c.json({ error: 'Site not found' }, 404);
  return c.json(site);
});

// ============================================================
// POST /site/register - Register a new site
// ============================================================
app.post('/site/register', async (c) => {
  const body = await c.req.json<{
    site_id: string; site_name: string; default_personality?: string;
    custom_system_prompt?: string; allowed_origins?: string;
  }>();
  const site = await registerSite(
    c.env.DB, body.site_id, body.site_name,
    body.default_personality, body.custom_system_prompt, body.allowed_origins, c.env.CACHE,
  );
  return c.json(site, 201);
});

// ============================================================
// PUT /site/:siteId - Update site config
// ============================================================
app.put('/site/:siteId', async (c) => {
  const siteId = c.req.param('siteId');
  const updates = await c.req.json<Partial<SiteConfig>>();
  const site = await updateSite(c.env.DB, siteId, updates, c.env.CACHE);
  if (!site) return c.json({ error: 'Site not found' }, 404);
  return c.json(site);
});

// ============================================================
// POST /swarm/decide - Direct Trinity Council query
// ============================================================
app.post('/swarm/decide', async (c) => {
  const { question } = await c.req.json<{ question: string }>();
  const result = await querySwarmTrinity(c.env, question);
  if (!result) return c.json({ error: 'Swarm Brain unavailable' }, 503);
  return c.json(result);
});

// ============================================================
// POST /swarm/process - Full swarm agent processing
// ============================================================
app.post('/swarm/process', async (c) => {
  const { task, agents } = await c.req.json<{ task: string; agents?: number }>();
  const result = await querySwarmProcess(c.env, task, agents);
  if (!result) return c.json({ error: 'Swarm Brain unavailable' }, 503);
  return c.json(result);
});

// ============================================================
// GET /swarm/status - Swarm Brain health
// ============================================================
app.get('/swarm/status', async (c) => {
  const status = await getSwarmStatus(c.env);
  if (!status) return c.json({ error: 'Swarm Brain unavailable' }, 503);
  return c.json(status);
});

// ============================================================
// POST /relay/execute - Execute relay command (Commander only)
// ============================================================
app.post('/relay/execute', async (c) => {
  const body = await c.req.json<{ user_id: string; email?: string; tool: string; params: Record<string, unknown> }>();
  const user = await getOrCreateUser(c.env.DB, body.user_id, body.email);
  const auth = authenticateUser(user, body.email ?? user.email ?? undefined, c.env.COMMANDER_EMAIL);

  if (!canUseRelay(auth)) {
    return c.json({ error: 'Relay access requires Commander authority' }, 403);
  }

  const command: RelayCommand = { tool: body.tool, params: body.params };
  const result = await executeRelayCommand(c.env, auth, command);
  return c.json(result);
});

// ============================================================
// GET /relay/status - Echo Relay connectivity
// ============================================================
app.get('/relay/status', async (c) => {
  const status = await getRelayStatus(c.env);
  return c.json(status);
});

// ============================================================
// GET /cortex/status - Memory Cortex health
// ============================================================
app.get('/cortex/status', async (c) => {
  const health = await getCortexHealth(c.env);
  return c.json({ cortex: health });
});

// ============================================================
// GET /infrastructure - Full fleet status (Commander only)
// ============================================================
app.get('/infrastructure', async (c) => {
  // Check auth via header or query
  const userId = c.req.query('user_id') ?? c.req.header('X-User-ID') ?? '';
  const email = c.req.query('email') ?? '';
  const user = userId ? await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first() : null;
  const auth = authenticateUser(user as any, email, c.env.COMMANDER_EMAIL);

  if (!auth.is_commander) {
    return c.json({ error: 'Commander access required' }, 403);
  }

  const status = await getFullInfrastructureStatus(c.env);
  return c.json(status);
});

// ============================================================
// GET /health - Health check
// ============================================================
app.get('/health', async (c) => {
  const start = Date.now();
  let dbOk = false;

  try {
    await c.env.DB.prepare('SELECT 1').first();
    dbOk = true;
  } catch { /* ignore */ }

  const services = await Promise.allSettled([
    checkServiceHealth(c.env.ENGINE_RUNTIME_SVC, 'engine-runtime'),
    checkServiceHealth(c.env.SWARM_BRAIN_SVC, 'swarm-brain'),
    checkServiceHealth(c.env.SHARED_BRAIN_SVC, 'shared-brain'),
  ]);

  const serviceResults = services.map((s, i) =>
    s.status === 'fulfilled' ? s.value : { service: ['engine-runtime', 'swarm-brain', 'shared-brain'][i], status: 'down' }
  );

  return c.json({
    status: dbOk ? 'healthy' : 'degraded',
    version: '1.0.0',
    worker: 'echo-chat',
    d1: dbOk ? 'connected' : 'error',
    services: serviceResults,
    latency_ms: Date.now() - start,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// GET /stats - Usage statistics
// ============================================================
app.get('/stats', async (c) => {
  const stats = await getStats(c.env.DB);
  return c.json(stats);
});

// ============================================================
// GET / - Root
// ============================================================
app.get('/', (c) => {
  return c.json({
    name: 'Echo Chat',
    version: '1.0.0',
    description: 'Universal AI Chat Worker for Echo Omega Prime',
    endpoints: {
      chat: 'POST /chat',
      history: 'GET /history/:userId',
      user: 'GET /user/:userId',
      memories: 'GET /memories/:userId',
      memory_search: 'POST /memory/search',
      memory_extract: 'POST /memory/extract',
      tts: 'POST /tts',
      personalities: 'GET /personalities',
      site: 'GET /site/:siteId',
      site_register: 'POST /site/register',
      site_update: 'PUT /site/:siteId',
      swarm_decide: 'POST /swarm/decide',
      swarm_process: 'POST /swarm/process',
      swarm_status: 'GET /swarm/status',
      relay_execute: 'POST /relay/execute',
      relay_status: 'GET /relay/status',
      cortex_status: 'GET /cortex/status',
      infrastructure: 'GET /infrastructure',
      health: 'GET /health',
      stats: 'GET /stats',
    },
    personalities: listPersonalities().map(p => ({ id: p.id, name: p.name })),
  });
});

// ============================================================
// Helper: Simple memory extraction
// ============================================================
function extractSimpleMemories(text: string): Array<{ type: string; content: string; importance: number }> {
  const memories: Array<{ type: string; content: string; importance: number }> = [];
  const lower = text.toLowerCase();

  // Preference patterns
  const prefPatterns = [
    /(?:i (?:prefer|like|love|enjoy|want|use|always))\s+(.{10,80})/gi,
    /(?:my favorite|my preferred)\s+(.{10,60})/gi,
  ];
  for (const pattern of prefPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      memories.push({ type: 'preference', content: match[0].trim(), importance: 6 });
    }
  }

  // Fact patterns
  const factPatterns = [
    /(?:i am|i'm|my name is|i work|i live|i have)\s+(.{5,80})/gi,
    /(?:my (?:company|job|role|title|business))\s+(?:is\s+)?(.{5,60})/gi,
  ];
  for (const pattern of factPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      memories.push({ type: 'fact', content: match[0].trim(), importance: 7 });
    }
  }

  // Goal patterns
  const goalPatterns = [
    /(?:i (?:need|want) to|i'm (?:trying|planning|going) to|my goal is)\s+(.{10,100})/gi,
  ];
  for (const pattern of goalPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      memories.push({ type: 'goal', content: match[0].trim(), importance: 7 });
    }
  }

  // Deduplicate by content
  const seen = new Set<string>();
  return memories.filter(m => {
    const key = m.content.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

async function extractMemoriesBackground(
  env: Env,
  userId: string,
  siteId: string,
  userMessage: string,
  assistantResponse: string,
): Promise<void> {
  const text = `user: ${userMessage}\nassistant: ${assistantResponse}`;
  const memories = extractSimpleMemories(text);
  for (const mem of memories) {
    try {
      await storeMemory(env.DB, userId, siteId, mem.type, mem.content, mem.importance);
    } catch {
      // Non-critical, continue
    }
  }
}

export default app;
