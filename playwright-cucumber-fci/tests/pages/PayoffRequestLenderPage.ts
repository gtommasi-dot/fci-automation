import { Page, expect, Locator } from '@playwright/test';
import { PopupPage } from './PopupPage';


export class PayoffRequestLenderPage {

  constructor(private page: Page) {}

  // 1. Cerrar popup si está presente
  async closePopupIfPresent() {
    const popup = new PopupPage(this.page);
    await popup.closeIfPresent();
  }

private sideNav() {
  return this.page
    .getByRole('navigation')
    .filter({ has: this.page.getByText('Loan Portfolio', { exact: true }) })
    .first();
}

// private loanPortfolioTrigger(nav = this.sideNav()) {
//   Es el DIV que despliega/colapsa
//   return nav.locator('.us-collapse-trigger', {
//     has: nav.getByText('Loan Portfolio', { exact: true }),
//   }).first();
// }

private loanPortfolioSubmenu(): Locator {
    // El submenu que tiene el TRIGGER "Loan Portfolio" (no el link interno)
    return this.page
      .locator('.us-menu-submenu')
      .filter({
        has: this.page.locator('.us-collapse-trigger .us-menu-item__title', {
          hasText: /^Loan Portfolio$/i,
        }),
      })
      .first();
  }

   private loanPortfolioTrigger(submenu = this.loanPortfolioSubmenu()): Locator {
    return submenu.locator('.us-collapse-trigger').first();
  }

  private loanPortfolioCollapse(submenu = this.loanPortfolioSubmenu()): Locator {
    return submenu.locator('.us-collapse').first();
  }

private loanPortfolioLink(submenu = this.loanPortfolioSubmenu()): Locator {
    return submenu.locator('a[href="/lender/loans"]').first();
  }

  private async ensureSidebarReady() {
    // Espera a que exista el menú real (por clases), no por role navigation
    await this.page.waitForSelector('.us-menu-submenu .us-collapse-trigger', { timeout: 60000 });
  }




  // 2. Expandir Loan Portfolio en menú lateral
 async openLoanPortfolioDropdown() {
    await this.ensureSidebarReady();

    const submenu = this.loanPortfolioSubmenu();
    const trigger = this.loanPortfolioTrigger(submenu);
    const collapse = this.loanPortfolioCollapse(submenu);

    await expect(trigger).toBeVisible({ timeout: 60000 });
    await trigger.scrollIntoViewIfNeeded();

    // Si ya está expandido, no lo vuelvas a tocar
    const hiddenBefore = (await collapse.getAttribute('data-hidden').catch(() => 'true')) ?? 'true';
    if (hiddenBefore === 'false') return;

    await trigger.click();

    // Espera a que el submenu se “abra”
    await expect(collapse).toHaveAttribute('data-hidden', 'false', { timeout: 30000 });
    await expect(this.loanPortfolioLink(submenu)).toBeVisible({ timeout: 30000 });
  }                           

  // 3. Ir a Loan Portfolio > primer item
 async goToLoanPortfolio() {
    await this.ensureSidebarReady();

    const submenu = this.loanPortfolioSubmenu();

    // Aseguro expandido
    const collapse = this.loanPortfolioCollapse(submenu);
    const hidden = (await collapse.getAttribute('data-hidden').catch(() => 'true')) ?? 'true';
    if (hidden === 'true') {
      await this.openLoanPortfolioDropdown();
    }

    const link = this.loanPortfolioLink(submenu);
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.scrollIntoViewIfNeeded();

    // Evita 100% el problema de “intercept pointer events”
    await Promise.all([
      this.page.waitForURL(/\/lender\/loans/i, { timeout: 60000 }),
      link.focus().then(() => this.page.keyboard.press('Enter')),
    ]);

    await expect(this.page).toHaveURL(/.*\/lender\/loans/i);
    await this.page.waitForSelector('table.k-grid-table', { timeout: 60000 });
  }

