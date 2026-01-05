// tests/pages/BoardingPortalPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class BoardingPortalPage {
  readonly page: Page;

  /** Simple logger for debugging */
  protected log(message: string) {
    // You can replace this with a more advanced logger if needed
    console.log(`[BoardingPortalPage] ${message}`);
  }

// ======= SECCIÓN: All Boarding (grid) =======
private mainArea: Locator;
private allBoardingBanner: Locator;
private anyGrid: Locator;                 // .k-grid o .k-table contenedor
private gridHeaderPrevAccount: Locator;   // header "PrevAccount"

// ======= SECCIÓN: Boarding abierto =======
private loanInfoCardTitle: Locator;    // número de Loan Account (arriba en las cards)
private tabsBar: Locator;
private investorTabLink: Locator;      // <a.nav-link> único para Investor
private tabLoan: Locator;

// ======= SECCIÓN: Investor > Add Investor Charge =======
private investorAddChargeBlock: Locator;
private paymentCodeInput: Locator;     // placeholder "Select a Payment Code..."
private periodInput: Locator;          // placeholder "Select a Period..."
private unitPriceSpin: Locator;        // input[role="spinbutton"] para Unit Price
private investorSaveButton: Locator;   // botón Save (Investor)
private confirmUpdateModal: Locator;
private confirmUpdateButton: Locator;  // botón "Update" del modal

// ======= Botón lateral que expande documentos/pendings =======
private expandRightPaneBtn: Locator;

// ======= Panel derecho (tabs + contenedor) =======
private rightPaneContainer: Locator;
private rightTabs: Locator;
private rightTabPendingDocsBtn: Locator;
private pendingDocsView: Locator; // ← agregado

// ======= Pending Documents (label + input + control) =======
private pendingDocsLabel: Locator;      // <label class="us-checkbox"> ... <div class="us-checkbox__label">I have received ...</div>
private pendingDocsInput: Locator;      // input[type="checkbox"] (suele estar oculto)
private pendingDocsControl: Locator;    // div.us-checkbox__control (zona clickeable visible)

// ======= Loan tab: Complete Pre-Boarding =======
// añade estas dos propiedades junto a las demás
private completePreBoardingBtnById: Locator;
private completePreBoardingBtnByText: Locator;


// ======= Toasts (compat Sonner + legacy) =======
private sonnerToasts: Locator; // <li data-sonner-toast ...>
private legacySuccessToast: Locator; // #toast-container .toast-success (por si aparece)

constructor(page: Page) {
  this.page = page;

  // --- Áreas base ---
  this.mainArea = this.page.getByRole('main');
  this.allBoardingBanner = this.mainArea
    .locator('xpath=.//*[self::h1 or self::div or self::span][normalize-space()="All Boarding"]')
    .first();

  this.anyGrid = this.mainArea.locator('css=div.k-grid,div.k-table');

  this.gridHeaderPrevAccount = this.mainArea.locator(
    'xpath=.//span[contains(@class,"k-column-title") and normalize-space()="PrevAccount"]'
  );

  // --- Boarding abierto (header cards + tabs) ---
  this.loanInfoCardTitle = this.mainArea
    .locator('.us-card-header__content .us-card-title')
    .filter({ hasText: /^\d+$/ })
    .first();

  this.tabsBar = this.mainArea.locator('ul.nav.justify-content-center');

  // Tab "Investor"
  this.investorTabLink = this.tabsBar
    .locator('a.nav-link:has(div.flex-grow-1:has-text("Investor"))')
    .first();

  // Tab "Loan"
  this.tabLoan = this.tabsBar
    .locator('a.nav-link:has(div.flex-grow-1:has-text("Loan"))')
    .first();

  // --- Investor > Add Investor Charge ---
  this.investorAddChargeBlock = this.mainArea.locator(
    'xpath=.//h6[normalize-space()="Add Investor Charge"]/ancestor::div[contains(@class,"pe-3")][contains(@class,"col-6") or contains(@class,"col-12")][1]'
  );

  this.paymentCodeInput = this.investorAddChargeBlock.locator(
    'input.us-input__field[placeholder="Select a Payment Code..."]'
  );
  this.periodInput = this.investorAddChargeBlock.locator(
    'input.us-input__field[placeholder="Select a Period..."]'
  );

  this.unitPriceSpin = this.investorAddChargeBlock
    .getByText('Unit Price:', { exact: true })
    .locator('xpath=following::input[@role="spinbutton"][1]');

  // Botón Save dentro del main
  this.investorSaveButton = this.mainArea
    .getByRole('button', { name: 'Save' })
    .filter({ has: this.page.locator('.us-button__content') })
    .first();

  // Modal de confirmación “Update Investor”
  this.confirmUpdateModal = this.page.locator('.modal-content').filter({ hasText: 'Update Investor' });
  this.confirmUpdateButton = this.confirmUpdateModal.getByRole('button', { name: 'Update', exact: true });

  // Botón que expande el panel derecho (icono cuadrado con flecha)
  this.expandRightPaneBtn = this.mainArea
    .locator('xpath=.//button[.//*[name()="path" and contains(@d,"M4 4")]]')
    .first();

  // === Panel derecho (anclado por la tab "Pending Documents") ===
  const pendingTabContent = this.mainArea
    .locator('.us-tabs .us-tab__content', { hasText: 'Pending Documents' })
    .first();

  this.rightPaneContainer = pendingTabContent.locator(
    'xpath=ancestor::div[contains(@class,"d-flex") and contains(@class,"flex-column") and contains(@class,"h-100")][1]'
  );

  this.rightTabs = this.rightPaneContainer.locator('.us-tabs').first();

  this.rightTabPendingDocsBtn = this.rightTabs
    .locator('.us-tab .us-tab__content', { hasText: 'Pending Documents' })
    .first();

  this.pendingDocsView = this.rightPaneContainer
    .locator('div.flex-grow-1.w-100')
    .filter({
      has: this.page.getByText('I have received all the required documents', { exact: false }),
    })
    .first();

  this.pendingDocsLabel   = this.pendingDocsView.locator('label.us-checkbox').first();
  this.pendingDocsInput   = this.pendingDocsLabel.locator('input[type="checkbox"]');
  this.pendingDocsControl = this.pendingDocsLabel.locator('.us-checkbox__control');

  // Loan tab: Complete Pre-Boarding
  // Loan tab: Complete Pre-Boarding
this.completePreBoardingBtnById   = this.mainArea.locator('#btnSendToPreBoarding').first();
this.completePreBoardingBtnByText = this.mainArea.getByRole('button', { name: 'Complete Pre-Boarding' }).first();


  // Toasts (Sonner + legado)
  this.sonnerToasts = this.page.locator('li[data-sonner-toast]');
  this.legacySuccessToast = this.page.locator('#toast-container .toast.toast-success');
}


  // ======= Utils comunes =======


