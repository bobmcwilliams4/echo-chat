// Echo Chat - All Cloudflare Worker Integrations
// Typed fetch wrappers for every Worker in the fleet

import type { Env, SwarmResult, ServiceHealth, InfrastructureStatus } from './types';

async function safeFetch(url: string, options?: RequestInit, timeoutMs: number = 15000): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

// --- Engine Runtime (674 engines, 30,626 doctrines) ---
export async function queryEngineRuntime(
  env: Env,
  query: string,
  domain?: string,
  mode: string = 'FAST',
): Promise<{ results: unknown[]; count: number }> {
  try {
    const body: Record<string, unknown> = { query, mode, limit: 5 };
    if (domain) body.domain = domain;

    const r = await safeFetch(`${env.ENGINE_RUNTIME_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { results: [], count: 0 };
    return await r.json() as { results: unknown[]; count: number };
  } catch {
    return { results: [], count: 0 };
  }
}

// --- Swarm Brain v3.1 (Trinity Council + 1,200 agents) ---
export async function querySwarmTrinity(
  env: Env,
  question: string,
): Promise<SwarmResult | null> {
  try {
    const r = await safeFetch(`${env.SWARM_BRAIN_URL}/trinity/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, require_consensus: true }),
    }, 20000);
    if (!r.ok) return null;
    return await r.json() as SwarmResult;
  } catch {
    return null;
  }
}

export async function querySwarmProcess(
  env: Env,
  task: string,
  agents?: number,
): Promise<SwarmResult | null> {
  try {
    const r = await safeFetch(`${env.SWARM_BRAIN_URL}/swarm/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, agent_count: agents ?? 5 }),
    }, 25000);
    if (!r.ok) return null;
    return await r.json() as SwarmResult;
  } catch {
    return null;
  }
}

export async function getSwarmStatus(env: Env): Promise<{ status: string; agents: number } | null> {
  try {
    const r = await safeFetch(`${env.SWARM_BRAIN_URL}/agents/status`, { method: 'GET' }, 5000);
    if (!r.ok) return null;
    return await r.json() as { status: string; agents: number };
  } catch {
    return null;
  }
}

// --- Knowledge Forge (5,387 docs) ---
export async function queryKnowledgeForge(
  env: Env,
  query: string,
  limit: number = 5,
): Promise<unknown[]> {
  try {
    const r = await safeFetch(
      `${env.KNOWLEDGE_FORGE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { method: 'GET' },
    );
    if (!r.ok) return [];
    const data = await r.json() as { results?: unknown[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

// --- ShadowGlass v8.2 (80 counties, 259K+ records) ---
export async function queryShadowGlass(
  env: Env,
  county: string,
  docType?: string,
  query?: string,
): Promise<unknown[]> {
  try {
    const params = new URLSearchParams({ county });
    if (docType) params.set('doc_type', docType);
    if (query) params.set('q', query);

    const r = await safeFetch(`${env.SHADOWGLASS_URL}/search?${params}`, { method: 'GET' });
    if (!r.ok) return [];
    const data = await r.json() as { results?: unknown[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

// --- Build Orchestrator ---
export async function queryBuildOrchestrator(
  env: Env,
  endpoint: string = '/status',
): Promise<unknown | null> {
  try {
    const r = await safeFetch(`${env.BUILD_ORCHESTRATOR_URL}${endpoint}`, { method: 'GET' }, 10000);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// --- OmniSync (todos, policies, broadcasts, memory) ---
export async function queryOmniSync(
  env: Env,
  path: string = '/todos',
): Promise<unknown | null> {
  try {
    const r = await safeFetch(`${env.OMNISYNC_URL}${path}`, { method: 'GET' }, 8000);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// --- Store to Shared Brain (fire-and-forget) ---
export async function storeToSharedBrain(
  env: Env,
  instanceId: string,
  content: string,
  importance: number,
  tags: string[] = [],
): Promise<void> {
  try {
    await safeFetch(`${env.SHARED_BRAIN_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instance_id: instanceId, role: 'assistant', content, importance, tags }),
    }, 5000);
  } catch {
    // Fire and forget
  }
}

// --- Broadcast ---
export async function broadcastToAllInstances(
  env: Env,
  message: string,
  priority: string = 'normal',
): Promise<void> {
  try {
    await safeFetch(`${env.OMNISYNC_URL}/broadcasts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, priority, source: 'echo-chat' }),
    }, 5000);
  } catch {
    // Fire and forget
  }
}

// --- Health Checks ---
export async function checkServiceHealth(url: string, name: string): Promise<ServiceHealth> {
  try {
    const start = Date.now();
    const r = await safeFetch(`${url}/health`, { method: 'GET' }, 5000);
    return {
      service: name,
      status: r.ok ? 'up' : 'degraded',
      latency_ms: Date.now() - start,
    };
  } catch {
    return { service: name, status: 'down' };
  }
}

export async function getFullInfrastructureStatus(env: Env): Promise<InfrastructureStatus> {
  const workerChecks = [
    { url: env.ENGINE_RUNTIME_URL, name: 'engine-runtime' },
    { url: env.SWARM_BRAIN_URL, name: 'swarm-brain' },
    { url: env.SHARED_BRAIN_URL, name: 'shared-brain' },
    { url: env.MEMORY_PRIME_URL, name: 'memory-prime' },
    { url: env.SENTINEL_MEMORY_URL, name: 'sentinel-memory' },
    { url: env.BUILD_ORCHESTRATOR_URL, name: 'build-orchestrator' },
    { url: env.KNOWLEDGE_FORGE_URL, name: 'knowledge-forge' },
    { url: env.OMNISYNC_URL, name: 'omnisync' },
    { url: env.ECHO_RELAY_URL, name: 'echo-relay' },
    { url: env.SHADOWGLASS_URL, name: 'shadowglass' },
    { url: env.FORGEX_URL, name: 'forge-x' },
  ];

  const healthResults = await Promise.allSettled(
    workerChecks.map(w => checkServiceHealth(w.url, w.name))
  );

  const workers = healthResults.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { service: workerChecks[i].name, status: 'down' as const }
  );

  // Get build status
  let buildProgress = { complete: 0, pending: 0, total: 0 };
  try {
    const buildStatus = await queryBuildOrchestrator(env, '/status') as {
      engines?: { complete?: number; pending?: number; total?: number };
    } | null;
    if (buildStatus?.engines) {
      buildProgress = {
        complete: buildStatus.engines.complete ?? 0,
        pending: buildStatus.engines.pending ?? 0,
        total: buildStatus.engines.total ?? 0,
      };
    }
  } catch { /* ignore */ }

  return {
    workers,
    d1_databases: [
      'echo-chat', 'echo-shared-brain', 'echo-build-orchestrator', 'forge-x-cloud',
      'echo-memory-prime', 'echo-ekm-archive', 'echo-engine-doctrines',
      'echo-relay', 'profinish', 'echo-sentinel-memory',
    ],
    r2_buckets: [
      'echo-build-plans', 'echo-prime-vault', 'echo-prime-knowledge',
      'echo-prime-memory', 'echo-prime-media', 'echo-prime-storage',
      'echo-prime-backups', 'echo-prime-master-vault', 'echo-prime-cold-archive',
      'echo-omega-prime-archive',
    ],
    kv_namespaces: [
      'echo-chat-cache', 'relay-cache', 'forge-x-cache',
      'shared-brain-hot', 'omnisync-state',
    ],
    engine_count: 674,
    doctrine_count: 30626,
    build_progress: buildProgress,
  };
}
