// tests/utils/aiTriage.ts
import fs from 'fs';
import path from 'path';

function envBool(v: string | undefined, def: boolean): boolean {
  if (v == null) return def;
  const s = v.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return def;
}

function clip(s: string, maxChars: number) {
  if (!s) return '';
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `\n...[TRUNCATED to ${maxChars} chars]`;
}

export type TriageInput = {
  scenarioName: string;
  frameworkType: string;
  url?: string;
  error?: string;
  consoleLogs?: string;
  networkJson?: string;
  htmlSnippet?: string;
};

export type TriageResult = {
  summary: string;
  likelyRootCause: string;
  signals: string[];
  recommendedActions: string[];
};

export async function runAiTriage(input: TriageInput): Promise<TriageResult | null> {
  const enabled = envBool(process.env.AI_TRIAGE, false);
  if (!enabled) return null;

  const maxChars = Number(process.env.AI_TRIAGE_MAX_CHARS || '12000');
  const model = process.env.AI_TRIAGE_MODEL || 'gpt-4.1-mini';

  // Si no hay API key, devolvemos un “triage mock” (no rompe el pipeline)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: `AI_TRIAGE enabled but OPENAI_API_KEY is missing. (Mock triage)\nScenario: ${input.scenarioName}`,
      likelyRootCause: 'Missing OPENAI_API_KEY (triage not executed).',
      signals: [
        input.url ? `URL: ${input.url}` : 'URL: (unknown)',
        input.error ? `Error: ${input.error}` : 'Error: (unknown)',
      ],
      recommendedActions: [
        'Set OPENAI_API_KEY in your environment (recommended: CI secret).',
        'Re-run to get real triage.',
      ],
    };
  }

  // Lazy import para no cargar si no se usa
  const { OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });

  const prompt = `
You are a senior QA Automation Engineer.
Given a failed E2E scenario, produce a concise triage:

Return JSON with keys:
- summary (string, 3-6 lines max)
- likelyRootCause (string)
- signals (array of strings)
- recommendedActions (array of strings)

Context:
Scenario: ${input.scenarioName}
FrameworkType: ${input.frameworkType}
URL: ${input.url || ''}

MainError:
${clip(input.error || '', 3000)}

ConsoleLogs:
${clip(input.consoleLogs || '', 3500)}

Network (only failures):
${clip(input.networkJson || '', 2500)}

HTML snippet (optional):
${clip(input.htmlSnippet || '', 1500)}
`.trim();

  const resp = await client.responses.create({
    model,
    input: prompt,
  });

  // responses API devuelve texto en output_text
  const text = (resp as any).output_text || '';
  // Intentamos parsear JSON “best effort”
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const json = text.slice(start, end + 1);
    const parsed = JSON.parse(json);
    return parsed as TriageResult;
  } catch {
    // fallback si el modelo devolvió texto
    return {
      summary: clip(text, 1200) || 'No triage output',
      likelyRootCause: 'Could not parse model output as JSON.',
      signals: [],
      recommendedActions: ['Re-run with AI_TRIAGE_MAX_CHARS lower/higher and ensure stable output JSON.'],
    };
  }
}

export function persistTriage(scenarioName: string, triage: TriageResult) {
  fs.mkdirSync('reports/ai', { recursive: true });
  const safe = scenarioName.replace(/[^\w\d-_ ]+/g, '_').trim() || 'scenario';

  const txtPath = path.join('reports', 'ai', `${safe}.triage.txt`);
  const jsonPath = path.join('reports', 'ai', `${safe}.triage.json`);

  const text = [
    `SUMMARY:\n${triage.summary}`,
    `\nLIKELY ROOT CAUSE:\n${triage.likelyRootCause}`,
    `\nSIGNALS:\n- ${triage.signals.join('\n- ') || '(none)'}`,
    `\nRECOMMENDED ACTIONS:\n- ${triage.recommendedActions.join('\n- ') || '(none)'}`,
  ].join('\n');

  fs.writeFileSync(txtPath, text, 'utf-8');

  const saveJson = envBool(process.env.AI_TRIAGE_SAVE_JSON, true);
  if (saveJson) {
    fs.writeFileSync(jsonPath, JSON.stringify(triage, null, 2), 'utf-8');
  }

  return { txtPath, jsonPath };
}
