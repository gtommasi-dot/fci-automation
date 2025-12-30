import { expect, Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export class BoardingAiPage {
  constructor(private page: Page, private assetsDir = process.env.ASSETS_DIR ?? 'tests/assets') {}

  async goToBoardingPage() {
    await this.page.goto(process.env.BOARDING_URL as string, { timeout: 30000 });
  }


async verifyStepTitle(expectedTitle: string) {
  // 👇 Espera especial SOLO para Step 2 (post pago con tarjeta)
  if (/^Step\s*2:/i.test(expectedTitle)) {
    // 1) Asegurar que el modal de tarjeta ya se cerró (si todavía está)
    await this.page.locator('.modal-content').first()
      .waitFor({ state: 'hidden', timeout: 120000 })
      .catch(() => { /* si nunca estuvo o ya cerró, seguimos */ });

    // 2) Esperar a que desaparezcan overlays/transiciones comunes
    const overlays = this.page.locator(
      '.us-loading-screen, .k-loading-mask, .modal-backdrop, .us-backdrop'
    );
    // si aparece alguno, esperar a que se oculte; si no, seguir
    const overlayCount = await overlays.count().catch(() => 0);
    if (overlayCount > 0) {
      await overlays.first().waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    }

    // 3) Confirmar que #questionBoarding ya refleja Step 2
    await this.page.waitForFunction(() => {
      const el = document.querySelector('#questionBoarding');
      return !!el && /Step\s*2:/i.test(el.textContent || '');
    }, { timeout: 30000 }).catch(() => {});
  }

  // === lógica original ===
  await this.page.waitForLoadState('domcontentloaded');

  // 1) Layout “legacy”: dentro de #questionBoarding
  const container = this.page.locator('#questionBoarding');
  if (await container.count()) {
    await expect(container).toBeVisible({ timeout: 30000 });
    const legacyTitle = container.getByText(expectedTitle, { exact: true });
    await expect(legacyTitle).toBeVisible({ timeout: 30000 });
    return;
  }

  // 2) Nuevo layout: .us-card-title.fw-bold
  const newLayoutTitle = this.page
    .locator('.us-card-title.fw-bold')
    .filter({ hasText: expectedTitle });
  if (await newLayoutTitle.count()) {
    await expect(newLayoutTitle.first()).toBeVisible({ timeout: 30000 });
    return;
  }

  // 3) Fallback global
  const globalTitle = this.page.getByText(expectedTitle, { exact: true });
  if (await globalTitle.count()) {
    await expect(globalTitle.first()).toBeVisible({ timeout: 30000 });
    return;
  }

  await this.page.screenshot({ path: 'debug-missing-title.png', fullPage: true });
  throw new Error(
    `No pude encontrar el título "${expectedTitle}". Se guardó un screenshot: debug-missing-title.png`
  );
}


// 3. Ingresar el número de cuenta y verificar ícono verde + Next
async fillAccountAndSearch(account: string) {
  // Ingresar cuenta
  const input = this.page.locator('#questionBoarding').getByRole('textbox');
  await input.fill(account);

  // Click en Buscar
  await this.page.locator('#btnSearchLender').click();
}



async waitForValidationIcon() {
  const checkIcon = this.page.locator('svg[color="green"][viewBox="0 0 512 512"][width="24"][height="24"]');
  await expect(checkIcon).toBeVisible({ timeout: 30000 });
}


async clickNext() {
  const nextButton = this.page.locator('button:has-text("Next")');
  await expect(nextButton).toBeEnabled({ timeout: 30000 });
  await nextButton.click();
}



async verifyTextsPresent(texts: string[]) {
  for (const text of texts) {
    const locator = this.page.locator('#questionBoarding').getByText(text, { exact: true });
    await expect(locator).toBeVisible({ timeout: 30000 });
  }
}


async verifyBoardingTrackerCode() {
  const label = this.page.locator('label.text-primary.text-end');
  await expect(label).toBeVisible({ timeout: 30000 });

  const text = await label.textContent();
  const match = text?.match(/Boarding Tracker Code:\s*(.+)/);

  if (match) {
    const code = match[1].trim();
    console.log('✅ Boarding Tracker Code:', code);
  } else {
    console.warn('⚠️ No se encontró el código de seguimiento.');
  }
}



  async verifyDocumentUploadBlock() {
    const block = this.page.locator('h4:has-text("Documents we are looking for:")');
    await expect(block).toBeVisible({ timeout: 90000 });
  }
 

  
  // * Sube documentos desde la carpeta de assets del repo.
  // * Ejemplo:
  // *   await uploadDocuments(['HUD-1.pdf', 'Note.pdf'])        // usa tests/assets/boarding
 //  *   await uploadDocuments(['otro.pdf'], 'oce')               // usa tests/assets/oce
//   *   await uploadDocuments(['/abs/path/a/archivo.pdf'])       // acepta ruta absoluta si existe
   
  async uploadDocuments(files: string[], subfolder: string = 'boarding') {
    const fileInput = this.page.locator('input[type="file"]');

    // Resolver cada archivo a una ruta existente
    const resolvedFiles = files.map((f) => {
      // 1) Si ya es absoluta y existe, la uso tal cual
      if (path.isAbsolute(f) && fs.existsSync(f)) return f;

      // 2) Intento en <ASSETS_DIR>/<subfolder>/<f>
      const candidateA = path.resolve(this.assetsDir, subfolder, f);
      if (fs.existsSync(candidateA)) return candidateA;

      // 3) Intento con cwd por si los runners cambian el working dir
      const candidateB = path.resolve(process.cwd(), this.assetsDir, subfolder, f);
      if (fs.existsSync(candidateB)) return candidateB;

      // 4) Falla con mensaje claro
      throw new Error(
        `No se encontró el archivo "${f}". Probé: ` +
        `\n - ${candidateA}\n - ${candidateB}\n` +
        `Sugerencia: coloca los PDFs en ${this.assetsDir}/${subfolder} o pasa una ruta absoluta válida.`
      );
    });

    await fileInput.setInputFiles(resolvedFiles);
  }

  async verifyDocumentsUploaded(expectedCount: number) {
    const uploaded = this.page.locator('.k-upload-files >> text=Successfully uploaded.');
    await expect(uploaded).toHaveCount(expectedCount, { timeout: 90000 });
  }

  // ======================
// STEP 4 - Document Categories
// ======================

// Mapa esperado (por “keyword” dentro del filename)
private expectedDocCategories(): Array<{ key: RegExp; category: string }> {
  return [
    { key: /HUD-1/i,     category: 'Copy HUD' },
    { key: /Mortgage/i,  category: 'Deed of Trust or Mortgage' },
    { key: /Note/i,      category: 'Promissory Note' },
  ];
}

private uploadListItems() {
  return this.page.locator('.k-upload-files > li.k-file[role="listitem"]');
}

private docItemByFilenameRegex(fileRegex: RegExp) {
  // encuentra el <li> que contiene el nombre del archivo (div.my-0)
  return this.uploadListItems()
    .filter({ has: this.page.locator('div.my-0', { hasText: fileRegex }) })
    .first();
}

private categoryButtonInDocItem(docItem: Locator) {
  // Botón que muestra "Category: xxx"
  return docItem.locator('button:has-text("Category:")').first();
}

private async readDocCategory(docItem: Locator): Promise<string> {
  const btn = this.categoryButtonInDocItem(docItem);
  const raw = (await btn.innerText().catch(() => '')) || '';
  // ejemplo: "Category: Other documents"
  const m = raw.match(/Category:\s*(.+)\s*$/i);
  return (m?.[1] ?? '').trim();
}

private categoryModal() {
  // Modal "Document Categoty" (ojo al typo que trae la UI)
  return this.page.locator('.us-modal', {
    has: this.page.locator('.us-modal-header__title', { hasText: /Document\s+Categoty/i })
  }).first();
}

private async selectCategoryInModal(category: string) {
  const modal = this.categoryModal();
  await expect(modal).toBeVisible({ timeout: 30000 });

  // Radio por nombre (usa aria-label del label)
  const radio = modal.getByRole('radio', { name: new RegExp(`^${this.escapeRegex(category)}$`, 'i') }).first();

  // Si no está visible por scroll, lo traemos
  await radio.scrollIntoViewIfNeeded().catch(() => {});
  await expect(radio).toBeVisible({ timeout: 15000 });

  // Marcar
  try {
    await radio.check({ force: true, timeout: 10000 });
  } catch {
    // fallback: click al label
    await modal.locator('label.k-radio-label', { hasText: new RegExp(`^${this.escapeRegex(category)}$`, 'i') })
      .first()
      .click({ force: true });
  }

  // Save
  const saveBtn = modal.getByRole('button', { name: /^Save$/i }).first();
  await expect(saveBtn).toBeEnabled({ timeout: 15000 });
  await saveBtn.click();

  await expect(modal).toBeHidden({ timeout: 30000 });
}

private escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Verifica y corrige categorías de los 3 documentos subidos.
 * - Si el documento ya está correcto: log y sigue.
 * - Si está mal: abre modal, selecciona la categoría correcta, Save, y re-verifica.
 */
async ensureUploadedDocsAreCorrectlyCategorized() {
  const expectations = this.expectedDocCategories();

  for (const exp of expectations) {
    const item = this.docItemByFilenameRegex(exp.key);
    await expect(item).toBeVisible({ timeout: 60000 });

    const current = await this.readDocCategory(item);
    if (new RegExp(`^${this.escapeRegex(exp.category)}$`, 'i').test(current)) {
      console.log(`✅ Category OK para ${exp.key}: "${current}"`);
      continue;
    }

    console.warn(`⚠️ Category incorrecta para ${exp.key}. Actual="${current}" Esperada="${exp.category}". Corrigiendo...`);

    const btn = this.categoryButtonInDocItem(item);
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ force: true });

    await this.selectCategoryInModal(exp.category);

    // Revalidar que en la lista quedó bien
    const btnAfter = this.categoryButtonInDocItem(item);
    await expect(btnAfter).toContainText(new RegExp(`Category:\\s*${this.escapeRegex(exp.category)}`, 'i'), { timeout: 30000 });

    console.log(`✅ Category corregida: ${exp.key} -> "${exp.category}"`);
  }
}