  // 4. Abrir filtro Loan Status
  async openLoanStatusFilter() {
    // Click en el icono de filtro de Loan Status (ajustado para el grid)
    const filterBtn = this.page.locator('//th[normalize-space(.)="Loan Status"]//a[contains(@class, "k-grid-header-menu")]');
    await filterBtn.waitFor({ state: 'visible', timeout: 35000 });
    await filterBtn.click();

  }

  // 5. Seleccionar "Performing" en el filtro y aplicar
  async filterLoanStatusPerforming() {
    await this.page.check('//span[contains(text(), "Performing")]/preceding-sibling::input[@type="checkbox"]');
    await this.page.click('//button[.//span[contains(text(),"Filter")]]');
    // Espera a que la tabla se actualice (puedes esperar a que desaparezca el loading o a que el primer row sea visible)
    await this.page.waitForSelector('table.k-grid-table tbody tr', { timeout: 30000 });
  }

  // 6. Click en botón INFO de primer loan
  async clickFirstInfoButton() {
    // Busca primer botón INFO de la tabla de loans
    await this.page.click('//table[contains(@class,"k-grid-table")]//button[contains(@class,"btn-success") and contains(text(),"INFO")][1]');
  }

  // 7. Click en primer item del dropdown INFO: Loan Details
  async selectLoanDetailsFromInfoDropdown() {
    // Espera el menú desplegado y selecciona Loan Details
    await this.page.click('//ul[contains(@class,"k-menu-vertical")]//span[contains(text(), "Loan Details")]', { timeout: 7000 });
    // Espera que cargue Loan Details (usa algún texto/selector de Loan Details)
    await this.page.waitForSelector(
  '//div[contains(@class,"card") and contains(@class,"mb-4") and .//div[contains(@class,"card-header") and contains(text(),"Loan Information")]]',
  { timeout: 15000 });
  }

  // 8. Click en Send a Request Payoff dentro de Loan Details
  async clickSendRequestPayoff() {
    await this.page.click('xpath=//button[.//div[contains(@class,"us-button__content") and normalize-space(.)="Send a Request Payoff"]]');
  }

