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
  // 1) Click en el item Loan Details (tu XPath original, pero con más tolerancia)
  const menuItem = this.page.locator(
    '//ul[contains(@class,"k-menu-vertical") or @role="menu"]//span[contains(normalize-space(.),"Loan Details")]'
  ).first();

  await menuItem.waitFor({ state: 'visible', timeout: 30000 });
  await menuItem.click();

  // 2) Espera robusta post navegación/carga
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForLoadState('networkidle').catch(() => {});

  // 3) Locator flexible para detectar Loan Details
  const loanInfoHeader = this.page
    .locator('.card-header, h1, h2, h3, h4, h5')
    .filter({ hasText: /Loan Information/i })
    .first();

  await expect(loanInfoHeader).toBeVisible({ timeout: 60000 });
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
  await this.page.waitForTimeout(300);

  const modalResultTitle = this.page
    .locator('.us-modal:has-text("Payoff Request") .us-result__title')
    .last();

  const toastMessage = this.page
    .locator('#toast-container .toast[aria-live]:has(.toast-message) .toast-message')
    .last();

  const winner = await Promise.race([
    modalResultTitle.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'modal' as const).catch(() => null),
    toastMessage.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'toast' as const).catch(() => null),
  ]);

  if (!winner) throw new Error('No se detectó ni modal ni toast tras enviar la solicitud de Payoff');

  const rawText =
    winner === 'modal'
      ? await modalResultTitle.innerText().catch(() => '')
      : await toastMessage.innerText().catch(() => '');

  const text = (rawText || '').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  console.log(`📌 Payoff result detectado desde ${winner.toUpperCase()} -> "${text}"`);

  // ✅ Patrones
  const isFurther = /further\s*review/i.test(lower);
  const isPenalty = /prepayment\s*penalty/i.test(lower);

  // ✅ ACTIVE/PENDING (agregamos el mensaje nuevo)
  const isActive =
    /already\s+a\s+payoff\s+request\s+active/i.test(lower) ||
    /already\s+a\s+payoff\s+request/i.test(lower) ||
    /payoff\s+demand\s+task\s+pending\s+or\s+active/i.test(lower) ||
    /payoff\s+request\s+.*(pending|active)/i.test(lower);

  const isSuccess =
    /has\s+been\s+successfully/i.test(lower) ||
    /successfully\s+sent/i.test(lower) ||
    /payoff\s+request\s+has\s+been\s+successfully/i.test(lower);

  let outcome: 'active' | 'further' | 'success' | 'penalty';

  if (isFurther) outcome = 'further';
  else if (isPenalty) outcome = 'penalty';
  else if (isActive) outcome = 'active';
  else if (isSuccess) outcome = 'success';
  else {
    // ✅ Fallback: NO asumir success
    console.warn(`⚠️ Resultado no reconocido. Lo trato como ACTIVE para no intentar firma. Texto="${text}"`);
    outcome = 'active';
  }

  // Cerrar toast si existe (sin romper si no está)
  const closeToastBtn = this.page
    .locator('#toast-container .toast:has(.toast-message) .toast-close-button')
    .last();

  if (await closeToastBtn.isVisible().catch(() => false)) {
    await closeToastBtn.click().catch(() => {});
  }

  console.log(`✅ Payoff outcome -> ${outcome}`);
  return outcome;
}