/**
 * (Opcional pero recomendado) Si aparece el toast de categorías, lo loguea y saca screenshot.
 */
async logToastIfCategoryErrorAppears() {
  const toast = this.page.locator('#toast-container .toast.toast-error .toast-message').first();
  const visible = await toast.isVisible().catch(() => false);
  if (!visible) return;

  const msg = (await toast.innerText().catch(() => '')).trim();
  console.warn(`🧾 Toast error detectado: ${msg}`);

  await this.page.screenshot({ path: `debug-toast-category-${Date.now()}.png`, fullPage: true });
}


async verifyRadioOptions(options: string[]) {
  for (const option of options) {
    const radioOption = this.page.locator('#questionBoarding div >> text=' + option);
    await expect(radioOption).toBeVisible({ timeout: 90000 });
  }
}




async fillBorrowerFields() {
  const nameInput = this.page.locator('input[name="ContactName"]');
  const emailInput = this.page.locator('input[name="Email"]');
  const tinInput = this.page.locator('input[name="Tin"]');

  // Esperar hasta que los campos estén visibles y habilitados
  await expect(nameInput).toBeVisible({ timeout: 120000 });
  await expect(nameInput).toBeEnabled({ timeout: 120000 });

  await expect(emailInput).toBeVisible({ timeout: 120000 });
  await expect(emailInput).toBeEnabled({ timeout: 120000 });

  await expect(tinInput).toBeVisible({ timeout: 120000 });
  await expect(tinInput).toBeEnabled({ timeout: 120000 });

  // Rellenar los campos
  await nameInput.fill('Juan Pérez');
  await emailInput.fill('juan@example.com');
  await tinInput.fill('12-3456789');
}



async verifyBlocksPresent(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(`xpath=${selector}`);
      await expect(element).toBeVisible({ timeout: 30000 });
    }
  }


async fillFundingAndFirstPaymentDates() {
  // Helper genérico que rellena un campo datepicker por name
  const fillDateByName = async (name: string, value: string) => {
    const input = this.page.locator(`input[name="${name}"][role="combobox"]`).first();
    await expect(input).toBeVisible({ timeout: 20000 });
    await expect(input).toBeEnabled({ timeout: 20000 });

    await input.click({ clickCount: 3 });
    await input.fill('');
    await input.type(value);
    await this.page.keyboard.press('Tab');
  };

  console.log('🕓 Completando Funding Date y First Payment Date...');

  await fillDateByName('FundingDate', '03/01/2026');
  await fillDateByName('FirstPaymentDate', '03/01/2026');

  console.log('✅ Fechas completadas correctamente.');
}



