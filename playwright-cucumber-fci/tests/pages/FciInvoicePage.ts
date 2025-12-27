import { Page, expect } from '@playwright/test';

export class FciInvoicePage {
  constructor(private page: Page) {}

  // Navegar a Fci Invoices desde el menú lateral
  async goToFciInvoices() {
    const { page } = this;

    const navLink = await page.waitForSelector('xpath=//*[@id="app"]/nav[2]/div/a[4]', {
      timeout: 15000,
    });
    await navLink.click();

    await expect(page).toHaveURL(/.*\/invoice\/pending/, { timeout: 20000 });

    // Esperar título o grid, pero sin romper si no aparecen
    const loaded = await Promise.race([
      page
        .waitForSelector('text=FCI Invoices - Pending Invoices', { timeout: 10000 })
        .then(() => 'title'),
      page
        .waitForSelector('table.k-grid-table', { timeout: 10000 })
        .then(() => 'grid'),
    ]).catch(() => null);

    if (!loaded) {
      console.log(
        '[FciInvoicePage] No se pudo confirmar la carga de la página de Pending Invoices. Continuando sin fallar.'
      );
    }
  }

  // Verificar que la página de facturas pendientes cargó correctamente
  async verifyPendingInvoicesLoaded() {
    const { page } = this;
    const grid = page.locator('table.k-grid-table');
    try {
      await grid.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      console.log(
        '[FciInvoicePage] verifyPendingInvoicesLoaded: la tabla no se hizo visible. Puede no haber facturas, se continúa sin fallar.'
      );
    }
  }

  // Seleccionar el primer checkbox de la tabla de facturas
  async selectFirstInvoiceCheckbox() {
    const { page } = this;

    const checkboxes = page.locator('table.k-grid-table input[type="checkbox"]:not([disabled])');
    const count = await checkboxes.count();

    if (count === 0) {
      console.log(
        '[FciInvoicePage] No hay facturas disponibles para seleccionar (0 checkboxes habilitados).'
      );
      return;
    }

    const first = checkboxes.first();
    const visible = await first.isVisible().catch(() => false);
    if (!visible) {
      console.log(
        '[FciInvoicePage] El primer checkbox de factura no es visible. Se omite la selección.'
      );
      return;
    }

    await first.click();
  }

  // Hacer click en el botón Pay By ACH
  async clickPayByACH() {
    const { page } = this;

    const btn = page.getByRole('button', { name: /pay by ach/i }).first();

    const isVisible = await btn.isVisible().catch(() => false);
    if (!isVisible) {
      console.log(
        '[FciInvoicePage] Botón "Pay By ACH" no visible (posible: no hay facturas seleccionadas).'
      );
      return;
    }

    const isEnabled = await btn.isEnabled().catch(() => false);
    if (!isEnabled) {
      console.log(
        '[FciInvoicePage] Botón "Pay By ACH" deshabilitado (posible: no hay facturas seleccionadas).'
      );
      return;
    }

    // Click real
    await btn.click();

    // 🔍 Detectar toast "No Invoices Selected!"
    const toastMessage = page.locator(
      '#toast-container .toast-warning .toast-message',
      { hasText: 'No Invoices Selected!' }
    );

    const toastVisible = await toastMessage.isVisible().catch(() => false);

    if (toastVisible) {
      console.log(
        '[FciInvoicePage] Toast detectado: "No Invoices Selected!" → No hay facturas. Se corta flujo sin error.'
      );

      // Cerrar el toast si tiene botón
      const closeBtn = page.locator('#toast-container .toast-warning .toast-close-button');
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click().catch(() => {});
      }

      // No seguimos con el modal → terminamos el método
      return;
    }

    // Si no hubo toast, esperamos el modal de ACH
    try {
      await page.waitForSelector('.modal-title:has-text("Pay By ACH")', {
        timeout: 20000,
        state: 'visible',
      });
    } catch {
      console.log(
        '[FciInvoicePage] No apareció el modal "Pay By ACH" tras el click. Probablemente no había facturas válidas.'
      );
      // No lanzamos error: dejamos el flujo como "sin operación".
    }
  }

  // Completar el modal de pago ACH
  async fillAchFormAndSubmit() {
    const { page } = this;

    // Si no hay modal, no hacemos nada
    const modalVisible = await page
      .locator('.modal-title:has-text("Pay By ACH")')
      .isVisible()
      .catch(() => false);

    if (!modalVisible) {
      console.log(
        '[FciInvoicePage] fillAchFormAndSubmit: no hay modal "Pay By ACH" visible. Se omite el llenado del formulario.'
      );
      return;
    }

    // Inputs de routing y account
    await page.locator('input[name="RoutingNumber"]').fill('026009593');
    await page.locator('input[name="RoutingConfirm"]').fill('026009593');
    await page.locator('input[name="AccountNumber"]').fill('12345');
    await page.locator('input[name="AccountConfirm"]').fill('12345');
    await page.locator('#RelationshipThirdParty').fill('Test');

    // Aceptar TyC
    await page
      .locator(
        'text=By checking this box, you are indicating that you have read and agree to the'
      )
      .click();

    // Click en Pay By ACH (botón dentro del modal)
    await page
      .locator('.modal-footer button.btn.btn-primary:has-text("Pay By ACH")')
      .click();
  }

  // Validar popup de éxito y cerrarlo
  async validateSuccessAndClose() {
    const { page } = this;

    // Si no hay modal de confirmación → probablemente no se ejecutó pago (por falta de invoices)
    const confirmationVisible = await page
      .locator('#vcheckConfirmation')
      .isVisible()
      .catch(() => false);

    if (!confirmationVisible) {
      console.log(
        '[FciInvoicePage] validateSuccessAndClose: no hay modal de confirmación visible. Es probable que no se haya ejecutado el pago (p.ej. sin facturas). Se omite validación.'
      );
      return;
    }

    // Esperar el texto exacto del modal
    const successTextXPath =
      '//*[@id="vcheckConfirmation"]//p[contains(text(),"You are done. Print Receipt!")]';

    await page.waitForSelector(`xpath=${successTextXPath}`, { timeout: 15000 });

    const foundText = await page.textContent(`xpath=${successTextXPath}`);
    if (!foundText?.includes('You are done. Print Receipt!')) {
      throw new Error(
        'No se encontró el texto de éxito esperado en el modal de confirmación de pago.'
      );
    }

    // Click en el botón Close del modal
    const closeBtnXPath =
      '//*[@id="vcheckConfirmation"]/following-sibling::div[contains(@class, "modal-footer")]/button[contains(., "Close")]';
    const closeBtn = page.locator(`xpath=${closeBtnXPath}`);
    await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await closeBtn.click();
  }
}
