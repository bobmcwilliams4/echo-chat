<h1 align="center">Echo Chat</h1>

<p align="center">
  <strong>Universal AI chat backend for every Echo Omega Prime website and application. 14 personalities, 12-layer prompt intelligence, emotion detection, doctrine-aware responses, and cross-session memory.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/D1-SQLite-003B57?logo=sqlite" alt="D1" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version" />
</p>

---

## What Is This?

Echo Chat is a single Cloudflare Worker that serves as the AI chat backend for **every** site and program in the Echo ecosystem. Instead of building separate chat systems per website, every site (`echo-op.com`, `echo-ept.com`, `profinishusa.com`, `barkinglot.org`, etc.) points at this one worker and gets a fully customized AI experience through per-site configuration.

Each site can have its own default personality, custom system prompt, voice settings, and memory scope -- but they all share the same engine, the same 5-tier memory cortex, and the same 674 domain intelligence engines underneath.

---

## 14 AI Personalities

| ID | Name | Role | Tone |
|----|------|------|------|
| **EP** | Echo Prime | Flagship AI | Confident, knowledgeable, direct, Texas edge |
| **BR** | Bree | Emotional intelligence | Warm, witty, emotionally perceptive, playful |
| **RA** | Raistlin | Knowledge oracle | Wise, measured, dark humor, pattern recognition |
| **SA** | Sage | Trinity Council -- Wisdom | Calm, strategic, systems-level thinking |
| **TH** | Thorne | Trinity Council -- Security | Vigilant, protective, military-precise |
| **NX** | Nyx | Trinity Council -- Optimization | Pattern-seeking, efficiency-obsessed, witty |
| **GS** | Guilty Spark 343 | Error healing | Clinical, precise, Halo-inspired diagnostics |
| **PH** | Phoenix | Auto-recovery | Resilient, healing-focused, practical optimism |
| **PR** | Prometheus | Security operations | Intense, OSINT-focused, threat intelligence |
| **BE** | Belle | Pro Finish carpentry assistant | Friendly, professional, carpentry knowledge |
| **TE** | Texas Engineer | Oilfield specialist | Practical, engineering-precise, Permian Basin |
| **WM** | Warm Mentor | Supportive guide | Gentle, encouraging, infinite patience |
| **R2** | R2-Echo | Utility assistant | Efficient, resourceful, loyal, slightly sassy |
| **3P** | EPCP3O | Autonomous executor | Protocol-aware, diplomatic, procedural |

Each personality has its own:
- Full system prompt defining behavior and knowledge scope
- Voice ID for TTS generation (ElevenLabs or Echo Speak)
- Emotion-responsive voice settings (stability, similarity, style, speed per emotion)
- Cognitive engine weights (analytical, empathy, strategic, creative, etc.)
- Traits, catchphrases, and speaking style

---

## 12-Layer Prompt Builder

The prompt builder is what makes Echo Chat fundamentally different from a wrapper around an LLM. Every request assembles a system prompt from up to 12 contextual layers:

| Layer | Name | Purpose |
|-------|------|---------|
| 1 | **Anti-Hallucination** | Hard rules preventing fabrication of URLs, statistics, citations, and code |
| 2 | **Bloodline Directive** | Commander-level instructions (only for authenticated Commander) |
| 3 | **Identity** | Full personality system prompt, traits, and speaking style |
| 4 | **Classified Protocol** | Access control -- what system details to reveal vs. deflect |
| 5 | **Cognitive Engines** | Active cognitive modes (analytical, empathy, strategic, etc.) |
| 6 | **Doctrine Context** | Real domain expertise from the Engine Runtime (674 engines, 30K+ doctrines) |
| 6.5 | **Tax Expertise** | IRC-citing tax intelligence (activated on tax-related queries) |
| 7 | **Memory Cortex** | Cross-session memories from 5 memory systems |
| 8 | **Swarm Intelligence** | Trinity Council consensus (Sage + Nyx + Thorne perspectives) |
| 9 | **Infrastructure Context** | Live system status (Commander only) |
| 10 | **Site Context** | Per-site custom system prompts and business rules |
| 11 | **Voice Rules** | Speech-optimized output formatting when TTS is enabled |
| 12 | **Variation Protocol** | Response diversity (randomized opening style, structure mixing) |

---

## API Reference

### Core Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Main chat endpoint -- send message, get response |
| `GET` | `/history/:userId` | Conversation history (filterable by site) |
| `GET` | `/user/:userId` | User profile and preferences |
| `GET` | `/personalities` | List all 14 personalities with traits |

### Memory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/memory/extract` | Trigger memory extraction from conversation |
| `POST` | `/memory/search` | Search all 5 memory systems simultaneously |
| `GET` | `/memories/:userId` | Get stored memories for a user |
| `GET` | `/cortex/status` | Memory Cortex health across all tiers |

### Voice

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tts` | Generate voice audio (returns raw audio or JSON) |

### Swarm Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/swarm/decide` | Trinity Council multi-perspective analysis |
| `POST` | `/swarm/process` | Full swarm agent processing (configurable agent count) |
| `GET` | `/swarm/status` | Swarm Brain health and agent status |

### Site Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/site/:siteId` | Get site configuration |
| `POST` | `/site/register` | Register a new site with custom settings |
| `PUT` | `/site/:siteId` | Update site configuration |