async selectEitherInAuthorizationsApprovals() {
  // 1️⃣ Esperar a que aparezca el bloque AUTHORIZATIONS & APPROVALS
  const blockTitle = this.page.getByText(/AUTHORIZATIONS\s*&\s*APPROVALS/i);
  await expect(blockTitle).toBeVisible({ timeout: 60000 });

  // 2️⃣ Asegurar scroll al bloque principal (contenedor con borde)
  const blockContainer = blockTitle.locator('xpath=ancestor::div[contains(@class,"border")]').first();
  await blockContainer.scrollIntoViewIfNeeded();
  await this.page.waitForTimeout(500);

  console.log('El bloque AUTHORIZATIONS & APPROVALS está visible, seleccionando "Either" en todos los campos...');

  // 3️⃣ Localizar todos los radios "either"
  const eitherRadios = this.page.locator('label.us-radio:has-text("either") input[type="radio"][value="3"]');
  const count = await eitherRadios.count();

  if (count === 0) {
    throw new Error('❌ No se encontraron radios "either" en AUTHORIZATIONS & APPROVALS.');
  }

  // 4️⃣ Iterar y seleccionar cada radio
  for (let i = 0; i < count; i++) {
    const radio = eitherRadios.nth(i);

    try {
      await radio.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(200);
      await radio.check({ force: true, timeout: 5000 });
    } catch (e) {
      console.warn(`⚠️ Fallback click manual para radio #${i + 1}`);
      const box = await radio.boundingBox();

      if (box) {
        // Click por coordenadas absolutas si el scroll no bastó
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        // Fallback final: click via JS (compatible con HTMLElement o SVGElement)
        const handle = await radio.elementHandle();
        if (handle) {
          await this.page.evaluate((el: Element) => {
            if (el instanceof HTMLElement) el.click();
            else if (el instanceof SVGElement)
              el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }, handle);
        }
      }
    }

    await this.page.waitForTimeout(250); // pequeño delay entre clics
  }

  // 5️⃣ Validar que todos fueron marcados
  await expect(this.page.locator('input[type="radio"][value="3"]:checked')).toHaveCount(count, { timeout: 5000 });

  console.log(`✅ Seleccionadas ${count} opciones "either" correctamente.`);
}





// --- FIRMA Y GUARDADO (escopado al bloque correcto) ---
// Helper: clickea el primer botón final disponible (Save... o Send to Boarding)
private async clickFinalActionButton(timeoutMs = 30000) {
  const start = Date.now();

  // candidatos (usa regex para tolerar variaciones mínimas)
  const saveBtn = this.page.getByRole('button', { name: /save\s*data.*generate\s*lsa/i }).first();
  const sendBtn = this.page.getByRole('button', { name: /send\s*to\s*boarding/i }).first();

  while (Date.now() - start < timeoutMs) {
    // intentamos con Save...
    if (await saveBtn.isVisible().catch(() => false)) {
      if (await saveBtn.isEnabled().catch(() => false)) {
        await saveBtn.scrollIntoViewIfNeeded();
        await saveBtn.click();
        console.log('✅ Click final: Save data & next to generate LSA');
        return;
      }
    }
    // intentamos con Send to Boarding
    if (await sendBtn.isVisible().catch(() => false)) {
      if (await sendBtn.isEnabled().catch(() => false)) {
        await sendBtn.scrollIntoViewIfNeeded();
        await sendBtn.click();
        console.log('✅ Click final: Send to Boarding');
        return;
      }
    }

    // pequeño backoff y reintento (por render/validaciones)
    await this.page.waitForTimeout(250);
  }

  // Si llegamos aquí, damos contexto de por qué falló
  const saveVisible = await saveBtn.isVisible().catch(() => false);
  const saveEnabled = saveVisible ? await saveBtn.isEnabled().catch(() => false) : false;
  const sendVisible = await sendBtn.isVisible().catch(() => false);
  const sendEnabled = sendVisible ? await sendBtn.isEnabled().catch(() => false) : false;

  throw new Error(
    `No encontré botón final habilitado en ${timeoutMs}ms. ` +
    `Save{visible=${saveVisible},enabled=${saveEnabled}} | ` +
    `Send{visible=${sendVisible},enabled=${sendEnabled}}`
  );
}

async signAndSave() {
  // 1) Bloque que contiene la leyenda "Lender Authorized Signatory Signature"
  const signBlock = this.page
    .locator('div.col-sm-12.col-lg-5')
    .filter({ hasText: /Lender\s+Authorized\s+Signatory\s+Signature/i })
    .first();

  await expect(signBlock).toBeVisible({ timeout: 30000 });

  // 2) Botón habilitado dentro del bloque
  const signatureButton = signBlock
    .locator('button[title="Add signature"]:not([disabled])')
    .first();

  await expect(signatureButton).toBeVisible({ timeout: 30000 });
  await expect(signatureButton).toBeEnabled({ timeout: 30000 });
  await signatureButton.scrollIntoViewIfNeeded();
  await signatureButton.click();

  // 3) Modal "Signature"
  const modal = this.page
    .locator('.us-modal')
    .filter({ has: this.page.locator('.us-modal-header__title', { hasText: /^Signature$/ }) })
    .first();

  await expect(modal).toBeVisible({ timeout: 30000 });
  await this.page.waitForTimeout(200);

  // Garantiza que esté el tab "Text" seleccionado (por si acaso)
  const textTab = modal.getByRole('button', { name: /^Text$/ });
  if (await textTab.isVisible()) await textTab.click();

  // 4) Completar la firma
  const signatureInput = modal.locator('input[placeholder="Write your signature here."]');
  await expect(signatureInput).toBeVisible({ timeout: 30000 });
  await signatureInput.fill(`Signature_${Date.now()}`);

  // 5) Guardar y esperar que cierre
  const saveButton = modal.getByRole('button', { name: /^Save$/ });
  await expect(saveButton).toBeEnabled({ timeout: 30000 });
  await saveButton.click();

  await Promise.race([
    expect(modal).toBeHidden({ timeout: 30000 }),
    modal.waitFor({ state: 'detached', timeout: 30000 }),
  ]);

  // 6) Botón final (Save data & next to generate LSA **o** Send to Boarding)
  await this.clickFinalActionButton(30000);

  console.log('✅ Firma y guardado completados exitosamente.');
}


// ====== STEP 13: Generar LSA, editar datos, firmar y enviar ======

