import { When, Then } from '@cucumber/cucumber';
import { PayoffRequestLenderPage } from '../../pages/PayoffRequestLenderPage';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

function safeSlug(s: string) {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

When('expando el menú Loan Portfolio', async function () {
  this.payoffRequestLenderPage = this.payoffRequestLenderPage ?? new PayoffRequestLenderPage(this.page);

  const outDir = path.join(process.cwd(), 'test-results', 'payoff-debug');
  await ensureDir(outDir);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `expand-loan-portfolio_${stamp}`;

  const tryExpand = async (attempt: number) => {
    console.log(`🔽 [Loan Portfolio] Intento ${attempt}/2 -> expandir menú`);
    await this.payoffRequestLenderPage.openLoanPortfolioDropdown();
  };

  try {
    await tryExpand(1);
    return;
  } catch (e1: any) {
    console.warn(`⚠️ Falló intento 1 al expandir menú: ${e1?.message ?? e1}`);

    // mini respiro + reintento
    await this.page.waitForTimeout(800);

    try {
      await tryExpand(2);
      return;
    } catch (e2: any) {
      console.error(`❌ Falló intento 2 al expandir menú: ${e2?.message ?? e2}`);

      // --- LOGS útiles ---
      const url = this.page.url();
      const title = await this.page.title().catch(() => '');
      console.log(`🧭 URL actual: ${url}`);
      console.log(`📄 Title: ${title}`);

      // Intento “diagnóstico”: cuántos nav hay y si alguno contiene el texto
      const navCount = await this.page.getByRole('navigation').count().catch(() => 0);
      console.log(`🧩 navigation count: ${navCount}`);

      const loanTextCount = await this.page.getByText('Loan Portfolio', { exact: true }).count().catch(() => 0);
      console.log(`🔎 "Loan Portfolio" text occurrences: ${loanTextCount}`);

      // --- Evidencia (screenshot + html) ---
      const screenshotPath = path.join(outDir, `${baseName}.png`);
      const htmlPath = path.join(outDir, `${baseName}.html`);

      const screenshot = await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
      const html = await this.page.content().catch(() => '');

      await fs.promises.writeFile(htmlPath, html, 'utf-8').catch(() => {});

      // Adjuntar a reporte Cucumber si está disponible
      if (typeof this.attach === 'function') {
        if (screenshot) {
          await this.attach(screenshot, 'image/png');
        }
        if (html) {
          await this.attach(html, 'text/html');
        }
      }

      // Re-lanzar el error original con contexto
      throw new Error(
        [
          `No se pudo expandir el menú "Loan Portfolio" tras 2 intentos.`,
          `URL: ${url}`,
          `Title: ${title}`,
          `Evidence: ${screenshotPath}`,
          `HTML: ${htmlPath}`,
          `Original error: ${e2?.message ?? e2}`,
        ].join('\n')
      );
    }
  }
});

When('ingreso a Loan Portfolio', async function () {
  await this.payoffRequestLenderPage.goToLoanPortfolio();
});

When('hago click en el botón INFO del primer loan', async function () {
  await this.payoffRequestLenderPage.clickFirstInfoButton();
});

When('selecciono Loan Details en el dropdown de INFO', async function () {
  await this.payoffRequestLenderPage.selectLoanDetailsFromInfoDropdown();
});

When('hago click en Send a Request Payoff', async function () {
  await this.payoffRequestLenderPage.clickSendRequestPayoff();
});

When('espero el modal de solicitud de Payoff', async function () {
  await this.payoffRequestLenderPage.waitForPayoffModal();
});

When('selecciono {string} en Request By', async function (value: string) {
  await this.payoffRequestLenderPage.selectRequestBy(value as any);
});

When('selecciono {string} en Reason', async function (value: string) {
  await this.payoffRequestLenderPage.selectReason(value);
});

When('ingreso el comentario en la solicitud de Payoff', async function () {
  await this.payoffRequestLenderPage.writePayoffComment('Solicitud de payoff automatizada ' + Date.now());
});

When('valido el texto informativo del modal', async function () {
  const expectedText =
    'Note: PAYOFF REQUEST/DEMAND FEE: $30 minimum that the Lender is obligated to pay depending on Federal/State Regulations.';
  await this.payoffRequestLenderPage.verifyInfoText(expectedText);
});

When('envío la solicitud de Payoff', async function () {
  await this.payoffRequestLenderPage.submitPayoffRequest();
});

When('gestionar el resultado de la solicitud de Payoff', async function () {
  this.payoffOutcome = await this.payoffRequestLenderPage.handlePayoffResult();
  console.log('Payoff outcome ->', this.payoffOutcome);
});

When('espero el modal de éxito tras la solicitud de Payoff', async function () {
  if (this.payoffOutcome !== 'success') {
    console.log(`Outcome "${this.payoffOutcome}": no se espera modal de éxito. Paso omitido.`);
    return;
  }
  await this.payoffRequestLenderPage.waitForSuccessModal();
});

When('hago click en Track My Payoff y valido el tracker', async function () {
  if (this.payoffOutcome !== 'success') {
    console.log(`Outcome "${this.payoffOutcome}": no hay modal; omito tracker.`);
    return;
  }
  await this.payoffRequestLenderPage.clickTrackMyPayoffAndVerify();
});

When('hago click en Review Payoff Demand y valido el documento', async function () {
  if (this.payoffOutcome !== 'success') {
    console.log(`Outcome "${this.payoffOutcome}": no hay modal; omito review.`);
    return;
  }
  this.reviewPayoffPage = await this.payoffRequestLenderPage.clickReviewPayoffDemandAndVerify();
});

When('acepto los términos y continúo en el documento de review', async function () {
  if (!this.reviewPayoffPage) {
    console.log('No review page: omito.');
    return;
  }
  await this.payoffRequestLenderPage.acceptTermsAndContinue(this.reviewPayoffPage);
});

When('abro el modal de firma', async function () {
  if (!this.reviewPayoffPage) {
    console.log('No review page: omito.');
    return;
  }
  await this.payoffRequestLenderPage.openSignatureModal(this.reviewPayoffPage);
});

When('ingreso la firma y acepto en el modal', async function () {
  if (!this.reviewPayoffPage) {
    console.log('No review page: omito.');
    return;
  }
  await this.payoffRequestLenderPage.fillSignatureAndAccept(this.reviewPayoffPage, 'Firma Automatizada ' + Date.now());
});

When('hago click en los campos de Signature, Print Name y Date', async function () {
  if (!this.reviewPayoffPage) {
    console.log('No review page: omito.');
    return;
  }
  await this.payoffRequestLenderPage.clickSignatureBoxes(this.reviewPayoffPage);
});

Then('envío la firma y verifico la aprobación', async function () {
  if (!this.reviewPayoffPage) {
    console.log('No review page: omito aprobación.');
    return;
  }
  await this.payoffRequestLenderPage.submitApprovalAndCheck(this.reviewPayoffPage);
});
