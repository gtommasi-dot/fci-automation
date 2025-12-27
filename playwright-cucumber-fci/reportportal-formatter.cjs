// reportportal-formatter.cjs
const { createRPFormatterClass } = require('@reportportal/agent-js-cucumber');

function envBool(v, def) {
  if (v == null) return def;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return def;
}

function normalizeEndpoint(raw) {
  const base = String(raw || 'http://localhost:8080').trim().replace(/\/+$/, '');

  // Si ya viene con /api/v1 o /api/v2, lo dejamos tal cual.
  if (base.endsWith('/api/v1') || base.endsWith('/api/v2')) return base;

  // Default recomendado (cámbialo a v1 si tu instalación lo requiere)
  return `${base}/api/v2`;
}

function parseAttributes(raw) {
  if (!raw) return [];
  return String(raw)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(':');
      if (idx > -1) {
        return { key: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
      }
      return { value: pair };
    });
}

const rpEnabled = envBool(process.env.RP_ENABLE, false);

if (!rpEnabled) {
  // Si por error se carga el formatter con RP_ENABLE=false, exportamos un formatter “no-op”
  module.exports = class DummyFormatter {};
} else {
  const config = {
    endpoint: normalizeEndpoint(process.env.RP_ENDPOINT),
    apiKey: process.env.RP_API_KEY || process.env.RP_UUID,
    project: process.env.RP_PROJECT,
    launch: process.env.RP_LAUNCH || 'Cucumber Launch',
    attributes: parseAttributes(process.env.RP_ATTRIBUTES),
    description: process.env.RP_DESCRIPTION || '',
    mode: process.env.RP_MODE || 'DEFAULT',
  };

  module.exports = createRPFormatterClass(config);
}
