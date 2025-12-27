// tests/hooks/hooks.ts
import {
  Before,
  After,
  BeforeStep,
  AfterStep,
  setDefaultTimeout,
  Status,
} from '@cucumber/cucumber';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { CustomWorld } from '../support/world';

dotenv.config({ override: true } as any);
setDefaultTimeout(180 * 1000);

function envBool(v: string | undefined, def: boolean): boolean {
  if (v == null) return def;
  const s = v.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return def;
}

function safeFileName(name: string): string {
  return name.replace(/[^\w\d-_ ]+/g, '_').trim() || 'scenario';
}

function nowIso(): string {
  return new Date().toISOString();
}

function tailLines(lines: string[], maxLines: number): string {
  if (!lines?.length) return '';
  return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
}

function redactSecrets(input: string): string {
  if (!input) return input;

  const secrets: Array<string | undefined> = [
    process.env.LENDER_PASSWORD,
    process.env.BORROWER_PASSWORD,
    process.env.ADMIN_PASSWORD,
    process.env.RP_API_KEY,
    process.env.RP_UUID,
    process.env.OPENAI_API_KEY,
  ];

  let out = input;
  for (const s of secrets) {
    if (s && s.trim()) {
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'g'), '***REDACTED***');
    }
  }
  return out;
}

async function runAiTriage(payload: {
  scenarioName: string;
  frameworkType: string;
  url: string;
  lastStepText?: string;
  failedStepText?: string;
  consoleTail?: string;
  networkTail?: string;
}): Promise<string | null> {
  const AI_TRIAGE = envBool(process.env.AI_TRIAGE, false);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!AI_TRIAGE) return null;
  if (!apiKey || !apiKey.trim()) return null;

  const model = (process.env.AI_MODEL || 'gpt-4.1-mini').trim();
  const maxChars = Number(process.env.AI_MAX_CHARS || 12000);

  const prompt = redactSecrets(
    [
      `Eres un QA Automation Senior. Analiza el fallo y devuelve un triage práctico y accionable.`,
      ``,
      `Contexto:`,
      `- Scenario: ${payload.scenarioName}`,
      `- FrameworkType: ${payload.frameworkType}`,
      `- URL: ${payload.url}`,
      payload.failedStepText ? `- Failed step: ${payload.failedStepText}` : null,
      payload.lastStepText ? `- Last step: ${payload.lastStepText}` : null,
      ``,
      `Console (tail):`,
      payload.consoleTail || '(sin logs)',
      ``,
      `Network (tail):`,
      payload.networkTail || '(sin eventos)',
      ``,
      `Entrega:`,
      `1) Causa probable (1-3 bullets)`,
      `2) Evidencia que lo respalda (bullets citando consola/network/step)`,
      `3) Próximos pasos concretos para debug (5 bullets máx)`,
      `4) Mejora recomendada del test (locators/esperas/assertions)`,
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, maxChars)
  );

  try {
    // Import dinámico para no romper si no se usa IA
    const mod: any = await import('openai');
    const OpenAI = mod?.default || mod?.OpenAI || mod;

    const client = new OpenAI({ apiKey });

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Responde en español, claro, directo y técnico.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const text = res?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err: any) {
    // No rompe el test: solo devuelve null
    return `AI_TRIAGE_ERROR: ${String(err?.message || err)}`;
  }
}

const isCI = envBool(process.env.CI, false);
const headless = isCI ? true : envBool(process.env.HEADLESS, true);

const frameworkType = (process.env.FRAMEWORK_TYPE || 'LEGACY').toUpperCase();
console.log(`🔧 Ejecutando entorno: ${frameworkType}`);

const TRACE = envBool(process.env.TRACE, true);
const TRACE_ON_PASS = envBool(process.env.TRACE_ON_PASS, false);

const CAPTURE_CONSOLE = envBool(process.env.CAPTURE_CONSOLE, true);
const CAPTURE_NETWORK = envBool(process.env.CAPTURE_NETWORK, true);
const SAVE_HTML_ON_FAIL = envBool(process.env.SAVE_HTML_ON_FAIL, true);
const SAVE_TRACE_ON_FAIL = envBool(process.env.SAVE_TRACE_ON_FAIL, true);

Before(async function (this: CustomWorld) {
  // folders
  fs.mkdirSync('reports/videos', { recursive: true });
  fs.mkdirSync('reports/screenshots', { recursive: true });
  fs.mkdirSync('reports/traces', { recursive: true });
  fs.mkdirSync('reports/html', { recursive: true });
  fs.mkdirSync('reports/logs', { recursive: true });

  this.consoleLogs = [];
  this.networkLogs = [];

  // Step meta (para triage)
  (this as any).lastStepText = undefined;
  (this as any).failedStepText = undefined;

  this.browser = await chromium.launch({
    headless,
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  });

  this.context = await this.browser.newContext({
    recordVideo: { dir: 'reports/videos/' },
    viewport: { width: 1600, height: 900 },
    ignoreHTTPSErrors: true,
  });

  if (TRACE && this.context) {
    await this.context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
  }

  this.page = await this.context.newPage();

  // AI mode metadata
  if (frameworkType === 'AI') {
    this.runId = `AI-${Date.now()}`;
    console.log('🤖 Configuración avanzada habilitada: tracking de métricas IA');
  }

  // Console capture
  if (CAPTURE_CONSOLE && this.page) {
    this.page.on('console', (msg) => {
      const line = `[${nowIso()}] [console.${msg.type()}] ${msg.text()}`;
      this.consoleLogs.push(line);
    });

    this.page.on('pageerror', (err) => {
      const line = `[${nowIso()}] [pageerror] ${String(err?.message || err)}`;
      this.consoleLogs.push(line);
    });
  }

  // Network capture
  if (CAPTURE_NETWORK && this.page) {
    this.page.on('requestfailed', (req) => {
      this.networkLogs.push({
        ts: nowIso(),
        type: 'requestfailed',
        method: req.method(),
        url: req.url(),
        failureText: req.failure()?.errorText,
      });
    });

    this.page.on('response', (res) => {
      const status = res.status();
      if (status >= 400) {
        this.networkLogs.push({
          ts: nowIso(),
          type: 'response',
          method: res.request().method(),
          url: res.url(),
          status,
        });
      }
    });
  }
});

