-- Echo Chat D1 Schema
-- Universal AI Chat Worker for all Echo Omega Prime websites

-- Site configurations (one row per website)
CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  default_personality TEXT DEFAULT 'EP',
  enabled_domains TEXT DEFAULT '*',
  custom_system_prompt TEXT,
  allowed_origins TEXT DEFAULT '*',
  api_key TEXT,
  max_history INTEGER DEFAULT 40,
  voice_enabled INTEGER DEFAULT 0,
  voice_provider TEXT DEFAULT 'echo-speak',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- User profiles (cross-site, identified by user_id)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  authority_level REAL DEFAULT 2.0,
  trust_level INTEGER DEFAULT 0,
  is_commander INTEGER DEFAULT 0,
  preferred_personality TEXT,
  total_messages INTEGER DEFAULT 0,
  first_seen TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now'))
);

-- Conversations (per-user, per-site)
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  session_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  personality TEXT,
  emotion TEXT DEFAULT 'neutral',
  mode TEXT DEFAULT 'chat',
  confidence TEXT,
  doctrine_hits INTEGER DEFAULT 0,
  llm_provider TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Per-user memories (extracted from conversations)
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  site_id TEXT,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5,
  recall_count INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Audit log (immutable)
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  site_id TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conv_user_site ON conversations(user_id, site_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id, active, importance);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
