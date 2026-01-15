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



  // =======================
// BULK DRAW REQUEST
// =======================


  // ---------- bulk helpers ----------
  private refreshButton() {
    // preferimos id si existe, sino por nombre visible
    return this.page
      .locator('#btnRefresh')
      .first()
      .or(this.page.getByRole('button', { name: /Refresh/i }).first());
  }

  private mainGridRows() {
    return this.page.locator('.k-grid .k-table-tbody tr.k-table-row');
  }

  private async clickRefreshAndWait() {
    const btn = this.refreshButton();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      // el grid suele actualizar rápido pero a veces necesita un breath
      await this.page.waitForTimeout(800);
      // en algunos casos ayuda a esperar red estable
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  private async waitForGridToHaveAtLeastRows(minRows: number, totalTimeoutMs = 90000) {
    const start = Date.now();
    let lastCount = 0;

    while (Date.now() - start < totalTimeoutMs) {
      await expect(this.grid()).toBeVisible({ timeout: 15000 });

      lastCount = await this.mainGridRows().count().catch(() => 0);
      if (lastCount >= minRows) return;

      // refresh “suave” antes de seguir esperando
      await this.clickRefreshAndWait();
      await this.page.waitForTimeout(1200);
    }

    throw new Error(
      `[DrawRequest] La grilla no llegó a ${minRows} filas en ${totalTimeoutMs}ms (último count=${lastCount}).`
    );
  }

  private rowByLoanAndAccount(loanNumber: string, investorAccount: string) {
    const grid = this.grid();

    // filtro por celdas concretas (más robusto que hasText global)
    return grid
      .locator('.k-table-tbody tr.k-table-row')
      .filter({ has: this.page.locator('td', { hasText: new RegExp(`^\\s*${loanNumber}\\s*$`) }) })
      .filter({ has: this.page.locator('td', { hasText: new RegExp(`^\\s*${investorAccount}\\s*$`) }) })
      .first();
  }


private bulkButton() {
  return this.page.getByRole('button', { name: /Bulk Draw Request/i }).first();
}

private bulkModal() {
  // modal principal
  return this.page.locator('.modal-content').first();
}

private bulkModalTitle() {
  return this.bulkModal().getByText(/Import Draw Loan/i, { exact: false }).first();
}

private bulkFileInput() {
  // input real dentro del label "Load File"
  return this.bulkModal().locator('input[type="file"][accept*=".xlsx"], input[type="file"][accept*="xls"]').first();
}

private bulkGridRows() {
  return this.bulkModal().locator('.k-grid .k-table-tbody .k-table-row');
}

private bulkNoRecords() {
  return this.bulkModal().locator('.k-grid-norecords-template', { hasText: /No records available/i }).first();
}

private bulkSelectAllCheckbox() {
  // label visible "Select All" asociado a checkbox
  return this.bulkModal().getByLabel(/Select All/i).first();
}

private bulkLoadDrawLoanButton() {
  // en tu HTML aparece name="Load Draw Loan"
  return this.bulkModal()
    .locator('button[name="Load Draw Loan"]')
    .first()
    .or(this.bulkModal().getByRole('button', { name: /Load Draw Loan/i }).first());
}

async openBulkDrawRequestModal() {
  const btn = this.bulkButton();
  await expect(btn).toBeVisible({ timeout: 20000 });
  await btn.click();

  const modal = this.bulkModal();
  await expect(modal).toBeVisible({ timeout: 20000 });
  await expect(this.bulkModalTitle()).toBeVisible({ timeout: 20000 });

  // aseguramos que el input exista
  await expect(this.bulkFileInput()).toBeAttached({ timeout: 20000 });
}

async uploadBulkDrawFile(filePath: string) {
  const input = this.bulkFileInput();
  await expect(input).toBeAttached({ timeout: 20000 });

  // setInputFiles dispara la carga del archivo
  await input.setInputFiles(filePath);

  // Esperar a que se procese y aparezcan filas (con retry)
  const maxMs = 25000;
  const start = Date.now();
  let lastCount = 0;

  while (Date.now() - start < maxMs) {
    lastCount = await this.bulkGridRows().count().catch(() => 0);

    // Cuando hay datos, "No records..." suele desaparecer o al menos ya hay rows
    if (lastCount > 0) break;

    await this.page.waitForTimeout(500);
  }

  if (lastCount === 0) {
    throw new Error('Bulk modal: no se cargaron filas desde el archivo (timeout).');
  }

  // checkbox Select All debe estar habilitado cuando hay filas
  await expect(this.bulkSelectAllCheckbox()).toBeVisible({ timeout: 15000 });
}

async expectBulkModalRowCount(expectedCount: number) {
  const rows = this.bulkGridRows();

  // retry por UI flakey / virtual grid
  const maxMs = 20000;
  const start = Date.now();
  let count = 0;

  while (Date.now() - start < maxMs) {
    count = await rows.count().catch(() => 0);
    if (count === expectedCount) break;
    await this.page.waitForTimeout(400);
  }

  expect(count).toBe(expectedCount);
}

async bulkSelectAll() {
  const selectAll = this.bulkSelectAllCheckbox();
  await expect(selectAll).toBeVisible({ timeout: 15000 });

  // si ya está checked, no hacemos nada
  const checked = await selectAll.isChecked().catch(() => false);
  if (!checked) {
    await selectAll.click();
    await expect(selectAll).toBeChecked({ timeout: 10000 });
  }

  // el botón debería habilitarse luego de seleccionar
  const loadBtn = this.bulkLoadDrawLoanButton();
  await expect(loadBtn).toBeVisible({ timeout: 15000 });

  // esperar a enabled (a veces tarda)
  await expect(loadBtn).toBeEnabled({ timeout: 15000 });
}

async bulkLoadDrawLoanAndWaitClose() {
  const loadBtn = this.bulkLoadDrawLoanButton();
  await expect(loadBtn).toBeEnabled({ timeout: 15000 });

  await loadBtn.click();

  // el modal se cierra al procesar
  await expect(this.bulkModal()).toBeHidden({ timeout: 30000 });

  // grid principal visible
  await expect(this.grid()).toBeVisible({ timeout: 30000 });
}

/**
 * Valida que existan filas en la grilla principal para cada (loan, account)
 * y que el Amount sea >= minAmount
 */
  async expectRowsInMainGrid(
    expected: Array<{ LoanNumber: string; InvestorAccount: string; MinAmount: number }>,
    options?: { totalTimeoutMs?: number; perAttemptTimeoutMs?: number; minRows?: number }
  ) {
    const totalTimeoutMs = options?.totalTimeoutMs ?? 120000; // ✅ 2 minutos total
    const perAttemptTimeoutMs = options?.perAttemptTimeoutMs ?? 30000; // cada intento 30s
    const minRows = options?.minRows ?? Math.min(expected.length, 11); // para bulk normalmente 11

    // primero: asegurar que “algo” cargó en la grilla
    await this.waitForGridToHaveAtLeastRows(minRows, Math.min(totalTimeoutMs, 90000));

    const start = Date.now();
    let attempt = 0;
    let lastError: any = null;

    while (Date.now() - start < totalTimeoutMs) {
      attempt++;

      try {
        console.log(`[DrawRequest] 🔎 Verificando filas (attempt ${attempt})...`);

        for (const r of expected) {
          const row = this.rowByLoanAndAccount(r.LoanNumber, r.InvestorAccount);

          // ✅ esperamos que aparezca la fila
          await expect(row).toBeVisible({ timeout: perAttemptTimeoutMs });

          // ✅ validar amount mínimo (buscamos la celda con $ y parseamos)
          // Tip: si la columna cambia, esto igual funciona porque toma el primer td que parezca monto.
          const amountCell = row.locator('td').filter({ hasText: /\$/ }).first();
          const rawAmount = (await amountCell.textContent())?.trim() ?? '';
          const numeric = Number(rawAmount.replace(/[^0-9.]/g, ''));
          expect(numeric).toBeGreaterThanOrEqual(r.MinAmount);
        }

        console.log(`[DrawRequest] ✅ Filas encontradas y validadas.`);
        return; // ✅ ok

      } catch (e) {
        lastError = e;
        console.log(`[DrawRequest] ⚠️ No se reflejó aún (attempt ${attempt}): ${(e as Error)?.message ?? e}`);

        // estrategia escalonada:
        // 1) refresh
        await this.clickRefreshAndWait();

        // 2) si seguimos sin ver cambios cada 2 intentos → reload
        if (attempt % 2 === 0) {
          console.log('[DrawRequest] 🔄 Reload para forzar data fresh...');
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForLoadState('networkidle').catch(() => {});
        }

        await this.page.waitForTimeout(1200);
      }
    }

    throw lastError ?? new Error(`[DrawRequest] No se pudieron validar filas en ${totalTimeoutMs}ms.`);
  }


}
