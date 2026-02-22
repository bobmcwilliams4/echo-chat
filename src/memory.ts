// Echo Chat - D1 Local Memory Layer
// Fast local storage for conversations, users, memories, audit

import type { UserProfile, SiteConfig, LLMMessage } from './types';

export async function getOrCreateUser(db: D1Database, userId: string, email?: string): Promise<UserProfile> {
  const existing = await db.prepare(
    'SELECT * FROM users WHERE user_id = ?'
  ).bind(userId).first<UserProfile>();

  if (existing) {
    await db.prepare(
      'UPDATE users SET last_seen = datetime("now"), total_messages = total_messages + 1 WHERE user_id = ?'
    ).bind(userId).run();
    return existing;
  }

  await db.prepare(
    'INSERT INTO users (user_id, email, display_name, authority_level, trust_level, is_commander) VALUES (?, ?, ?, 2.0, 0, 0)'
  ).bind(userId, email ?? null, null).run();

  return {
    user_id: userId,
    display_name: null,
    email: email ?? null,
    authority_level: 2.0,
    trust_level: 0,
    is_commander: 0,
    preferred_personality: null,
    total_messages: 1,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  };
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserProfile | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserProfile>();
}

export async function getSiteConfig(db: D1Database, siteId: string, cache?: KVNamespace): Promise<SiteConfig | null> {
  if (cache) {
    const cached = await cache.get(`site:${siteId}`, 'json');
    if (cached) return cached as SiteConfig;
  }

  const site = await db.prepare('SELECT * FROM sites WHERE site_id = ?').bind(siteId).first<SiteConfig>();

  if (site && cache) {
    await cache.put(`site:${siteId}`, JSON.stringify(site), { expirationTtl: 300 });
  }

  return site;
}

export async function getConversationHistory(
  db: D1Database,
  userId: string,
  siteId: string,
  limit: number = 40,
): Promise<LLMMessage[]> {
  const rows = await db.prepare(
    'SELECT role, content FROM conversations WHERE user_id = ? AND site_id = ? ORDER BY timestamp DESC LIMIT ?'
  ).bind(userId, siteId, limit).all<{ role: string; content: string }>();

  return (rows.results ?? []).reverse().map(r => ({
    role: r.role as 'user' | 'assistant',
    content: r.content,
  }));
}

