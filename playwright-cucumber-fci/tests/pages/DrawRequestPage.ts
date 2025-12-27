import { expect, Locator, Page } from '@playwright/test';

export class DrawRequestPage {
  constructor(private page: Page) {}


  // ========== ir a Draw Request y verificar la carga ==========
  async goToDrawRequestAndVerify() {
    
    // Click en menú “Draw Request”
    const menuItem =
      this.page.locator('a.us-menu-item', { hasText: /Draw\s+Request/i }).first()
        .or(this.page.getByRole('link', { name: /Draw Request/i }).first());

    await expect(menuItem).toBeVisible({ timeout: 15000 });
    await menuItem.click();

    // Verificar URL y UI base
    await this.page.waitForURL(/\/drawRequest(\?|$)/, { timeout: 20000 });

    const breadcrumb = this.page.locator('a.link', { hasText: /Draw Request/i }).first();
    const title = this.page.locator('.sc-dVBluf, .page-title').filter({ hasText: /^Draw Request$/i }).first();
    const grid = this.page.locator('.k-grid').first();

    await expect(breadcrumb).toBeVisible({ timeout: 15000 });
    await expect(title).toBeVisible({ timeout: 15000 });
    await expect(grid).toBeVisible({ timeout: 15000 });
  }

  // ========== abrir modal New DrawLoan ==========
  async openNewDrawLoanModal() {
    const newBtn = this.page.locator('button.button-option', { hasText: /New\s+DrawLoan/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 15000 });
    await newBtn.click();

    const modal = this.page.locator('.modal-content').first();
    const modalTitle = modal.locator('.modal-title', { hasText: /New\s+DrawLoan\s+Request/i });
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modalTitle).toBeVisible({ timeout: 15000 });
  }

    // ========== completar y confirmar ==========
  async fillModalAndConfirm(loanNumber: string, investorAccount: string, amount: number, comments: string) {
    const modal = this.page.locator('.modal-content').first();

    const loanInput = modal
      .locator('div:has-text("Loan Number") ~ div input.k-input-inner, div:has-text("Loan Number") ~ div input.form-control-sm, input#\\:r15\\:')
      .first();

    const accountInput = modal
      .locator('div:has-text("Investor Account Number") ~ div input.k-input-inner, div:has-text("Investor Account Number") ~ div input.form-control-sm, input#\\:r16\\:')
      .first();

    const dateInput = modal.locator('div:has-text("Date Received") ~ div input.k-input-inner[role="combobox"]').first();

    const amountInput = modal
      .locator('div:has-text("Amount") ~ div input.k-input-inner[type="tel"], input[role="spinbutton"]')
      .first();

    const commentsInput = modal.locator('div:has-text("Comments") ~ div input').first();

    // Loan
    await expect(loanInput).toBeVisible({ timeout: 15000 });
    await loanInput.fill('');
    await loanInput.type(loanNumber);

    // Account
    await expect(accountInput).toBeVisible({ timeout: 15000 });
    await accountInput.fill('');
    await accountInput.type(investorAccount);

    // (Date opcional)
    // if (await dateInput.isVisible().catch(() => false)) {
    //   await dateInput.click({ clickCount: 3 });
    //   await dateInput.fill('08/14/2025');
    // }

    // Amount → convertir a formato 100.00
    const formattedAmount = amount.toFixed(2); 
    await expect(amountInput).toBeVisible({ timeout: 15000 });
    await amountInput.click({ clickCount: 3 });
    await amountInput.fill(formattedAmount);

    // Comments
    if (await commentsInput.isVisible().catch(() => false)) {
      await commentsInput.fill(comments);
    }

    // Confirmar
    const confirmBtn = modal.locator('#btnInsertDrawRequest').first()
      .or(modal.getByRole('button', { name: /^Confirm$/i }).first());
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click();

    await expect(modal).toBeHidden({ timeout: 25000 });
  }


  // ========== verificar fila creada ==========
  async expectRowAppears(loanNumber: string, investorAccount: string, minAmount: number) {
    const grid = this.page.locator('.k-grid').first();
    await expect(grid).toBeVisible({ timeout: 15000 });

    // Esperar una fila que contenga el Loan Number exacto
    const row = this.page.locator('.k-grid .k-table-tbody .k-table-row').filter({
      has: this.page.locator('.k-table-td', { hasText: new RegExp(`^${loanNumber}$`) }),
    }).first();

    await expect(row).toBeVisible({ timeout: 30000 });

    const cells = row.locator('.k-table-td, td');
    const loanCell = cells.nth(0);
    const accountCell = cells.nth(1);
    const amountCell = cells.nth(2);
    const statusCell = row.locator('td:text("Draft"), .k-table-td:text("Draft")').first();

    await expect(loanCell).toHaveText(new RegExp(`^${loanNumber}$`), { timeout: 10000 });
    await expect(accountCell).toHaveText(new RegExp(`^${investorAccount}$`), { timeout: 10000 });

    const rawAmount = (await amountCell.textContent())?.trim() ?? '';
    const numeric = Number(rawAmount.replace(/[^0-9.]/g, ''));
    expect(numeric).toBeGreaterThanOrEqual(minAmount);

    await expect(statusCell).toBeVisible({ timeout: 10000 }); // “Draft”
  }
}
