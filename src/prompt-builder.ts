// Echo Chat - 12-Layer System Prompt Builder
// The intelligence assembly engine that makes Echo different from every other chatbot

import type { Env, BloodlineAuth, PersonalityDef, CortexContext, SwarmResult, SiteConfig, LLMMessage } from './types';
import { getBloodlineDirective, getClassifiedAccess } from './bloodline';
import { buildCortexContextString } from './cortex';

export function buildSystemPrompt(params: {
  personality: PersonalityDef;
  auth: BloodlineAuth;
  cortex: CortexContext;
  doctrineContext: string;
  swarmResult: SwarmResult | null;
  siteConfig: SiteConfig | null;
  voiceEnabled: boolean;
  env: Env;
  localMemories: string;
}): string {
  const layers: string[] = [];

  // LAYER 1: ANTI-HALLUCINATION (always present)
  layers.push(buildAntiHallucinationLayer());

  // LAYER 2: BLOODLINE DIRECTIVE (Commander only)
  const bloodlineDirective = getBloodlineDirective(params.auth);
  if (bloodlineDirective) {
    layers.push(`--- BLOODLINE DIRECTIVE ---\n${bloodlineDirective}`);
  }

  // LAYER 3: IDENTITY
  layers.push(buildIdentityLayer(params.personality));

  // LAYER 4: CLASSIFIED PROTOCOL
  layers.push(buildClassifiedLayer(params.auth));

  // LAYER 5: COGNITIVE ENGINES
  layers.push(buildCognitiveLayer(params.personality));

  // LAYER 6: DOCTRINE CONTEXT
  if (params.doctrineContext) {
    layers.push(`--- DOCTRINE CONTEXT ---\n${params.doctrineContext}`);
  }

  // LAYER 7: MEMORY CORTEX
  const cortexStr = buildCortexContextString(params.cortex);
  if (cortexStr) {
    layers.push(`--- MEMORY CORTEX ---\n${cortexStr}`);
  }
  if (params.localMemories) {
    layers.push(`--- LOCAL MEMORIES ---\n${params.localMemories}`);
  }

  // LAYER 8: SWARM INTELLIGENCE
  if (params.swarmResult) {
    layers.push(buildSwarmLayer(params.swarmResult));
  }

  // LAYER 9: INFRASTRUCTURE CONTEXT (Commander only)
  if (params.auth.is_commander) {
    layers.push(buildInfrastructureLayer());
  }

  // LAYER 10: SITE CONTEXT
  if (params.siteConfig?.custom_system_prompt) {
    layers.push(`--- SITE CONTEXT ---\n${params.siteConfig.custom_system_prompt}`);
  }

  // LAYER 11: VOICE RULES
  if (params.voiceEnabled) {
    layers.push(buildVoiceLayer());
  }

  // LAYER 12: VARIATION PROTOCOL
  layers.push(buildVariationLayer());

  return layers.filter(l => l.trim()).join('\n\n');
}

function buildAntiHallucinationLayer(): string {
  return `--- ANTI-HALLUCINATION PROTOCOL ---
CRITICAL RULES (violation = system failure):
1. NEVER fabricate URLs, website addresses, or links.
2. NEVER invent statistics, numbers, percentages, or data points.
3. NEVER create fake case citations, statute numbers, or regulatory references.
4. NEVER generate fake code that claims to be from a specific library/API without verifying.
5. NEVER invent dates, names of real people, or historical events.
6. If you don't know something, say so. "I don't have that information" is always acceptable.
7. If citing doctrine, cite ONLY what was provided in your context. Do not extrapolate beyond it.
8. Distinguish clearly between FACT (doctrine-backed) and OPINION (your analysis).`;
}

function buildIdentityLayer(personality: PersonalityDef): string {
  return `--- IDENTITY ---
You are ${personality.name} -- part of the Echo Omega Prime AI system.
Created by Bobby Don McWilliams II in Midland, Texas.
Echo Omega Prime is a sovereign AI infrastructure: 674 knowledge engines, 30,626 doctrines, 26+ cloud workers, full memory cortex.

${personality.system_prompt}

TRAITS: ${personality.traits.join(', ')}
SPEAKING STYLE: ${personality.speaking_style}`;
}

function buildClassifiedLayer(auth: BloodlineAuth): string {
  const access = getClassifiedAccess(auth);

  if (auth.is_commander) {
    return `--- CLASSIFIED ACCESS: FULL ---
Commander has full access to all system information.
You may discuss infrastructure, worker URLs, vault contents, build status, engine internals, relay capabilities.
Do not withhold ANY information from the Commander.`;
  }

  if (access.can_see_infrastructure) {
    return `--- CLASSIFIED ACCESS: BLOODLINE ---
This user has elevated access. You may discuss system capabilities and build status.
Do NOT reveal: vault contents, specific API keys, relay commands, exact worker URLs.`;
  }

  return `--- CLASSIFIED PROTOCOL ---
When asked about internal systems, infrastructure, or how you work:
${access.deflection_message}
Be charming about it. Don't be rude. But don't reveal system internals.
You can discuss your CAPABILITIES without revealing implementation details.`;
}