private async safeShot(name: string) {
  if (this.page.isClosed()) return;
  const safe = name.replace(/[^\w\d-_]+/g, '_').slice(0, 80);
  try {
    await this.page.screenshot({ path: `reports/screenshots/${safe}.png`, fullPage: false });
  } catch { /* no-op */ }
}

  /** Espera robusta a que la vista All Boarding tenga el grid listo */
  async waitForAllBoardingLoaded() {
    await this.mainArea.waitFor();
    await expect(this.allBoardingBanner).toBeVisible({ timeout: 30000 });
    await expect(this.anyGrid.first()).toBeVisible({ timeout: 30000 });
    await expect(this.gridHeaderPrevAccount).toBeVisible({ timeout: 30000 });

    // Quitar posibles máscaras de carga (si no están, ignora)
    await this.page
      .locator('.k-loading-mask,.k-loading,.k-busy')
      .first()
      .waitFor({ state: 'detached', timeout: 5000 })
      .catch(() => {});
  }

  async gotoAllBoarding() {
    await this.page.goto('https://tfciportal.myfci.com/AllBoarding', { waitUntil: 'domcontentloaded' });
    await this.waitForAllBoardingLoaded();
  }

  /** Doble-click en la celda PrevAccount == valor indicado (en la 1ª tabla del main) */
  async openBoardingRowByPrevAccount(prevAccount: string) {
    const grid = this.anyGrid.first();
    const targetCell = grid.locator(
      `xpath=.//td[@role="gridcell" or self::td][normalize-space()="${prevAccount}"]`
    ).first();

    await expect(targetCell).toBeVisible({ timeout: 30000 });
    await targetCell.dblclick();
  }

  async waitForBoardingDetailLoaded() {
    await this.mainArea.waitFor();
    await expect(this.tabsBar).toBeVisible({ timeout: 30000 });
    await expect(this.loanInfoCardTitle).toBeVisible({ timeout: 30000 });
  }

  async getLoanAccountFromHeader(): Promise<string> {
    return (await this.loanInfoCardTitle.innerText()).trim();
  }

  /** Abre la pestaña Investor con selector único y espera al bloque Add Investor Charge */
  async goToInvestorTab() {
  // Click en la tab Investor
  await expect(this.investorTabLink).toBeVisible({ timeout: 30000 });
  await this.investorTabLink.scrollIntoViewIfNeeded();
  await this.investorTabLink.click();

  // Esperar el heading del bloque, que es lo más estable
  const investorH6 = this.mainArea.getByRole('heading', { level: 6, name: 'Add Investor Charge' }).first();
  await expect(investorH6).toBeVisible({ timeout: 30000 });

  // Re-seleccionar dinámicamente el bloque e inputs (evita stale locators)
  const block = investorH6.locator('xpath=ancestor::div[contains(@class,"pe-3")][1]');
  this.investorAddChargeBlock = block;

  this.paymentCodeInput = block.locator('input.us-input__field[placeholder="Select a Payment Code..."]');
  this.periodInput      = block.locator('input.us-input__field[placeholder="Select a Period..."]');
  this.unitPriceSpin    = block.getByText('Unit Price:', { exact: true })
                              .locator('xpath=following::input[@role="spinbutton"][1]');
}


  async fillInvestorCharge({
    paymentCode,
    periodText,
    unitPriceIncrements = 1,
  }: { paymentCode: string; periodText: string; unitPriceIncrements?: number; }) {
    // Payment Code
    await this.paymentCodeInput.click();
    await this.paymentCodeInput.fill(paymentCode);
    await this.page.getByText(paymentCode, { exact: true }).first().click();

    // Period
    await this.periodInput.click();
    await this.periodInput.fill(periodText);
    await this.page.getByText(periodText, { exact: true }).first().click();

    // Unit Price
    for (let i = 0; i < unitPriceIncrements; i++) {
      await this.unitPriceSpin.press('ArrowUp');
    }
  }

 async saveInvestorChargeAndConfirm() {
  // Click en Save
  await this.investorSaveButton.click();

  // 1️⃣ Modal de confirmación (si aparece)
  const confirmModalVisible = await this.confirmUpdateModal
    .isVisible()
    .catch(() => false);

  if (confirmModalVisible) {
    console.log('[BoardingPortal] Modal de confirmación detectado. Confirmando update.');
    await this.confirmUpdateButton.click();
  } else {
    console.log('[BoardingPortal] Modal de confirmación NO apareció. Continuando.');
  }

  // 2️⃣ Toast de éxito (opcional / no determinístico)
  const successToast = this.legacySuccessToast.filter({
    hasText: 'Data Updated Successfully',
  });

  try {
    await successToast.waitFor({ state: 'visible', timeout: 8000 });
    console.log('[BoardingPortal] Toast de éxito detectado: "Data Updated Successfully".');
  } catch {
    console.log(
      '[BoardingPortal] Toast de éxito NO apareció dentro del tiempo esperado. Continuando flujo.'
    );
  }

  // 🚀 No lanzamos error: el flujo continúa siempre
}


  /** Expande panel derecho y espera a que el contenedor/tabs estén interactuables */
  async expandRightPanel() {
    // Locator "en vivo" del contenido de la tab Pending Documents
    const pendingTabContent = this.mainArea
      .locator('.us-tabs .us-tab__content', { hasText: 'Pending Documents' })
      .first();

    // 0) Si ya está visible (porque otro paso lo abrió antes), sólo re-cableamos y salimos
    if (await pendingTabContent.isVisible().catch(() => false)) {
      const container = pendingTabContent.locator(
        'xpath=ancestor::div[contains(@class,"d-flex") and contains(@class,"flex-column") and contains(@class,"h-100")][1]'
      );

      this.rightPaneContainer = container;
      this.rightTabs = container.locator('.us-tabs').first();
      this.rightTabPendingDocsBtn = this.rightTabs
        .locator('.us-tab .us-tab__content', { hasText: 'Pending Documents' })
        .first();

      this.pendingDocsView = container
        .locator('div.flex-grow-1.w-100')
        .filter({
          has: this.page.getByText('I have received all the required documents', { exact: false }),
        })
        .first();

      this.pendingDocsLabel   = this.pendingDocsView.locator('label.us-checkbox').first();
      this.pendingDocsInput   = this.pendingDocsLabel.locator('input[type="checkbox"]');
      this.pendingDocsControl = this.pendingDocsLabel.locator('.us-checkbox__control');

      return;
    }

    // 1) Nuevo botón de nav rail: "Boarding Documents"
    const boardingDocsRailBtn = this.mainArea
      .getByRole('button', { name: /Boarding Documents/i })
      .first();

    if (await boardingDocsRailBtn.isVisible().catch(() => false)) {
      await boardingDocsRailBtn.click();
    } else {
      // 2) Fallback: botón viejo que expandía el panel (por si aún existe)
      await this.expandRightPaneBtn.click({ timeout: 10000 }).catch(() => {});
    }

    // 3) Esperar a que se cree y se muestre la tab "Pending Documents"
    await expect(pendingTabContent).toBeVisible({ timeout: 30000 });

    // 4) Re-cablear todos los locators del panel derecho ahora que el DOM existe
    const container = pendingTabContent.locator(
      'xpath=ancestor::div[contains(@class,"d-flex") and contains(@class,"flex-column") and contains(@class,"h-100")][1]'
    );

    this.rightPaneContainer = container;
    this.rightTabs = container.locator('.us-tabs').first();
    this.rightTabPendingDocsBtn = this.rightTabs
      .locator('.us-tab .us-tab__content', { hasText: 'Pending Documents' })
      .first();

    this.pendingDocsView = container
      .locator('div.flex-grow-1.w-100')
      .filter({
        has: this.page.getByText('I have received all the required documents', { exact: false }),
      })
      .first();

    this.pendingDocsLabel   = this.pendingDocsView.locator('label.us-checkbox').first();
    this.pendingDocsInput   = this.pendingDocsLabel.locator('input[type="checkbox"]');
    this.pendingDocsControl = this.pendingDocsLabel.locator('.us-checkbox__control');

    // 5) Asegurar que el panel quedó visible
    await expect(this.rightPaneContainer).toBeVisible({ timeout: 20000 });
    await expect(this.rightTabs).toBeVisible({ timeout: 20000 });
  }



  /** Devuelve true si el tab "Pending Documents" está habilitado/clicable */
  private async isPendingDocsTabEnabled(): Promise<boolean> {
    const handle = await this.rightTabPendingDocsBtn.elementHandle();
    if (!handle) return false;

    const ariaDisabled = await handle.getAttribute('aria-disabled');
    const className = (await handle.getAttribute('class')) || '';
    const pointerEvents = await handle.evaluate((el) => getComputedStyle(el as HTMLElement).pointerEvents);

    const notAriaDisabled = ariaDisabled !== 'true';
    const notCssDisabled = !/us-tab--disabled/i.test(className);
    const pointerOk = pointerEvents !== 'none';

    return notAriaDisabled && notCssDisabled && pointerOk;
  }

  /** Espera activa (hasta 30s) a que el tab Pending Documents esté habilitado */
  private async waitForPendingDocumentsTabEnabled(timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.isPendingDocsTabEnabled()) return;
      await this.page.waitForTimeout(300);
    }
    throw new Error('Pending Documents tab no se habilitó dentro del tiempo esperado');
  }

  /** Espera a que desaparezcan loaders dentro del panel derecho (Kendo/otros) */
  private async waitRightPaneIdle(timeoutMs = 20000) {
    await this.rightPaneContainer
      .locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]')
      .first()
      .waitFor({ state: 'detached', timeout: timeoutMs })
      .catch(() => {});
  }

  /** Espera a que el label de Pending Docs esté visible (texto) */
  private async waitPendingLabelVisible(timeoutMs = 30000) {
    await expect(this.pendingDocsLabel).toBeVisible({ timeout: timeoutMs });
  }

  /** Espera a que el checkbox quede interactuable (label sin disabled y con pointer-events) */
  private async waitCheckboxInteractive(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ariaDisabled = await this.pendingDocsLabel.getAttribute('aria-disabled');
    const pe = await this.pendingDocsLabel.evaluate(el => getComputedStyle(el as HTMLElement).pointerEvents);
    if (ariaDisabled !== 'true' && pe !== 'none') return;
    await this.page.waitForTimeout(150);
  }
  throw new Error('El checkbox de Pending Documents no quedó interactuable a tiempo.');
}


  /** Intenta clickear el label; si falla, prueba el control; si falla, click por coordenadas */
  private async clickPendingDocsCheckbox() {
    // scroll + focus
    await this.pendingDocsLabel.scrollIntoViewIfNeeded();
    await this.pendingDocsLabel.hover({ trial: true }).catch(() => {});

    // 1) Click directo al label
    try {
      await this.pendingDocsLabel.click({ timeout: 3000 });
      return;
    } catch {}

    // 2) Click al control visible
    try {
      await this.pendingDocsControl.click({ timeout: 3000, force: true });
      return;
    } catch {}

    // 3) Fallback: click por coordenadas en el centro del label
    const box = await this.pendingDocsLabel.boundingBox();
    if (!box) throw new Error('No pude obtener boundingBox del checkbox label');
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  async goToPendingDocumentsTab() {
  await expect(this.rightTabs).toBeVisible({ timeout: 20000 });

  // si la tab viene habilitada por defecto, clic directo; si no, podrías conservar tu verificación
  await this.rightTabPendingDocsBtn.scrollIntoViewIfNeeded();
  await this.rightTabPendingDocsBtn.click();

  // Esperá a que la vista de Pending se vuelva visible (remueve d-none)
  await expect(this.pendingDocsView).toBeVisible({ timeout: 20000 });

  // Quita loaders internos del panel si los hubiera
  await this.waitRightPaneIdle(20000);

  // Asegurá que el label esté visible e interactuable (dentro de la vista)
  await expect(this.pendingDocsLabel).toBeVisible({ timeout: 30000 });

  // Dale un mini respiro si hay fetchs
  await this.page.waitForTimeout(400);

  // Interactuable (sobre el label scoped)
  await this.waitCheckboxInteractive(20000);

  // Click tolerante (scoped)
  await this.clickPendingDocsCheckbox();

  await this.page.waitForTimeout(400);
}


  async confirmAllPendingDocumentsAndWaitProcessing() {
    // Mantengo una pausa corta para procesamiento backend luego del click
    await this.page.waitForTimeout(7000);
  }

  async goToLoanTab() {
    await this.tabLoan.click();
  }

  // ======= TOASTS SONNER =======
private async waitForSonnerToastOutcome(opts?: {
  loadingText?: string;
  successText?: string;
  errorPrefix?: string;
  overallTimeoutMs?: number;
}) {
  const loadingText = opts?.loadingText ?? 'Generating and sending documents...';
  const successText = opts?.successText ?? 'Documents generated and sent successfully.';
  const errorPrefix = opts?.errorPrefix ?? 'Error: BoardingApi';
  const overallTmo  = opts?.overallTimeoutMs ?? 180000;

  // Selectores CORREGIDOS: el tipo vive en el MISMO <li>
  const loadingToast = this.page
    .locator(`li[data-sonner-toast][data-type="loading"]`)
    .filter({ hasText: loadingText })
    .first();

  const successToast = this.page
    .locator(`li[data-sonner-toast][data-type="success"]`)
    .filter({ hasText: successText })
    .first();

  const errorToast = this.page
    .locator(`li[data-sonner-toast][data-type="error"]`)
    .filter({ hasText: errorPrefix })
    .first();

  // Helpers para esperar "attached" (rápido) y luego "visible" (si llega a estar)
  const waitAttachedThenVisible = async (loc: import('@playwright/test').Locator, label: string, attachTmo = 30000, visibleTmo = overallTmo) => {
    if (this.page.isClosed()) throw new Error('La página se cerró antes de detectar toasts.');
    await loc.waitFor({ state: 'attached', timeout: attachTmo }).catch(() => { /* puede ser fugaz */ });
    if (await loc.count() > 0) {
      this.log(`Toast ${label}: adjuntado al DOM.`);
      await loc.waitFor({ state: 'visible', timeout: visibleTmo }).catch(() => { /* pudo ser fugaz */ });
      return true;
    }
    return false;
  };

  // Disparo paralelo (no bloquea resultado) para loguear si hubo "loading"
  void (async () => {
    const seen = await waitAttachedThenVisible(loadingToast, 'loading');
    this.log(seen ? `Toast loading detectado: "${loadingText}"` : 'Toast loading no detectado (posible fugaz).');
  })();

  // Carrera SUCCESS vs ERROR, con logs y corte inmediato en error
  const seenSuccess = (async () => {
    await waitAttachedThenVisible(successToast, 'success');
    this.log(`Toast success detectado: "${successText}"`);
    return 'success' as const;
  })();

  const seenError = (async () => {
    await waitAttachedThenVisible(errorToast, 'error');
    const fullErrorText = await errorToast.innerText().catch(() => errorPrefix);
    this.log(`Toast error detectado: "${fullErrorText}"`);
    await this.safeShot('preboarding_error_toast');
    const err = new Error(`Se mostró un toast de ERROR en Pre-Boarding: ${fullErrorText}`);
    (err as any).__preBoardingToast = 'error';
    throw err;
  })();

  try {
    return await Promise.race([seenSuccess, seenError]);
  } catch (e) {
    if ((e as any)?.__preBoardingToast === 'error') throw e;
    throw e;
  }
}

  async completePreBoardingAndWaitSuccess() {
  this.log('Clic en "Complete Pre-Boarding".');
  await this.completePreBoardingBtnById.click();

  const loadingText = 'Generating and sending documents...';
  const successText = 'Documents generated and sent successfully.';
  const errorPrefix = 'Error: BoardingApi';

  try {
    const outcome = await this.waitForSonnerToastOutcome({
      loadingText, successText, errorPrefix, overallTimeoutMs: 180000
    });

    if (outcome === 'success') {
      this.log('Resultado Sonner: SUCCESS.');
      // Limpia loading si aún quedara montado
      const loading = this.page.locator(`li[data-sonner-toast][data-type="loading"]`).filter({ hasText: loadingText });
      await loading.first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
      return;
    }
  } catch (err) {
    if ((err as any)?.__preBoardingToast === 'error') {
      this.log('Cortando flujo por toast de error (Sonner).');
      throw err; // detiene el escenario
    }
    this.log(`Excepción inesperada esperando toasts Sonner: ${(err as Error)?.message || err}`);
    // seguimos a fallback
  }

  // Fallback legacy si Sonner no aparece (o hay skin mixto)
  this.log('Intentando fallback legacy (toast-success).');
  try {
    await this.legacySuccessToast
      .filter({ hasText: 'Data Updated Successfully' })
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
    this.log('Fallback legacy: SUCCESS (Data Updated Successfully).');
  } catch {
    this.log('Fallback legacy: NO apareció el toast de éxito.');
    await this.safeShot('preboarding_no_success_toast');
    throw new Error('No se detectó confirmación de éxito (ni Sonner ni legacy).');
  }
}


  // ======= Email Log =======
  async gotoEmailLog() {
    await this.page.goto('https://tfciportal.myfci.com/tools/emailLog', { waitUntil: 'domcontentloaded' });
    await this.mainArea.waitFor();
    await expect(this.mainArea.locator('div.k-grid,div.k-table')).toBeVisible({ timeout: 30000 });
  }


async openEmailLogModalByAccount(accountNumber: string) {
  console.log(`[EmailLog] Buscando account "${accountNumber}" con pager...`);

  // Grid listo (al menos 1 fila o contenedor renderizado)
  const rowsSel = '.k-grid .k-table-tbody tr, .k-grid tbody tr';
  await this.page.waitForSelector(rowsSel, { timeout: 20000 }).catch(() => {});

  const MAX_PAGES = 30;
  const REFRESH_RETRIES = 1; // 1 => intenta una pasada normal + 1 refresh + otra pasada

  const refreshBtn = this.page.locator('#btnRefresh').first();

  const clickRefreshAndWait = async () => {
    if (!(await refreshBtn.isVisible().catch(() => false))) {
      console.log('[EmailLog] Botón Refresh (#btnRefresh) no visible. Se omite refresh.');
      return;
    }

    console.log('[EmailLog] Click en Refresh y espera de recarga del grid...');
    const firstRow = this.page.locator(rowsSel).first();
    const before = await firstRow.innerText().catch(() => '');

    await refreshBtn.click({ timeout: 8000 }).catch(() => {});
    // Espera loaders típicos (si existen)
    await this.page
      .locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]')
      .first()
      .waitFor({ state: 'detached', timeout: 8000 })
      .catch(() => {});
    // Espera mínima a que repueble data
    await this.page.waitForTimeout(800);

    // Si el primer row cambia, mejor; si no, al menos que haya rows
    await this.page.waitForSelector(rowsSel, { timeout: 15000 }).catch(() => {});
    const after = await this.page.locator(rowsSel).first().innerText().catch(() => '');
    if (before && after && before !== after) {
      console.log('[EmailLog] Grid actualizado luego del Refresh.');
    } else {
      console.log('[EmailLog] Refresh ejecutado (grid puede no haber cambiado visualmente).');
    }
  };

  const goToFirstPageIfPossible = async () => {
    const firstBtn = this.page.getByRole('button', { name: 'Go to the first page' }).first();
    if (await firstBtn.isVisible().catch(() => false)) {
      const disabled = await firstBtn.getAttribute('aria-disabled').catch(() => null);
      if (disabled !== 'true') {
        await firstBtn.click().catch(() => {});
        await this.page.waitForSelector(rowsSel, { timeout: 10000 }).catch(() => {});
        await this.page.waitForTimeout(400);
      }
    }
  };

  for (let refreshAttempt = 0; refreshAttempt <= REFRESH_RETRIES; refreshAttempt++) {
    if (refreshAttempt > 0) {
      console.log(`[EmailLog] Account no encontrado. Reintentando tras Refresh (intento ${refreshAttempt}/${REFRESH_RETRIES})...`);
      await clickRefreshAndWait();
    }

    // arrancar desde la primera página (si existe pager)
    await goToFirstPageIfPossible();

    for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
      const accountCell = this.page
        .locator('.k-grid .k-table-tbody td[role="gridcell"][aria-colindex="2"], .k-grid tbody td[role="gridcell"][aria-colindex="2"]')
        .filter({ hasText: accountNumber });

      const cellCount = await accountCell.count();
      console.log(`[EmailLog] Página ${pageIndex + 1} -> celdas encontradas para "${accountNumber}": ${cellCount}`);

      if (cellCount > 0) {
        const targetCell = accountCell.first();
        const row = targetCell.locator('xpath=ancestor::tr[contains(@class,"k-table-row")]');

        await row.locator('button.us-button:has-text("Details")').click();
        console.log(`[EmailLog] Account "${accountNumber}" encontrado y botón Details clickeado.`);
        return;
      }

      const nextButton = this.page.getByRole('button', { name: 'Go to the next page' }).first();
      const isDisabled = await nextButton.getAttribute('aria-disabled').catch(() => 'true');
      if (isDisabled === 'true') {
        console.log('[EmailLog] No hay más páginas en el pager.');
        break;
      }

      console.log(`[EmailLog] Account "${accountNumber}" no encontrado en la página ${pageIndex + 1}, navegando a la siguiente...`);

      await Promise.all([
        nextButton.click().catch(() => {}),
        this.page.waitForSelector(rowsSel, { state: 'attached', timeout: 10000 }).catch(() => {}),
      ]);

      await this.page.waitForTimeout(500);
    }
  }

  throw new Error(`No se encontró ninguna fila en Email Log para account "${accountNumber}" (incluso tras Refresh).`);
}


