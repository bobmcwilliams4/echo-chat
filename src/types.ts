// Echo Chat - Universal AI Chat Worker Type Definitions

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  DEFAULT_PERSONALITY: string;
  // Memory Cortex
  SHARED_BRAIN_URL: string;
  MEMORY_PRIME_URL: string;
  SENTINEL_MEMORY_URL: string;
  // Engine + Swarm
  ENGINE_RUNTIME_URL: string;
  SWARM_BRAIN_URL: string;
  // Voice
  ECHO_SPEAK_URL: string;
  // Infrastructure
  BUILD_ORCHESTRATOR_URL: string;
  KNOWLEDGE_FORGE_URL: string;
  OMNISYNC_URL: string;
  ECHO_RELAY_URL: string;
  SHADOWGLASS_URL: string;
  FORGEX_URL: string;
  // Auth
  COMMANDER_EMAIL: string;
  // Claude CLI Proxy (PRIMARY LLM)
  CLAUDE_PROXY_URL: string;
  // Secrets
  AZURE_API_KEY: string;
  AZURE_OPENAI_ENDPOINT: string;
  XAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  ECHO_API_KEY: string;
  GITHUB_TOKEN: string;
  // Service Bindings (Worker-to-Worker direct communication)
  ENGINE_RUNTIME_SVC: Fetcher;
  SHARED_BRAIN_SVC: Fetcher;
  MEMORY_PRIME_SVC: Fetcher;
  SENTINEL_MEMORY_SVC: Fetcher;
  SWARM_BRAIN_SVC: Fetcher;
  BUILD_ORCHESTRATOR_SVC: Fetcher;
  KNOWLEDGE_FORGE_SVC: Fetcher;
  OMNISYNC_SVC: Fetcher;
  SHADOWGLASS_SVC: Fetcher;
  FORGEX_SVC: Fetcher;
  ECHO_RELAY_SVC: Fetcher;
}

export interface ChatRequest {
  message: string;
  user_id: string;
  site_id: string;
  session_id?: string;
  personality?: string;
  mode?: 'chat' | 'doctrine' | 'swarm' | 'echo' | 'relay';
  enable_voice?: boolean;
  stream?: boolean;
  command?: RelayCommand;
  email?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  response: string;
  emotion: string;
  personality: string;
  confidence?: string;
  doctrine_count?: number;
  voice_url?: string;
  session_id: string;
  swarm_consensus?: SwarmResult;
  relay_result?: unknown;
  latency_ms: number;
  llm_provider?: string;
  tokens_used?: number;
}

export interface SiteConfig {
  site_id: string;
  site_name: string;
  default_personality: string;
  enabled_domains: string;
  custom_system_prompt: string | null;
  allowed_origins: string;
  api_key: string | null;
  max_history: number;
  voice_enabled: number;
  voice_provider: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  authority_level: number;
  trust_level: number;
  is_commander: number;
  preferred_personality: string | null;
  total_messages: number;
  first_seen: string;
  last_seen: string;
}

export interface PersonalityDef {
  id: string;
  name: string;
  tone: string;
  system_prompt: string;
  voice_id: string | null;
  voice_provider: 'echo-speak' | 'elevenlabs' | 'cartesia';
  emotion_settings: Record<string, EmotionVoiceSettings>;
  cognitive_engines: CognitiveEngineConfig;
  traits: string[];
  catchphrases: string[];
  speaking_style: string;
  bloodline_access: number;
}

export interface EmotionVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
}

export interface CognitiveEngineConfig {
  forward_thinking: number;
  critical_thinking: number;
  proactive: number;
  foresight: number;
  creative: number;
  empathy: number;
  analytical: number;
  strategic: number;
}

export interface DoctrineResult {
  topic: string;
  conclusion: string;
  reasoning: string;
  confidence: string;
  authority: string[];
  zone: string;
  score: number;
  domain: string;
  engine_id?: string;
}

export interface SwarmResult {
  consensus: string;
  harmony: number;
  votes: SwarmVote[];
  agents_used: number;
  reasoning: string;
  mode: string;
}

export interface SwarmVote {
  agent: string;
  position: string;
  confidence: number;
  reasoning: string;
}

export interface RelayCommand {
  tool: string;
  params: Record<string, unknown>;
  target?: string;
}

export interface CortexContext {
  shared_brain_memories: CortexMemory[];
  sentinel_memories: CortexMemory[];
  ekm_results: CortexMemory[];
  memory_prime_results: CortexMemory[];
  cognition_results: CortexMemory[];
}

export interface CortexMemory {
  content: string;
  source: string;
  importance: number;
  timestamp?: string;
  tags?: string[];
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  tokens_used: number;
  latency_ms: number;
}

export interface BloodlineAuth {
  authority_level: number;
  is_commander: boolean;
  classified_access: boolean;
  relay_access: boolean;
  vault_access: boolean;
  trust_level: number;
}

export interface EmotionDetection {
  dominant: string;
  intensity: number;
  secondary: string | null;
}

export interface MemoryExtraction {
  type: 'fact' | 'preference' | 'opinion' | 'goal' | 'inside_joke' | 'relationship';
  content: string;
  importance: number;
}

export interface ServiceHealth {
  service: string;
  status: 'up' | 'down' | 'degraded';
  latency_ms?: number;
  detail?: string;
}

export interface InfrastructureStatus {
  workers: ServiceHealth[];
  d1_databases: string[];
  r2_buckets: string[];
  kv_namespaces: string[];
  engine_count: number;
  doctrine_count: number;
  build_progress: { complete: number; pending: number; total: number };
}
