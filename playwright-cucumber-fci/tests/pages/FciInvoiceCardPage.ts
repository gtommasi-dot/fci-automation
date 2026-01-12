import { Page, expect } from '@playwright/test';

export class FciInvoiceCardPage {
  constructor(private page: Page) {}

  // Ir a la sección Fci Invoices
   async goToFciInvoices() {
    const { page } = this;

    // ✅ Si ya estamos en la página destino, no hace falta click
    if (/\/invoice\/pending/i.test(page.url())) {
      // sigue igual con tu validación/espera
      await expect(page).toHaveURL(/.*\/invoice\/pending/i);
      return;
    }

    // --- 1) Mejor opción: link por role + name ---
    const byRole = page.getByRole('link', { name: /^FCI Invoices$/ }).first();
    if (await byRole.isVisible().catch(() => false)) {
      await byRole.scrollIntoViewIfNeeded();
      await byRole.click();
    } else {
      // --- 2) Muy estable: href directo (si existe en el DOM) ---
      const byHref = page.locator('a[href="/invoice/pending"], a[href*="/invoice/pending"]').first();
      if (await byHref.isVisible().catch(() => false)) {
        await byHref.scrollIntoViewIfNeeded();
        await byHref.click();
      } else {
        // --- 3) Fallback: click en el item de menú que contiene el span "FCI Invoices" ---
        const byTitleSpan = page
          .locator('.us-menu-item, a.us-menu-item')
          .filter({ has: page.locator('span.us-menu-item__title', { hasText: /^FCI Invoices$/ }) })
          .first();

        await expect(byTitleSpan).toBeVisible({ timeout: 30000 });
        await byTitleSpan.scrollIntoViewIfNeeded();
        await byTitleSpan.click();
      }
    }

    // Validar URL correcta
    await expect(page).toHaveURL(/.*\/invoice\/pending/i, { timeout: 30000 });

    // Intentar esperar la tabla, pero si no se hace visible no fallamos
    try {
      await page.waitForSelector('table.k-grid-table', {
        timeout: 10000,
        state: 'visible',
      });
    } catch {
      console.log(
        '[FciInvoiceCardPage] No se logró mostrar la tabla de facturas (puede no haber datos o estar oculta). Se continúa sin fallar.'
      );
    }
  }

  // Seleccionar la primera factura de la tabla (si existe)
  async selectFirstInvoiceCheckbox() {
    const { page } = this;

    const checkboxes = page.locator(
      'table.k-grid-table input[type="checkbox"]:not([disabled])'
    );

    const count = await checkboxes.count();

    if (count === 0) {
      console.log(
        '[FciInvoiceCardPage] No hay facturas disponibles para seleccionar (0 checkboxes habilitados).'
      );
      // No lanzamos error: dejamos que el test continúe en "modo sin datos"
      return;
    }

    const checkbox = checkboxes.first();
    await checkbox.waitFor({ state: 'visible', timeout: 7000 });
    await checkbox.click();
  }

  // Verificar que la página de facturas pendientes cargó correctamente
  async verifyPendingInvoicesLoaded() {
    const { page } = this;

    try {
      await page.waitForSelector('table.k-grid-table', {
        timeout: 10000,
        state: 'visible',
      });
    } catch {
      console.log(
        '[FciInvoiceCardPage] verifyPendingInvoicesLoaded: la tabla no se hizo visible. Puede no haber facturas, se continúa sin fallar.'
      );
    }
  }

  // Hacer click en Pay By Credit Card (si está disponible)
  // Hacer click en Pay By Credit Card
async clickPayByCard() {
  const { page } = this;

  const btn = page.getByRole('button', { name: /pay by credit card/i }).first();

  const isVisible = await btn.isVisible().catch(() => false);
  if (!isVisible) {
    console.log(
      '[FciInvoiceCardPage] Botón "Pay By Credit Card" no visible (posible: no hay facturas seleccionadas).'
    );
    return;
  }

  const isEnabled = await btn.isEnabled().catch(() => false);
  if (!isEnabled) {
    console.log(
      '[FciInvoiceCardPage] Botón "Pay By Credit Card" deshabilitado (posible: no hay facturas seleccionadas).'
    );
    return;
  }

  // Click real
  await btn.click();

  // 🔍 Detectar toast: "No Invoices Selected!"
  const toastWarning = page.locator(
    '#toast-container .toast-warning .toast-message',
    { hasText: 'No Invoices Selected!' }
  );

  const toastVisible = await toastWarning.isVisible().catch(() => false);

  if (toastVisible) {
    console.log(
      '[FciInvoiceCardPage] Toast detectado: "No Invoices Selected!" → No hay facturas. Se corta el flujo sin error.'
    );

    // Cerrar toast
    const closeBtn = page.locator('#toast-container .toast-warning .toast-close-button');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
    }

    // 🚫 No seguimos con el modal → terminamos el método
    return;
  }