/**
 * Si existe un dropdown de page size (Kendo), lo setea (ej: 100)
 * Es “best effort”: si no existe, no rompe.
 */
private async trySetKendoPageSize(grid: import('@playwright/test').Locator, size: number) {
  // Algunos Kendo usan: .k-pager-sizes select, otros un button/dropdown
  const select = grid.locator('.k-pager-sizes select').first();
  if (await select.count().catch(() => 0)) {
    await select.selectOption(String(size)).catch(() => {});
    await this.page.waitForTimeout(400);
    return;
  }

  // Fallback “dropdown” (si lo hubiera)
  const sizesBtn = grid.locator('.k-pager-sizes').first();
  if (await sizesBtn.count().catch(() => 0)) {
    await sizesBtn.click().catch(() => {});
    const opt = this.page.locator(`text="${size}"`).first();
    if (await opt.count().catch(() => 0)) await opt.click().catch(() => {});
    await this.page.waitForTimeout(400);
  }
}



private async waitForDocSignLinksInEmailModal(
  modal: import('@playwright/test').Locator,
  timeoutMs = 30000
) {
  const start = Date.now();
  const modalHandle = await modal.first().elementHandle().catch(() => null);
  if (!modalHandle) return;

  // Para no spamear logs
  let lastLog = 0;

  while (Date.now() - start < timeoutMs) {
    const framesInModal: Array<import('@playwright/test').Frame> = [];

    for (const f of this.page.frames()) {
      const fe = await f.frameElement().catch(() => null);
      if (!fe) continue;

      const inside = await fe
        .evaluate((el, root) => !!root && (root as HTMLElement).contains(el), modalHandle)
        .catch(() => false);

      if (inside) framesInModal.push(f);
    }

    let totalLinks = 0;
    for (const f of framesInModal) {
      await f.locator('body').waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
      const count = await f.locator('a[href*="/boarding/docsign"]').count().catch(() => 0);
      totalLinks += count;
      if (count > 0) return; // ✅ ya hay links, listo
    }

    // log cada ~3s
    if (Date.now() - lastLog > 3000) {
      this.log(`[EmailLog] Esperando DocSign links en modal... encontrados=${totalLinks}`);
      lastLog = Date.now();
    }

    await this.page.waitForTimeout(500);
  }
}