export async function storeMessage(
  db: D1Database,
  userId: string,
  siteId: string,
  role: string,
  content: string,
  personality: string,
  emotion: string,
  sessionId: string,
  mode: string = 'chat',
  confidence?: string,
  doctrineHits: number = 0,
  llmProvider?: string,
  tokensUsed: number = 0,
  latencyMs: number = 0,
): Promise<void> {
  await db.prepare(`
    INSERT INTO conversations (user_id, site_id, session_id, role, content, personality, emotion, mode, confidence, doctrine_hits, llm_provider, tokens_used, latency_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, siteId, sessionId, role, content, personality, emotion,
    mode, confidence ?? null, doctrineHits, llmProvider ?? null, tokensUsed, latencyMs,
  ).run();
}

export async function getMemories(
  db: D1Database,
  userId: string,
  limit: number = 20,
): Promise<Array<{ id: number; memory_type: string; content: string; importance: number }>> {
  const rows = await db.prepare(
    'SELECT id, memory_type, content, importance FROM memories WHERE user_id = ? AND active = 1 ORDER BY importance DESC, created_at DESC LIMIT ?'
  ).bind(userId, limit).all<{ id: number; memory_type: string; content: string; importance: number }>();

  return rows.results ?? [];
}

export async function storeMemory(
  db: D1Database,
  userId: string,
  siteId: string | null,
  memoryType: string,
  content: string,
  importance: number,
): Promise<void> {
  // Check for duplicate-ish memories (same type + similar content)
  const existing = await db.prepare(
    'SELECT id FROM memories WHERE user_id = ? AND memory_type = ? AND content = ? AND active = 1'
  ).bind(userId, memoryType, content).first();

  if (existing) {
    await db.prepare(
      'UPDATE memories SET recall_count = recall_count + 1, importance = MAX(importance, ?) WHERE id = ?'
    ).bind(importance, (existing as { id: number }).id).run();
    return;
  }

  await db.prepare(
    'INSERT INTO memories (user_id, site_id, memory_type, content, importance) VALUES (?, ?, ?, ?, ?)'
  ).bind(userId, siteId, memoryType, content, importance).run();
}

export async function auditLog(
  db: D1Database,
  userId: string | null,
  siteId: string | null,
  action: string,
  detail: string | null,
): Promise<void> {
  await db.prepare(
    'INSERT INTO audit_log (user_id, site_id, action, detail) VALUES (?, ?, ?, ?)'
  ).bind(userId, siteId, action, detail).run();
}

export async function getStats(db: D1Database): Promise<{
  total_users: number;
  total_conversations: number;
  total_memories: number;
  conversations_today: number;
  top_sites: Array<{ site_id: string; count: number }>;
  top_personalities: Array<{ personality: string; count: number }>;
}> {
  const [users, convos, memories, today, sites, personalities] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM conversations').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM memories WHERE active = 1').first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM conversations WHERE timestamp >= date('now')").first<{ count: number }>(),
    db.prepare('SELECT site_id, COUNT(*) as count FROM conversations GROUP BY site_id ORDER BY count DESC LIMIT 10').all<{ site_id: string; count: number }>(),
    db.prepare('SELECT personality, COUNT(*) as count FROM conversations WHERE role = "assistant" AND personality IS NOT NULL GROUP BY personality ORDER BY count DESC LIMIT 10').all<{ personality: string; count: number }>(),
  ]);

  return {
    total_users: users?.count ?? 0,
    total_conversations: convos?.count ?? 0,
    total_memories: memories?.count ?? 0,
    conversations_today: today?.count ?? 0,
    top_sites: sites.results ?? [],
    top_personalities: personalities.results ?? [],
  };
}

export async function registerSite(
  db: D1Database,
  siteId: string,
  siteName: string,
  defaultPersonality: string = 'EP',
  customPrompt?: string,
  allowedOrigins: string = '*',
  cache?: KVNamespace,
): Promise<SiteConfig> {
  await db.prepare(`
    INSERT OR REPLACE INTO sites (site_id, site_name, default_personality, custom_system_prompt, allowed_origins, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(siteId, siteName, defaultPersonality, customPrompt ?? null, allowedOrigins).run();

  if (cache) {
    await cache.delete(`site:${siteId}`);
  }

  const site = await db.prepare('SELECT * FROM sites WHERE site_id = ?').bind(siteId).first<SiteConfig>();
  return site!;
}

export async function updateSite(
  db: D1Database,
  siteId: string,
  updates: Partial<SiteConfig>,
  cache?: KVNamespace,
): Promise<SiteConfig | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.site_name !== undefined) { fields.push('site_name = ?'); values.push(updates.site_name); }
  if (updates.default_personality !== undefined) { fields.push('default_personality = ?'); values.push(updates.default_personality); }
  if (updates.custom_system_prompt !== undefined) { fields.push('custom_system_prompt = ?'); values.push(updates.custom_system_prompt); }
  if (updates.allowed_origins !== undefined) { fields.push('allowed_origins = ?'); values.push(updates.allowed_origins); }
  if (updates.max_history !== undefined) { fields.push('max_history = ?'); values.push(updates.max_history); }
  if (updates.voice_enabled !== undefined) { fields.push('voice_enabled = ?'); values.push(updates.voice_enabled); }
  if (updates.voice_provider !== undefined) { fields.push('voice_provider = ?'); values.push(updates.voice_provider); }

  if (fields.length === 0) return getSiteConfig(db, siteId);

  fields.push('updated_at = datetime("now")');
  values.push(siteId);

  await db.prepare(`UPDATE sites SET ${fields.join(', ')} WHERE site_id = ?`).bind(...values).run();

  if (cache) {
    await cache.delete(`site:${siteId}`);
  }

  return getSiteConfig(db, siteId);
}
