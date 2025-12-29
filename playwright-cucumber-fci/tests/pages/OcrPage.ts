// tests/pages/OcrPage.ts
import { expect, Page } from '@playwright/test';
import path from 'path';

export class OcrPage {
  readonly page: Page;

  // URLs
  readonly groupsUrl = 'https://tfciportal.myfci.com/check/groups';
  readonly groupsDetailUrl = 'https://tfciportal.myfci.com/check/groups/detail';

  constructor(page: Page) {
    this.page = page;
  }

  // --- Helpers de archivos ---
  private resolveAssetPath(rel: string): string {
    const base = process.env.ASSETS_DIR || path.join(process.cwd(), 'tests', 'assets');
    return path.resolve(base, rel);
  }

  async uploadTiff(filePath: string) {
    const realInput = this.page.locator('input#imageFile[type="file"]');
    await realInput.setInputFiles(filePath);
  }

  async uploadTiffFromAssets(relativePath: string) {
    // 👇 tu versión actual usa __dirname, que puede variar en CI/dist.
    // mejor resolver desde process.cwd() por consistencia.
    const filePath = this.resolveAssetPath(relativePath);
    console.log('📂 Subiendo archivo:', filePath);

    const realInput = this.page.locator('input#imageFile[type="file"]');
    await realInput.setInputFiles(filePath);
  }

  // --- TOAST / ERRORES GLOBALES ---
  private dbRestoreToast() {
    return this.page.locator('#toast-container .toast.toast-error', {
      hasText: "Database 'Centurion' cannot be opened. It is in the middle of a restore",
    });
  }

  /** Si la DB está en restore, cortamos el test porque no hay nada estable que validar. */
  async abortIfDbRestoreToast() {
    try {
      // chequeo rápido (no bloquea)
      const toast = this.dbRestoreToast();
      if (await toast.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        const msg = (await toast.first().textContent().catch(() => ''))?.trim();
        console.log('[OCR] ❌ DB en restore detectada. Se aborta el test.');
        console.log('[OCR] Toast:', msg);
        throw new Error("OCR bloqueado: Database 'Centurion' está en restore. Reintentar más tarde.");
      }
    } catch (e) {
      // si ya tiramos error arriba, que explote
      throw e;
    }
  }

  // --- NAV / MENU ---
  async openSidebar() {
    const toggler = this.page.locator('#bnNavBarToggler1');
    await toggler.waitFor({ state: 'visible' });
    await toggler.click();
  }

  async expandOcrPaymentMenu() {
    const ocrPaymentTrigger = this.page.locator(
      'div.us-collapse-trigger:has(span.us-menu-item__title:text("OCR Payment"))'
    );
    await ocrPaymentTrigger.waitFor({ state: 'visible' });
    await ocrPaymentTrigger.click();
    await this.page.locator('a.us-menu-item:has-text("OCR Check Groups")').waitFor({ state: 'visible' });
  }

  async goToOcrCheckGroups() {
    await this.page.locator('a.us-menu-item:has-text("OCR Check Groups")').click();
    await expect(this.page).toHaveURL(this.groupsUrl);

    // ✅ Si DB está en restore, abortar aquí ya
    await this.abortIfDbRestoreToast();

    await this.waitForGroupsTableWithRetry();
  }

  // --- LISTA / TABLA ---
  private refreshButton() {
    // más robusto que xpath: id estable + texto
    return this.page.locator('#btnRefresh').or(this.page.getByRole('button', { name: /refresh/i }));
  }

  async waitForGroupsTable() {
    const grid = this.page.locator('div.k-grid-aria-root[role="grid"]');
    await grid.waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.locator('.k-pager-info').waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Espera la tabla con reintentos. Si a veces no carga, usamos Refresh.
   * - Reintenta N veces
   * - Detecta toast DB restore y aborta
   */
  async waitForGroupsTableWithRetry(maxAttempts: number = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.abortIfDbRestoreToast();

      try {
        await this.waitForGroupsTable();
        console.log(`[OCR] ✅ Tabla OCR visible (attempt ${attempt}/${maxAttempts}).`);
        return;
      } catch (err) {
        console.log(`[OCR] ⚠️ No cargó tabla OCR (attempt ${attempt}/${maxAttempts}).`);

        // último intento -> fallar con error original
        if (attempt === maxAttempts) throw err;

        // intentar refresh del listado
        const refresh = this.refreshButton();
        if (await refresh.isVisible().catch(() => false)) {
          console.log('[OCR] 🔄 Click en Refresh.');
          await refresh.click();
        } else {
          console.log('[OCR] 🔄 Refresh no visible, hago page.reload().');
          await this.page.reload({ waitUntil: 'domcontentloaded' });
        }

        // pequeña espera para que el grid vuelva a renderizar
        await this.page.waitForTimeout(1500);
      }
    }
  }

  async clickNewButton() {
    await this.page.locator('button.button-option:has-text("New")').click();
    await this.page.locator('.modal-content:has-text("New Split Image")').waitFor({ state: 'visible' });
  }

  async splitImageAndGenerate() {
    const splitBtn = this.page.locator('#SplitButton');
    await expect(splitBtn).toBeEnabled({ timeout: 60_000 });
    await splitBtn.click();
  }

  // --- INFO AFTER SPLIT (con reintentos) ---
  private infoPanel() {
    return this.page.locator('#info');
  }