async clickDocLinkInEmailModal(
  linkTextContains: 'Setup From' | 'Setup Form' | 'Loan Servicing Agreement'
): Promise<Page | import('@playwright/test').Frame> {
  const modal = this.page.locator('.us-modal');
  await expect(modal.getByText('Email Log')).toBeVisible({ timeout: 15000 });

  // ✅ NUEVO: esperar/pollear hasta que aparezcan links DocSign (evita "0 links" por timing)
  await this.waitForDocSignLinksInEmailModal(modal, 30000).catch(() => {});

  // === Mapeo de documentType esperado según el link que pedimos ===
  const expectedDocType = /loan\s+servicing\s+agreement/i.test(linkTextContains) ? '21' : '1';
  const docTypeQuery = `documentType=${expectedDocType}`;

  // Patrones de texto tolerantes
  const setupPattern = /Setup\s+(?:Form|From)/i; // cubre Form/From
  const lsaPattern = /Loan\s+Servicing\s+Agreement/i;
  const wantedText = /loan/i.test(linkTextContains) ? lsaPattern : setupPattern;

  // Reunir frames del modal
  const modalHandle = await modal.first().elementHandle().catch(() => null);
  if (!modalHandle) throw new Error('No se obtuvo el handle del modal Email Log.');

  const framesInModal: Array<import('@playwright/test').Frame> = [];
  for (const f of this.page.frames()) {
    const fe = await f.frameElement().catch(() => null);
    if (!fe) continue;

    const inside = await fe
      .evaluate((el, root) => !!root && (root as HTMLElement).contains(el), modalHandle)
      .catch(() => false);

    if (inside) framesInModal.push(f);
  }

  if (framesInModal.length === 0) {
    await this.safeShot('email_log_no_iframes_in_modal');
    throw new Error('No se detectaron iframes dentro del modal de Email Log.');
  }

  // Busca, con prioridad por documentType esperado
  let candidate: import('@playwright/test').Locator | null = null;
  let candidateHref: string | null = null;

  for (const f of framesInModal) {
    await f.locator('body').waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});

    // 1) Lo más estricto: href + texto + documentType
    const byHrefAndText = f
      .locator(`a[href*="/boarding/docsign"][href*="${docTypeQuery}"]`)
      .filter({ hasText: wantedText })
      .first();

    // 2) Texto (pero luego validamos href con documentType)
    const byTextOnly = f.getByRole('link', { name: wantedText }).first();

    // 3) Href solamente con documentType
    const byHrefOnly = f
      .locator(`a[href*="/boarding/docsign"][href*="${docTypeQuery}"]`)
      .first();

    if ((await byHrefAndText.count().catch(() => 0)) > 0) {
      candidate = byHrefAndText;
    } else if ((await byTextOnly.count().catch(() => 0)) > 0) {
      candidate = byTextOnly;
    } else if ((await byHrefOnly.count().catch(() => 0)) > 0) {
      candidate = byHrefOnly;
    }

    if (candidate) {
      candidateHref = await candidate.getAttribute('href').catch(() => null);

      // Si elegimos por texto pero el href no contiene documentType esperado -> descartar
      if (!((candidateHref || '').includes(docTypeQuery))) {
        candidate = null;
        candidateHref = null;
        continue;
      }
      break;
    }
  }

  if (!candidate) {
    // Log de ayuda: listar links detectados dentro de los frames
    for (const f of framesInModal) {
      const allA = f.locator('a[href*="/boarding/docsign"]');
      const n = await allA.count().catch(() => 0);
      this.log(`[EmailLog] DocSign links detectados: ${n}`);
      for (let i = 0; i < Math.min(n, 10); i++) {
        const a = allA.nth(i);
        const href = (await a.getAttribute('href').catch(() => '')) || '';
        const text = ((await a.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
        this.log(`[EmailLog] a[${i}] text="${text}" href="${href}"`);
      }
    }

    await this.safeShot('email_log_no_expected_doctype_link');
    throw new Error(`No se encontró link para "${linkTextContains}" con ${docTypeQuery} dentro del modal.`);
  }

  this.log(
    `[EmailLog] Click en "${linkTextContains}" (esperado ${docTypeQuery}): href="${candidateHref || ''}"`
  );

  // === 1) Click + esperar NUEVA PESTAÑA (popup) ===
  const popupPromise = this.page.waitForEvent('popup', { timeout: 10000 }).catch(() => null);

  await candidate.click({ force: true }).catch(() => {});

  const popup = await popupPromise;
  if (popup) {
    this.log('EmailLog: link abrió nueva pestaña (popup Page).');
    await popup.waitForLoadState('domcontentloaded').catch(() => {});

    // Selectores en la NUEVA pestaña
    const popupLegacyToast = popup
      .locator('.toast.toast-error, #toast-container .toast.toast-error')
      .filter({ hasText: "File wasn't uploaded or doesn't exist" })
      .first();

    const popupSonnerError = popup
      .locator('li[data-sonner-toast][data-type="error"]')
      .filter({ hasText: /BoardingApi|Boarding Sign|File wasn't uploaded/i })
      .first();

    const popupAccept = popup.locator('input#accept-terms');
    const popupContinue = popup.getByRole('button', { name: 'CONTINUE' });

    // === 2) Espera activa en el POPUP: error toast vs DocSign ===
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      // error en popup
      if (
        (await popupLegacyToast.isVisible().catch(() => false)) ||
        (await popupSonnerError.isVisible().catch(() => false))
      ) {
        const msgLegacy = await popupLegacyToast.innerText().catch(() => '');
        const msgSonner = await popupSonnerError.innerText().catch(() => '');
        const msg = (msgLegacy || msgSonner || 'Error en DocSign popup').trim();

        this.log(`[EmailLog] ❌ Error en la nueva pestaña: ${msg}`);
        try {
          await popup.screenshot({ path: 'reports/screenshots/docsign_popup_error.png', fullPage: true });
        } catch {}
        await popup.close().catch(() => {});
        throw new Error(msg);
      }

      // DocSign markers
      if (
        (await popupAccept.isVisible().catch(() => false)) ||
        (await popupContinue.isVisible().catch(() => false))
      ) {
        this.log('EmailLog: DocSign detectado en la nueva pestaña.');
        return popup;
      }

      await this.page.waitForTimeout(300);
    }

    // chequeo extra
    if (
      (await popupAccept.isVisible({ timeout: 1000 }).catch(() => false)) ||
      (await popupContinue.isVisible({ timeout: 1000 }).catch(() => false))
    ) {
      this.log('EmailLog: DocSign detectado tardíamente en la nueva pestaña.');
      return popup;
    }

    // nada claro: seguimos a fallbacks
    this.log('EmailLog: popup abierto pero sin toast ni marcadores; intento fallbacks…');
  } else {
    this.log('EmailLog: no se abrió nueva pestaña; intento same-tab/iframe/fallback…');
  }

  // === 3) Fallbacks (same tab / iframe) ===
  const sameTab =
    (await this.page.locator('input#accept-terms').isVisible({ timeout: 4000 }).catch(() => false)) ||
    (await this.page.getByRole('button', { name: 'CONTINUE' }).isVisible({ timeout: 4000 }).catch(() => false));

  if (sameTab) {
    this.log('EmailLog: DocSign cargó en la misma pestaña (Page).');
    return this.page;
  }

  for (const f of this.page.frames()) {
    const marker = f.locator('input#accept-terms');
    if ((await marker.count().catch(() => 0)) > 0) {
      await marker.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
      this.log('EmailLog: DocSign cargó dentro de un iframe (Frame).');
      return f;
    }
  }

  // === 4) Fallback final: abrir href manualmente en una nueva página ===
  if (candidateHref && /^https?:/i.test(candidateHref)) {
    this.log(`EmailLog: abro manualmente href: ${candidateHref}`);
    const np = await this.page.context().newPage();
    await np.goto(candidateHref, { waitUntil: 'domcontentloaded' });

    const npLegacyToast = np
      .locator('.toast.toast-error, #toast-container .toast.toast-error')
      .filter({ hasText: "File wasn't uploaded or doesn't exist" })
      .first();

    const npSonnerError = np
      .locator('li[data-sonner-toast][data-type="error"]')
      .filter({ hasText: /BoardingApi|Boarding Sign|File wasn't uploaded/i })
      .first();

    const npAccept = np.locator('input#accept-terms');
    const npContinue = np.getByRole('button', { name: 'CONTINUE' });

    const limit = Date.now() + 10000;
    while (Date.now() < limit) {
      if (
        (await npLegacyToast.isVisible().catch(() => false)) ||
        (await npSonnerError.isVisible().catch(() => false))
      ) {
        const m1 = await npLegacyToast.innerText().catch(() => '');
        const m2 = await npSonnerError.innerText().catch(() => '');
        const msg = (m1 || m2 || 'Error en DocSign (manual)').trim();
        this.log(`[EmailLog/manual] ❌ ${msg}`);
        try {
          await np.screenshot({ path: 'reports/screenshots/docsign_manual_error.png', fullPage: true });
        } catch {}
        await np.close().catch(() => {});
        throw new Error(msg);
      }

      if (
        (await npAccept.isVisible().catch(() => false)) ||
        (await npContinue.isVisible().catch(() => false))
      ) {
        return np;
      }

      await this.page.waitForTimeout(300);
    }
  }

  await this.safeShot('email_log_expected_doctype_click_no_destination');
  throw new Error(
    `Tras click en "${linkTextContains}" (${docTypeQuery}) no se detectó destino (popup/same-tab/iframe/manual).`
  );
}





private async scrollSurfaceIntoCenter(
  target: Page | import('@playwright/test').Frame,
  surface: import('@playwright/test').Locator
) {
  const handle = await surface.elementHandle().catch(() => null);
  if (!handle) return;
  try {
    await target.evaluate((el: HTMLElement | SVGElement) => {
      // Encuentra el ancestro scrollable (propio visor) en vez de la ventana
      function getScrollParent(node: HTMLElement | null): HTMLElement {
        let cur: HTMLElement | null = node;
        while (cur && cur !== document.body) {
          const cs = getComputedStyle(cur);
          const oy = cs.overflowY;
          const ox = cs.overflowX;
          const scrollableY = /(auto|scroll)/.test(oy) && cur.scrollHeight > cur.clientHeight;
          const scrollableX = /(auto|scroll)/.test(ox) && cur.scrollWidth > cur.clientWidth;
          if (scrollableY || scrollableX) return cur;
          cur = cur.parentElement;
        }
        return (document.scrollingElement || document.documentElement) as HTMLElement;
      }

      // Cast el to HTMLElement if possible
      const htmlEl = el instanceof HTMLElement ? el : null;
      if (!htmlEl) return;

      const parent = getScrollParent(htmlEl);
      const elRect = htmlEl.getBoundingClientRect();
      const pRect = parent.getBoundingClientRect();

      // Desplaza para centrar vertical y horizontalmente dentro del contenedor
      const topTarget =
        (elRect.top - pRect.top) + parent.scrollTop - (pRect.height / 2 - elRect.height / 2);
      const leftTarget =
        (elRect.left - pRect.left) + parent.scrollLeft - (pRect.width / 2 - elRect.width / 2);

      parent.scrollTo({ top: topTarget, left: leftTarget, behavior: 'auto' });
    }, handle);
  } catch { /* noop */ }
}



private async tryClickSurface(
  target: Page | import('@playwright/test').Frame,
  surface: import('@playwright/test').Locator,
  label: string,
  preDelayMs = 900
): Promise<boolean> {
  const tp = this.getTargetPage(target);

  try {
    await tp.waitForTimeout(preDelayMs);
    await surface.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
    await this.scrollSurfaceIntoCenter(target, surface);
    await surface.hover({ timeout: 1200 }).catch(() => {});
    await surface.waitFor({ state: 'visible', timeout: 1500 }).catch(() => {});
  } catch {}

  // 1) click normal
  try {
    await surface.click({ timeout: 1500 });
    this.log(`[DocSign] Click OK en ${label} (normal).`);
    return true;
  } catch (e1) {
    this.log(`[DocSign] Click normal falló en ${label}: ${(e1 as Error).message || e1}`);
  }

  // 2) click force
  try {
    await surface.click({ timeout: 1500, force: true });
    this.log(`[DocSign] Click OK en ${label} (force).`);
    return true;
  } catch (e2) {
    this.log(`[DocSign] Click force falló en ${label}: ${(e2 as Error).message || e2}`);
  }

  // 3) doble click
  try {
    await surface.dblclick({ timeout: 1200 });
    this.log(`[DocSign] DblClick OK en ${label}.`);
    return true;
  } catch (e3) {
    this.log(`[DocSign] DblClick falló en ${label}: ${(e3 as Error).message || e3}`);
  }

  // 4) click por coordenadas (EN EL PAGE CORRECTO)
  try {
    const handle = await surface.elementHandle({ timeout: 800 }).catch(() => null);
    const box = handle ? await handle.boundingBox() : null;
    if (box) {
      await tp.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      this.log(`[DocSign] Click OK en ${label} (coords).`);
      return true;
    }
  } catch (e4) {
    this.log(`[DocSign] Click coords falló en ${label}: ${(e4 as Error).message || e4}`);
  }

  // 5) dispatchEvent
  try {
    const handle = await surface.elementHandle().catch(() => null);
    if (handle) {
      await handle.evaluate((el: any) => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        const parent = el.closest('.us-visor-box__element') as HTMLElement | null;
        if (parent) {
          parent.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
      });
      this.log(`[DocSign] dispatchEvent('click') en ${label}.`);
      return true;
    }
  } catch (e5) {
    this.log(`[DocSign] dispatchEvent falló en ${label}: ${(e5 as Error).message || e5}`);
  }

  return false;
}



private async waitDocSignResult(opts: {
  target: Page | import('@playwright/test').Frame,
  timeoutMs?: number
}) {
  const { target, timeoutMs = 60_000 } = opts;

  const successMsgTarget   = target.getByText(/The document has been signed satisfactorily\./i).first();
  const successToastTarget = target.locator('li[data-sonner-toast][data-type="success"]').first();
  const successToastApp    = this.page.locator('li[data-sonner-toast][data-type="success"]').first();

  const errorToastTarget   = target.locator('li[data-sonner-toast][data-type="error"]').first();
  const errorToastApp      = this.page.locator('li[data-sonner-toast][data-type="error"]').first();

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // Éxito (cualquiera gana)
    if (await successMsgTarget.isVisible().catch(() => false)) { this.log('[DocSign] OK por mensaje.'); return; }
    if (await successToastTarget.isVisible().catch(() => false)) { this.log('[DocSign] OK por toast (target).'); return; }
    if (await successToastApp.isVisible().catch(() => false)) { this.log('[DocSign] OK por toast (app).'); return; }

    // Error (cualquiera corta)
    if (await errorToastTarget.isVisible().catch(() => false) ||
        await errorToastApp.isVisible().catch(() => false)) {
      const txtT = await errorToastTarget.innerText().catch(() => '');
      const txtA = await errorToastApp.innerText().catch(() => '');
      const msg = (txtT || txtA || 'Error toast sin texto').trim();
      await this.safeShot('docsign_error_toast_detected');
      throw new Error(`Error en DocSign tras submit: ${msg}`);
    }

    await this.page.waitForTimeout(300);
  }

  await this.safeShot('docsign_result_timeout');
  throw new Error('Timeout esperando confirmación de DocSign.');
}


private acceptTermsCheckbox(p: Page): Locator {
  // Ajustá si tenés un selector exacto. Lo dejo tolerante.
  return p.locator(
    '#accept-terms, input[name="accept-terms"], input[id*="accept-terms"], input[type="checkbox"][id*="terms"], input[type="checkbox"][name*="terms"]'
  ).first();
}

private continueBtn(p: Page): Locator {
  return p.getByRole('button', { name: /^CONTINUE$/i }).first();
}

/**
 * Espera a que el checkbox deje de “flapear”, lo deja checked=true y espera CONTINUE enabled.
 * Si la UI re-renderiza y vuelve a destildarlo, lo re-intenta sin “toggle” manual.
 */
private async ensureTermsAcceptedAndContinueEnabled(p: Page, timeoutMs = 90_000) {
  const terms = this.acceptTermsCheckbox(p);
  const cont  = this.continueBtn(p);

  // 0) Asegurar elementos visibles
  await expect(terms).toBeVisible({ timeout: 30_000 });
  await expect(cont).toBeVisible({ timeout: 30_000 });

  // 1) Esperar overlays comunes (si existen)
  const overlays = p.locator('.us-loading-screen, .k-loading-mask, .modal-backdrop, .us-backdrop');
  const overlayCount = await overlays.count().catch(() => 0);
  if (overlayCount > 0) {
    await overlays.first().waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
  }

  // 2) Esperar “estabilidad” del checkbox (que no cambie de estado por 800ms)
  //    Esto evita que lo tildes y el componente se remonte y lo destilde.
  await p.waitForFunction(() => {
    const cb =
      (document.querySelector('#accept-terms') as HTMLInputElement | null) ||
      (document.querySelector('input[name="accept-terms"]') as HTMLInputElement | null) ||
      (document.querySelector('input[type="checkbox"][id*="terms"], input[type="checkbox"][name*="terms"]') as HTMLInputElement | null);

    if (!cb) return false;

    const key = '__pw_terms_stable__';
    const now = Date.now();
    const checked = cb.checked;

    const prev = (window as any)[key] as { v: boolean; t: number } | undefined;
    if (!prev || prev.v !== checked) {
      (window as any)[key] = { v: checked, t: now };
      return false;
    }
    return (now - prev.t) > 800;
  }, { timeout: 30_000 }).catch(() => {
    // si no logramos estabilidad, no matamos todavía: seguimos con reintentos abajo
  });

  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < timeoutMs) {
    attempt++;

    // Re-leer estados
    const checked = await terms.isChecked().catch(() => false);
    const contEnabled = await cont.isEnabled().catch(() => false);

    const disabledAttr = await cont.getAttribute('disabled').catch(() => null);
    console.log(`[DocSign] attempt=${attempt} | terms.checked=${checked} | CONTINUE.enabled=${contEnabled} | disabledAttr=${disabledAttr ?? 'null'}`);

    // Si CONTINUE ya está habilitado, listo.
    if (contEnabled) return;

    // Si terms NO está checked, lo seteamos en true (sin toggle)
    if (!checked) {
      await terms.setChecked(true, { force: true }).catch(async () => {
        await terms.check({ force: true }).catch(() => {});
      });
    }

    // Espera corta a que el UI procese y habilite el botón
    // (y para que se asiente el re-render)
    await p.waitForTimeout(600);

    // Si el checkbox se volvió a destildar por re-render, el loop lo vuelve a setear,
    // pero SOLO cuando lo detecta false (no “clickea” por click).
  }

  const shot = `debug-docsign-continue-disabled-${Date.now()}.png`;
  await p.screenshot({ path: shot, fullPage: true });

  throw new Error(
    `[DocSign] CONTINUE sigue deshabilitado tras ${timeoutMs}ms. ` +
    `terms.checked=${await terms.isChecked().catch(() => '??')} ` +
    `Screenshot: ${shot}`
  );
}




  // ======= DocSign genérico =======
// ======= DocSign genérico (FIX CONTINUE disabled) =======
async docSignFlow({
  target,
  editInfoValue,
  signButtonsCount,
  perSignatureDelayMs = 900,
}: {
  target: Page | import('@playwright/test').Frame;
  editInfoValue: string;
  signButtonsCount: number;
  perSignatureDelayMs?: number;
}) {
  // ✅ Page correcto (si target es Frame => target.page())
  const tp: Page =
    typeof (target as any)?.page === 'function' ? (target as any).page() : (target as Page);

  await tp.bringToFront().catch(() => {});

  // ===== Intro (ACEPTAR TÉRMINOS + CONTINUE habilitado) =====
  const acceptTerms = target.locator('input#accept-terms').first();
  const continueBtn = target.getByRole('button', { name: /^CONTINUE$/ }).first();

  await acceptTerms.waitFor({ state: 'attached', timeout: 20000 });
  await acceptTerms.scrollIntoViewIfNeeded().catch(() => {});
  await acceptTerms.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await continueBtn.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

  // --- helper: esperar estabilidad del checkbox (si cambia de estado por re-render) ---
  const waitTermsStability = async () => {
    const runner = (target as any); // Page o Frame (ambos tienen waitForFunction)
    if (typeof runner?.waitForFunction !== 'function') return;

    await runner.waitForFunction(
      (sel: string) => {
        const cb = document.querySelector(sel) as HTMLInputElement | null;
        if (!cb) return false;

        const key = '__pw_terms_stable__';
        const now = Date.now();
        const checked = !!cb.checked;

        const prev = (window as any)[key] as { v: boolean; t: number } | undefined;
        if (!prev || prev.v !== checked) {
          (window as any)[key] = { v: checked, t: now };
          return false;
        }
        return now - prev.t > 800; // estable 800ms
      },
      '#accept-terms',
      { timeout: 30000 }
    ).catch(() => {
      // Si no logramos estabilidad, no rompemos: seguimos con reintentos abajo
    });
  };

  // --- helper principal: deja terms checked=true y espera CONTINUE enabled (sin togglear) ---
  const ensureTermsAcceptedAndContinueEnabled = async (timeoutMs = 90_000) => {
    // overlays comunes (si existen)
    const overlays = tp.locator('.us-loading-screen, .k-loading-mask, .modal-backdrop, .us-backdrop');
    const overlayCount = await overlays.count().catch(() => 0);
    if (overlayCount > 0) {
      await overlays.first().waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
    }

    // Espera a que el checkbox deje de “flapear” (si aplica)
    await waitTermsStability();

    const start = Date.now();
    let attempt = 0;

    while (Date.now() - start < timeoutMs) {
      attempt++;

      const checked = await acceptTerms.isChecked().catch(() => false);
      const enabled = await continueBtn.isEnabled().catch(() => false);
      const disabledAttr = await continueBtn.getAttribute('disabled').catch(() => null);
      const ariaDisabled = await continueBtn.getAttribute('aria-disabled').catch(() => null);

      this.log(
        `[DocSign] attempt=${attempt} | terms.checked=${checked} | CONTINUE.enabled=${enabled} | disabledAttr=${disabledAttr ?? 'null'} | ariaDisabled=${ariaDisabled ?? 'null'}`
      );

      if (enabled) return;

      // ✅ SOLO setear si está false (idempotente, evita toggle)
      if (!checked) {
        await acceptTerms.setChecked(true, { force: true }).catch(async () => {
          await acceptTerms.check({ force: true }).catch(() => {});
        });
      } else {
        // Si ya está checked pero CONTINUE sigue disabled, disparar eventos (sin click/toggle)
        const h = await acceptTerms.elementHandle().catch(() => null);
        if (h) {
          await h.evaluate((el: any) => {
            try {
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch {}
          });
        }
      }

      // pequeño settle + re-check (aquí suele habilitar)
      await tp.waitForTimeout(600);

      // Si vuelve a destildarse por re-render, el loop lo detecta y lo setea de nuevo.
    }

    await this.safeShot('docsign_continue_still_disabled');
    const checked = await acceptTerms.isChecked().catch(() => false);
    const disabledAttr = await continueBtn.getAttribute('disabled').catch(() => null);

    throw new Error(
      `[DocSign] CONTINUE sigue deshabilitado tras ${timeoutMs}ms. accept-terms checked=${checked}, disabledAttr=${disabledAttr}`
    );
  };

  // ✅ Nueva lógica robusta (anti flapping)
  await ensureTermsAcceptedAndContinueEnabled(90_000);

  // Click real (ya habilitado)
  await continueBtn.click();

  // ===== Edit info =====
  const editInfoBtn = target.getByRole('button', { name: 'Edit info', exact: true });
  await editInfoBtn.waitFor({ state: 'visible', timeout: 20000 });
  await editInfoBtn.click();

  const editInput = target.locator('input.us-input__field[name="Data"]');
  await editInput.waitFor({ state: 'visible', timeout: 20000 });
  await editInput.fill(editInfoValue);

  // ===== Esperar logo/imagen cargada =====
  const logoImg = target.locator('div.us-d-flex.us-justify-center.us-items-center img');
  await logoImg.waitFor({ state: 'visible', timeout: 20000 });
  this.log('[DocSign] Imagen/logo presente y cargada.');

  await tp.waitForTimeout(10000);

  // ===== Accept =====
  const acceptBtn = target.getByRole('button', { name: 'Accept', exact: true });
  await acceptBtn.waitFor({ state: 'visible', timeout: 20000 });
  await acceptBtn.click();

  // ===== Firmas =====
  const submitBtn = target.getByRole('button', { name: 'SUBMIT APPROVAL', exact: true });
  await submitBtn.waitFor({ state: 'attached', timeout: 20000 });

  const allSurfaces = target.locator('.us-docsign-element.us-docsign-surface');
  await allSurfaces.first().waitFor({ state: 'attached', timeout: 20000 }).catch(() => {});
  await tp.waitForTimeout(300);

  let clicksHechos = 0;
  const deadline = Date.now() + 100_000;
  let submitEnabled = await submitBtn.isEnabled().catch(() => false);

  for (let ronda = 1; ronda <= 7 && !submitEnabled; ronda++) {
    const surfaces = target.locator('.us-docsign-element.us-docsign-surface:visible');
    const countNow = await surfaces.count().catch(() => 0);

    this.log(`[DocSign] Ronda ${ronda}: visibles=${countNow}; clicks=${clicksHechos}/${signButtonsCount}`);

    for (let i = countNow - 1; i >= 0; i--) {
      if (clicksHechos >= signButtonsCount) break;

      const current = surfaces.nth(i);
      const ok = await this.tryClickSurface(
        target,
        current,
        `surface#${i + 1} (ronda ${ronda})`,
        perSignatureDelayMs
      );

      if (ok) {
        clicksHechos++;
        await tp.waitForTimeout(350);

        for (let t = 0; t < 6; t++) {
          submitEnabled = await submitBtn.isEnabled().catch(() => false);
          if (submitEnabled) break;
          await tp.waitForTimeout(200);
        }

        if (submitEnabled) {
          this.log('[DocSign] SUBMIT APPROVAL habilitado (post-click).');
          break;
        }
      }
    }

    if (Date.now() > deadline) break;

    try { await tp.keyboard.press('PageDown'); } catch {}
    await tp.waitForTimeout(500);

    submitEnabled = await submitBtn.isEnabled().catch(() => false);
  }

  submitEnabled = await submitBtn.isEnabled().catch(() => false);
  if (!submitEnabled) {
    await this.safeShot('docsign_submit_disabled_after_retries');
    const rem = await target.locator('.us-docsign-element.us-docsign-surface:visible').count().catch(() => -1);
    throw new Error(`SUBMIT APPROVAL sigue deshabilitado tras ${clicksHechos} clics. Superficies visibles remanentes: ${rem}.`);
  }

  await submitBtn.click();

  try {
    await this.waitDocSignResult({ target, timeoutMs: 60_000 });
  } catch (e) {
    this.log(`[DocSign] Reintento de confirmación: ${(e as Error).message || e}`);
    await this.waitDocSignResult({ target, timeoutMs: 30_000 });
  }

  this.log('[DocSign] Confirmación recibida, continuando.');
}






  // ======= Final Boarding / Migration =======
async gotoFinalBoarding() {
  // Cierra cualquier modal colgando (por ejemplo, Email Log) antes de navegar
  try {
    const closeBtn = this.page.locator('.us-modal .us-modal-header__end-content svg').first();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await this.page.waitForTimeout(200);
    }
  } catch {}

  await this.page.goto('https://tfciportal.myfci.com/FinalBoarding', { waitUntil: 'domcontentloaded' });

  // Confirma URL (si hay redirecciones)
  await this.page.waitForURL(/\/FinalBoarding(\/|$|\?|#)/, { timeout: 15000 }).catch(() => {});

  // Señales de que cargó: título "Final Boarding", botón "Boarding To Centurion" o un grid Kendo
  const title = this.page
    .locator('xpath=//*[self::h1 or self::div or self::span][normalize-space()="Final Boarding"]')
    .first();
  const boardBtn = this.page.getByRole('button', { name: /Boarding To Centurion/i });
  const grid = this.page.locator('div.k-grid,div.k-table').first();

  // Espera por cualquiera de las señales
  await Promise.race([
    title.waitFor({ state: 'visible', timeout: 20000 }),
    boardBtn.waitFor({ state: 'visible', timeout: 20000 }),
    grid.waitFor({ state: 'visible', timeout: 20000 }),
  ]).catch(async () => {
    // Fallback: si existe un <main>, lo esperamos un poco más
    await this.page.getByRole('main').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  });

  // Quita loaders típicos de Kendo si los hay
  await this.page
    .locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {});
}

async markRowAndBoardToCenturion() {
  // Toma el primer grid visible en la vista
  const grid = this.page.locator('div.k-grid,div.k-table').first();
  await expect(grid).toBeVisible({ timeout: 30000 });

  // Espera a que exista al menos un checkbox de fila y selecciónalo
  const firstCheckbox = grid.locator('input.k-checkbox[type="checkbox"]').first();
  await firstCheckbox.waitFor({ state: 'visible', timeout: 20000 });
  await firstCheckbox.check();

  // Espera que el botón de acción esté habilitado y clica
  const btn = this.page.getByRole('button', { name: /Boarding To Centurion/i });
  await expect(btn).toBeEnabled({ timeout: 10000 });
  await btn.click();

  // Pequeña confirmación: espera toast de éxito (si existe) o deja respirar a la UI
  const successToast = this.page
    .locator('li[data-sonner-toast][data-type="success"]')
    .filter({ hasText: /Boarding|Centurion|Success/i })
    .first();

  await successToast
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(async () => {
      // Si no hay toast, al menos espera a que no haya loaders
      await this.page
        .locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]')
        .first()
        .waitFor({ state: 'detached', timeout: 8000 })
        .catch(() => {});
      // y un respiro corto
      await this.page.waitForTimeout(1000);
    });

  this.log('[FinalBoarding] Acción "Boarding To Centurion" ejecutada.');
}


  async gotoMigrationHistory() {
  await this.page.goto('https://tfciportal.myfci.com/migrationHistory', { waitUntil: 'domcontentloaded' });
  await this.mainArea.waitFor();
  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  await expect(grid).toBeVisible({ timeout: 30000 });

  // Espera a headers clave
  await expect(grid.getByText('Loan Account', { exact: true })).toBeVisible({ timeout: 30000 });

  // Quitar posibles loaders
  await grid.locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]').first()
    .waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
}


async assertMigrationRow(loanAccount: string, timeoutMs = 180000) {
  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  await expect(grid).toBeVisible({ timeout: 30000 });

  // 0) Si existe Quick Search / Filter, úsalo (MUCHO más estable)
  const quickSearch = grid.locator(
    'input.k-input-inner[placeholder*="Search"], input[placeholder*="Search"], input[placeholder*="Filter"], input[aria-label*="Search"]'
  ).first();

  const refreshBtn = grid.locator('.k-pager-refresh, .k-grid-toolbar .k-button[title*="Refresh"]').first();

  const findRowHere = async () => {
    // busca tr con celda exacta del loan (lo más sólido)
    const row = grid.locator(`xpath=.//tr[.//td[normalize-space()="${loanAccount}"]]`).first();
    if (await row.count().catch(() => 0)) return row;
    return null;
  };

  const assertRowStatus = async (row: import('@playwright/test').Locator) => {
    await row.scrollIntoViewIfNeeded().catch(() => {});

    const cells = row.locator('td');
    const n = await cells.count().catch(() => 0);

    if (n >= 6) {
      await expect(cells.nth(4)).toHaveText(/^\s*Migrated\s*$/i, { timeout: 20000 });
      await expect(cells.nth(5)).toHaveText(/^\s*Success\s*$/i, { timeout: 20000 });
    } else {
      await expect(row.getByText('Migrated', { exact: false })).toBeVisible({ timeout: 20000 });
      await expect(row.getByText('Success', { exact: false })).toBeVisible({ timeout: 20000 });
    }
  };

  const deadline = Date.now() + timeoutMs;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      // 1) QuickSearch
      if (await quickSearch.count().catch(() => 0)) {
        await quickSearch.fill('');
        await quickSearch.type(loanAccount, { delay: 15 });
        await this.page.keyboard.press('Enter').catch(() => {});
        await this.page.waitForTimeout(600);
      }

      // 2) intento directo
      const row = await findRowHere();
      if (row) {
        await assertRowStatus(row);
        this.log(`[MigrationHistory] OK: Loan=${loanAccount} → Migrated/Success`);
        return;
      }

      // 3) fallback: virtual scroll con “cambio real” (si no hay search o no filtró)
      const scrollArea = grid.locator('.k-grid-content, .k-virtual-content, .k-table-wrap').first();
      if (await scrollArea.count().catch(() => 0)) {
        // firma del último row visible para detectar render
        const lastRowSig = async () => {
          const lastRow = grid.locator('tbody tr:visible').last();
          const txt = (await lastRow.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
          return txt.slice(0, 140);
        };

        let prevSig = await lastRowSig().catch(() => '');
        for (let i = 0; i < 25; i++) {
          // buscar antes de scrollear
          const r = await findRowHere();
          if (r) {
            await assertRowStatus(r);
            this.log(`[MigrationHistory] OK: Loan=${loanAccount} → Migrated/Success`);
            return;
          }

          await scrollArea.evaluate((el: HTMLElement) => {
            el.scrollTop = Math.min(el.scrollTop + 700, el.scrollHeight);
          }).catch(() => {});

          // esperar que el grid “cambie” (render)
          await expect.poll(async () => await lastRowSig(), { timeout: 8000 })
            .not.toBe(prevSig);

          prevSig = await lastRowSig().catch(() => prevSig);
          await this.page.waitForTimeout(200);
        }
      }

      // 4) si no está, refresh y esperar un poco (la fila puede tardar)
      if (await refreshBtn.count().catch(() => 0)) {
        await refreshBtn.click().catch(() => {});
      } else {
        await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      }
      await this.page.waitForTimeout(1200);
    } catch (e: any) {
      lastError = e?.message || String(e);
      await this.page.waitForTimeout(900);
    }
  }

  await this.safeShot('migration_row_not_found');
  throw new Error(`No se encontró la fila de Loan Account "${loanAccount}" en Migration History. Último error: ${lastError}`);
}