  // 1. Esperar a que se abra el modal
async waitForPayoffModal() {
    await this.page.waitForSelector("xpath=//div[contains(@class, 'us-modal-header__title') and normalize-space(.)='Payoff Request']", { timeout: 10000 });
}

// Normaliza texto (para comparar valores del chip)
  private norm(t?: string | null) {
    return (t ?? '').trim().toLowerCase();
  }
  private escRe(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Devuelve el bloque .form-group de un dropdown por su etiqueta visible */
  private sectionByLabel(labelText: string): Locator {
    return this.page
      .locator('.form-group.row')
      .filter({ has: this.page.locator('.col-form-label', { hasText: new RegExp(`^\\s*${this.escRe(labelText)}\\s*\\*?\\s*$`, 'i') }) })
      .first();
  }

  /** Selecciona en un dropdown (scoped por label). Si ya está el valor, no abre el popup. */
 private async selectInDropdownByLabel(labelText: string, option: string) {
  const wanted = this.norm(option);
  const section = this.sectionByLabel(labelText);

  await expect(section, `No encontré la sección "${labelText}".`).toBeVisible({ timeout: 10000 });

  const dropdown = section.locator('.us-input.us-input--selectable').first();
  const chip = dropdown.locator('.us-input__content .us-input__search').first();

  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const currentRaw =
    (await chip.count()) ? (await chip.getAttribute('title')) ?? (await chip.textContent()) : '';
  const current = this.norm(currentRaw);

  // Si ya coincide, validamos y salimos sin abrir
  if (current && current === wanted) {
    await expect(chip).toHaveText(new RegExp(`^${this.escRe(option)}$`, 'i'));
    return;
  }

  // Función que abre, selecciona y valida. Reintentable.
  const attemptSelect = async () => {
    // Cierra popovers previos por si quedaron abiertos
    const anyPopover = this.page.locator('.us-popover .us-list').first();
    if (await anyPopover.isVisible()) {
      await this.page.keyboard.press('Escape');
      await expect(anyPopover).toBeHidden({ timeout: 5000 });
    }

    // Abrir el dropdown correcto
    await dropdown.click();
    const popover = this.page.locator('.us-popover .us-list').first();
    await expect(popover, `No se abrió la lista para "${labelText}".`).toBeVisible({ timeout: 15000 });

    // Deja que termine la animación
    await this.page.waitForTimeout(250);

    // Opciones disponibles y la deseada
    const titles = popover.locator('.us-list-item__title');
    const available = (await titles.allTextContents()).map(t => t.trim());
    const desired = titles.filter({ hasText: new RegExp(`^${this.escRe(option)}$`, 'i') });

    await expect(
      desired,
      `La opción "${option}" no está en la lista de "${labelText}". Opciones: [${available.join(', ')}]`
    ).toHaveCount(1, { timeout: 5000 });

    // Selección por CLICK (más confiable que Enter aquí)
    await desired.first().click();

    // Esperar que el popover se cierre (algunos cierran async)
    await expect(popover).toBeHidden({ timeout: 10000 });

    // Validar que el chip se actualizó
    const chipAfter = dropdown.locator('.us-input__content .us-input__search').first();
    await expect(chipAfter).toBeVisible({ timeout: 5000 });
    const afterRaw = (await chipAfter.getAttribute('title')) ?? (await chipAfter.textContent());
    const after = this.norm(afterRaw);

    return after === wanted;
  };

  // Intento 1
  if (await attemptSelect()) return;

  // Pequeño respiro y reintento (algunas UIs requieren segundo intento)
  await this.page.waitForTimeout(300);

  // Intento 2 (final)
  const ok = await attemptSelect();
  expect(ok, `El valor seleccionado en "${labelText}" no se reflejó en el chip.`).toBe(true);
}

private async sleep(ms: number) {
  await this.page.waitForTimeout(ms);
}


private dropdownDelayMs = 1000; // ajustable

async selectRequestBy(option: 'Lender' | 'Borrower' | 'Broker') {
  await this.selectInDropdownByLabel('Request By', option);
  await this.sleep(this.dropdownDelayMs);
}

async selectReason(option: string) {
  await this.selectInDropdownByLabel('Reason', option);
  await this.sleep(this.dropdownDelayMs);
}

// 3. Escribir comentario
async writePayoffComment(comment: string) {
    await this.page.locator("xpath=//textarea[@role='textbox' and contains(@class, 'k-input-inner')]").fill(comment);
}

// 4. Validar texto informativo
async verifyInfoText(expectedText: string) {
    const infoText = await this.page.textContent("xpath=//div[contains(@class, 'us-alert--primary') and starts-with(normalize-space(.), 'Note:')]");
    if (!infoText?.includes(expectedText)) {
        throw new Error('No se encontró el texto informativo esperado en el modal de Payoff.');
    }
}

/** Root del modal de Payoff Request */
private payoffModal() {
  return this.page.locator('[role="dialog"], .us-modal')
    .filter({ hasText: /payoff request/i })
    .first();
}

/** ¿Hay alertas de fechas inválidas? */
private async hasInvalidDateAlerts(): Promise<boolean> {
  const modal = this.payoffModal();
  const alerts = modal.locator('.us-alert.us-alert--danger')
    .filter({ hasText: /(Payoff Date invalid|Expiration Date invalid)/i });
  return await alerts.isVisible().catch(() => false);
}

/** Simula ENTER en el datepicker (el primer k-datepicker del modal) y espera que desaparezcan las alertas */
private async fixInvalidDatesByEnter(): Promise<void> {
  const modal = this.payoffModal();

  // Tomamos el primer datepicker del modal (el snippet que pasaste es Kendo datepicker)
  const dateInput = modal.locator('.k-datepicker .k-input-inner').first();

  await expect(dateInput, 'No encontré el input de fecha (k-datepicker)').toBeVisible({ timeout: 5000 });

  // Foco + ENTER para que Kendo valide el valor actual
  await dateInput.focus();
  await dateInput.press('Enter');

  // Pequeño blur por si la validación ocurre al perder foco
  await dateInput.press('Tab');

  // Espera a que desaparezcan las alertas de invalid date
  const alertsGone = modal.locator('.us-alert.us-alert--danger')
    .filter({ hasText: /(Payoff Date invalid|Expiration Date invalid)/i });
  await expect(alertsGone).toBeHidden({ timeout: 5000 });
}

// 5. Click en Submit (con autocorrección de fechas inválidas)
async submitPayoffRequest() {
  const modal = this.payoffModal();
  const submitBtn = modal.getByRole('button', { name: /submit/i });

  await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
  await submitBtn.click();

  // Deja que rendericen las validaciones
  await this.page.waitForTimeout(300);

  // Si aparecen las alertas de fecha inválida, simula ENTER en el datepicker y reintenta
  if (await this.hasInvalidDateAlerts()) {
    await this.fixInvalidDatesByEnter();

    // Reintento único de submit
    await submitBtn.click();

    // Pequeño respiro post-submit
    await this.page.waitForTimeout(300);
  }
}


// Espera y gestiona el resultado del payoff request (robusto + logs)
async handlePayoffResult(): Promise<'active' | 'further' | 'success' | 'penalty'> {
  // Mini respiro post submit
  await this.page.waitForTimeout(300);

  // --- Candidatos robustos ---
  const modalResultTitle = this.page
    .locator('.us-modal:has-text("Payoff Request") .us-result__title')
    .last();

  // Toast: tomamos el ÚLTIMO que tenga message (el más nuevo), y evitamos `.first()`
  const toastMessage = this.page
    .locator('#toast-container .toast[aria-live]:has(.toast-message) .toast-message')
    .last();

  // Esperar a que aparezca algo (modal o toast)
  const winner = await Promise.race([
    modalResultTitle.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'modal' as const).catch(() => null),
    toastMessage.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'toast' as const).catch(() => null),
  ]);