/** Espera la generación del LSA y abre el modal "Edit information". */
async openEditInfoAfterLsaGeneration() {
  // 1) Espera que aparezca el acordeón del LSA o el label de carga
  const lsaHeader = this.page.locator('.us-accordion-header__title', { hasText: 'LOAN SERVICING AGREEMENT' });
  const loadingLabel = this.page.locator('.us-loading-screen__label', { hasText: 'Generating LSA Documents' });

  // Puede que uno aparezca antes que el otro; no fallamos si alguno no aparece
  await Promise.race([
    lsaHeader.waitFor({ state: 'visible', timeout: 60_000 }),
    loadingLabel.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {})
  ]).catch(() => { /* seguimos igualmente; a veces ya está listo */ });

  // 2) Esperar hasta 3 minutos a que desaparezca el estado de carga
  await loadingLabel.waitFor({ state: 'hidden', timeout: 180_000 }).catch(() => { /* si nunca se mostró, ok */ });

  // 3) Cuando esté listo debe aparecer el botón "Edit info"
  const editInfoBtn = this.page.getByRole('button', { name: 'Edit info', exact: false });
  await expect(editInfoBtn).toBeVisible({ timeout: 180_000 });
  await expect(editInfoBtn).toBeEnabled();
  await editInfoBtn.click();
}

// --- LSA: completar "Client Name" y aceptar ---
async fillEditInformationAndAccept() {
  // 1) Modal "Edit info"/"Edit information"
  const modal = this.page
    .locator('.us-modal')
    .filter({ has: this.page.locator('.us-modal-header__title', { hasText: /Edit\s+(info|information)/i }) })
    .first();

  await expect(modal).toBeVisible({ timeout: 30000 });

  // 2) Asegurar que "Personal information" esté visible/abierta
  const personalHeader = modal.locator('.us-accordion-header__title', { hasText: /Personal\s+information/i }).first();
  if (await personalHeader.count()) {
    // Si no se ve el contenido, abre el acordeón
    const accordionItem = personalHeader.locator('xpath=ancestor::div[contains(@class,"us-accordion-item")]').first();
    const contentOpen = accordionItem.locator('.us-collapse.us-collapse--is-open');
    if (!(await contentOpen.isVisible())) {
      await personalHeader.click();
      await this.page.waitForTimeout(300); // pequeño settle
    }
  }

  // 3) Card "Client Name" -> input[name="Data"]
  const clientNameCardTitle = modal.locator('.us-card-title', { hasText: /^Client\s+Name$/i }).first();
  await expect(clientNameCardTitle).toBeVisible({ timeout: 15000 });

  const clientNameInput = clientNameCardTitle
    .locator('xpath=ancestor::div[contains(@class,"us-card")]//input[contains(@class,"us-input__field") and @name="Data"]')
    .first();

  await expect(clientNameInput).toBeVisible({ timeout: 15000 });
  await clientNameInput.fill(`Signer_${Date.now()}`);

  // 4) Aceptar
  const acceptBtn = modal.getByRole('button', { name: /^Accept$/i });
  await expect(acceptBtn).toBeEnabled({ timeout: 10000 });
  await acceptBtn.click();

  await expect(modal).toBeHidden({ timeout: 30000 });
}


// Esperar a que termine el WIP y aparezca el botón "Edit info"
async waitLsaProcessingAndOpenEditInfo() {
  // modal en proceso (opcional, si querés verificar)
  const wip = this.page.locator('.us-loading-screen:has(.us-loading-screen__label:text("Generating LSA"))');
  await wip.waitFor({ state: 'visible', timeout: 120000 }).catch(() => {});
  await wip.waitFor({ state: 'hidden', timeout: 240000 }).catch(() => {}); // 90-180s

  const editInfoBtn = this.page.getByRole('button', { name: /Edit\s+info/i }).first();
  await expect(editInfoBtn).toBeVisible({ timeout: 60000 });
  await editInfoBtn.click();
}

// Helper: click robusto sobre un placeholder (icono interno > surface)
private async clickPlaceholder(surface: import('@playwright/test').Locator) {
  const icon = surface.locator('.us-icon, svg').first();
  const target = (await icon.isVisible().catch(() => false)) ? icon : surface;

  try { await target.scrollIntoViewIfNeeded(); } catch { /* no-op */ }

  try {
    await target.click({ timeout: 1500 });
  } catch {
    try {
      await target.click({ timeout: 2000, force: true });
    } catch {
      // Fallback 1: click por coordenadas
      const box = await target.boundingBox().catch(() => null);
      if (box) {
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        // Fallback 2: click vía JS
        const handle = await target.elementHandle().catch(() => null);
        if (handle) await this.page.evaluate((el: SVGElement | HTMLElement) => (el as HTMLElement).click(), handle);
      }
    }
  }

  await this.page.waitForTimeout(150); // settle de animaciones/re-render
}

// Firma todos los placeholders visibles (dinámico) y envía
async signDocPlaceholdersAndSubmit(maxTotalClicks = 16) {
  // Si tu visor está en iframe, cambia this.page por:
  // const root = this.page.frameLocator('iframe'); y usa root.locator(...) abajo.
  const root = this.page;

  const placeholders = root.locator('.us-docsign-element.us-docsign-surface:visible');
  const submit = root.getByRole('button', { name: /Submit approval/i }).first();

  // Espera a que aparezca al menos el botón o algún placeholder
  await Promise.race([
    submit.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
    placeholders.first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
  ]);

  let clicks = 0;
  while (clicks < maxTotalClicks) {
    // Si el botón ya está visible y habilitado, salimos a submit
    const submitVisible = await submit.isVisible().catch(() => false);
    const submitEnabled = submitVisible ? await submit.isEnabled().catch(() => false) : false;
    if (submitVisible && submitEnabled) break;

    // ¿Hay placeholders visibles?
    let count = await placeholders.count();
    if (count === 0) {
      // Empuja el scroll por si el visor virtualiza campos fuera de viewport
      await this.page.mouse.wheel(0, 500);
      await this.page.waitForTimeout(200);
      count = await placeholders.count();
      if (count === 0) break; // no hay más
    }

    // Click al primero visible (se recalcula cada iteración)
    const first = placeholders.first();
    await this.clickPlaceholder(first);
    clicks++;
  }

  // Submit final (espera fuerte a que se habilite)
  await expect(submit).toBeVisible({ timeout: 30000 });
  await expect(submit).toBeEnabled({ timeout: 30000 });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();
}