BeforeStep(function (this: CustomWorld) {
  this.stepStartTs = Date.now();
});

AfterStep(async function (this: CustomWorld, step) {
  const start = this.stepStartTs ?? Date.now();
  const ms = Date.now() - start;

  const stepText = step?.pickleStep?.text ? String(step.pickleStep.text) : 'Step';
  const stepStatus = step?.result?.status;

  // Guardamos “último step”
  (this as any).lastStepText = stepText;

  // Guardamos “step fallido” (si aplica)
  if (stepStatus === Status.FAILED) {
    (this as any).failedStepText = stepText;
  }

  // Si querés adjuntar timing por step, descomentá:
  // await this.attach(`${stepText}\nDurationMs: ${ms}\nStatus: ${stepStatus}`, 'text/plain');

  void ms;
});

After(async function (this: CustomWorld, scenario) {
  const scenarioName = safeFileName(scenario.pickle?.name || 'scenario');
  const failed = scenario.result?.status === Status.FAILED;

  const screenshotPath = path.join('reports', 'screenshots', `${scenarioName}.png`);
  const htmlPath = path.join('reports', 'html', `${scenarioName}.html`);
  const consoleLogPath = path.join('reports', 'logs', `${scenarioName}.console.log`);
  const networkLogPath = path.join('reports', 'logs', `${scenarioName}.network.json`);
  const tracePath = path.join('reports', 'traces', `${scenarioName}.zip`);

  try {
    if (failed && this.page) {
      // 1) Screenshot (buffer + file)
      const pngBuffer = await this.page.screenshot({ fullPage: true });
      fs.writeFileSync(screenshotPath, pngBuffer);
      await this.attach(pngBuffer, 'image/png');

      // 2) HTML dump
      if (SAVE_HTML_ON_FAIL) {
        const html = await this.page.content();
        fs.writeFileSync(htmlPath, html, 'utf-8');
        await this.attach(html, 'text/html');
      }

      // 3) Console logs
      if (CAPTURE_CONSOLE) {
        const txt = this.consoleLogs.join('\n');
        fs.writeFileSync(consoleLogPath, txt, 'utf-8');
        if (txt.trim()) await this.attach(redactSecrets(txt), 'text/plain');
      }

      // 4) Network logs (>=400 + requestfailed)
      if (CAPTURE_NETWORK) {
        const json = JSON.stringify(this.networkLogs, null, 2);
        fs.writeFileSync(networkLogPath, json, 'utf-8');
        if (this.networkLogs.length) await this.attach(redactSecrets(json), 'application/json');
      }

      // 5) Basic context
      const currentUrl = this.page.url(); // string
      const info = [
        `Scenario: ${scenario.pickle?.name}`,
        `URL: ${currentUrl}`,
        `FrameworkType: ${frameworkType}`,
        this.runId ? `runId: ${this.runId}` : null,
        `Screenshot: ${screenshotPath}`,
        SAVE_HTML_ON_FAIL ? `HTML: ${htmlPath}` : null,
        CAPTURE_CONSOLE ? `Console: ${consoleLogPath}` : null,
        CAPTURE_NETWORK ? `Network: ${networkLogPath}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      await this.attach(info, 'text/plain');

      // 6) ✅ AI TRIAGE (solo en FAIL y si AI_TRIAGE=true + OPENAI_API_KEY)
      const consoleTail = CAPTURE_CONSOLE ? tailLines(this.consoleLogs, 60) : '';
      const networkTail = CAPTURE_NETWORK
        ? JSON.stringify(this.networkLogs.slice(Math.max(0, this.networkLogs.length - 30)), null, 2)
        : '';

      const aiText = await runAiTriage({
        scenarioName: String(scenario.pickle?.name || scenarioName),
        frameworkType,
        url: currentUrl,
        lastStepText: (this as any).lastStepText,
        failedStepText: (this as any).failedStepText,
        consoleTail,
        networkTail,
      });

      if (aiText && aiText.trim()) {
        await this.attach(`AI TRIAGE\n\n${aiText}`, 'text/plain');
      }
    }
  } catch (err) {
    console.error('❌ Error en After hook (attachments/ai):', err);
  } finally {
    // 7) Tracing: guardar solo si falló (o si TRACE_ON_PASS=true)
    try {
      if (TRACE && this.context) {
        const shouldSave = (failed && SAVE_TRACE_ON_FAIL) || (!failed && TRACE_ON_PASS);
        if (shouldSave) {
          await this.context.tracing.stop({ path: tracePath });
          const zip = fs.readFileSync(tracePath);
          await this.attach(zip, 'application/zip');
        } else {
          await this.context.tracing.stop(); // descarta
        }
      }
    } catch (e) {
      console.error('❌ Error en tracing.stop:', e);
    }

    // cierre robusto
    try {
      await this.context?.close();
    } catch {}
    try {
      await this.browser?.close();
    } catch {}
  }
});