  if (!winner) {
    throw new Error('No se detectó ni modal ni toast tras enviar la solicitud de Payoff');
  }

  // Obtener el texto desde la fuente que ganó
  const rawText =
    winner === 'modal'
      ? await modalResultTitle.innerText().catch(() => '')
      : await toastMessage.innerText().catch(() => '');

  const text = (rawText || '').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // Log bien claro
  console.log(`📌 Payoff result detectado desde ${winner.toUpperCase()} -> "${text}"`);

  // Clasificación
  let outcome: 'active' | 'further' | 'success' | 'penalty';

  if (lower.includes('further review')) {
    outcome = 'further';
  } else if (lower.includes('already a payoff request active') || lower.includes('already a payoff request')) {
    outcome = 'active';
  } else if (lower.includes('prepayment penalty')) {
    outcome = 'penalty';
  } else if (lower.includes('successfully') || lower.includes('has been successfully')) {
    outcome = 'success';
  } else {
    // Si el texto vino vacío por fade raro, hacemos fallback buscando cualquier toast-message no vacía
    const anyToastTexts = (await this.page
      .locator('#toast-container .toast-message')
      .allInnerTexts()
      .catch(() => []))
      .map(t => t.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const fallbackText = anyToastTexts[anyToastTexts.length - 1] || '';
    if (fallbackText) {
      console.warn(`⚠️ Texto principal vacío/no reconocido. Fallback toast -> "${fallbackText}"`);
      const f = fallbackText.toLowerCase();
      if (f.includes('further review')) outcome = 'further';
      else if (f.includes('already a payoff request')) outcome = 'active';
      else if (f.includes('prepayment penalty')) outcome = 'penalty';
      else outcome = 'success'; // si es toast-success “raro”
    } else {
      console.warn(`⚠️ No pude clasificar el resultado. Texto: "${text}"`);
      outcome = 'active'; // default controlado
    }
  }

  // Cerrar toast si existe (sin romper si no está)
  const closeToastBtn = this.page.locator('#toast-container .toast:has(.toast-message) .toast-close-button').last();
  if (await closeToastBtn.isVisible().catch(() => false)) {
    await closeToastBtn.click().catch(() => {});
  }

  console.log(`✅ Payoff outcome -> ${outcome}`);
  return outcome;
}



// Espera y verifica la presencia del modal de éxito tras el popup
async waitForSuccessModal() {
  // 1) Espera a que aparezca algún dialog/modal que contenga “Payoff”
  const modal = this.page.locator('[role="dialog"], .us-modal')
    .filter({ hasText: /payoff/i })
    .first();

  await modal.waitFor({ state: 'visible', timeout: 60000 });

  // 2) Botones esperados (case-insensitive y sin asumir <div> interno)
  const btnReview = modal.getByRole('button', { name: /review\s*payoff\s*demand/i });
  const btnTrack  = modal.getByRole('button', { name: /track\s*my\s*payoff/i });
  const btnClose  = modal.getByRole('button', { name: /cerrar|close/i });

  await btnReview.waitFor({ state: 'visible', timeout: 60000 });
  await btnTrack.waitFor({ state: 'visible', timeout: 60000 });
  await btnClose.waitFor({ state: 'visible', timeout: 60000 });
}



async clickTrackMyPayoffAndVerify() {
  // Guarda la cantidad de páginas antes de hacer click
   const modal = this.page.locator('[role="dialog"], .us-modal').first();
  const [popup] = await Promise.all([
    this.page.context().waitForEvent('page'),
    modal.getByRole('button', { name: /track\s*my\s*payoff/i }).click()
  ]);
  await popup.waitForLoadState();
  if (!popup.url().includes('payoffTracker')) throw new Error('No se redirigió al tracker de payoff.');

  // Espera los bloques de status, activity y emails
  await popup.waitForSelector('xpath=//div[contains(@class, "us-step--current")]//div[contains(@class, "us-step__title") and text()="Active"]', { timeout: 60000 });
  await popup.waitForSelector('xpath=//div[contains(@class, "us-accordion-item--selected")]//div[contains(@class, "us-accordion-header__title") and text()="Activity"]', { timeout: 60000 });
  await popup.waitForSelector('xpath=//div[contains(@class, "us-accordion-item--selected")]//div[contains(@class, "us-accordion-header__title") and text()="Emails"]', { timeout: 60000 });

  // Cierra la pestaña del tracker
  await popup.close();
}

async clickReviewPayoffDemandAndVerify() {
  const modal = this.page.locator('[role="dialog"], .us-modal').first();
  const [popup] = await Promise.all([
    this.page.context().waitForEvent('page'),
    modal.getByRole('button', { name: /review\s*payoff\s*demand/i }).click()
  ]);
  await popup.waitForLoadState();
  if (!popup.url().includes('reviewPayoffDemand')) throw new Error('No se abrió la página de Review Payoff Demand');
  return popup;
}

async acceptTermsAndContinue(popup: Page) {
  await popup.waitForSelector('xpath=//*[@id="accept-terms"]', { timeout: 8000 });
  await popup.click('xpath=//*[@id="accept-terms"]');
  await popup.waitForSelector('xpath=//*[@id="page"]/div[3]/div[1]/div[2]/button[1][not(@disabled)]', { timeout: 8000 });
  await popup.click('xpath=//*[@id="page"]/div[3]/div[1]/div[2]/button[1]');
}
/*
async openSignatureModal(popup: Page) {
  await popup.waitForSelector('xpath=//button[contains(@class, "us-visor-box__button") and contains(@class, "us-visor-element__box")]', { timeout: 20000 });
  await popup.click('xpath=//button[contains(@class, "us-visor-box__button") and contains(@class, "us-visor-element__box")]');
  // Espera el modal de firma (nombre del cliente)
  await popup.waitForSelector('xpath=//div[contains(@class,"modal-content")]//div[text()="Client Name"]/ancestor::div[contains(@class,"us-card")]//input[@type="text" and not(@readonly)]', { timeout: 8000 });
}

async fillSignatureAndAccept(popup: Page, clientName: string) {
  const inputSelector = 'xpath=//div[contains(@class,"modal-content")]//div[text()="Client Name"]/ancestor::div[contains(@class,"us-card")]//input[@type="text" and not(@readonly)]';
  await popup.fill(inputSelector, clientName);
  await popup.click('xpath=//div[contains(@class,"modal-footer")]//button[.//div[text()="Accept"] and not(@disabled)]');
}
*/

/**
 * Abre el modal de firma y espera hasta que el campo "Client Name" esté visible.
 */
async openSignatureModal(popup: Page) {
  console.log('🖊️ Abriendo modal de firma...');

  // Esperar y hacer clic en el botón del visor que abre el modal
  const openSignatureButton = popup.locator(
    'button.us-visor-box__button.us-visor-element__box'
  );
  await expect(openSignatureButton).toBeVisible({ timeout: 20000 });
  await openSignatureButton.click();

  // Esperar el modal de firma (busca el input del card con título "Client Name")
  const clientNameInput = popup
    .getByRole('dialog')
    .locator('.us-card:has(.us-card-title:has-text("Client Name")) input.form-control:not([readonly])');

  await expect(clientNameInput).toBeVisible({ timeout: 20000 });

  console.log('✅ Modal de firma abierto correctamente.');
}

/**
 * Rellena el campo "Client Name" en el modal de firma y hace clic en "Accept".
 */
async fillSignatureAndAccept(popup: Page, clientName: string) {
  console.log(`✍️ Ingresando firma con nombre "${clientName}"...`);

  const clientNameInput = popup
    .getByRole('dialog')
    .locator('.us-card:has(.us-card-title:has-text("Client Name")) input.form-control:not([readonly])');

  await expect(clientNameInput).toBeVisible({ timeout: 20000 });
  await clientNameInput.fill(clientName);

  // Esperar y hacer clic en el botón "Accept"
  const acceptButton = popup
    .getByRole('dialog')
    .getByRole('button', { name: /Accept/i, exact: false });

  await expect(acceptButton).toBeEnabled({ timeout: 10000 });
  await acceptButton.click();

  console.log('✅ Firma ingresada y modal confirmado.');
}

async clickSignatureBoxes(popup: Page) {
  // Firmas: busca todos los botones de firma y clickea en ellos uno a uno
  const signatureBoxes = await popup.$$('xpath=//button[contains(@class,"us-visor-box__button")]');
  for (const box of signatureBoxes) await box.click();
}



async submitApprovalAndCheck(popup: Page) {
  await popup.waitForSelector('xpath=//button[contains(@class,"btn-info") and contains(.,"SUBMIT APPROVAL")]', { timeout: 15000 });
  await popup.click('xpath=//button[contains(@class,"btn-info") and contains(.,"SUBMIT APPROVAL")]');
  // Espera a que desaparezca el botón
  await popup.waitForSelector('xpath=//button[contains(@class,"btn-info") and contains(.,"SUBMIT APPROVAL")]', { state: 'detached', timeout: 15000 });
  // Valida marca de agua de Approved
  await popup.waitForSelector('xpath=//div[contains(@class,"img-status-demand") and contains(@style,"approved")]', { timeout: 8000 });
}

}


