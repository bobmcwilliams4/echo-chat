# Echo Chat

A Cloudflare Worker that powers AI chat across all Echo Omega Prime websites and applications. Features 14 distinct AI personalities, a 12-layer prompt builder, emotion detection, voice synthesis, and persistent memory.

## Features

- **14 AI Personalities** — Each with unique speaking styles, catchphrases, and behavioral traits
- **12-Layer Prompt Builder** — Stacks context from memory, personality, emotion, doctrine, and conversation history
- **Emotion Detection** — Analyzes user sentiment and adjusts personality response tone
- **Voice Synthesis** — Text-to-speech output via ElevenLabs with per-personality voice IDs
- **Memory Integration** — Connects to Shared Brain and Memory Cortex for cross-session recall
- **Bloodline Authentication** — Commander-level access control for system operations
- **Echo Mode** — Special autonomous operation mode for system-level tasks
- **Relay Integration** — Routes tool calls through Echo Relay for MCP tool access

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send a message, get a personality-driven response |
| `GET` | `/personalities` | List all available personalities |
| `GET` | `/personality/:id` | Get personality details |
| `POST` | `/voice` | Generate TTS audio for a message |
| `GET` | `/history` | Conversation history |
| `GET` | `/health` | Health check |

## Deploy

```bash
git clone https://github.com/bobmcwilliams4/echo-chat.git
cd echo-chat
npm install
npx wrangler d1 create echo-chat
npx wrangler d1 execute echo-chat --remote --file=schema.sql
npx wrangler deploy
```

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1
- **Language**: TypeScript
- **Voice**: ElevenLabs v3 TTS

## Part of Echo Omega Prime

Echo Chat is the conversational interface for [Echo Omega Prime](https://github.com/bobmcwilliams4/Echo-Omega-Prime).

## Author

**Bobby Don McWilliams II** · bobmcwilliams4@outlook.com

## License

MIT