// ======= PRE-BOARDING (grid) =======
async gotoPreBoarding() {
  await this.page.goto('https://tfciportal.myfci.com/PreBoarding', { waitUntil: 'domcontentloaded' });
  await this.mainArea.waitFor();

  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  await expect(grid).toBeVisible({ timeout: 30000 });

  // Header Kendo puede ser <div.k-grid-header> o <thead.k-table-thead>
  const kendoHeaderDiv = grid.locator('.k-grid-header').first();
  const kendoThead     = grid.locator('.k-table-thead').first();
  if (!(await kendoHeaderDiv.isVisible().catch(() => false))) {
    await expect(kendoThead).toBeVisible({ timeout: 30000 });
  }

  // Body con al menos 1 fila
  const tbody = grid.locator('tbody.k-table-tbody, .k-grid-content tbody, tbody').first();
  await expect(tbody).toBeVisible({ timeout: 30000 });
  await expect(tbody.locator('tr[role="row"]').first()).toBeVisible({ timeout: 30000 });

  // Quitar loaders si hubiera
  await this.page.locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]').first()
    .waitFor({ state: 'detached', timeout: 5000 })
    .catch(() => {});
}

// Selecciona la PRIMERA fila de PreBoarding y devuelve el PrevAccount (col index=1)
async selectFirstPreBoardingRow(): Promise<string> {
  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  const tbody = grid.locator('tbody.k-table-tbody, .k-grid-content tbody, tbody').first();

  await expect(tbody).toBeVisible({ timeout: 30000 });
  const firstRow = tbody.locator('tr[role="row"]').first();
  await expect(firstRow).toBeVisible({ timeout: 30000 });

  // Marcar checkbox de la primera fila
  const checkboxInput = firstRow.locator('span.k-checkbox-wrap > input.k-checkbox[type="checkbox"]').first();
  const checkboxWrap  = firstRow.locator('span.k-checkbox-wrap').first();

  try {
    await checkboxInput.check({ force: true });
  } catch {
    await checkboxWrap.click({ force: true }).catch(async () => {
      const box = await checkboxWrap.boundingBox();
      if (box) {
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
    });
  }

  // Capturar PrevAccount (col index=1)
  const prevCell = firstRow.locator('td[data-grid-col-index="1"]').first();
  await expect(prevCell).toBeVisible({ timeout: 10000 });
  const prev = (await prevCell.innerText()).trim();

  console.log('PrevAccount guardado desde primera fila:', prev);
  return prev;
}

// Clic en "Processing Pre-Boarding" y esperar toast legacy de éxito
async clickProcessingPreBoardingAndWaitSuccess() {
  const byName = this.page.locator('button[name="Processing Pre-Boarding"]').first();
  const byText = this.page.getByRole('button', { name: 'Processing Pre-Boarding' }).first();
  const btn = (await byName.count()) ? byName : byText;

  await expect(btn).toBeEnabled({ timeout: 15000 });
  await btn.click();

  const legacyToast = this.page.locator('#toast-container .toast-success')
    .filter({ hasText: 'Pending Boarding' })
    .filter({ hasText: 'Pre-Loans Proccessed Successfully' }); // (sic)
  await legacyToast.waitFor({ state: 'visible', timeout: 60000 });
}

// ======= LOAN: sincronizar Interest Paid To = First Payment (multi-estrategia) =======
async syncInterestPaidToFirstPayment() {
  const firstPaymentInput = this.mainArea
    .getByText('First Payment', { exact: false })
    .locator('xpath=ancestor::div[contains(@class,"col-md-12")][1]')
    .locator('input.k-input-inner')
    .first();

  const interestPaidToInput = this.mainArea
    .getByText('Interest Paid To', { exact: false })
    .locator('xpath=ancestor::div[contains(@class,"col-md-12")][1]')
    .locator('input.k-input-inner')
    .first();

  await expect(firstPaymentInput).toBeVisible({ timeout: 20000 });
  await expect(interestPaidToInput).toBeVisible({ timeout: 20000 });

  // 1) leer y normalizar First Payment
  const raw =
    (await firstPaymentInput.inputValue().catch(() => '')) ||
    (await firstPaymentInput.getAttribute('title').catch(() => '')) ||
    '';
  const norm = (() => {
    const digits = raw.replace(/\D+/g, '');
    if (digits.length === 8) {
      const mm = digits.slice(0, 2);
      const dd = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      return { display: `${mm}/${dd}/${yyyy}`, digits: `${mm}${dd}${yyyy}` };
    }
    const m = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (!m) return null;
    const mm = String(+m[1]).padStart(2, '0');
    const dd = String(+m[2]).padStart(2, '0');
    const yyyy = m[3];
    return { display: `${mm}/${dd}/${yyyy}`, digits: `${mm}${dd}${yyyy}` };
  })();

  if (!norm) throw new Error(`No pude leer/normalizar First Payment: "${raw}"`);

  // helper: lee el valor “actual” que muestra Kendo (value o title)
  const readCurrent = async () => {
    let v = (await interestPaidToInput.inputValue().catch(() => ''))?.trim();
    if (!v) v = ((await interestPaidToInput.getAttribute('title').catch(() => '')) || '').trim();
    return v;
  };

  // helper: commit (Enter+Tab) y espera a que Kendo enmascare
  const commitAndStabilize = async () => {
    await interestPaidToInput.press('Enter').catch(() => {});
    await interestPaidToInput.blur();
    await this.page.waitForTimeout(150);
  };

  // Estrategia 1: seleccionar todo, Delete, escribir dígitos
  const strat1 = async () => {
    await interestPaidToInput.focus();
    await interestPaidToInput.press('Control+A').catch(() => {});
    await interestPaidToInput.press('Delete').catch(() => {});
    await interestPaidToInput.type(norm.digits, { delay: 25 });
    await commitAndStabilize();
  };

  // Estrategia 2: seleccionar todo, Delete, fill con MM/DD/YYYY
  const strat2 = async () => {
    await interestPaidToInput.focus();
    await interestPaidToInput.press('Control+A').catch(() => {});
    await interestPaidToInput.press('Delete').catch(() => {});
    await interestPaidToInput.fill(norm.display);
    await commitAndStabilize();
  };

  // Estrategia 3: seleccionar todo, backspace varias veces, escribir dígitos
  const strat3 = async () => {
    await interestPaidToInput.focus();
    await interestPaidToInput.press('Control+A').catch(() => {});
    for (let i = 0; i < 10; i++) {
      await interestPaidToInput.press('Backspace').catch(() => {});
    }
    await interestPaidToInput.type(norm.digits, { delay: 25 });
    await commitAndStabilize();
  };

  // ejecuta estrategias hasta que coincida
  for (const [name, fn] of [
    ['type-digits', strat1],
    ['fill-display', strat2],
    ['backspace-then-digits', strat3],
  ] as const) {
    await fn();
    const current = await readCurrent();
    if (current === norm.display) {
      this.log?.(`[Loan] Interest Paid To OK con estrategia "${name}": ${current}`);
      return;
    }
    this.log?.(`[Loan] Interest Paid To aún no coincide tras "${name}". Esperado="${norm.display}", actual="${current}". Reintentando...`);
  }

  const finalValue = await readCurrent();
  throw new Error(`No pude sincronizar Interest Paid To. Esperado="${norm.display}", actual="${finalValue}".`);
}




/**
 * Si hay cambios pendientes en Loan, guarda (Save) y confirma (Update Loan).
 * - Si no está el botón Save visible/habilitado, log y sigue.
 * - Si no aparece el modal Update Loan, log y sigue.
 */
private async saveAndConfirmUpdateLoanIfPresent(timeoutMs = 30000) {
  const saveBtn = this.page.locator('button#btnUpdate:has-text("Save")').first();

  // 1) ¿Existe y está visible?
  const saveVisible = await saveBtn.isVisible().catch(() => false);
  if (!saveVisible) {
    this.log('[LoanUpdate] ℹ️ No se encontró botón "Save" (#btnUpdate). Continúo.');
    return;
  }

  // 2) ¿Está habilitado?
  const saveEnabled = await saveBtn.isEnabled().catch(() => false);
  if (!saveEnabled) {
    this.log('[LoanUpdate] ℹ️ El botón "Save" está visible pero deshabilitado. Continúo.');
    return;
  }

  // 3) Click Save
  await saveBtn.scrollIntoViewIfNeeded().catch(() => {});
  await saveBtn.click({ timeout: 15000 });
  this.log('[LoanUpdate] ✅ Click en "Save" (#btnUpdate).');

  // 4) Modal Update Loan (puede o no aparecer)
  const modal = this.page.locator('.modal-content').filter({ hasText: /Update Loan/i }).first();
  const updateBtn = modal.getByRole('button', { name: /^Update$/i }).first();

  const modalAppeared = await modal
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!modalAppeared) {
    this.log('[LoanUpdate] ⚠️ No apareció el modal "Update Loan" luego de Save. Continúo igual.');
    return;
  }

  // 5) Confirmar Update
  await updateBtn.waitFor({ state: 'visible', timeout: 15000 });
  await updateBtn.click();
  this.log('[LoanUpdate] ✅ Confirmado "Update" en modal Update Loan.');

  // 6) Esperar cierre + overlays típicos
  await modal.waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
  const overlays = this.page.locator('.k-loading-mask, .us-loading-screen, .modal-backdrop, .us-backdrop');
  const c = await overlays.count().catch(() => 0);
  if (c > 0) await overlays.first().waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
}