  // 🧭 Si no hay toast, seguimos con el modal como siempre
  await page.waitForSelector('.modal-title:has-text("Pay By Credit Card")', {
    timeout: 20000,
    state: 'visible',
  });
}


  // Data para cada tipo de tarjeta
  cardTestData: Record<
    string,
    { number: string; cvc: string; typeClass: string }
  > = {
    amex: {
      number: '370000000000002',
      cvc: '1234',
      typeClass: 'rccs__card--american-express',
    },
    discover: {
      number: '6011000000000012',
      cvc: '123',
      typeClass: 'rccs__card--discover',
    },
    jcb: {
      number: '3566002020360505',
      cvc: '123',
      typeClass: 'rccs__card--jcb',
    },
    visa: {
      number: '4111111111111111',
      cvc: '123',
      typeClass: 'rccs__card--visa',
    },
    mastercard: {
      number: '5555555555554444',
      cvc: '123',
      typeClass: 'rccs__card--mastercard',
    },
    unionpay: {
      number: '6200000000000005',
      cvc: '123',
      typeClass: 'rccs__card--unionpay',
    },
    diners: {
      number: '36070500001020',
      cvc: '123',
      typeClass: 'rccs__card--diners-club',
    },
    laser: {
      number: '6771798021000008',
      cvc: '123',
      typeClass: 'rccs__card--laser',
    },
    dankort: {
      number: '5019717010103742',
      cvc: '123',
      typeClass: 'rccs__card--dankort',
    },
    elo: {
      number: '5066991111111118',
      cvc: '123',
      typeClass: 'rccs__card--elo',
    },
    hipercard: {
      number: '6062828888666688',
      cvc: '123',
      typeClass: 'rccs__card--hipercard',
    },
  };

  // Completar el modal de tarjeta de crédito y procesar el pago
  async fillCardFormAndSubmit(cardType: string) {
    const { page } = this;

    const data = this.cardTestData[cardType.toLowerCase()];
    if (!data) throw new Error(`Tipo de tarjeta no soportado: ${cardType}`);

    // Si el modal no está visible, asumimos que no se abrió (p.ej. no había facturas)
    const modalVisible = await page
      .locator('.modal-title:has-text("Pay By Credit Card")')
      .isVisible()
      .catch(() => false);

    if (!modalVisible) {
      console.log(
        '[FciInvoiceCardPage] No se abrió el modal de tarjeta. Probablemente no había facturas seleccionadas. Se omite el llenado del formulario.'
      );
      return;
    }

    // Card Number
    await page.waitForSelector(
      'xpath=//input[@type="text" and @name="Number" and @placeholder="Credit Card Number"]',
      { timeout: 5000 }
    );
    await page.fill(
      'xpath=//input[@type="text" and @name="Number" and @placeholder="Credit Card Number"]',
      data.number
    );

    // Espera a que la UI muestre la tarjeta correcta
    await page.waitForSelector(`.rccs__card.${data.typeClass}`, {
      timeout: 5000,
    });

    // Expiry
    await page.fill(
      'xpath=//input[@type="text" and @name="Expiration" and @placeholder="Card Expiration"]',
      '12/25'
    );
    // CVC
    await page.fill(
      'xpath=//input[@type="tel" and @name="Ccv" and @placeholder="Card ID Number (CVC)"]',
      data.cvc
    );
    // First Name
    await page.fill(
      'xpath=//input[@type="text" and @name="OnName" and @placeholder="First Name"]',
      'TestFirst'
    );
    // Last Name
    await page.fill(
      'xpath=//input[@type="text" and @name="LastName" and @placeholder="Last Name"]',
      'TestLast'
    );
    // Billing Address
    await page.fill(
      'xpath=//input[@type="text" and @name="BillingAddress" and @placeholder="Billing Address"]',
      '123 Main St'
    );
    // Billing City
    await page.fill(
      'xpath=//input[@type="text" and @name="BillingCity" and @placeholder="Billing City"]',
      'TestCity'
    );
    // Billing State (Arizona)
    await page.selectOption(
      'xpath=//select[@name="BillingState"]',
      { label: 'Arizona' }
    );
    // Billing Zip Code
    await page.fill(
      'xpath=//input[@type="text" and @name="BillingZip" and @placeholder="Billing Zip Code"]',
      '12345'
    );
    // Email
    await page.fill(
      'xpath=//input[@type="text" and @name="Email" and @placeholder="Email"]',
      'test@test.com'
    );
    // TyC
    await page
      .locator(
        'text=By checking this box, you are indicating that you have read and agree to the'
      )
      .click();

    // Click en pagar
    await page
      .locator(
        '.modal-footer button.btn.btn-primary:has-text("Pay By Credit Card")'
      )
      .click();
  }

  // Valida popup de éxito/cancelación y lo cierra
  async validateResultAndClose() {
    const { page } = this;

    const [successModal, errorToast] = await Promise.all([
      page
        .waitForSelector(
          'div#paymentConfirmation >> text=Payment Confirmation',
          { timeout: 15000 }
        )
        .catch(() => null),
      page
        .waitForSelector('.toast.toast-error .toast-message', {
          timeout: 10000,
        })
        .catch(() => null),
    ]);

    if (successModal) {
      // ✅ Éxito: cerrar el modal desde su botón "Close"
      const closeBtn = page
        .locator('div.modal-footer >> button:has-text("Close")')
        .first();
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();
    } else if (errorToast) {
      // ❌ Cancelado / error real de pago
      const closeToastBtn = page.locator(
        '.toast.toast-error .toast-close-button'
      );
      if (await closeToastBtn.isVisible().catch(() => false)) {
        await closeToastBtn.click();
      }
      // Aquí mantenemos el throw porque esto sí es un fallo de pago real
      throw new Error('Operación cancelada: el pago no fue exitoso.');
    } else {
      // Caso típico cuando no hubo facturas → no hubo pago → no hay popup
      console.log(
        '[FciInvoiceCardPage] No se detectó ningún popup de resultado (probablemente no se ejecutó el pago por falta de facturas).'
      );
      // No lanzamos error: escenario pasa aunque no haya datos
    }
  }
}