/** Verifica el modal de éxito y vuelve a MyFci. */
async verifySuccessAndGoToMyFci() {
  const successModal = this.page
    .locator('.us-modal')
    .filter({ has: this.page.locator('.us-modal-header__title', { hasText: /Sucessfully|Successfully/i }) })
    .first();

  await expect(successModal).toBeVisible({ timeout: 180000 });

  const goBtn = successModal.getByRole('button', { name: /Go to MyFci/i });
  await expect(goBtn).toBeVisible({ timeout: 30000 });
  await goBtn.click();

  await expect(this.page).toHaveURL(/test\.myfci\.com\/?$/i, { timeout: 30000 });
}

//------- Metodos para Pago de Tarjeta -------
//--------
//-----------

// --- Tarjetas de prueba (agregar dentro de la clase BoardingAiPage) ---
cardTestData: Record<string, { number: string; cvc: string; typeClass: string }> = {
  amex:       { number: '370000000000002', cvc: '1234', typeClass: 'rccs__card--american-express' },
  discover:   { number: '6011000000000012', cvc: '123', typeClass: 'rccs__card--discover' },
  jcb:        { number: '3566002020360505', cvc: '123', typeClass: 'rccs__card--jcb' },
  visa:       { number: '4111111111111111', cvc: '123', typeClass: 'rccs__card--visa' },
  mastercard: { number: '5555555555554444', cvc: '123', typeClass: 'rccs__card--mastercard' },
  unionpay:   { number: '6243030000000001', cvc: '123', typeClass: 'rccs__card--unionpay' },
};

// --- Helpers (agregar dentro de la clase BoardingAiPage) ---
private randomWord(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

private randomEmail() {
  return `qa.${Date.now()}@example.com`;
}

private async typeKendoComboByPlaceholder(base: Locator, placeholder: string, text: string) {
  const combo = base.locator(`input.k-input-inner[placeholder="${placeholder}"]`).first();
  await expect(combo).toBeVisible({ timeout: 30000 });
  await combo.click();
  await combo.fill('');
  await combo.type(text);
  await this.page.keyboard.press('Enter');
}

private async waitVisibleEnabled(locator: Locator, timeout = 30000) {
  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toBeEnabled({ timeout });
}

// --- Selecciona el radio "If no..." y espera que el formulario esté listo ---
async selectNoLenderAndWaitForm() {
  // Bloque del step con el radiogroup
  const card = this.page.locator('#questionBoarding').first();
  await expect(card).toBeVisible({ timeout: 30000 });

  // Li que contiene el texto "If no, kindly complete..."
  const noLi = card.locator('.k-radio-list-item', { hasText: 'If no, kindly complete the form below' }).first();

  // Marca el radio (input.k-radio)
  const radio = noLi.locator('input.k-radio').first();
  // A veces el click sobre el input falla por overlays; probamos label/LI también
  try {
    await radio.check({ timeout: 10000 });
  } catch {
    await noLi.click({ timeout: 10000 });
  }

  // Espera a que el radio quede seleccionado (.k-checked) y que aparezcan los campos
  await expect(noLi.locator('input.k-radio')).toBeChecked({ timeout: 10000 });

  // Campos básicos que deben habilitarse
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="Company"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="FirstName"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="LastName"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="Street"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="City"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="ZipCode"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="Tin"]'));
  await this.waitVisibleEnabled(noLi.locator('input.us-input__field[name="Email"]'));
  // Banco / ACH
  await this.waitVisibleEnabled(card.locator('input.us-input__field[name="ACHReceivingDFI"]'));   // Routing
  await this.waitVisibleEnabled(card.locator('input.us-input__field[name="ACHAccountNumber"]')); // Account
}
// --- Completa el formulario "If no..." con datos aleatorios válidos ---
async fillNewLenderBasicInfo() {
  const card = this.page.locator('#questionBoarding').first();
  const noLi = card.locator('.k-radio-list-item', { hasText: 'If no, kindly complete the form below' }).first();

  // Inputs básicos
  await noLi.locator('input.us-input__field[name="Company"]').fill(`Company ${this.randomWord(6)}`);
  await noLi.locator('input.us-input__field[name="FirstName"]').fill(`Name${this.randomWord(4)}`);
  await noLi.locator('input.us-input__field[name="LastName"]').fill(`Last${this.randomWord(4)}`);
  await noLi.locator('input.us-input__field[name="Street"]').fill(`${Math.floor(Math.random() * 9999)} Main St`);
  await noLi.locator('input.us-input__field[name="City"]').fill('Anchorage');

  // State (Kendo Combo) -> Alaska
  await this.typeKendoComboByPlaceholder(noLi, 'Select State...', 'Alaska');

  // Zip (5 dígitos)
  await noLi.locator('input.us-input__field[name="ZipCode"]').fill(String(10000 + Math.floor(Math.random() * 89999)));

  // SS/tax (xx-xxxxxxx)
  await noLi.locator('input.us-input__field[name="Tin"]').fill('12-3456789');

  // Email
  await noLi.locator('input.us-input__field[name="Email"]').fill(this.randomEmail());

  // === Name of Primary Bank (FILA ESPECÍFICA) ===
  // Usamos el helper para anclar el input al label y no traer 29 inputs.
  await this.fillRowInputByLabel('Name of Primary Bank:', `Bank ${this.randomWord(5)}`);


  // Routing & Account (valores provistos)
  await card.locator('input.us-input__field[name="ACHReceivingDFI"]').fill('32165498732154365');
  await card.locator('input.us-input__field[name="ACHAccountNumber"]').fill('22233445566778899');
}