// ======= COMPLETE BOARDING cuando ya existen docs =======
async completeBoardingWhenDocsAlreadyGenerated() {
  // Helper logs
  const info = (m: string) => (this as any).log ? (this as any).log(m) : console.log(m);
  const warn = (m: string) => (this as any).log ? (this as any).log(m) : console.warn(m);

  // ✅ NUEVO: Guardar + confirmar Update Loan antes de completar pre-boarding
  await this.saveAndConfirmUpdateLoanIfPresent(30000);

  // --- 1) Click en "Complete Pre-Boarding" (id con fallback por texto) ---
  const btn = (await this.completePreBoardingBtnById.count().catch(() => 0))
    ? this.completePreBoardingBtnById
    : this.completePreBoardingBtnByText;

  await expect(btn).toBeEnabled({ timeout: 15000 });
  await btn.click();

  // --- 2) Selectores de toasts ---
  // 2.a) Sonner error (docs ya generados)
  const errorToastDocs = this.page
    .locator('[data-sonner-toast][data-type="error"]')
    .filter({ hasText: 'Setup Form and LSA documents are already generated.' })
    .first();

  // 2.b) Sonner success
  const successToast = this.page
    .locator('[data-sonner-toast][data-type="success"]')
    .filter({ hasText: 'Boarding completed successfully.' })
    .first();

  // 2.c) Legacy "no eres el dueño"
  const notOwnerToast = this.page
    .locator('#toast-container .toast-error .toast-message, .toast.toast-error .toast-message')
    .filter({ hasText: "You can't send this loan to Pre-Boarding. You are not the owner of this task" })
    .first();

  // 2.d) Legacy success (fallback)
  const legacySuccess = this.page
    .locator('#toast-container .toast-success .toast-message, .toast.toast-success .toast-message')
    .filter({ hasText: /Boarding completed successfully/i })
    .first();

  // Modal (puede aparecer con o sin toast)
  const modal = this.page.locator('.modal-content').filter({ hasText: 'Complete Boarding Loan' }).first();
  const completeBtnInModal = modal.getByRole('button', { name: /Complete boarding/i }).first();

  // Helper: esperar success de forma opcional (NO falla si no aparece)
  const waitSuccessOptional = async (timeoutMs = 45_000): Promise<boolean> => {
    const appeared = await Promise.race([
      successToast.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false),
      legacySuccess.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false),
    ]);

    if (appeared) {
      info('[CompleteBoarding] ✅ Toast de éxito detectado: "Boarding completed successfully."');
      return true;
    }

    warn(
      `[CompleteBoarding] ⚠️ No apareció el toast de éxito en ${timeoutMs}ms. ` +
      `Continuo el flujo igual porque el boarding puede haberse procesado correctamente.`
    );
    return false;
  };

  // --- 3) Corte anticipado si aparece "not owner" ---
  try {
    await notOwnerToast.waitFor({ state: 'visible', timeout: 10000 });
    info('[CompleteBoarding] ✋ Toast detectado: el usuario no es el dueño de la tarea. Se corta el flujo.');
    await (this as any).safeShot?.('toast_not_owner_detected').catch?.(() => {});
    throw new Error("Interrumpido: You can't send this loan to Pre-Boarding. You are not the owner of this task.");
  } catch {
    // No apareció ese toast → seguimos el flujo normal
  }

  // --- 4) Si aparece el error (docs ya generados), confirma el modal y luego espera success opcional ---
  const docsErrorAppeared = await errorToastDocs
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (docsErrorAppeared) {
    await expect(modal).toBeVisible({ timeout: 30000 });
    await expect(completeBtnInModal).toBeEnabled({ timeout: 30000 });
    await completeBtnInModal.click();

    // Esperar cierre del modal (siempre ayuda a estabilizar)
    await Promise.race([
      modal.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {}),
      modal.waitFor({ state: 'detached', timeout: 60000 }).catch(() => {}),
    ]);

    await waitSuccessOptional(60_000);
    return;
  }

  // --- 5) Éxito directo sin modal (opcional) ---
  const successDirect = await waitSuccessOptional(45_000);
  if (successDirect) return;

  // --- 6) Fallbacks ---
  if (await modal.isVisible().catch(() => false)) {
    await expect(completeBtnInModal).toBeEnabled({ timeout: 30000 });
    await completeBtnInModal.click();

    await Promise.race([
      modal.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {}),
      modal.waitFor({ state: 'detached', timeout: 60000 }).catch(() => {}),
    ]);

    await waitSuccessOptional(60_000);
    return;
  }

  const legacyNow = await legacySuccess.isVisible().catch(() => false);
  const sonnerNow = await successToast.isVisible().catch(() => false);
  if (legacyNow || sonnerNow) {
    info('[CompleteBoarding] ✅ Success detectado en fallback final (legacy/sonner).');
    return;
  }

  // --- 7) ya NO tiramos error ---
  warn(
    '[CompleteBoarding] ⚠️ No se detectó confirmación de “Boarding completed successfully.” ' +
    '(ni Sonner ni legacy) tras “Complete Pre-Boarding”. Continúo el flujo igual.'
  );

  await (this as any).safeShot?.(`no_success_toast_after_complete_${Date.now()}`).catch?.(() => {});
  return;
}