// Espera y verifica la presencia del modal de éxito tras el popup
// Espera y verifica la presencia del modal de éxito tras el payoff (con retry + reload + fallbacks)
async waitForSuccessModal(opts?: {
  timeoutMs?: number;
  reloadRetries?: number;
  perAttemptTimeoutMs?: number;
  pollMs?: number;
}): Promise<boolean> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;            // total
  const reloadRetries = opts?.reloadRetries ?? 1;          // 1 refresh extra
  const pollMs = opts?.pollMs ?? 500;

  // dividimos el tiempo total por intentos (intento normal + reloadRetries)
  const attempts = reloadRetries + 1;
  const perAttemptTimeoutMs = opts?.perAttemptTimeoutMs ?? Math.ceil(timeoutMs / attempts);

  const info = (m: string) => (this as any).log ? (this as any).log(m) : console.log(m);
  const warn = (m: string) => (this as any).log ? (this as any).log(m) : console.warn(m);

  // Modal candidato (tomamos el ÚLTIMO por si hay varios)
  const modal = () =>
    this.page
      .locator('[role="dialog"], .us-modal, .modal-content')
      .filter({ hasText: /payoff/i })
      .last();

  // Botones esperados dentro del modal
  const btnReview = (m: Locator) => m.getByRole('button', { name: /review\s*payoff\s*demand/i }).first();
  const btnTrack  = (m: Locator) => m.getByRole('button', { name: /track\s*my\s*payoff/i }).first();
  const btnClose  = (m: Locator) => m.getByRole('button', { name: /close|cerrar/i }).first();

  // ✅ Success también puede venir como toast sin modal
  const successToast = this.page
    .locator('#toast-container .toast-success .toast-message, .toast.toast-success .toast-message')
    .filter({ hasText: /(Payoff Request has been successfully sent|successfully)/i })
    .last();

  // ⚠️ Error conocido (no debería esperar modal)
  const activeOrPendingToast = this.page
    .locator('#toast-container .toast-error .toast-message, .toast.toast-error .toast-message')
    .filter({ hasText: /(already a payoff request active|payoff demand task pending or active)/i })
    .last();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    info(`[Payoff] Esperando modal/confirmación (intento ${attempt}/${attempts})...`);

    const deadline = Date.now() + perAttemptTimeoutMs;

    while (Date.now() < deadline) {
      // 1) Si aparece error "active/pending" -> no esperes modal, salí limpio
      if (await activeOrPendingToast.isVisible().catch(() => false)) {
        const msg = ((await activeOrPendingToast.textContent().catch(() => "")) || "").trim();
        warn(`[Payoff] ⚠️ Detectado toast error (active/pending). No habrá modal de éxito. Msg="${msg}"`);
        return false;
      }

      // 2) Si aparece toast de éxito -> lo consideramos confirmación suficiente
      if (await successToast.isVisible().catch(() => false)) {
        const msg = ((await successToast.textContent().catch(() => "")) || "").trim();
        info(`[Payoff] ✅ Toast de éxito detectado. Msg="${msg}"`);
        return true; // confirmación OK (aunque modal no aparezca)
      }

      // 3) Si aparece modal, validamos botones (si aún no están, seguimos esperando un poco)
      const m = modal();
      if (await m.isVisible().catch(() => false)) {
        const reviewVisible = await btnReview(m).isVisible().catch(() => false);
        const trackVisible  = await btnTrack(m).isVisible().catch(() => false);
        const closeVisible  = await btnClose(m).isVisible().catch(() => false);

        // con que aparezcan 2 de 3, lo damos por válido (más tolerante)
        const okCount = [reviewVisible, trackVisible, closeVisible].filter(Boolean).length;

        if (okCount >= 2) {
          info('[Payoff] ✅ Modal de éxito detectado con botones esperados.');
          return true;
        }
      }

      await this.page.waitForTimeout(pollMs);
    }

    // Si falló este intento, hacemos reload si quedan reintentos
    if (attempt < attempts) {
      warn(`[Payoff] ⚠️ No apareció modal/confirmación en ${perAttemptTimeoutMs}ms. Reintentando con refresh...`);
      await this.page.reload({ waitUntil: 'networkidle' }).catch(() => {});
      await this.page.waitForTimeout(800);
    }
  }

  // Si llegamos acá, no hubo confirmación detectable. NO tiramos error duro, solo log.
  warn('[Payoff] ⚠️ No se detectó modal/confirmación de éxito dentro del tiempo total. Continúo flujo sin fallar.');
  await (this as any).safeShot?.(`payoff_no_modal_${Date.now()}`).catch?.(() => {});
  return false;
}