  /**
   * A veces el split lleva a una pantalla intermedia o tarda en renderizar #info.
   * Hacemos retry con reload antes de fallar.
   */
  async assertInfoAfterSplit(maxAttempts: number = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.abortIfDbRestoreToast();

      try {
        const infoLeft = this.infoPanel();
        await infoLeft.waitFor({ state: 'visible', timeout: 30_000 });

        // Campos básicos
        const date = infoLeft.locator('input.us-input__field').nth(0);
        const username = infoLeft.locator('input.us-input__field').nth(1);
        const fileName = infoLeft.locator('input.us-input__field').nth(2);
        const attachmentPath = infoLeft.locator('input.us-input__field').nth(3);

        await expect(date).toHaveAttribute('value', /.+/);
        await expect(username).toHaveAttribute('value', /.+/);
        await expect(fileName).toHaveAttribute('value', /.+\.tif$/i);
        await expect(attachmentPath).toHaveAttribute('value', /\\\\.+\.tif$/i);

        console.log(`[OCR] ✅ Pantalla de Info del split OK (attempt ${attempt}/${maxAttempts}).`);
        return;
      } catch (err) {
        console.log(`[OCR] ⚠️ No apareció #info (attempt ${attempt}/${maxAttempts}).`);

        if (attempt === maxAttempts) throw err;

        // Reintento: reload (o volver a groups y re-entrar si lo preferís)
        console.log('[OCR] 🔄 Reintentando: page.reload() para forzar render.');
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(1500);
      }
    }
  }

  async returnToGroups() {
    await this.page.goto(this.groupsUrl, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(this.groupsUrl);

    await this.abortIfDbRestoreToast();
    await this.waitForGroupsTableWithRetry();
  }

  async clickFirstRowDetails() {
    // Asegurar tabla
    await this.waitForGroupsTableWithRetry();

    const firstDetails = this.page.locator('tbody tr').first().locator('button:has-text("Details")');
    await firstDetails.waitFor({ state: 'visible', timeout: 30_000 });
    await firstDetails.click();
    await expect(this.page).toHaveURL(this.groupsDetailUrl);
  }

  async clickFirstInfoInDetails() {
    await this.abortIfDbRestoreToast();

    const infoBtn = this.page.locator('button.us-button:has-text("Info")').first();
    await infoBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await infoBtn.click();
  }

  async assertThreeBlocksPresent() {
    await this.abortIfDbRestoreToast();

    await this.page.locator('.header-box:has-text("[PENDING TASK]")').waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.locator('#cardLoan').waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.locator('#imageOCRCheck').waitFor({ state: 'visible', timeout: 30_000 });
  }

  async selectAccount(value: string) {
    await this.abortIfDbRestoreToast();

    const combobox = this.page.locator('#cardLoan .AccountBox input[role="combobox"]');
    await combobox.waitFor({ state: 'visible', timeout: 30_000 });
    await combobox.click();
    await combobox.fill(value);

    const option = this.page.locator(`[role="option"] >> text=${value}`);
    await option.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.keyboard.press('Enter');
    await expect(combobox).toHaveAttribute('value', value, { timeout: 10_000 });
  }

  async setTotalAmount(amount: number | string) {
    await this.abortIfDbRestoreToast();

    const str = typeof amount === 'number' ? String(amount) : amount;

    const amountRow = this.page.locator('.content-box .row.align-items-center', { hasText: 'Total Amount' });
    const amountInput = amountRow.locator('input.k-input-inner');

    await amountRow.waitFor({ state: 'visible', timeout: 30_000 });
    await amountRow.scrollIntoViewIfNeeded();

    await amountInput.click({ timeout: 10_000 });
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');

    await amountInput.type(str, { delay: 30 });
    await this.page.keyboard.press('Tab');

    await expect(amountInput).toHaveValue(/\$\s*\d/);
  }

  async verifyAndLogGreenSummary() {
    await this.abortIfDbRestoreToast();

    const block = this.page.locator('div.alert.alert-success');
    await block.waitFor({ state: 'visible', timeout: 30_000 });

    const fullNameP = block.locator('p:has-text("Full Name:")');
    const trustAccP = block.locator('p:has-text("Trust Account:")');
    const monthlyP  = block.locator('p:has-text("Monthly Payment:")');
    const lenderP   = block.locator('p:has-text("Lender name:")');

    await expect(fullNameP).toContainText(/Full Name:\s+\S.+/);
    await expect(trustAccP).toContainText(/Trust Account:\s+\S.+/);
    await expect(monthlyP).toContainText(/Monthly Payment:\s+\$/);
    await expect(lenderP).toHaveText(/Lender name:\s+.+/, { timeout: 15_000 });

    const [fullName, trustAcc, monthly, lender] = await Promise.all([
      fullNameP.textContent(),
      trustAccP.textContent(),
      monthlyP.textContent(),
      lenderP.textContent(),
    ]);

    console.log('[OCR Summary]', {
      fullName: (fullName ?? '').trim(),
      trustAccount: (trustAcc ?? '').trim(),
      monthlyPayment: (monthly ?? '').trim(),
      lenderName: (lender ?? '').trim(),
    });

    expect(fullName).toMatch(/Full Name:\s+\S.+/);
    expect(trustAcc).toMatch(/Trust Account:\s+\S.+/);
    expect(monthly).toMatch(/Monthly Payment:\s+\$/);
    expect(lender).toMatch(/Lender name:\s+.+/);
  }
}