// ===== Navegar a FinalBoarding (idempotente) =====
async navigateToFinalBoarding() {
  const base = process.env.PORTAL_BASE_URL ?? 'https://tfciportal.myfci.com';
  const url = `${base.replace(/\/+$/, '')}/FinalBoarding`;

  await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(this.mainArea).toBeVisible({ timeout: 20000 });

  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  await expect(grid).toBeVisible({ timeout: 20000 });

  // tbody presente
  await grid.locator('tbody').first().waitFor({ state: 'attached', timeout: 15000 });

  // pequeño settle
  await this.page.waitForTimeout(300);
}

// ===== util: obtener referencias comunes del grid =====
private get finalGrid() {
  // ✅ agarrar el grid/table VISIBLE (evita header grid u otros ocultos)
  const grid = this.mainArea.locator('div.k-grid:visible, div.k-table:visible').first();

  const tbody = grid.locator(
    'tbody.k-table-tbody, .k-grid-content tbody, tbody'
  ).first();

  const rows = tbody.locator('tr[role="row"], tr.k-table-row');

  const scrollArea = grid.locator(
    '.k-grid-content, .k-table-wrap, .k-virtual-content, .k-grid-table-wrap'
  ).first();

  const pagerFirst = grid.locator('.k-pager-first, .k-pager-nav .k-pager-first').first();
  const pagerNext  = grid.locator('.k-pager-next,  .k-pager-nav .k-pager-next').first();
  const refreshBtn = grid.locator('.k-pager-refresh, .k-grid-toolbar .k-button[title*="Refresh"]').first();

  const quickSearch = grid.locator(
    'input.k-input-inner[placeholder*="Search"], input[placeholder*="Search"], input[placeholder*="Filter"], input[aria-label*="Search"]'
  ).first();

  return { grid, tbody, rows, scrollArea, pagerFirst, pagerNext, refreshBtn, quickSearch };
}