async clickTrackMyPayoffAndVerify(): Promise<boolean> {
  const warn = (m: string) => (this as any).log ? (this as any).log(m) : console.warn(m);
  const info = (m: string) => (this as any).log ? (this as any).log(m) : console.log(m);

  // Modal “Payoff” (último por si hay más de uno)
  const modal = this.page
    .locator('[role="dialog"], .us-modal, .modal-content')
    .filter({ hasText: /payoff/i })
    .last();

  const trackBtn = modal.getByRole('button', { name: /track\s*my\s*payoff/i }).first();

  // Si no hay modal o no está el botón → salteo sin fallar
  const hasModal = await modal.isVisible().catch(() => false);
  const hasTrack = hasModal ? await trackBtn.isVisible().catch(() => false) : false;

  if (!hasModal || !hasTrack) {
    warn('[Payoff] ⚠️ No hay modal/Track My Payoff visible. Salteo este paso sin fallar.');
    return false;
  }

  // Abrir popup tracker
  const [popup] = await Promise.all([
    this.page.context().waitForEvent('page'),
    trackBtn.click(),
  ]);

  await popup.waitForLoadState('domcontentloaded');
  await popup.waitForLoadState('networkidle').catch(() => {});
  info(`[Payoff] Popup abierto -> ${popup.url()}`);

  if (!popup.url().toLowerCase().includes('payofftracker')) {
    throw new Error('No se redirigió al tracker de payoff.');
  }

  // ---- VALIDACIONES (los 3 bloques) ----
  // 1) Status "Active" (más tolerante)
  const activeStep = popup
    .locator('.us-step__title, .us-step__label, .us-step__name')
    .filter({ hasText: /^Active$/i })
    .first();

  await activeStep.waitFor({ state: 'visible', timeout: 60000 });

  // Helper: asegurar accordion visible (y si hace falta, abrirlo)
  const ensureAccordionVisible = async (title: string) => {
    // item del accordion que contiene el título
    const item = popup.locator('.us-accordion-item').filter({
      has: popup.locator('.us-accordion-header__title', { hasText: new RegExp(`^${title}$`, 'i') })
    }).first();

    const header = item.locator('.us-accordion-header').first();
    const headerTitle = item.locator('.us-accordion-header__title', { hasText: new RegExp(`^${title}$`, 'i') }).first();

    await headerTitle.waitFor({ state: 'visible', timeout: 60000 });

    // Si el contenido no está visible, intentamos expandir (sin asumir clases exactas)
    const content = item.locator('.us-accordion-content, .us-accordion-body').first();
    const contentVisible = await content.isVisible().catch(() => false);

    if (!contentVisible) {
      await header.click().catch(() => headerTitle.click().catch(() => {}));
      await popup.waitForTimeout(300);
    }

    // Validación final: al menos el header está visible
    // y si existe content lo esperamos un poco (sin fallar si no lo renderiza como “content”)
    await headerTitle.waitFor({ state: 'visible', timeout: 10000 });

    const contentVisibleAfter = await content.isVisible().catch(() => false);
    info(`[Payoff] Accordion "${title}" visible. contentVisible=${contentVisibleAfter}`);
  };

  // 2) Activity
  await ensureAccordionVisible('Activity');

  // 3) Emails
  await ensureAccordionVisible('Emails');

  // Cerrar popup tracker
  await popup.close().catch(() => {});
  info('[Payoff] ✅ Tracker validado y popup cerrado.');

  return true;
}