### Relay and Infrastructure

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/relay/execute` | Execute MCP tool via Echo Relay (Commander only) |
| `GET` | `/relay/status` | Echo Relay connectivity status |
| `GET` | `/infrastructure` | Full fleet status (Commander only) |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with D1 + service status |
| `GET` | `/stats` | Usage statistics (messages, users, sites) |
| `GET` | `/` | API documentation and personality list |

---

## Chat Request/Response

### Request

```json
{
  "message": "What are the tax implications of a 1031 exchange?",
  "user_id": "user_abc123",
  "site_id": "echo-ept.com",
  "personality": "EP",
  "mode": "chat",
  "model": "default",
  "enable_voice": false,
  "session_id": "sess_optional",
  "email": "user@example.com"
}
```

### Response

```json
{
  "response": "A 1031 exchange under IRC Section 1031 allows...",
  "emotion": "neutral",
  "personality": "EP",
  "confidence": "DEFENSIBLE",
  "doctrine_count": 3,
  "session_id": "sess_1234567890_abcde",
  "latency_ms": 1847,
  "llm_provider": "azure-gpt41",
  "tokens_used": 523
}
```

---

## Infrastructure

### Cloudflare Bindings

| Type | Name | Resource |
|------|------|----------|
| **D1** | `DB` | `echo-chat` -- conversations, users, memories, sites, audit |
| **KV** | `CACHE` | Site config cache, session data |
| **Service** | `ENGINE_RUNTIME_SVC` | Engine Runtime (674 engines) |
| **Service** | `SHARED_BRAIN_SVC` | Shared Brain (cross-instance memory) |
| **Service** | `MEMORY_PRIME_SVC` | Memory Prime (9-pillar cloud memory) |
| **Service** | `SENTINEL_MEMORY_SVC` | Sentinel (security memory) |
| **Service** | `SWARM_BRAIN_SVC` | Swarm Brain (Trinity Council) |
| **Service** | `BUILD_ORCHESTRATOR_SVC` | Build Orchestrator |
| **Service** | `KNOWLEDGE_FORGE_SVC` | Knowledge Forge (5,387 docs) |
| **Service** | `OMNISYNC_SVC` | OmniSync (todos, policies) |
| **Service** | `SHADOWGLASS_SVC` | ShadowGlass (deed records) |
| **Service** | `FORGEX_SVC` | FORGE-X (engine builder) |
| **Service** | `ECHO_RELAY_SVC` | Echo Relay (MCP tools) |

### LLM Providers

The worker routes to multiple LLM providers with automatic fallback:

1. Azure GPT-4.1 (primary -- free via GitHub Models)
2. Groq LPU (Llama 3.3 70B at 1.5s, Llama 4 Scout at 853ms)
3. DeepSeek V3
4. OpenRouter (fallback)

---

## Source Files

```
src/
  index.ts            # Hono app, 20 route handlers, 597 lines
  personalities.ts    # 14 personality definitions, 639 lines
  prompt-builder.ts   # 12-layer system prompt assembly, 241 lines
  cortex.ts           # 5-tier memory integration
  memory.ts           # D1 CRUD for conversations, users, memories, sites
  llm.ts              # Multi-provider LLM routing with fallback
  echo-mode.ts        # Engine Runtime doctrine query integration
  emotion.ts          # Emotion detection and personality routing
  bloodline.ts        # Commander authentication and access control
  relay.ts            # Echo Relay MCP tool execution
  services.ts         # Swarm Brain + infrastructure status queries
  voice.ts            # TTS generation via ElevenLabs / Echo Speak
  tax-tools.ts        # Tax intent detection and IRC system prompt
  types.ts            # Full TypeScript type definitions
```

**Total**: 3,566 lines across 14 TypeScript files.

---

## Deployment

```bash
# Clone and install
git clone https://github.com/bobmcwilliams4/echo-chat.git
cd echo-chat
npm install

# Create D1 database
npx wrangler d1 create echo-chat
# Update database_id in wrangler.toml

# Run schema migration
npx wrangler d1 execute echo-chat --remote --file=schema.sql

# Set secrets
echo "YOUR_KEY" | npx wrangler secret put AZURE_API_KEY
echo "YOUR_KEY" | npx wrangler secret put XAI_API_KEY
echo "YOUR_KEY" | npx wrangler secret put OPENROUTER_API_KEY
echo "YOUR_KEY" | npx wrangler secret put DEEPSEEK_API_KEY
echo "YOUR_KEY" | npx wrangler secret put ELEVENLABS_API_KEY
echo "YOUR_KEY" | npx wrangler secret put ECHO_API_KEY
echo "YOUR_KEY" | npx wrangler secret put GITHUB_TOKEN
echo "YOUR_KEY" | npx wrangler secret put GROQ_API_KEY

# Deploy
npx wrangler deploy
```

---

## Part of Echo Omega Prime

Echo Chat is the conversational interface for [Echo Omega Prime](https://github.com/bobmcwilliams4/Echo-Omega-Prime) -- a fully autonomous AI operating system with 674 domain intelligence engines, 5-tier persistent memory, multi-agent fleet coordination, and self-healing error recovery.

---

## Author

**Bobby Don McWilliams II** -- AI Systems Architect, Midland, Texas

- Email: bobmcwilliams4@outlook.com
- Web: [echo-op.com](https://echo-op.com) | [echo-ept.com](https://echo-ept.com)

## License

MIT
