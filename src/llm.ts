// Echo Chat - Multi-LLM Router with Fallback Chain
// PRIMARY: Claude Code CLI Proxy (Claude.ai subscription, free with plan)
// SECONDARY: Azure GPT-4.1 (GitHub Models, free until May 2026)
// TERTIARY: Grok 3 mini, DeepSeek V3, OpenRouter (additional fallbacks)

import type { Env, LLMMessage, LLMResponse, PersonalityDef } from './types';

interface LLMProvider {
  name: string;
  call: (messages: LLMMessage[], env: Env) => Promise<LLMResponse>;
  priority: number;
  best_for: string[];
}

// ─── PRIMARY: Claude Code CLI Proxy ────────────────────────────────────────
// Local proxy at claude-proxy.echo-op.com wraps `claude -p` subprocess.
// Uses Claude.ai subscription (free with plan). Sonnet 4.5 default, max output.
async function callClaudeProxy(messages: LLMMessage[], env: Env): Promise<LLMResponse> {
  const start = Date.now();
  const proxyUrl = (env.CLAUDE_PROXY_URL || 'https://claude-proxy.echo-op.com').replace(/\/+$/, '');

  // Build system + query from messages array
  const systemMsgs = messages.filter(m => m.role === 'system').map(m => m.content);
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content);
  const system = systemMsgs.join('\n\n') || undefined;
  const query = userMsgs[userMsgs.length - 1] || '';

  const response = await fetch(`${proxyUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, query }),
    signal: AbortSignal.timeout(60000), // Claude can take longer but worth it
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Claude Proxy error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as {
    response: string;
    model?: string;
    elapsed_ms?: number;
  };

  return {
    content: data.response ?? '',
    provider: `claude-proxy-${data.model || 'sonnet'}`,
    tokens_used: 0,
    latency_ms: Date.now() - start,
  };
}

// ─── SECONDARY: Azure GPT-4.1 ─────────────────────────────────────────────
async function callAzureGPT(messages: LLMMessage[], env: Env): Promise<LLMResponse> {
  const start = Date.now();
  const endpoint = (env.AZURE_OPENAI_ENDPOINT || 'https://models.github.ai/inference/v1').replace(/\/+$/, '');
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.AZURE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure GPT-4.1 error ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    provider: 'azure-gpt-4.1',
    tokens_used: data.usage?.total_tokens ?? 0,
    latency_ms: Date.now() - start,
  };
}

// ─── TERTIARY: Grok 3 mini ─────────────────────────────────────────────────
async function callGrok(messages: LLMMessage[], env: Env): Promise<LLMResponse> {
  const start = Date.now();
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error(`Grok error ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    provider: 'grok-3-mini',
    tokens_used: data.usage?.total_tokens ?? 0,
    latency_ms: Date.now() - start,
  };
}

// ─── TERTIARY: DeepSeek V3 ─────────────────────────────────────────────────
async function callDeepSeek(messages: LLMMessage[], env: Env): Promise<LLMResponse> {
  const start = Date.now();
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek error ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    provider: 'deepseek-v3',
    tokens_used: data.usage?.total_tokens ?? 0,
    latency_ms: Date.now() - start,
  };
}

// ─── QUATERNARY: OpenRouter (free tier) ─────────────────────────────────────
async function callOpenRouter(messages: LLMMessage[], env: Env): Promise<LLMResponse> {
  const start = Date.now();
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://echo-op.com',
      'X-Title': 'Echo Chat',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    provider: 'openrouter-llama-3.3-70b',
    tokens_used: data.usage?.total_tokens ?? 0,
    latency_ms: Date.now() - start,
  };
}

// ─── Provider Registry ──────────────────────────────────────────────────────
const PROVIDERS: LLMProvider[] = [
  { name: 'claude-proxy', call: callClaudeProxy, priority: 0, best_for: ['doctrine', 'echo', 'EP', 'RA', 'SA', 'TH', 'NX', 'GS', 'PH', 'analysis', 'code'] },
  { name: 'azure-gpt-4.1', call: callAzureGPT, priority: 1, best_for: ['doctrine', 'echo', 'EP', 'RA', 'SA', 'TH', 'NX'] },
  { name: 'grok-3-mini', call: callGrok, priority: 2, best_for: ['BR', 'creative', 'sarcasm', 'casual'] },
  { name: 'deepseek-v3', call: callDeepSeek, priority: 3, best_for: ['code', 'analysis', 'R2', '3P'] },
  { name: 'openrouter', call: callOpenRouter, priority: 4, best_for: ['fallback'] },
];

const STATIC_FALLBACKS: Record<string, string[]> = {
  EP: [
    "I'm experiencing a temporary connection issue with my reasoning engines. Give me a moment and try again.",
    "My doctrine systems are briefly offline. I'll be back at full capacity shortly.",
    "Connection hiccup. The engines are still running -- I just can't reach them right now. Try again in a moment.",
  ],
  BR: [
    "[sighs] Well, my brain's taking a coffee break apparently. Try me again in a sec?",
    "Oh no, I'm having a moment. Give me just a second to pull myself together!",
    "[laughs] Even AI needs a breather sometimes. Hit me again?",
  ],
  DEFAULT: [
    "I'm experiencing a brief interruption. Please try again in a moment.",
    "My systems are temporarily recalibrating. Try again shortly.",
  ],
};

function getProviderOrder(personality: PersonalityDef, mode?: string): LLMProvider[] {
  const sorted = [...PROVIDERS];

  if (mode === 'doctrine' || mode === 'echo') {
    sorted.sort((a, b) => {
      const aMatch = a.best_for.includes('doctrine') ? -10 : 0;
      const bMatch = b.best_for.includes('doctrine') ? -10 : 0;
      return (a.priority + aMatch) - (b.priority + bMatch);
    });
    return sorted;
  }

  sorted.sort((a, b) => {
    const aMatch = a.best_for.includes(personality.id) ? -10 : 0;
    const bMatch = b.best_for.includes(personality.id) ? -10 : 0;
    return (a.priority + aMatch) - (b.priority + bMatch);
  });

  return sorted;
}

function getStaticFallback(personalityId: string): string {
  const options = STATIC_FALLBACKS[personalityId] ?? STATIC_FALLBACKS['DEFAULT'];
  return options[Math.floor(Math.random() * options.length)];
}

export async function routeLLM(
  messages: LLMMessage[],
  env: Env,
  personality: PersonalityDef,
  mode?: string,
): Promise<LLMResponse> {
  const providers = getProviderOrder(personality, mode);
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const key = getProviderKey(provider.name, env);
      if (!key) continue;

      const result = await provider.call(messages, env);
      if (result.content) return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  return {
    content: getStaticFallback(personality.id),
    provider: 'static-fallback',
    tokens_used: 0,
    latency_ms: 0,
  };
}

function getProviderKey(providerName: string, env: Env): string | undefined {
  switch (providerName) {
    case 'claude-proxy': return env.CLAUDE_PROXY_URL || 'https://claude-proxy.echo-op.com';
    case 'azure-gpt-4.1': return env.AZURE_API_KEY;
    case 'grok-3-mini': return env.XAI_API_KEY;
    case 'deepseek-v3': return env.DEEPSEEK_API_KEY;
    case 'openrouter': return env.OPENROUTER_API_KEY;
    default: return undefined;
  }
}
