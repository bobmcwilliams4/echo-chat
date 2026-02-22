// Echo Chat - Doctrineistic Mode
// Domain detection, doctrine lookup, authority hardening, confidence stratification

import type { Env, DoctrineResult, LLMMessage } from './types';

// Domain signal word map for auto-detection
const DOMAIN_SIGNALS: Record<string, { domain: string; weight: number; keywords: string[] }> = {
  tax: {
    domain: 'TAX',
    weight: 1.0,
    keywords: ['tax', 'irs', 'irc', 'deduction', 'credit', '1031', 'exchange', 'depreciation', 'amortization', 'basis', 'capital gains', 'section', 'treasury', 'withholding', 'w-2', '1099', 'schedule c', 'estate tax', 'gift tax', 'amt', 'qbi', 'roth', 'ira', 'filing', 'audit', 'penalty', 'refund'],
  },
  legal: {
    domain: 'LEGAL',
    weight: 1.0,
    keywords: ['legal', 'lawsuit', 'court', 'judge', 'attorney', 'lawyer', 'statute', 'regulation', 'compliance', 'contract', 'liability', 'damages', 'negligence', 'tort', 'plaintiff', 'defendant', 'motion', 'discovery', 'deposition', 'appeal', 'precedent', 'jurisdiction', 'standing', 'due process'],
  },
  landman: {
    domain: 'LANDMAN',
    weight: 1.0,
    keywords: ['title', 'deed', 'mineral rights', 'royalty', 'lease', 'surface', 'chain of title', 'abstract', 'conveyance', 'grantor', 'grantee', 'easement', 'right of way', 'division order', 'pooling', 'unitization', 'working interest', 'net revenue', 'overriding royalty', 'top lease'],
  },
  oilfield: {
    domain: 'OILFIELD',
    weight: 1.0,
    keywords: ['drilling', 'production', 'well', 'frac', 'fracturing', 'completions', 'bop', 'blowout', 'mud', 'casing', 'cement', 'tubing', 'packer', 'perforating', 'stimulation', 'artificial lift', 'pump jack', 'esp', 'gas lift', 'separator', 'treater', 'flare', 'pipeline', 'rrc', 'spud', 'td', 'wireline'],
  },
  security: {
    domain: 'SECURITY',
    weight: 0.9,
    keywords: ['security', 'vulnerability', 'exploit', 'penetration', 'firewall', 'encryption', 'authentication', 'authorization', 'breach', 'malware', 'phishing', 'threat', 'incident', 'forensics', 'osint', 'reconnaissance', 'ctf', 'reverse engineer'],
  },
  medical: {
    domain: 'MEDICAL',
    weight: 0.9,
    keywords: ['medical', 'diagnosis', 'treatment', 'symptom', 'disease', 'patient', 'clinical', 'pharmaceutical', 'drug', 'dosage', 'adverse', 'toxicology', 'poison', 'exposure', 'surgery', 'therapy'],
  },
  engineering: {
    domain: 'ENGINEERING',
    weight: 0.8,
    keywords: ['engineering', 'mechanical', 'structural', 'electrical', 'civil', 'chemical', 'thermodynamics', 'fluid dynamics', 'materials', 'stress', 'strain', 'load', 'factor of safety', 'tolerance', 'specification'],
  },
  finance: {
    domain: 'FINANCE',
    weight: 0.8,
    keywords: ['finance', 'investment', 'portfolio', 'stock', 'bond', 'derivative', 'option', 'futures', 'hedge', 'valuation', 'dcf', 'ebitda', 'balance sheet', 'income statement', 'cash flow', 'roi', 'irr', 'npv'],
  },
  insurance: {
    domain: 'INSURANCE',
    weight: 0.8,
    keywords: ['insurance', 'policy', 'premium', 'claim', 'coverage', 'deductible', 'underwriting', 'actuarial', 'risk', 'loss', 'indemnity', 'exclusion', 'endorsement', 'rider'],
  },
  environmental: {
    domain: 'ENVIRONMENTAL',
    weight: 0.7,
    keywords: ['environmental', 'epa', 'emission', 'pollution', 'remediation', 'cleanup', 'hazardous', 'waste', 'water quality', 'air quality', 'osha', 'compliance', 'spill', 'contamination'],
  },
};

const CONFIDENCE_LEVELS = {
  DEFENSIBLE: { label: 'DEFENSIBLE', description: 'Backed by statute + case law. High confidence.', min_score: 8 },
  AGGRESSIVE: { label: 'AGGRESSIVE', description: 'Reasonable interpretation with some risk.', min_score: 5 },
  DISCLOSURE: { label: 'DISCLOSURE', description: 'Uncertainty exists. Disclose risks.', min_score: 3 },
  HIGH_RISK: { label: 'HIGH_RISK', description: 'Limited authority. Proceed with caution.', min_score: 0 },
} as const;

export function detectDomains(message: string): Array<{ domain: string; score: number }> {
  const lower = message.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [_, config] of Object.entries(DOMAIN_SIGNALS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        score += config.weight;
      }
    }
    if (score > 0) {
      scores[config.domain] = score;
    }
  }

  return Object.entries(scores)
    .map(([domain, score]) => ({ domain, score }))
    .sort((a, b) => b.score - a.score);
}

export function shouldEngageDoctrine(domains: Array<{ domain: string; score: number }>): boolean {
  return domains.length > 0 && domains[0].score >= 1.5;
}