// --- Espera a que cargue completamente el modal "Pay By Credit Card" ---
async waitForPayByCardModal() {
  // Título del modal
  const title = this.page.locator('.modal-content .modal-title', { hasText: 'Pay By Credit Card' }).first();
  await expect(title).toBeVisible({ timeout: 120000 });

  // Campos clave del modal listos
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="ccNumber"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="expiration"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="ccv"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="ccOnName"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="ccLastName"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="billingAddress"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="billingCity"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="billingZip"]'));
  await this.waitVisibleEnabled(this.page.locator('input.us-input__field[name="email"]'));
}
// --- Completa el modal de tarjeta y hace el pago ---
async fillCardFormAndPay(cardType: string = 'visa') {
  const data = this.cardTestData[cardType.toLowerCase()];
  if (!data) throw new Error(`Tipo de tarjeta no soportado: ${cardType}`);

  // Número de tarjeta
  await this.page.locator('input.us-input__field[name="ccNumber"]').fill(data.number);

  // Espera que la UI reconozca tipo (tarjeta visual)
  await this.page.locator(`.rccs__card.${data.typeClass}`).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  // Expiración, CVC
  await this.page.locator('input.us-input__field[name="expiration"]').fill('12/27');
  await this.page.locator('input.us-input__field[name="ccv"]').fill(data.cvc);

  // Nombre en tarjeta
  await this.page.locator('input.us-input__field[name="ccOnName"]').fill('TestFirst');
  await this.page.locator('input.us-input__field[name="ccLastName"]').fill('TestLast');

  // Dirección de facturación
  await this.page.locator('input.us-input__field[name="billingAddress"]').fill('123 Main St');
  await this.page.locator('input.us-input__field[name="billingCity"]').fill('Phoenix');

  // Estado (Kendo Combo del modal) – elegimos Arizona
  const modal = this.page.locator('.modal-content').first();
  await this.typeKendoComboByPlaceholder(modal, 'Select State...', 'Arizona');

  // Zip y Email
  await this.page.locator('input.us-input__field[name="billingZip"]').fill('85001');
  await this.page.locator('input.us-input__field[name="email"]').fill(this.randomEmail());

  // Términos
  const tyc = this.page.locator('input#AcceptTerms[name="AcceptTerms"]');
  await tyc.check();

  // Botón "Pay By Credit Card"
  const payBtn = this.page.locator('.modal-footer .us-button:has-text("Pay By Credit Card")').first();
  await expect(payBtn).toBeEnabled({ timeout: 30000 });
  await payBtn.click();

  // Procesamiento ~90s (dejamos un margen)
  await this.page.waitForTimeout(95_000);

  // Opcional: esperar que el modal desaparezca si así ocurre
  await modal.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
}

// Dentro de BoardingAiPage
/**
 * Busca un input a partir del texto de su label (independientemente del contenedor)
 * y completa el valor indicado.
 */
async fillRowInputByLabel(labelText: string, value: string) {
  console.log(`📝 Buscando input para el label: "${labelText}"`);

  // Buscar el label con el texto dado dentro del formulario principal
  const labelLocator = this.page.locator(
    `#questionBoarding label:has-text("${labelText}")`
  );

  // Esperar a que el label exista y sea visible
  await expect(labelLocator).toBeVisible({ timeout: 30000 });

  // Ubicar el input asociado al label dentro del mismo contenedor padre
  const inputLocator = labelLocator.locator('xpath=ancestor::div[contains(@class,"d-flex")][1]//input[contains(@class,"us-input__field")]');

  await expect(inputLocator).toBeVisible({ timeout: 30000 });
  await expect(inputLocator).toBeEnabled();

  await inputLocator.scrollIntoViewIfNeeded();
  await inputLocator.click({ clickCount: 3 });
  await inputLocator.fill(value);
  await this.page.waitForTimeout(300);

  console.log(`✅ Input "${labelText}" completado con valor "${value}"`);
}


// ==== STEP 10 helpers ====

// Input del Appraiser Market Value dentro del card actual
private appraiserMarketValueInput() {
  // En este proyecto todos los pasos muestran su contenido dentro de #questionBoarding
  return this.page.locator('#questionBoarding input[name="AppraiserMarketValue"]').first();
}

// Sanitiza un string con formato monetario a número (e.g., "$576,375.00" -> 576375)
private parseCurrencyToNumber(raw: string | null | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.-]/g, ''); // quita $, comas, espacios
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Asegura que Appraiser Market Value sea > 0:
 * - Si el valor es 0 o vacío, escribe un aleatorio y blurea para que Kendo formatee.
 * - Por defecto usa un rango [100000, 999999] (realista para mercado)
 */
async ensureAppraiserMarketValueNonZero(min = 100000, max = 999999) {
  // Garantiza que estamos en Step 10
  await expect(
    this.page.getByText('Step 10: Property Details', { exact: false })
  ).toBeVisible({ timeout: 20000 });

  const input = this.appraiserMarketValueInput();
  await expect(input).toBeVisible({ timeout: 20000 });
  await input.scrollIntoViewIfNeeded();

  // Lee el valor actual
  const currentRaw = await input.inputValue();
  let current = this.parseCurrencyToNumber(currentRaw);

  if (current > 0) {
    // Ya tiene valor > 0, nada que hacer
    return;
  }

  // Genera aleatorio y lo escribe (deja que Kendo formatee)
  const randomValue = Math.floor(min + Math.random() * (max - min));
  await input.click({ force: true });
  await this.page.keyboard.press('Control+A');
  await this.page.keyboard.type(String(randomValue));
  await this.page.keyboard.press('Tab'); // blur para aplicar formato

  // Relee y valida
  const afterRaw = await input.inputValue();
  const after = this.parseCurrencyToNumber(afterRaw);

  // Si por algún motivo quedó en 0, intenta un nudge con ArrowUp (Kendo numeric)
  if (after <= 0) {
    await input.click();
    await this.page.keyboard.press('ArrowUp');
    const retryRaw = await input.inputValue();
    const retry = this.parseCurrencyToNumber(retryRaw);
    await expect(retry).toBeGreaterThan(0);
  }
}


// ------- Caso Georgia: Sign & Submit (firma) -------
// --- STEP 10: Property Details ---
  stateCombobox(): Locator {
    // Evitamos depender de IDs como :ru: y usamos el placeholder estable
    return this.page.locator('input[placeholder="Select State..."][role="combobox"]');
  }

  stateListbox(): Locator {
    // Kendo crea una listbox con role=listbox. No usamos IDs dinámicos.
    return this.page.locator('[role="listbox"]');
  }

  stateOption(text: string): Locator {
    // Opción exacta en la lista
    return this.page.locator('[role="listbox"] >> text=' + text);
  }

  async selectStateInStep10(state: string) {
    // Aseguramos visibilidad del combo
    await expect(this.stateCombobox()).toBeVisible({ timeout: 20000 });

    // Estrategia “type + Enter” (más estable con Kendo)
    await this.stateCombobox().click({ timeout: 20000 });
    await this.stateCombobox().fill(''); // limpiar por si hay valor previo
    await this.stateCombobox().type(state, { delay: 50 });

    // Esperar que aparezca la listbox y la opción
    await expect(this.stateListbox()).toBeVisible({ timeout: 20000 });
    await expect(this.stateOption(state)).toBeVisible({ timeout: 20000 });

    // Seleccionar la opción (click directo) o Enter
    await this.stateOption(state).click();

    // Confirmar que quedó seteado
    await expect(this.stateCombobox()).toHaveValue(new RegExp(`^${state}$`, 'i'), { timeout: 20000 });
  }

  // --- Firma / DocSign: Georgia extra page ---