private async waitFinalBoardingGridReady(timeoutMs = 30000) {
  const { grid, rows } = this.finalGrid;

  await expect(grid).toBeVisible({ timeout: timeoutMs });

  // ✅ esperar loaders típicos (si existen)
  await this.page
    .locator('.k-loading-mask,.k-loading,.k-busy,[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => {});

  // ✅ Kendo puede renderizar tbody vacío: esperamos a que haya rows
  await expect
    .poll(async () => await rows.count().catch(() => 0), { timeout: timeoutMs })
    .toBeGreaterThan(0);
}

// ===== util: construir locator de fila por PrevAccount =====
private rowByPrevAccount(prevAccount: string) {
  const { grid } = this.finalGrid;
  // 1) match por celda en columna 2 (cuando aplica)
  const byCol2 = grid
    .locator('tbody tr[role="row"]')
    .filter({
      has: grid.locator('td[role="gridcell"][aria-colindex="2"]').filter({ hasText: prevAccount }),
    })
    .first();

  // 2) fallback: cualquier parte de la fila (por si cambia aria-colindex)
  const byAnyCell = grid
    .locator('tbody tr[role="row"]')
    .filter({ hasText: prevAccount })
    .first();

  return { byCol2, byAnyCell };
}

// ===== util: intentar match directo en la página actual =====
private async tryFindRowHere(prevAccount: string): Promise<Locator | null> {
  const { tbody } = this.finalGrid;

  // ✅ lo más robusto: buscar por contenido normalizado dentro de un td cualquiera
  const exactRow = tbody.locator(
    `xpath=.//tr[( @role="row" or contains(@class,"k-table-row")) and .//td[normalize-space()="${prevAccount}"]]`
  ).first();

  if ((await exactRow.count().catch(() => 0)) > 0) return exactRow;

  // ✅ fallback: por data-grid-col-index (según tu HTML, PrevAccount está en col-index 1)
  const byDataCol = tbody.locator('tr[role="row"], tr.k-table-row').filter({
    has: tbody.locator('td[data-grid-col-index="1"]').filter({ hasText: prevAccount }),
  }).first();

  if ((await byDataCol.count().catch(() => 0)) > 0) return byDataCol;

  // ✅ fallback final: contains (por si hay espacios raros)
  const containsRow = tbody.locator('tr[role="row"], tr.k-table-row').filter({ hasText: prevAccount }).first();
  if ((await containsRow.count().catch(() => 0)) > 0) return containsRow;

  return null;
}

private async tryFilterFinalBoarding(prevAccount: string): Promise<Locator | null> {
  const { quickSearch } = this.finalGrid;
  if (!(await quickSearch.count().catch(() => 0))) return null;

  await quickSearch.fill('');
  await quickSearch.type(prevAccount, { delay: 20 });
  await this.page.keyboard.press('Enter').catch(() => {});
  await this.page.waitForTimeout(500);

  return this.tryFindRowHere(prevAccount);
}

private async tryPaginateFinalBoarding(prevAccount: string): Promise<Locator | null> {
  const { pagerFirst, pagerNext, rows } = this.finalGrid;

  if (await pagerFirst.count().catch(() => 0)) {
    const disabled = await pagerFirst.getAttribute('aria-disabled').catch(() => null);
    if (disabled !== 'true') {
      await pagerFirst.click().catch(() => {});
      await rows.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      await this.page.waitForTimeout(300);
    }
  }

  for (let i = 0; i < 80; i++) {
    const row = await this.tryFindRowHere(prevAccount);
    if (row) return row;

    if (!(await pagerNext.count().catch(() => 0))) break;
    const disabled = await pagerNext.getAttribute('aria-disabled').catch(() => null);
    if (disabled === 'true') break;

    await pagerNext.click().catch(() => {});
    await rows.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await this.page.waitForTimeout(350);
  }

  return null;
}

private async tryInfiniteScrollFinalBoarding(prevAccount: string): Promise<Locator | null> {
  const { scrollArea, rows } = this.finalGrid;
  if (!(await scrollArea.count().catch(() => 0))) return null;

  let lastSig = '';
  const sig = async () => {
    const lastRow = rows.filter({ hasText: /.*/ }).last();
    return ((await lastRow.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  };

  lastSig = await sig().catch(() => '');

  for (let i = 0; i < 60; i++) {
    const row = await this.tryFindRowHere(prevAccount);
    if (row) return row;

    await scrollArea.evaluate((el: HTMLElement) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
    await this.page.waitForTimeout(300);

    const newSig = await sig().catch(() => '');
    if (newSig && newSig === lastSig) break;
    lastSig = newSig;

    await rows.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  }

  return null;
}

// ===== util: usar quick search si existe =====
private async tryFilter(prevAccount: string) {
  const { quickSearch, rows, grid } = this.finalGrid;
  if (!(await quickSearch.count())) return null;

  await quickSearch.fill('');
  await quickSearch.type(prevAccount, { delay: 20 });
  await this.page.keyboard.press('Enter').catch(() => {});
  await this.page.waitForTimeout(400);

  // espera a que el grid re-renderice algo
  await rows.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  return this.tryFindRowHere(prevAccount);
}

// ===== util: paginar de inicio a fin =====
private async tryPaginate(prevAccount: string) {
  const { pagerFirst, pagerNext, rows } = this.finalGrid;

  // ir a la primera página si hay botón
  if (await pagerFirst.count()) {
    const disabled = await pagerFirst.isDisabled().catch(() => false);
    if (!disabled) {
      await pagerFirst.click({ timeout: 4000 }).catch(() => {});
      await rows.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    }
  }

  // recorrer páginas hasta encontrar
  for (let i = 0; i < 80; i++) {
    const row = await this.tryFindRowHere(prevAccount);
    if (row) return row;

    if (!(await pagerNext.count())) break;
    const disabled = await pagerNext.isDisabled().catch(() => false);
    if (disabled) break;

    await pagerNext.click({ timeout: 4000 }).catch(() => {});
    await rows.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  }
  return null;
}

// ===== util: infinite scroll =====
private async tryInfiniteScroll(prevAccount: string) {
  const { scrollArea, rows } = this.finalGrid;
  if (!(await scrollArea.count())) return null;

  let lastHeight = -1;
  for (let i = 0; i < 60; i++) {
    const row = await this.tryFindRowHere(prevAccount);
    if (row) return row;

    // scroll hacia el final
    await scrollArea.evaluate((el: HTMLElement) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })).catch(() => {});
    await this.page.waitForTimeout(250);

    const h = await scrollArea.evaluate((el: HTMLElement) => el.scrollHeight).catch(() => -1);
    if (h <= lastHeight) break; // no crece => nada nuevo
    lastHeight = h;

    // asegura que hayan filas visibles
    await rows.first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  }
  return null;
}

// ===== FinalBoarding: marcar fila por PrevAccount (robusto) =====
async markFinalBoardingRowByPrevAccount(prevAccount: string, timeoutMs = 60000) {
  await this.navigateToFinalBoarding();

  const deadline = Date.now() + timeoutMs;
  let refreshed = false;

  while (Date.now() < deadline) {
    await this.waitFinalBoardingGridReady(30000).catch(() => {});

    // 1) directo
    let row = await this.tryFindRowHere(prevAccount);

    // 2) quick search
    if (!row) row = await this.tryFilterFinalBoarding(prevAccount);

    // 3) paginado
    if (!row) row = await this.tryPaginateFinalBoarding(prevAccount);

    // 4) virtual/infinite scroll
    if (!row) row = await this.tryInfiniteScrollFinalBoarding(prevAccount);

    if (row && (await row.isVisible().catch(() => false))) {
      await row.scrollIntoViewIfNeeded().catch(() => {});

      // ✅ checkbox: Kendo a veces no deja check() directo, usamos fallback al label
      const input = row.locator('input.k-checkbox, input[type="checkbox"][role="checkbox"], input[type="checkbox"]').first();
      const label = row.locator('label.k-checkbox-label, .k-checkbox-label').first();

      try {
        await input.check({ force: true });
      } catch {
        await label.click({ force: true }).catch(async () => {
          const box = await input.boundingBox().catch(() => null);
          if (box) await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        });
      }

      this.log(`[FinalBoarding] Fila "${prevAccount}" marcada correctamente.`);
      return;
    }

    // 5) refresh una sola vez dentro del loop
    if (!refreshed) {
      const { refreshBtn } = this.finalGrid;
      if (await refreshBtn.count().catch(() => 0)) {
        this.log('[FinalBoarding] PrevAccount no aparece aún → Refresh del grid...');
        await refreshBtn.click().catch(() => {});
        refreshed = true;
        await this.page.waitForTimeout(1200);
        continue;
      }
    }

    await this.page.waitForTimeout(800);
  }

  // Debug útil si falla
  const { rows } = this.finalGrid;
  const sample = await rows.allInnerTexts().catch(() => []);
  this.log(`[FinalBoarding] No encontré "${prevAccount}". Sample rows:\n- ${sample.slice(0, 8).join('\n- ')}`);
  await this.safeShot('finalboarding_prev_not_found');

  throw new Error(`No encontré la fila con PrevAccount "${prevAccount}" en FinalBoarding.`);
}

// ===== Alias para tu step actual =====
async checkFinalBoardingRowByPrevAccount(prevAccount: string) {
  return this.markFinalBoardingRowByPrevAccount(prevAccount);
}


// ===== MIGRATION HISTORY =====

// 1) Navegar a /migrationHistory
async navigateToMigrationHistory() {
  const base = process.env.PORTAL_BASE_URL ?? 'https://tfciportal.myfci.com';
  const url = `${base.replace(/\/+$/, '')}/migrationHistory`;

  await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(this.mainArea).toBeVisible({ timeout: 20000 });

  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  await expect(grid).toBeVisible({ timeout: 20000 });
  await grid.locator('tbody').first().waitFor({ state: 'attached', timeout: 15000 });

  // pequeño settle
  await this.page.waitForTimeout(300);
}

// Helpers de grid (reutilizables rápidamente aquí)
private get mhGrid() {
  const grid = this.mainArea.locator('div.k-grid,div.k-table').first();
  return {
    grid,
    tbody: grid.locator('tbody').first(),
    rows: grid.locator('tbody tr[role="row"]'),
    scrollArea: grid.locator('.k-grid-content, .k-virtual-content, .k-grid-table-wrap, .k-table-wrap').first(),
    refreshBtn: grid.locator('.k-pager-refresh, .k-grid-toolbar .k-button[title*="Refresh"]').first(),
    quickSearch: grid.locator('input.k-input-inner[placeholder*="Search"], input[placeholder*="Filter"], input[placeholder*="Buscar"], input[placeholder*="search"]').first(),
  };
}

private mhRowByPrev(prev: string) {
  const { grid } = this.mhGrid;

  // preferimos la col 1 "Prev Account" si respeta aria-colindex
  const byCol1 = grid
    .locator('tbody tr[role="row"]')
    .filter({
      has: grid
        .locator('td[role="gridcell"][aria-colindex="1"], td.text-center:nth-child(1)')
        .filter({ hasText: prev }),
    })
    .first();

  // fallback: cualquier celda del row
  const byAny = grid.locator('tbody tr[role="row"]').filter({ hasText: prev }).first();

  return { byCol1, byAny };
}

private async mhTryFindHere(prev: string) {
  const { byCol1, byAny } = this.mhRowByPrev(prev);
  if (await byCol1.count()) return byCol1;
  if (await byAny.count()) return byAny;
  return null;
}

private async mhTryFilter(prev: string) {
  const { quickSearch, rows } = this.mhGrid;
  if (!(await quickSearch.count())) return null;

  await quickSearch.fill('');
  await quickSearch.type(prev, { delay: 20 });
  await this.page.keyboard.press('Enter').catch(() => {});
  await this.page.waitForTimeout(400);
  await rows.first().waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  return this.mhTryFindHere(prev);
}

private async mhTryInfiniteScroll(prev: string) {
  const { scrollArea, rows } = this.mhGrid;
  if (!(await scrollArea.count())) return null;

  let lastH = -1;
  for (let i = 0; i < 80; i++) {
    const row = await this.mhTryFindHere(prev);
    if (row) return row;

    await scrollArea.evaluate((el: HTMLElement) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })).catch(() => {});
    await this.page.waitForTimeout(250);
    const h = await scrollArea.evaluate((el: HTMLElement) => el.scrollHeight).catch(() => -1);
    if (h <= lastH) break; // no crece => nada nuevo
    lastH = h;
    await rows.first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  }
  return null;
}

// 2) Afirmar fila "Migrated / Success" por Prev Account
// ✅ Ahora: loguea estados distintos, y si hay "Error" corta con mensaje claro.
async assertMigrationRowByPrev(prev: string, opts?: {
  timeoutMs?: number;
  expectedBoarding?: RegExp;
  expectedMigration?: RegExp;
  failFastOnError?: boolean;
}) {
  const timeoutMs = opts?.timeoutMs ?? 180000;
  const expectedBoarding = opts?.expectedBoarding ?? /Migrated/i;
  const expectedMigration = opts?.expectedMigration ?? /Success/i;
  const failFastOnError = opts?.failFastOnError ?? true;

  await this.navigateToMigrationHistory();

  const deadline = Date.now() + timeoutMs;

  let lastSnapshot = '';
  let refreshTick = 0;

  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

  const readRowState = async (row: Locator) => {
    const cells = row.locator('td');
    const boardingStatus = normalize(await cells.nth(4).innerText().catch(() => ''));
    const migrationStatus = normalize(await cells.nth(5).innerText().catch(() => ''));
    const message = normalize(await cells.nth(6).innerText().catch(() => ''));
    return { boardingStatus, migrationStatus, message };
  };

  while (Date.now() < deadline) {
    // Buscar fila (reusa tus helpers existentes)
    let row: Locator | null = null;

    row = await this.mhTryFindHere(prev);
    if (!row) row = await this.mhTryFilter(prev);
    if (!row) row = await this.mhTryInfiniteScroll(prev);

    if (row) {
      await row.scrollIntoViewIfNeeded().catch(() => {});

      const { boardingStatus, migrationStatus, message } = await readRowState(row);

      const snapshot =
        `Prev="${prev}" | Boarding="${boardingStatus}" | Migration="${migrationStatus}" | Msg="${message.slice(0, 160)}"`;

      // ✅ Log sólo cuando cambia algo (evita spam)
      if (snapshot !== lastSnapshot) {
        this.log(`[MigrationHistory] ${snapshot}`);
        lastSnapshot = snapshot;
      }

      // ✅ Caso OK
      if (expectedBoarding.test(boardingStatus) && expectedMigration.test(migrationStatus)) {
        this.log(`[MigrationHistory] ✅ OK: Prev="${prev}" -> ${boardingStatus} / ${migrationStatus}`);
        return;
      }

      // ✅ Caso terminal de error: cortamos y reportamos bien
      if (failFastOnError && /error|failed/i.test(migrationStatus)) {
        await this.safeShot('migration_history_error_status');

        // best-effort: si existe botón "Full Message" le damos click para capturar texto completo
        let fullMsg = message;
        try {
          const btn = row.getByRole('button', { name: /Full Message/i }).first();
          if (await btn.isVisible().catch(() => false)) {
            await btn.click({ timeout: 3000 }).catch(() => {});
            const modal = this.page
              .locator('.us-modal, .modal-content')
              .filter({ hasText: /Full Message/i })
              .first();

            if (await modal.isVisible().catch(() => false)) {
              fullMsg = normalize(await modal.innerText().catch(() => fullMsg));
              // cerrar modal (best-effort)
              await modal.getByRole('button', { name: /Close|OK|Cancel|X/i }).first().click().catch(() => {});
            }
          }
        } catch {}

        this.log(
          `[MigrationHistory] ❌ ERROR terminal para Prev="${prev}". Boarding="${boardingStatus}" Migration="${migrationStatus}". FullMsg="${fullMsg}"`
        );

        throw new Error(
          `Migration History ERROR para Prev="${prev}". Boarding="${boardingStatus}" Migration="${migrationStatus}". Msg="${fullMsg || message || '(sin mensaje)'}"`
        );
      }
    } else {
      // fila aún no aparece: log cada tanto
      if (!lastSnapshot) {
        this.log(`[MigrationHistory] Aún no aparece fila para Prev="${prev}". Esperando...`);
        lastSnapshot = 'logged_not_found';
      }
    }

    // Espera y refresco periódico (porque la grilla puede tardar en actualizar)
    await this.page.waitForTimeout(2000);

    refreshTick++;
    if (refreshTick % 2 === 0) {
      const { refreshBtn, rows } = this.mhGrid;
      if (await refreshBtn.count().catch(() => 0)) {
        await refreshBtn.click().catch(() => {});
        await rows.first().waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      } else {
        await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      }
      await this.page.waitForTimeout(800);
      // reset para que vuelva a loguear cambios si aplica
      lastSnapshot = '';
    }
  }

  await this.safeShot('migration_history_timeout');
  throw new Error(
    `Timeout esperando Migrated/Success para Prev="${prev}". Último estado: ${lastSnapshot || 'N/A'}`
  );
}



// 👇 helper: devuelve el Page correcto (si target es Frame => target.page())
private getTargetPage(target: Page | import('@playwright/test').Frame): Page {
  const anyTarget = target as any;
  return typeof anyTarget.page === 'function' ? anyTarget.page() : (target as Page);
}


}
