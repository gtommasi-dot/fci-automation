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

  // --- Helpers de archivos (nuevo) ---
  private resolveAssetPath(rel: string): string {
    // Permite sobreescribir la carpeta base via env si querés (opcional)
    const base = process.env.ASSETS_DIR || path.join(process.cwd(), 'tests', 'assets');
    return path.resolve(base, rel);
  }

  /** Igual que antes: sube un archivo usando una ruta absoluta que ya le pases */
  async uploadTiff(filePath: string) {
    const realInput = this.page.locator('input#imageFile[type="file"]');
    await realInput.setInputFiles(filePath);
  }

  /** Nuevo: sube un archivo a partir de una ruta relativa dentro de tests/assets */
    async uploadTiffFromAssets(relativePath: string) {
    // resuelve desde tests/assets
    const filePath = path.resolve(__dirname, '..', 'assets', relativePath);
    console.log('📂 Subiendo archivo:', filePath);

    const realInput = this.page.locator('input#imageFile[type="file"]');
    await realInput.setInputFiles(filePath);
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
    await this.waitForGroupsTable();
  }

  // --- LISTA / TABLA ---
  async waitForGroupsTable() {
    const grid = this.page.locator('div.k-grid-aria-root[role="grid"]');
    await grid.waitFor({ state: 'visible' });
    await this.page.locator('.k-pager-info').waitFor({ state: 'visible' });
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

  async assertInfoAfterSplit() {
    const infoLeft = this.page.locator('#info');
    await infoLeft.waitFor({ state: 'visible' });

    const date = infoLeft.locator('input.us-input__field').nth(0);
    const username = infoLeft.locator('input.us-input__field').nth(1);
    const fileName = infoLeft.locator('input.us-input__field').nth(2);
    const attachmentPath = infoLeft.locator('input.us-input__field').nth(3);

    await expect(date).toHaveAttribute('value', /.+/);
    await expect(username).toHaveAttribute('value', /.+/);
    await expect(fileName).toHaveAttribute('value', /.+\.tif$/i);
    await expect(attachmentPath).toHaveAttribute('value', /\\\\.+\.tif$/i);
  }

  async returnToGroups() {
    await this.page.goto(this.groupsUrl);
    await expect(this.page).toHaveURL(this.groupsUrl);
    await this.waitForGroupsTable();
  }

  async clickFirstRowDetails() {
    const firstDetails = this.page.locator('tbody tr').first().locator('button:has-text("Details")');
    await firstDetails.waitFor({ state: 'visible' });
    await firstDetails.click();
    await expect(this.page).toHaveURL(this.groupsDetailUrl);
  }

  async clickFirstInfoInDetails() {
    const infoBtn = this.page.locator('button.us-button:has-text("Info")').first();
    await infoBtn.waitFor({ state: 'visible' });
    await infoBtn.click();
  }

  async assertThreeBlocksPresent() {
    await this.page.locator('.header-box:has-text("[PENDING TASK]")').waitFor({ state: 'visible' });
    await this.page.locator('#cardLoan').waitFor({ state: 'visible' });
    await this.page.locator('#imageOCRCheck').waitFor({ state: 'visible' });
  }

  async selectAccount(value: string) {
    const combobox = this.page.locator('#cardLoan .AccountBox input[role="combobox"]');
    await combobox.waitFor({ state: 'visible' });
    await combobox.click();
    await combobox.fill(value);

    const option = this.page.locator(`[role="option"] >> text=${value}`);
    await option.waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.keyboard.press('Enter');
    await expect(combobox).toHaveAttribute('value', value, { timeout: 10_000 });
  }

  async setTotalAmount(amount: number | string) {
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
    const block = this.page.locator('div.alert.alert-success');
    await block.waitFor({ state: 'visible' });

    const fullNameP = block.locator('p:has-text("Full Name:")');
    const trustAccP = block.locator('p:has-text("Trust Account:")');
    const monthlyP  = block.locator('p:has-text("Monthly Payment:")');
    const lenderP   = block.locator('p:has-text("Lender name:")');

    await expect(fullNameP).toContainText(/Full Name:\s+\S.+/);
    await expect(trustAccP).toContainText(/Trust Account:\s+\S.+/);
    await expect(monthlyP).toContainText(/Monthly Payment:\s+\$/);
    await expect(lenderP).toHaveText(/Lender name:\s+.+/, { timeout: 15000 });

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