// Si el visor estuviera en un iframe, cambia aquí:
// private root() { return this.page.frameLocator('iframe[src*="doc"]'); }
private root() { return this.page; }

// Devuelve la .us-visor-box cuyo label (span dentro de .us-docsign-label) machaque el patrón
private boxByLabel(labelPattern: RegExp) {
  const r = this.root();
  return r.locator('.us-visor-box', {
    has: r.locator('.us-docsign-label span', { hasText: labelPattern }),
  }).first();
}

// Superficie clickeable dentro de la box
private surfaceInBox(box: Locator) {
  return box.locator('.us-docsign-element.us-docsign-surface').first();
}

// Icono interno (suele ser el target real del click)
private iconInBox(box: Locator) {
  return box.locator('.us-docsign-element.us-docsign-surface .us-icon, .us-docsign-element.us-docsign-surface svg').first();
}

// Click robusto: scroll, preferir icono, force-click si hace falta
private async clickSurfaceInBoxByLabel(labelPattern: RegExp) {
  const box = this.boxByLabel(labelPattern);
  await expect(box).toBeVisible({ timeout: 20000 });

  const icon = this.iconInBox(box);
  const surface = this.surfaceInBox(box);
  const target = (await icon.isVisible().catch(() => false)) ? icon : surface;

  await target.scrollIntoViewIfNeeded();
  try {
    await target.click({ timeout: 5000 });
  } catch {
    try {
      await target.click({ timeout: 20000, force: true });
    } catch {
      const handle = await target.elementHandle();
      if (handle) await this.page.evaluate((el: SVGElement | HTMLElement) => (el as HTMLElement).click(), handle);
    }
  }
  await this.page.waitForTimeout(150);
}

async signGeorgiaExtraPageIfPresent() {
  // Patrones flexibles por si cambian levemente los textos
  const INVESTOR_LABEL = /Client\s*Name/i;         // "Client Name | Vendor"
  const CHECKBOX_LABEL = /Options/i;               // "Options | Vendor"
  const SIGN_LABEL     = /Signature(\s*\|\s*Vendor)?/i; // "Signature | Vendor" o "Signature"
  const DATE_LABEL     = /Signature\s*Date/i;      // "Signature Date | Vendor"

  // Detectamos presencia de la hoja extra por la box de "Client Name"
  const maybeInvestorBox = this.boxByLabel(INVESTOR_LABEL);
  const isGeorgia = await maybeInvestorBox.isVisible({ timeout: 2000 }).catch(() => false);
  if (!isGeorgia) return;

  console.log('Georgia LSA extra page detectada (por label).');

  // 1) Investor / Lender Name
  await this.clickSurfaceInBoxByLabel(INVESTOR_LABEL);

  // 2) Checkbox (solo uno)
  await this.clickSurfaceInBoxByLabel(CHECKBOX_LABEL);

  // 3) Signature
  await this.clickSurfaceInBoxByLabel(SIGN_LABEL);

  // 4) Date
  await this.clickSurfaceInBoxByLabel(DATE_LABEL);

  console.log('Georgia LSA extra page: 4 elementos clickeados por label.');
}
 /**
   * STEP 5: Click en "Yes" (robusto)
   * - Scope: bloque visible del Step 5 ANTES del modal
   * - Click sobre el wrap del radio para evitar problemas de hitbox
   * - Asegura que el input tenga clase k-checked
   * - Espera a que aparezca #questionBoarding
   */
// 1) Seleccionar Yes (queda igual que la versión con fallback que ya pegaste)
async step5_selectYes() {
  const step5Question = this.page
    .locator('div')
    .filter({ hasText: 'Step 5: Is there a Broker on this loan?' })
    .first();
  await expect(step5Question).toBeVisible({ timeout: 20000 });

  const yesItem = step5Question.locator('ul.k-radio-list li', { hasText: /^Yes$/ }).first();
  await expect(yesItem).toBeVisible({ timeout: 20000 });

  const yesWrap  = yesItem.locator('span.k-radio-wrap').first();
  const yesInput = yesItem.locator('input[type="radio"]').first();

  try {
    if (!(await yesInput.isChecked())) {
      await yesInput.check({ force: true });
    }
  } catch {
    await yesWrap.click({ trial: true }).catch(() => {});
    await yesWrap.click().catch(() => {});
    if (!(await yesInput.isChecked())) {
      await yesInput.evaluate((el: HTMLInputElement) => el.click());
    }
  }

  const modal = this.page.locator('#questionBoarding');
  await expect(modal).toBeVisible({ timeout: 30000 });
}

// 2) Espera del modal (simplificada: sin el locator ambiguo)
async step5_waitModalVisible() {
  const card = this.page.locator('#questionBoarding');
  await expect(card).toBeVisible({ timeout: 30000 });
  await expect(
    card.getByText('Step 5: Is there a Broker on this loan?', { exact: false })
  ).toBeVisible({ timeout: 30000 });
  // pequeño respiro para que rendericen filas internas
  await this.page.waitForTimeout(200);
}

// 3) Localizador único del input "broker Account"
// LOCALIZA el input de "broker Account:" SOLO con XPath (dentro del modal)
private brokerAccountInput() {
  const card = this.page.locator('#questionBoarding');
  // Fila específica que contiene el label "broker Account:" y el input
  const row = card.locator(
    'xpath=.//div[contains(@class,"d-flex") and contains(@class,"align-items-center") and .//div[normalize-space()="Broker Account:"]]'
  ).first();
  // Input dentro de esa fila
  return row.locator('xpath=.//input[contains(@class,"us-input__field")]').first();
}

// LLENA el broker code con scroll defensivo y blur
async step5_fillBrokerAccount(brokerCode: string) {
  const input = this.brokerAccountInput();
  await expect(input).toBeVisible({ timeout: 20000 });

  // Asegura que no haya overlay encima y que esté en viewport
  await input.scrollIntoViewIfNeeded();
  await input.click({ force: true });

  await input.fill('');
  await input.type(brokerCode, { delay: 20 });

  // Blur para que el componente tome el valor
  await this.page.keyboard.press('Tab');
}

// 5) Buscar broker (sin cambios, pero dejo enabled check)
async step5_clickSearchBroker() {
  const card = this.page.locator('#questionBoarding');
  const btn = card.locator('#btnSearchBroker').first();
  await expect(btn).toBeVisible({ timeout: 20000 });
  await expect(btn).toBeEnabled({ timeout: 20000 });
  await btn.click();
}

