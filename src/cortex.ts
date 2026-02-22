// Echo Chat - Memory Cortex
// Unified interface to ALL 5 memory systems:
// 1. Shared Brain, 2. Memory Prime, 3. Sentinel Memory, 4. EKM Archive, 5. Cognition Cloud

import type { Env, CortexContext, CortexMemory } from './types';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function querySharedBrain(env: Env, userId: string, query: string): Promise<CortexMemory[]> {
  try {
    const response = await fetchWithTimeout(`${env.SHARED_BRAIN_URL}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: `echo-chat-${userId}`,
        query,
        conversation_id: `chat_${userId}`,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json() as { memories?: Array<{ content: string; importance?: number; timestamp?: string; tags?: string[] }> };
    return (data.memories ?? []).map(m => ({
      content: m.content,
      source: 'shared-brain',
      importance: m.importance ?? 5,
      timestamp: m.timestamp,
      tags: m.tags,
    }));
  } catch {
    return [];
  }
}

async function queryMemoryPrime(env: Env, query: string): Promise<CortexMemory[]> {
  try {
    const response = await fetchWithTimeout(
      `${env.MEMORY_PRIME_URL}/recall?query=${encodeURIComponent(query)}&limit=5`, { method: 'GET' },
    );
    if (!response.ok) return [];
    const data = await response.json() as { results?: Array<{ content: string; importance?: number; category?: string; created_at?: string; tags?: string[] }> };
    return (data.results ?? []).map(m => ({
      content: m.content,
      source: 'memory-prime',
      importance: m.importance ?? 5,
      timestamp: m.created_at,
      tags: m.tags ?? (m.category ? [m.category] : []),
    }));
  } catch {
    return [];
  }
}

async function querySentinelMemory(env: Env, userId: string): Promise<CortexMemory[]> {
  try {
    const response = await fetchWithTimeout(`${env.SENTINEL_MEMORY_URL}/api/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: userId, limit: 5 }),
    });
    if (!response.ok) return [];
    const data = await response.json() as { context?: Array<{ content: string; type?: string; importance?: number }> };
    return (data.context ?? []).map(m => ({
      content: m.content,
      source: 'sentinel-memory',
      importance: m.importance ?? 5,
      tags: m.type ? [m.type] : [],
    }));
  } catch {
    return [];
  }
}

async function queryEKMArchive(env: Env, query: string): Promise<CortexMemory[]> {
  // EKM Archive is D1-based, query via direct D1 if bound, or skip
  // For now, return empty -- EKM is primarily used by Cognition Cloud workers
  return [];
}

async function queryCognitionCloud(env: Env, query: string): Promise<CortexMemory[]> {
  // Cognition Cloud has 10 workers; for chat context, we query the crystal search
  try {
    const response = await fetchWithTimeout(
      `https://echo-crystal-search.bmcii1976.workers.dev/search?q=${encodeURIComponent(query)}&limit=3`,
      { method: 'GET' },
      8000,
    );
    if (!response.ok) return [];
    const data = await response.json() as { results?: Array<{ content: string; score?: number }> };
    return (data.results ?? []).map(m => ({
      content: m.content,
      source: 'cognition-cloud',
      importance: Math.round((m.score ?? 0.5) * 10),
    }));
  } catch {
    return [];
  }
}

export async function loadFullContext(env: Env, userId: string, query: string): Promise<CortexContext> {
  const [sharedBrain, memoryPrime, sentinel, ekm, cognition] = await Promise.allSettled([
    querySharedBrain(env, userId, query),
    queryMemoryPrime(env, query),
    querySentinelMemory(env, userId),
    queryEKMArchive(env, query),
    queryCognitionCloud(env, query),
  ]);

  return {
    shared_brain_memories: sharedBrain.status === 'fulfilled' ? sharedBrain.value : [],
    memory_prime_results: memoryPrime.status === 'fulfilled' ? memoryPrime.value : [],
    sentinel_memories: sentinel.status === 'fulfilled' ? sentinel.value : [],
    ekm_results: ekm.status === 'fulfilled' ? ekm.value : [],
    cognition_results: cognition.status === 'fulfilled' ? cognition.value : [],
  };
}

export async function storeToAllMemory(
  env: Env,
  userId: string,
  content: string,
  importance: number,
  tags: string[] = [],
): Promise<void> {
  const instanceId = `echo-chat-${userId}`;

  await Promise.allSettled([
    // Shared Brain
    fetchWithTimeout(`${env.SHARED_BRAIN_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance_id: instanceId, role: 'assistant', content, importance, tags }),
    }, 5000),
    // Memory Prime
    fetchWithTimeout(`${env.MEMORY_PRIME_URL}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'chat_memory', content, tags, importance }),
    }, 5000),
    // Sentinel Memory (only if importance >= 7)
    ...(importance >= 7 ? [fetchWithTimeout(`${env.SENTINEL_MEMORY_URL}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: userId, content, importance, type: 'chat_memory' }),
    }, 5000)] : []),
  ]);
}

export async function searchAllMemory(
  env: Env,
  query: string,
  limit: number = 10,
): Promise<CortexMemory[]> {
  const [brainResults, primeResults] = await Promise.allSettled([
    fetchWithTimeout(`${env.SHARED_BRAIN_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    }).then(r => r.json() as Promise<{ results?: CortexMemory[] }>),
    fetchWithTimeout(`${env.MEMORY_PRIME_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
    }).then(r => r.json() as Promise<{ results?: Array<{ content: string; importance?: number; category?: string }> }>),
  ]);

  const results: CortexMemory[] = [];

  if (brainResults.status === 'fulfilled' && brainResults.value.results) {
    results.push(...brainResults.value.results.map(m => ({ ...m, source: 'shared-brain' })));
  }
  if (primeResults.status === 'fulfilled' && primeResults.value.results) {
    results.push(...primeResults.value.results.map(m => ({
      content: m.content,
      source: 'memory-prime',
      importance: m.importance ?? 5,
      tags: m.category ? [m.category] : [],
    })));
  }

  return results.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0)).slice(0, limit);
}

export function buildCortexContextString(cortex: CortexContext): string {
  const allMemories = [
    ...cortex.shared_brain_memories,
    ...cortex.memory_prime_results,
    ...cortex.sentinel_memories,
    ...cortex.ekm_results,
    ...cortex.cognition_results,
  ]
    .filter(m => m.content)
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 15);

  if (allMemories.length === 0) return '';

  const lines = allMemories.map(m => {
    const src = m.source ? `[${m.source}]` : '';
    const tags = m.tags?.length ? ` (${m.tags.join(', ')})` : '';
    return `${src} ${m.content}${tags}`;
  });

  return `
MEMORY CORTEX - Relevant memories from all systems:
${lines.join('\n')}

Use these memories to personalize your response. Reference past conversations naturally.
`.trim();
}

export async function getCortexHealth(env: Env): Promise<Array<{ system: string; status: string; latency_ms: number }>> {
  const systems = [
    { name: 'shared-brain', url: `${env.SHARED_BRAIN_URL}/health` },
    { name: 'memory-prime', url: `${env.MEMORY_PRIME_URL}/health` },
    { name: 'sentinel-memory', url: `${env.SENTINEL_MEMORY_URL}/health` },
  ];

  const results = await Promise.allSettled(
    systems.map(async s => {
      const start = Date.now();
      const r = await fetchWithTimeout(s.url, { method: 'GET' }, 5000);
      return { system: s.name, status: r.ok ? 'up' : 'degraded', latency_ms: Date.now() - start };
    })
  );

  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { system: systems[i].name, status: 'down', latency_ms: 0 }
  );
}
