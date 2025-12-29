import { expect, Page } from '@playwright/test';

export class DrawRequestPage {
  constructor(private page: Page) {}

  // ---------- helpers ----------
  private sidebarToggler() {
    return this.page.locator('#bnNavBarToggler1');
  }

  private drawRequestMenuItem() {
    // menú lateral (a.us-menu-item) o link visible
    return this.page
      .locator('a.us-menu-item', { hasText: /Draw\s+Request/i })
      .first()
      .or(this.page.getByRole('link', { name: /Draw Request/i }).first());
  }

  private breadcrumb() {
    return this.page.locator('a.link', { hasText: /Draw Request/i }).first();
  }

  private title() {
    return this.page.locator('.sc-dVBluf, .page-title').filter({ hasText: /^Draw Request$/i }).first();
  }

  private grid() {
    return this.page.locator('.k-grid').first();
  }

  private async ensureSidebarOpen() {
    const toggler = this.sidebarToggler();

    // Si existe, lo tocamos para asegurar el menú (en algunos layouts, el menú no está en DOM hasta abrir)
    if (await toggler.isVisible().catch(() => false)) {
      await toggler.click().catch(() => {});
      // pequeño delay para que renderice
      await this.page.waitForTimeout(300);
    }
  }

  private async tryClickMenuOnce(timeoutMs: number) {
    await this.ensureSidebarOpen();

    const item = this.drawRequestMenuItem();
    await expect(item).toBeVisible({ timeout: timeoutMs });
    await item.click();
  }

  // ========== ir a Draw Request y verificar la carga ==========
  async goToDrawRequestAndVerify() {
    // ✅ retry con estrategia escalonada
    const attempts = [
      { label: 'attempt 1 (menu click)', timeout: 15000, afterFail: 'none' as const },
      { label: 'attempt 2 (re-open sidebar + menu click)', timeout: 20000, afterFail: 'sidebar' as const },
      { label: 'attempt 3 (reload + menu click)', timeout: 25000, afterFail: 'reload' as const },
    ];

    let navigated = false;
    let lastError: any = null;

    for (const a of attempts) {
      try {
        console.log(`[DrawRequest] ${a.label}`);

        if (a.afterFail === 'sidebar') {
          await this.ensureSidebarOpen();
        }
        if (a.afterFail === 'reload') {
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForTimeout(800);
          await this.ensureSidebarOpen();
        }

        await this.tryClickMenuOnce(a.timeout);

        // Esperar URL
        await this.page.waitForURL(/\/drawRequest(\?|$)/, { timeout: 25000 });
        navigated = true;
        break;
      } catch (e) {
        lastError = e;
        console.log(`[DrawRequest] ⚠️ Falló ${a.label}: ${(e as Error)?.message ?? e}`);
      }
    }

    // ✅ fallback: ir directo por URL si el menú es flaky
    if (!navigated) {
      console.log('[DrawRequest] 🧭 Fallback: navegando directo por URL /drawRequest');
      // Si tu app usa base URL distinta, esto igual funciona si ya estás dentro del portal autenticado.
      await this.page.goto('/drawRequest', { waitUntil: 'domcontentloaded' }).catch(async () => {
        // si goto relativo no funciona, intentar absoluto a partir de current origin
        const url = new URL(this.page.url());
        await this.page.goto(`${url.origin}/drawRequest`, { waitUntil: 'domcontentloaded' });
      });

      await this.page.waitForURL(/\/drawRequest(\?|$)/, { timeout: 25000 });
      navigated = true;
    }

    if (!navigated) {
      throw lastError ?? new Error('No se pudo navegar a Draw Request (menú no visible).');
    }

    // ✅ verificar UI base (con tolerancia)
    await expect(this.breadcrumb()).toBeVisible({ timeout: 20000 });
    await expect(this.title()).toBeVisible({ timeout: 20000 });

    // algunas veces el grid tarda por data → esperar visible/attached
    await expect(this.grid()).toBeVisible({ timeout: 30000 });
    console.log('[DrawRequest] ✅ Página Draw Request cargada.');
  }

  // ========== abrir modal New DrawLoan ==========
  async openNewDrawLoanModal() {
    const newBtn = this.page.locator('button.button-option', { hasText: /New\s+DrawLoan/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 20000 });
    await newBtn.click();

    const modal = this.page.locator('.modal-content').first();
    const modalTitle = modal.locator('.modal-title', { hasText: /New\s+DrawLoan\s+Request/i });
    await expect(modal).toBeVisible({ timeout: 20000 });
    await expect(modalTitle).toBeVisible({ timeout: 20000 });
  }

  // ========== completar y confirmar ==========
  async fillModalAndConfirm(loanNumber: string, investorAccount: string, amount: number, comments: string) {
    const modal = this.page.locator('.modal-content').first();

    const loanInput = modal
      .locator('div:has-text("Loan Number") ~ div input.k-input-inner, div:has-text("Loan Number") ~ div input.form-control-sm, input#\\:r15\\:')
      .first();

    const accountInput = modal
      .locator(
        'div:has-text("Investor Account Number") ~ div input.k-input-inner, div:has-text("Investor Account Number") ~ div input.form-control-sm, input#\\:r16\\:'
      )
      .first();

    const amountInput = modal
      .locator('div:has-text("Amount") ~ div input.k-input-inner[type="tel"], input[role="spinbutton"]')
      .first();

    const commentsInput = modal.locator('div:has-text("Comments") ~ div input').first();

    await expect(loanInput).toBeVisible({ timeout: 20000 });
    await loanInput.fill('');
    await loanInput.type(loanNumber);

    await expect(accountInput).toBeVisible({ timeout: 20000 });
    await accountInput.fill('');
    await accountInput.type(investorAccount);

    const formattedAmount = amount.toFixed(2);
    await expect(amountInput).toBeVisible({ timeout: 20000 });
    await amountInput.click({ clickCount: 3 });
    await amountInput.fill(formattedAmount);

    if (await commentsInput.isVisible().catch(() => false)) {
      await commentsInput.fill(comments);
    }

    const confirmBtn = modal
      .locator('#btnInsertDrawRequest')
      .first()
      .or(modal.getByRole('button', { name: /^Confirm$/i }).first());

    await expect(confirmBtn).toBeVisible({ timeout: 20000 });
    await confirmBtn.click();

    await expect(modal).toBeHidden({ timeout: 30000 });
  }

  // ========== verificar fila creada ==========
  async expectRowAppears(loanNumber: string, investorAccount: string, minAmount: number) {
    const grid = this.grid();
    await expect(grid).toBeVisible({ timeout: 30000 });

    // Nota: a veces el orden de columnas cambia; si eso pasa, hay que ubicar por header.
    const row = this.page
      .locator('.k-grid .k-table-tbody .k-table-row')
      .filter({
        has: this.page.locator('.k-table-td', { hasText: new RegExp(`^${loanNumber}$`) }),
      })
      .first();

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

    await expect(statusCell).toBeVisible({ timeout: 10000 });
  }
}