// 6) Esperar datos cargados (sin cambios)
async step5_waitBrokerDataLoaded(brokerCode: string) {
  const input = this.brokerAccountInput().first();
  await expect(input).toHaveValue(brokerCode, { timeout: 30000 });

  const card = this.page.locator('#questionBoarding');
  await expect(card.locator('input[name="Company"]')).toBeDisabled({ timeout: 30000 });
  await expect(card.locator('input[name="City"]')).toBeDisabled();
  await expect(card.locator('input[name="Email"]')).toBeDisabled();
}



  async step5_assertBrokerDataPopulated(brokerCode: string) {
    const input = this.brokerAccountInput();
    await expect(input).toHaveValue(brokerCode, { timeout: 20000 });

    const card = this.page.locator('#questionBoarding');
    await expect(card.locator('input[name="Company"]')).toBeDisabled();
    await expect(card.locator('input[name="City"]')).toBeDisabled();
  }

  // ------ Yield spread & fees quedan igual que ya tenías ------

  // Localiza el input numérico de "Spread Rate %"
private yieldSpreadInput() {
  const card = this.page.locator('#questionBoarding');
  // fila que contiene el label "Spread Rate %"
  const row = card.locator('div:has(> label:has-text("Spread Rate %"))').first();
  // input del Kendo NumericTextBox dentro de esa fila
  return row.locator('input.k-input-inner').first();
}
// YES en "Is there a yield spread due to the broker?"
// YES en "Is there a yield spread due to the broker?"
async step5_enableYieldSpreadYes() {
  const card = this.page.locator('#questionBoarding');

  // Localiza el row exacto por estructura + texto normalizado (case-insensitive)
  const groupRow = card.locator(
    `xpath=.//div[contains(@class,'d-flex') and contains(@class,'align-items-center')]
           [.//div[contains(@class,'me-3')]
              [contains(translate(normalize-space(.),
                                  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                                  'abcdefghijklmnopqrstuvwxyz'),
                        'is there a yield spread due to the broker?')]]`
  ).first();

  await expect(groupRow).toBeVisible({ timeout: 30000 });

  // Intento 1: click al label "Yes"
  const yesLabel = groupRow.locator(
    `xpath=.//label[contains(@class,'k-radio-label')][normalize-space(.)='Yes']`
  ).first();

  if (await yesLabel.isVisible().catch(() => false)) {
    await yesLabel.click({ force: true });
  } else {
    // Intento 2 (fallback): check al input con name real de la UI
    const yesInput = groupRow.locator('input[name="IsTakingSpreadYes"]').first();
    if (await yesInput.count()) {
      if (!(await yesInput.isChecked().catch(() => false))) {
        await yesInput.check({ force: true });
      }
    } else {
      // Último recurso: primer radio dentro del grupo
      const anyRadio = groupRow.locator('input[type="radio"]').first();
      await expect(anyRadio).toBeVisible({ timeout: 10000 });
      await anyRadio.check({ force: true });
    }
  }

  // Esperar a que se habilite "Spread Rate %"
  const spreadInput = this.yieldSpreadInput();
  await expect(spreadInput).toBeVisible({ timeout: 30000 });
  await expect(spreadInput).toBeEnabled({ timeout: 30000 });
  await this.page.waitForTimeout(100);
}


// Setear el porcentaje (ej: "15")
async step5_setYieldSpreadPercent(percentWithoutSymbol: string) {
  const input = this.yieldSpreadInput();
  await expect(input).toBeVisible({ timeout: 20000 });
  await input.click();
  // Selecciona todo y escribe el número sin %
  await this.page.keyboard.press('Control+A');
  await this.page.keyboard.type(percentWithoutSymbol);
  await this.page.keyboard.press('Tab'); // forzar blur/formateo
  await expect(input).toHaveValue(/15/, { timeout: 10000 }); // validación laxa
}

// YES en "Is the broker due a servicing fee from the broker?"
async step5_enableServicingFeeYes() {
  const card = this.page.locator('#questionBoarding');

  // 1) Radio exacto por name
  const yesInput = card.locator('input[name="DueServicingFeeYes"]').first();
  await expect(yesInput).toBeVisible({ timeout: 20000 });

  try {
    if (!(await yesInput.isChecked())) {
      await yesInput.check({ force: true });
    }
  } catch {
    // Fallback: label "Yes" dentro del row correcto
    const groupRow = card.locator(
      'div.d-flex.align-items-center:has(> div.me-3:has-text("Is the broker due a servicing fee"))'
    ).first();
    await expect(groupRow).toBeVisible({ timeout: 20000 });
    await groupRow.locator('label.k-radio-label', { hasText: /^Yes$/ }).first().click({ force: true });
  }

  // 2) Espera a que se habiliten los 3 campos posteriores
  await expect(this.principalBalanceInput()).toBeVisible({ timeout: 20000 });
  await expect(this.plusAmountInput()).toBeVisible({ timeout: 20000 });
  await expect(this.minimumInput()).toBeVisible({ timeout: 20000 });
}

  private principalBalanceInput() {
    const card = this.page.locator('#questionBoarding');
    const row = card.locator('label', { hasText: 'Principal Balance %' }).first().locator('..');
    return row.locator('input.k-input-inner').first();
  }
  private plusAmountInput() {
    const card = this.page.locator('#questionBoarding');
    const row = card.locator('label', { hasText: 'Plus Amount' }).first().locator('..');
    return row.locator('input.k-input-inner').first();
  }
  private minimumInput() {
    const card = this.page.locator('#questionBoarding');
    const row = card.locator('label', { hasText: 'Minimun' }).first().locator('..');
    return row.locator('input.k-input-inner').first();
  }

  private async arrowUpOnceOn(input: Locator) {
    await expect(input).toBeVisible({ timeout: 20000 });
    await input.click();
    await this.page.keyboard.press('ArrowUp');
  }

  async step5_bumpPrincipalPlusMin() {
    const p = this.principalBalanceInput();
    const plus = this.plusAmountInput();
    const min = this.minimumInput();

    await this.arrowUpOnceOn(p);
    await this.arrowUpOnceOn(plus);
    await this.arrowUpOnceOn(min);

    const ensureNotZero = async (inp: Locator) => {
      const v = await inp.inputValue();
      if (v?.trim().match(/^(\$?0+([.,]0+)?|0?\.0+%?)$/)) {
        await inp.click();
        await this.page.keyboard.press('ArrowUp');
      }
    };
    await ensureNotZero(p);
    await ensureNotZero(plus);
    await ensureNotZero(min);
  }

}