export async function lookupDoctrines(
  env: Env,
  query: string,
  domain?: string,
  mode: string = 'FAST',
  limit: number = 5,
): Promise<DoctrineResult[]> {
  try {
    // Engine Runtime uses /search (GET or POST), NOT /query
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (domain) params.set('category', domain.toUpperCase());

    const path = `/search?${params}`;
    console.log(`[DOCTRINE] Fetching via service binding: ${path}`);

    // Use Service Binding for Worker-to-Worker communication (avoids error 1042)
    const response = await env.ENGINE_RUNTIME_SVC.fetch(`https://internal${path}`, {
      signal: AbortSignal.timeout(15000),
    });

    console.log(`[DOCTRINE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[DOCTRINE] Error response: ${errorText.slice(0, 200)}`);
      return [];
    }

    const data = await response.json() as { results?: DoctrineResult[] };
    console.log(`[DOCTRINE] Results count: ${data.results?.length ?? 0}`);
    return data.results ?? [];
  } catch (err) {
    console.error(`[DOCTRINE] Fetch error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export function hardenAuthority(doctrines: DoctrineResult[]): DoctrineResult[] {
  return doctrines.map(d => {
    let authorityScore = 0;
    const authorityStr = (d.authority ?? []).join(' ').toLowerCase();
    const reasoningStr = (d.reasoning ?? '').toLowerCase();
    const combined = authorityStr + ' ' + reasoningStr;

    if (combined.includes('irc') || combined.includes('usc') || combined.includes('statute') || combined.includes('code')) authorityScore += 3;
    if (combined.includes('v.') || combined.includes('case') || combined.includes('court') || combined.includes('held')) authorityScore += 2;
    if (combined.includes('reg') || combined.includes('cfr') || combined.includes('rule')) authorityScore += 2;
    if (combined.includes('irs') || combined.includes('treasury') || combined.includes('notice') || combined.includes('revenue ruling')) authorityScore += 1;

    return { ...d, score: d.score + authorityScore };
  }).sort((a, b) => b.score - a.score);
}

export function stratifyConfidence(doctrines: DoctrineResult[]): string {
  if (doctrines.length === 0) return CONFIDENCE_LEVELS.HIGH_RISK.label;

  const avgScore = doctrines.reduce((sum, d) => sum + d.score, 0) / doctrines.length;

  if (avgScore >= CONFIDENCE_LEVELS.DEFENSIBLE.min_score) return CONFIDENCE_LEVELS.DEFENSIBLE.label;
  if (avgScore >= CONFIDENCE_LEVELS.AGGRESSIVE.min_score) return CONFIDENCE_LEVELS.AGGRESSIVE.label;
  if (avgScore >= CONFIDENCE_LEVELS.DISCLOSURE.min_score) return CONFIDENCE_LEVELS.DISCLOSURE.label;
  return CONFIDENCE_LEVELS.HIGH_RISK.label;
}

export function buildDoctrineContext(doctrines: DoctrineResult[], confidence: string): string {
  if (doctrines.length === 0) return '';

  const doctrineBlocks = doctrines.slice(0, 5).map((d, i) => {
    const authorities = (d.authority ?? []).join(', ') || 'General domain knowledge';
    return `DOCTRINE ${i + 1}: ${d.topic}
Domain: ${d.domain}${d.engine_id ? ` (Engine: ${d.engine_id})` : ''}
Conclusion: ${d.conclusion}
Reasoning: ${d.reasoning}
Primary Authority: ${authorities}
Confidence Zone: ${d.confidence ?? confidence}`;
  }).join('\n\n');

  return `
AUTHORITATIVE DOCTRINE CONTEXT
Confidence Level: ${confidence}
Doctrine Count: ${doctrines.length}

${doctrineBlocks}

DOCTRINE RULES:
- Ground your response in the doctrine above. It represents real domain expertise.
- Cite specific authorities when they support your answer.
- If your confidence is below DEFENSIBLE, explicitly note the limitation.
- NEVER fabricate case citations, statute numbers, or regulatory references.
- If doctrine is insufficient, say so. "Based on available doctrine, I can say X. For Y, I'd need to research further."
- NEVER say "guaranteed", "always works", or "100% certain" in doctrine-grounded responses.
`.trim();
}

export async function engageEchoMode(
  env: Env,
  message: string,
  requestedMode?: string,
): Promise<{
  doctrines: DoctrineResult[];
  confidence: string;
  doctrineContext: string;
  domains: Array<{ domain: string; score: number }>;
  engaged: boolean;
}> {
  const domains = detectDomains(message);
  const forceDoctrine = requestedMode === 'doctrine' || requestedMode === 'echo';
  const autoEngage = shouldEngageDoctrine(domains);

  console.log(`[ECHO_MODE] domains=${JSON.stringify(domains)}, force=${forceDoctrine}, auto=${autoEngage}, mode=${requestedMode}`);

  if (!forceDoctrine && !autoEngage) {
    return { doctrines: [], confidence: '', doctrineContext: '', domains, engaged: false };
  }

  const primaryDomain = domains[0]?.domain;
  const mode = requestedMode === 'doctrine' ? 'DEFENSE' : 'FAST';

  const doctrines = await lookupDoctrines(env, message, primaryDomain, mode);
  const hardened = hardenAuthority(doctrines);
  const confidence = stratifyConfidence(hardened);
  const doctrineContext = buildDoctrineContext(hardened, confidence);

  return {
    doctrines: hardened,
    confidence,
    doctrineContext,
    domains,
    engaged: hardened.length > 0,
  };
}