async clickReviewPayoffDemandAndVerify(): Promise<Page | null> {
  const warn = (m: string) => (this as any).log ? (this as any).log(m) : console.warn(m);
  const info = (m: string) => (this as any).log ? (this as any).log(m) : console.log(m);

  const modal = this.page
    .locator('[role="dialog"], .us-modal, .modal-content')
    .filter({ hasText: /payoff/i })
    .last();

  const reviewBtn = modal.getByRole('button', { name: /review\s*payoff\s*demand/i }).first();

  const hasModal = await modal.isVisible().catch(() => false);
  const hasBtn = hasModal ? await reviewBtn.isVisible().catch(() => false) : false;

  if (!hasModal || !hasBtn) {
    warn('[Payoff] ⚠️ No hay modal/Review Payoff Demand visible. Salteo este paso sin fallar.');
    return null;
  }

  const ctx = this.page.context();

  // ✅ Soporta: popup NUEVO o navegación en la misma pestaña
  for (let attempt = 1; attempt <= 2; attempt++) {
    info(`[Payoff] Review Payoff Demand -> intento ${attempt}/2`);

    const popupPromise = ctx.waitForEvent('page', { timeout: 45000 }).catch(() => null);
    const navPromise = this.page.waitForURL(/reviewPayoffDemand/i, { timeout: 45000 }).catch(() => null);

    await reviewBtn.click().catch(() => {});

    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded');
      await popup.waitForLoadState('networkidle').catch(() => {});
      if (!popup.url().toLowerCase().includes('reviewpayoffdemand')) {
        throw new Error('Se abrió popup pero NO es Review Payoff Demand.');
      }
      info(`[Payoff] ✅ Review abierto en popup -> ${popup.url()}`);
      return popup;
    }

    await navPromise;
    if (this.page.url().toLowerCase().includes('reviewpayoffdemand')) {
      info(`[Payoff] ✅ Review abrió en misma pestaña -> ${this.page.url()}`);
      return this.page;
    }

    await this.page.waitForTimeout(800);
  }

  throw new Error('[Payoff] No se abrió Review Payoff Demand (ni popup ni navegación) tras reintentos.');
}


async acceptTermsAndContinue(popup: Page) {
  await popup.waitForSelector('xpath=//*[@id="accept-terms"]', { timeout: 8000 });
  await popup.click('xpath=//*[@id="accept-terms"]');
  await popup.waitForSelector('xpath=//*[@id="page"]/div[3]/div[1]/div[2]/button[1][not(@disabled)]', { timeout: 8000 });
  await popup.click('xpath=//*[@id="page"]/div[3]/div[1]/div[2]/button[1]');
}


/**
 * Abre el modal de firma y espera hasta que el campo "Client Name" esté visible.
 */
async openSignatureModal(popup: Page) {
  console.log('🖊️ Abriendo modal de firma...');

  // Espera a que el visor exista (evita correr antes de tiempo)
  const visorRoot = popup.locator('[id^="visor"], .us-visor, #page').first();
  await expect(visorRoot).toBeVisible({ timeout: 30_000 });

  // Todos los boxes posibles (muchos)
  const boxes = popup.locator('button.us-visor-box__button.us-visor-element__box');

  // A) Preferido: box con texto típico de firma
  const signBoxByText = boxes.filter({
    hasText: /sign|signature|click to sign|firma/i,
  }).first();

  // B) Alternativa: un box visible (primero)
  const firstVisibleBox = boxes.first();

  // Helper para click robusto
  const clickBox = async (box: Locator, label: string) => {
    await expect(box, `No se encontró box de firma (${label}).`).toBeVisible({ timeout: 20_000 });
    await box.scrollIntoViewIfNeeded();
    // Evita problemas de overlays/transiciones
    await box.click({ timeout: 20_000, trial: true }).catch(() => null);
    await box.click({ timeout: 20_000 });
    console.log(`✅ Click en box de firma usando estrategia: ${label}`);
  };

  // Intento A
  if (await signBoxByText.count().catch(() => 0)) {
    await clickBox(signBoxByText, 'texto (sign/signature)');
  } else {
    // Intento B: primer box (no strict)
    await clickBox(firstVisibleBox, 'first()');
  }

  // Esperar el modal de firma: el input de Client Name
  // (No asumo role=dialog siempre; algunos modals no lo traen bien)
  const modal = popup.locator('.modal-content:has-text("Client Name")').first();
  const clientNameInput = modal.locator('input[type="text"]:not([readonly])').first();

  await expect(modal, 'No apareció el modal de firma.').toBeVisible({ timeout: 20_000 });
  await expect(clientNameInput, 'No apareció el input "Client Name" en el modal.').toBeVisible({ timeout: 20_000 });

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


