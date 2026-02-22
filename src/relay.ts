// Echo Chat - Echo Relay Bridge
// File access, MEGA Gateway, vault, machine control via Echo Relay
// ALL relay calls require Commander authority (>= 11.0)

import type { Env, RelayCommand, BloodlineAuth } from './types';

export function canUseRelay(auth: BloodlineAuth): boolean {
  return auth.relay_access && auth.is_commander;
}

async function callRelay(
  env: Env,
  tool: string,
  params: Record<string, unknown>,
  timeoutMs: number = 20000,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const response = await fetch(`${env.ECHO_RELAY_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Echo-API-Key': env.ECHO_API_KEY,
      },
      body: JSON.stringify({ tool, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Relay error ${response.status}: ${text}` };
    }

    const data = await response.json();
    return { success: true, result: data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function readFile(env: Env, path: string): Promise<{ success: boolean; content?: string; error?: string }> {
  const result = await callRelay(env, 'file_read', { path });
  if (result.success && result.result) {
    const data = result.result as { content?: string };
    return { success: true, content: data.content ?? JSON.stringify(result.result) };
  }
  return { success: false, error: result.error };
}

export async function writeFile(env: Env, path: string, content: string): Promise<{ success: boolean; error?: string }> {
  return callRelay(env, 'file_write', { path, content });
}

export async function searchFiles(env: Env, pattern: string, directory?: string): Promise<{ success: boolean; result?: unknown; error?: string }> {
  return callRelay(env, 'file_search', { pattern, directory: directory ?? 'O:/ECHO_OMEGA_PRIME' });
}

export async function megaGatewaySearch(env: Env, keyword: string): Promise<{ success: boolean; result?: unknown; error?: string }> {
  return callRelay(env, 'mega_search', { keyword });
}

export async function megaGatewayExecute(
  env: Env,
  server: string,
  tool: string,
  params: Record<string, unknown>,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  return callRelay(env, 'mega_execute', { server, tool, params }, 30000);
}

export async function getVaultCredential(env: Env, service: string): Promise<{ success: boolean; result?: unknown; error?: string }> {
  return callRelay(env, 'vault_get_credential', { service });
}

export async function runCommand(env: Env, command: string): Promise<{ success: boolean; result?: unknown; error?: string }> {
  return callRelay(env, 'shell_execute', { command }, 30000);
}

export async function getRelayStatus(env: Env): Promise<{ connected: boolean; tools?: number; latency_ms?: number }> {
  try {
    const start = Date.now();
    const response = await fetch(`${env.ECHO_RELAY_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { connected: false };
    const data = await response.json() as { tools?: number };
    return {
      connected: true,
      tools: data.tools,
      latency_ms: Date.now() - start,
    };
  } catch {
    return { connected: false };
  }
}

export async function executeRelayCommand(
  env: Env,
  auth: BloodlineAuth,
  command: RelayCommand,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  if (!canUseRelay(auth)) {
    return { success: false, error: 'Relay access requires Commander authority (11.0)' };
  }

  return callRelay(env, command.tool, command.params);
}

// Parse relay commands from natural language chat messages
export function detectRelayCommand(message: string): RelayCommand | null {
  const lower = message.toLowerCase();

  // Read file patterns
  const readMatch = message.match(/(?:read|show|cat|get)\s+(?:file\s+)?["']?([A-Za-z]:[\\\/][^\s"']+)["']?/i);
  if (readMatch) {
    return { tool: 'file_read', params: { path: readMatch[1] } };
  }

  // Search files
  const searchMatch = message.match(/(?:search|find|grep|look for)\s+(?:files?\s+)?(?:for\s+)?["']?(.+?)["']?\s+(?:in|under|at)\s+["']?([A-Za-z]:[\\\/][^\s"']+)/i);
  if (searchMatch) {
    return { tool: 'file_search', params: { pattern: searchMatch[1], directory: searchMatch[2] } };
  }

  // Deploy commands
  if (lower.includes('deploy') && lower.includes('worker')) {
    return { tool: 'shell_execute', params: { command: 'npx wrangler deploy' } };
  }

  // System status
  if (lower.includes('system status') || lower.includes('resource') && lower.includes('check')) {
    return { tool: 'shell_execute', params: { command: 'python O:/ECHO_OMEGA_PRIME/CORE/resource_monitor.py snapshot' } };
  }

  return null;
}
