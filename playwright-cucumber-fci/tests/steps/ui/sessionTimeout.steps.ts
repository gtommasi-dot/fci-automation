import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import fs from 'fs';

function msToMinutes(ms: number): number {
  return ms / 1000 / 60;
}

function formatMadrid(ts: number): string {
  return new Date(ts).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

When('comienzo a medir el tiempo de inactividad', async function () {
  // 🔸 Forzar "última actividad" (evita que el backend ya venga contando inactividad)
  try {
    await this.page.mouse.move(10, 10);
    await this.page.keyboard.press('Shift');
  } catch {
    // si falla por alguna razón, no bloquea el test
  }

  this.sessionStartMs = Date.now();

  const msg = `🟢 Inicio medición inactividad:
- Hora inicio (Madrid): ${formatMadrid(this.sessionStartMs)}
- Timestamp: ${this.sessionStartMs}`;

  console.log(msg);
  if (this.attach) await this.attach(msg, 'text/plain');
});

Then(
  'la sesión debe cerrarse por inactividad en un máximo de {int} minutos',
  { timeout: 75 * 60 * 1000 }, // ✅ evita corte a 3 min
  async function (maxMinutes: number) {
    const toleranceSeconds = 30;
    const minExpectedMinutes = Math.max(0, maxMinutes - 5);
    const waitMs = (maxMinutes * 60 + 5 * 60) * 1000; // 60m + buffer

    this.page.setDefaultTimeout(waitMs);

    const loginBtn = this.page.locator('#btnSignIn');

    // 1) Detectar "sesión cerrada" (por URL a login o por login visible)
    const logoutSignal = await Promise.race([
      this.page.waitForURL(/\/login/i, { timeout: waitMs }).then(() => ({
        signal: 'URL /login detectada',
        ts: Date.now(),
      })),
      loginBtn.waitFor({ state: 'visible', timeout: waitMs }).then(() => ({
        signal: 'Pantalla de login visible (#btnSignIn)',
        ts: Date.now(),
      })),
    ]);

    const logoutDetectedAtMs = logoutSignal.ts;

    // 2) Asegurar y registrar específicamente "login visible"
    let loginVisibleAtMs = logoutDetectedAtMs;
    if (logoutSignal.signal === 'URL /login detectada') {
      await loginBtn.waitFor({ state: 'visible', timeout: 60 * 1000 });
      loginVisibleAtMs = Date.now();
    }

    // 3) Si el primer signal fue login visible, intentamos capturar URL /login (sin fallar si no cambia)
    let loginUrlAtMs: number | null = null;
    if (logoutSignal.signal === 'Pantalla de login visible (#btnSignIn)') {
      try {
        await this.page.waitForURL(/\/login/i, { timeout: 30 * 1000 });
        loginUrlAtMs = Date.now();
      } catch {
        // algunas apps no cambian URL o lo hacen distinto
      }
    }

    // 4) Métricas
    const startMs = this.sessionStartMs ?? Date.now();
    const elapsedMs = logoutDetectedAtMs - startMs;
    const elapsedMinutes = msToMinutes(elapsedMs);
    const maxAllowed = maxMinutes + toleranceSeconds / 60;

    // 5) Capturar URL actual al momento del evento (súper útil para diagnosticar falsos positivos)
    const currentUrl = this.page.url();

    // 6) Evidencia ANTES de asserts (para que quede log aunque falle por "cerró antes")
    const report =
      `⏱️ Session Timeout Result\n` +
      `- Hora inicio (Madrid): ${formatMadrid(startMs)}\n` +
      `- Hora cierre detectado (Madrid): ${formatMadrid(logoutDetectedAtMs)}\n` +
      `- Señal de cierre detectada: ${logoutSignal.signal}\n` +
      `- Hora login visible (Madrid): ${formatMadrid(loginVisibleAtMs)}\n` +
      (loginUrlAtMs ? `- Hora URL /login detectada (Madrid): ${formatMadrid(loginUrlAtMs)}\n` : ``) +
      `- URL al detectar: ${currentUrl}\n` +
      `- Tiempo transcurrido: ${formatDuration(elapsedMs)} (${elapsedMinutes.toFixed(2)} min)\n` +
      `- Regla MAX: <= ${maxMinutes} min (+${toleranceSeconds}s tolerancia)\n` +
      `- Regla MIN: >= ${minExpectedMinutes} min\n`;

    console.log(report);
    if (this.attach) await this.attach(report, 'text/plain');

    // 7) Screenshot SIEMPRE al detectar logout (pase o falle)
    try {
      fs.mkdirSync('reports/screenshots', { recursive: true });
      const screenshotPath = `reports/screenshots/session_timeout_${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Evidencia screenshot: ${screenshotPath}`);
      if (this.attach) await this.attach(`Screenshot: ${screenshotPath}`, 'text/plain');
    } catch (e) {
      console.log('⚠️ No se pudo tomar screenshot al detectar logout:', e);
    }

    // ✅ Asserts al FINAL (así no perdés evidencia si falla)
    expect(elapsedMinutes).toBeLessThanOrEqual(maxAllowed);
    expect(elapsedMinutes).toBeGreaterThanOrEqual(minExpectedMinutes);
  }
);