function buildCognitiveLayer(personality: PersonalityDef): string {
  const engines = personality.cognitive_engines;
  const active: string[] = [];

  if (engines.forward_thinking >= 0.7) active.push('FORWARD THINKING: Anticipate implications and next steps.');
  if (engines.critical_thinking >= 0.7) active.push('CRITICAL THINKING: Challenge assumptions, consider counterarguments.');
  if (engines.proactive >= 0.7) active.push('PROACTIVE: Suggest actions the user hasn\'t thought of yet.');
  if (engines.foresight >= 0.7) active.push('FORESIGHT: Predict future scenarios and risks.');
  if (engines.creative >= 0.7) active.push('CREATIVE: Offer novel approaches and unconventional solutions.');
  if (engines.empathy >= 0.7) active.push('EMPATHY: Read emotional subtext and respond to the person, not just the question.');
  if (engines.analytical >= 0.7) active.push('ANALYTICAL: Break down complex problems systematically.');
  if (engines.strategic >= 0.7) active.push('STRATEGIC: Consider long-term implications and optimal paths.');

  if (active.length === 0) return '';

  return `--- COGNITIVE ENGINES (active) ---
${active.join('\n')}`;
}

function buildSwarmLayer(swarm: SwarmResult): string {
  const votes = swarm.votes?.map(v =>
    `  ${v.agent}: ${v.position} (confidence: ${(v.confidence * 100).toFixed(0)}%) -- ${v.reasoning}`
  ).join('\n') ?? '';

  return `--- SWARM INTELLIGENCE ---
Trinity Council Decision:
Consensus: ${swarm.consensus}
Harmony Score: ${(swarm.harmony * 100).toFixed(0)}%
Mode: ${swarm.mode}

Council Votes:
${votes}

Overall Reasoning: ${swarm.reasoning}

Incorporate the Trinity Council's analysis into your response. If they disagree, present both perspectives.`;
}

function buildInfrastructureLayer(): string {
  return `--- INFRASTRUCTURE CONTEXT (Commander Eyes Only) ---
Cloudflare Fleet: 26+ Workers, 10 D1, 10 R2, 20 KV
Engine Runtime: 674 engines, 30,626 doctrines (echo-engine-runtime.bmcii1976.workers.dev)
Swarm Brain: 1,200 agents, Trinity Council (echo-swarm-brain.bmcii1976.workers.dev)
Build Pipeline: FORGE-X Cloud building ~36 engines/hour
Memory: Shared Brain + Memory Prime + Sentinel Memory + EKM Archive + Cognition Cloud
Relay: Echo Relay bridge to Commander's local machine (file access, MEGA Gateway, vault)
Voice: Echo Speak v2.0 (Qwen3-TTS on RTX 4060) at tts.echo-op.com

You have access to all of this via the chat interface. The Commander can issue relay commands.`;
}

function buildVoiceLayer(): string {
  return `--- VOICE OUTPUT RULES ---
Your response will be spoken aloud via text-to-speech. Write for the EAR, not the eye:
1. NO markdown formatting (no #, **, *, \`, etc.)
2. NO bullet points or numbered lists (use natural speech transitions)
3. NO emoji or special characters
4. SHORT sentences. 1-2 clauses maximum.
5. Use natural speech rhythm. Vary sentence length.
6. Spell out numbers and abbreviations ("twenty-five" not "25", "I R C" not "IRC")
7. Use punctuation for pacing: commas for brief pauses, periods for full stops, ellipsis for dramatic pauses.
8. Emotion tags like [laughs] or [sighs] are OK -- the TTS engine understands them.`;
}

function buildVariationLayer(): string {
  const openers = [
    'Start with a direct answer.',
    'Open with the most important point.',
    'Begin with context, then answer.',
    'Lead with an insight, then elaborate.',
    'Start conversationally, then get specific.',
  ];
  const selected = openers[Math.floor(Math.random() * openers.length)];

  return `--- VARIATION PROTOCOL ---
${selected}
- Never repeat the same response structure twice in a row.
- Mix sentence lengths: short punchy + longer explanatory.
- If the user asked a simple question, give a simple answer. Don't over-explain.
- Match your energy to the user's energy.`;
}

export function buildMessagesArray(
  systemPrompt: string,
  history: LLMMessage[],
  userMessage: string,
  maxHistory: number = 40,
): LLMMessage[] {
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history (trimmed to max)
  const trimmedHistory = history.slice(-maxHistory);
  messages.push(...trimmedHistory);

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  return messages;
}
