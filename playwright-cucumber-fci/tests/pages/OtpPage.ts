import { Page, Locator } from 'playwright';

export class OtpPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Locators base ---

  private get otpCard(): Locator {
    return this.page.locator('div.us-card', { hasText: 'One-Time Express Payment' }).first();
  }

  private get accountNumberInput(): Locator {
    return this.page.locator('input[name="LoanAccount"]');
  }

  private get ssnInput(): Locator {
    return this.page.locator('input[name="SSN"]');
  }

  private get addressNumberInput(): Locator {
    return this.page.locator('input[name="AddressNumber"]');
  }

  private get zipCodeInput(): Locator {
    return this.page.locator('input[name="ZipCode"]');
  }

  private get useAddressLink(): Locator {
    return this.page.getByRole('link', {
      name: /Use the address number and zip code instead/i,
    });
  }

  private get useSsnLink(): Locator {
    return this.page.getByRole('link', {
      name: /Use SSN\/EIN\/TIN \(Last 4 Digits\) instead/i,
    });
  }

  private get verifyButton(): Locator {
    return this.page.getByRole('button', { name: /^Verify$/i });
  }

  private get successToast(): Locator {
    return this.page.locator('.toast.toast-success');
  }

  private get successToastCloseButton(): Locator {
    return this.successToast.locator('.toast-close-button');
  }

  // Monthly ACH modal
  private get monthlyAchModal(): Locator {
    return this.page.locator('.modal-content', {
      hasText: 'This Account has monthly ACH setup, do you want to proceed?',
    });
  }

  private get monthlyAchYesButton(): Locator {
    return this.monthlyAchModal.getByRole('button', { name: /^Yes$/i });
  }

  // Popup pago adicional ACH
  private get additionalAchCheckbox(): Locator {
    return this.page.locator('#AdditionalPaymentACH');
  }

  private get additionalAchModal(): Locator {
    return this.additionalAchCheckbox.locator(
      'xpath=ancestor::div[contains(@class,"modal-content")]',
    );
  }

  private get additionalAchSubmitButton(): Locator {
    return this.additionalAchModal.getByRole('button', { name: /Submit/i });
  }

  private get anyOpenModal(): Locator {
    return this.page.locator('.modal.show');
  }

  // Bloque Loan Information
  private get loanInformationAccordion(): Locator {
    return this.page.locator('.accordion', { hasText: 'Loan Information' });
  }

  // Bloque Express Payment (stepper)
  private get expressPaymentCard(): Locator {
    return this.page.locator('div.us-card', { hasText: 'Express Payment' }).first();
  }

  private get expressPaymentNextButton(): Locator {
    return this.expressPaymentCard.getByRole('button', { name: /^Next$/i });
  }

  private get expressPaymentStepLabels(): Locator {
    return this.expressPaymentCard.locator('.step-label-content .step-label');
  }

  private get bankAccountInformationTitle(): Locator {
    return this.expressPaymentCard.getByText('Bank Account Information', { exact: true });
  }

  // Contact Information + acuerdo ACH
  private get individualNameInput(): Locator {
    return this.page.locator('#IndividualName');
  }

  private get emailInput(): Locator {
    return this.page.locator('#Email');
  }

  private get achAgreeCheckbox(): Locator {
    return this.page.locator('#achIsAgree');
  }

  // Firma (Click to Sign + modal)
  private get clickToSignButton(): Locator {
    return this.page.getByText('Click to Sign', { exact: true });
  }

  private get signatureModal(): Locator {
    return this.page.locator('.modal-content', { hasText: 'Please add your signature' });
  }

  private get addNameToSignCheckbox(): Locator {
    return this.signatureModal.locator('#addAutomaticSign');
  }

  private get signatureSaveButton(): Locator {
    return this.signatureModal.getByRole('button', { name: /Save/i });
  }

  private get selectedStepLabel(): Locator {
    return this.page.locator('.step-label.step-selected');
  }

  // Confirmación final
  private get achConfirmationContainer(): Locator {
    return this.page.locator('#achConfirmation');
  }

  // --- Navegación / estado inicial ---

  async goto(): Promise<void> {
    await this.page.goto('https://tblis.myfci.com/onlinePayment', {
      waitUntil: 'networkidle',
    });
  }

  async verifyOtpCardVisible(): Promise<void> {
    console.log('[OTP] Esperando card principal One-Time Express Payment');
    await this.otpCard.waitFor({ state: 'visible', timeout: 20000 });
    await this.accountNumberInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.ssnInput.waitFor({ state: 'visible', timeout: 20000 });
    console.log('[OTP] Card principal One-Time Express Payment visible');
  }

  // --- Camino A: LoanAccount + SSN/EIN/TIN ---

  async fillLoanAccountAndSsn(accountNumber: string, ssnLast4: string): Promise<void> {
    console.log(`[OTP] Rellenando LoanAccount=${accountNumber}, SSNLast4=${ssnLast4}`);
    await this.accountNumberInput.fill(accountNumber);
    await this.ssnInput.fill(ssnLast4);
  }

  async submitAndVerifySuccessToast(): Promise<void> {
    console.log('[OTP] Click en botón Verify');
    await this.verifyButton.click();
    await this.successToast.waitFor({ state: 'visible', timeout: 20000 });

    const title = await this.successToast.locator('.toast-title').textContent().catch(() => '');
    const message = await this.successToast.locator('.toast-message').textContent().catch(() => '');

    console.log('[OTP] Toast title:', (title || '').trim());
    console.log('[OTP] Toast message:', (message || '').trim());
  }

  // --- Camino B: LoanAccount + Address + Zip ---

  async switchToAddressAndZipMode(): Promise<void> {
    console.log('[OTP] Cambiando formulario a Address Number + Zip Code');
    await this.useAddressLink.click();
    await this.addressNumberInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.zipCodeInput.waitFor({ state: 'visible', timeout: 20000 });
    console.log('[OTP] Campos AddressNumber y ZipCode visibles');
  }

  async fillLoanAccountAddressAndZip(
    accountNumber: string,
    addressNumber: string,
    zipCode: string,
  ): Promise<void> {
    console.log(
      `[OTP] Rellenando LoanAccount=${accountNumber}, AddressNumber=${addressNumber}, ZipCode=${zipCode}`,
    );
    await this.accountNumberInput.fill(accountNumber);
    await this.addressNumberInput.fill(addressNumber);
    await this.zipCodeInput.fill(zipCode);
  }

  // --- Toast / overlays ---

  async dismissSuccessToastIfVisible(): Promise<void> {
    const toastVisible = await this.successToast.isVisible().catch(() => false);
    if (!toastVisible) {
      console.log('[OTP] No hay toast de éxito visible');
      return;
    }

    console.log('[OTP] Toast de éxito visible, intentando cerrarlo');
    const closeVisible = await this.successToastCloseButton.isVisible().catch(() => false);
    if (closeVisible) {
      await this.successToastCloseButton.click();
      console.log('[OTP] Toast cerrado con botón X');
    } else {
      await this.successToast.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      console.log('[OTP] Toast desapareció automáticamente');
    }
  }

  // --- Modales opcionales ---

  async handleOptionalMonthlyAchModal(): Promise<void> {
  console.log('[OTP] Chequeando si aparece el modal de ACH mensual (hasta 15s)');

  const monthlyAchDialog = this.page.locator('.modal.show', {
    hasText: 'This Account has monthly ACH setup, do you want to proceed?',
  });

  // Espera activa hasta 15s a que aparezca el modal
  let visible = false;
  for (let i = 0; i < 30; i++) {
    visible = await monthlyAchDialog.isVisible().catch(() => false);
    if (visible) break;
    await this.page.waitForTimeout(500);
  }

  if (!visible) {
    console.log('[OTP] Modal de ACH mensual no apareció, continúo flujo normal');
    return;
  }

  console.log('[OTP] Modal de ACH mensual visible, haciendo click en Yes');

  const yesButton = monthlyAchDialog.getByRole('button', { name: /^Yes$/i });
  await yesButton.waitFor({ state: 'visible', timeout: 5000 });
  await yesButton.click();

  // Muy importante: esperar a que este modal se cierre
  try {
    await monthlyAchDialog.waitFor({ state: 'hidden', timeout: 15000 });
    console.log('[OTP] Modal de ACH mensual cerrado correctamente después de hacer click en Yes');
  } catch {
    console.log('[OTP] ⚠️ Advertencia: el modal de ACH mensual no se cerró tras hacer click en Yes');
  }
}


  async handleOptionalAdditionalPaymentAchModal(): Promise<void> {
    const checkbox = this.additionalAchCheckbox;

    // 1) Esperamos a que aparezca (si no aparece, salimos)
    try {
      await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      console.log('[OTP] Popup de pago adicional ACH no apareció dentro del timeout, sigo flujo normal');
      return;
    }

    console.log('[OTP] Popup de pago adicional ACH visible, verificando elementos...');

    const modal = this.additionalAchModal;
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const submitButton = this.additionalAchSubmitButton;
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });

    // 3) Click en checkbox
    await checkbox.check();
    console.log('[OTP] Checkbox "Yes, I want to make an additional payment" marcado');

    // 4) Esperamos a que el botón Submit se habilite
    for (let i = 0; i < 40; i++) {
      const isDisabled = await submitButton.isDisabled().catch(() => false);
      if (!isDisabled) {
        break;
      }
      await this.page.waitForTimeout(250);
    }

    const finalDisabledState = await submitButton.isDisabled().catch(() => false);
    if (finalDisabledState) {
      console.log('[OTP] El botón Submit sigue deshabilitado después de esperar, no se puede continuar');
      return;
    }

    console.log('[OTP] Botón Submit habilitado, haciendo click para continuar');
    await submitButton.click();
  }

  async ensureNoBlockingModals(): Promise<void> {
  const modalVisible = await this.anyOpenModal.isVisible().catch(() => false);
  if (!modalVisible) {
    console.log('[OTP] No hay modales genéricos bloqueando la vista');
    return;
  }

  console.log('[OTP] Modal genérico visible, intentando cerrarlo');
  const currentModal = this.anyOpenModal.first();

  // Logueamos un pedacito del texto del modal para entender qué es
  const modalText = (await currentModal.innerText().catch(() => '')).trim();
  console.log('[OTP] Texto del modal genérico actual (primeros 200 chars):', modalText.slice(0, 200));

  const yesButton = currentModal.getByRole('button', { name: /^Yes$/i });
  if (await yesButton.isVisible().catch(() => false)) {
    console.log('[OTP] Haciendo click en Yes de modal genérico');
    await yesButton.click();
    // Esperamos a que ese modal se cierre
    try {
      await currentModal.waitFor({ state: 'hidden', timeout: 10000 });
      console.log('[OTP] Modal genérico cerrado después de click en Yes');
    } catch {
      console.log('[OTP] ⚠️ Advertencia: modal genérico no se cerró tras click en Yes');
    }
    return;
  }

  const closeButton = currentModal.getByRole('button', { name: /Close|×/i });
  if (await closeButton.isVisible().catch(() => false)) {
    console.log('[OTP] Haciendo click en Close de modal genérico');
    await closeButton.click();
    try {
      await currentModal.waitFor({ state: 'hidden', timeout: 10000 });
      console.log('[OTP] Modal genérico cerrado después de click en Close');
    } catch {
      console.log('[OTP] ⚠️ Advertencia: modal genérico no se cerró tras click en Close');
    }
    return;
  }

  console.log('[OTP] Modal genérico no tiene Yes ni Close manejable, lo dejo como está');
}


  // --- Verificación de bloques y paso 2 ---

  async verifyLoanInformationBlock(): Promise<void> {
    console.log('[OTP] Esperando bloque Loan Information');
    await this.loanInformationAccordion.waitFor({ state: 'visible', timeout: 30000 });
    console.log('[OTP] Bloque Loan Information visible');
  }

  async verifyExpressPaymentStep1AndClickNext(): Promise<void> {
    console.log('[OTP] Preparando verificación de Express Payment Step 1');

    // Nos aseguramos de no tener cosas encima
    await this.dismissSuccessToastIfVisible();
    await this.ensureNoBlockingModals();

    console.log('[OTP] Esperando card Express Payment Step 1');
    await this.expressPaymentCard.waitFor({ state: 'visible', timeout: 30000 });

    const stepCount = await this.expressPaymentStepLabels.count();
    console.log('[OTP] Cantidad de step-labels encontrados en Express Payment:', stepCount);
    if (stepCount < 3) {
      throw new Error('No se encontraron los 3 pasos del flujo Express Payment');
    }

    const selectedStep = this.expressPaymentCard.locator('.step-label.step-selected');
    await selectedStep.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[OTP] Step 1 está seleccionado en Express Payment');

    await this.expressPaymentNextButton.waitFor({ state: 'visible', timeout: 30000 });
    console.log('[OTP] Click en botón Next de Express Payment Step 1');
    await this.expressPaymentNextButton.click();
  }

  async waitForBankAccountInformationSection(): Promise<void> {
    console.log('[OTP] Esperando bloque Bank Account Information (Step 2)');
    await this.bankAccountInformationTitle.waitFor({ state: 'visible', timeout: 30000 });
    console.log('[OTP] Bloque Bank Account Information visible');
  }

  // --- OTP-only: completar Contact Info + acuerdo ACH tras ExpressPaymentPage.fillBankData() ---

  async completeContactInfoAndAcceptAgreementForOtp(): Promise<void> {
  console.log('[OTP] Completando Contact Information + acuerdo ACH para OTP');

  // Contact Information
  if (await this.individualNameInput.isVisible().catch(() => false)) {
    console.log('[OTP] Rellenando Individual Name');
    await this.individualNameInput.fill('Automation Tester');
  } else {
    console.log('[OTP] Campo Individual Name no visible, lo salto');
  }

  if (await this.emailInput.isVisible().catch(() => false)) {
    const currentEmail = (await this.emailInput.inputValue().catch(() => '')).trim();
    console.log('[OTP] Email actual en Contact Information:', currentEmail || '(vacío)');
  }

  // Aceptar términos ACH
  await this.achAgreeCheckbox.waitFor({ state: 'visible', timeout: 10000 });

  // Primero vemos si ya está marcado
  let isChecked = await this.achAgreeCheckbox.isChecked().catch(() => false);
  if (isChecked) {
    console.log('[OTP] Checkbox achIsAgree ya estaba tildado');
    console.log('[OTP] Contact Information + acuerdo ACH completados para OTP');
    return;
  }

  console.log('[OTP] Intentando marcar acuerdo ACH haciendo click en el label asociado');

  const achAgreeLabel = this.page.locator('label[for="achIsAgree"]');

  // Hacemos click en el label (lo más parecido a un usuario real)
  await achAgreeLabel.waitFor({ state: 'visible', timeout: 10000 });
  await achAgreeLabel.click();
  await this.page.waitForTimeout(300); // pequeño tiempo para que el estado se actualice

  // Verificamos estado luego del click
  isChecked = await this.achAgreeCheckbox.isChecked().catch(() => false);
  console.log('[OTP] Estado del checkbox achIsAgree después del click en label:', isChecked);

  if (!isChecked) {
    // Como fallback, probamos un click directo sin usar .check() (sin aserción interna)
    console.log('[OTP] Checkbox sigue sin marcarse, intento click directo sobre el input');
    await this.achAgreeCheckbox.click({ force: true });
    await this.page.waitForTimeout(300);
    const finalState = await this.achAgreeCheckbox.isChecked().catch(() => false);
    console.log('[OTP] Estado final de achIsAgree después de click directo:', finalState);
  }

  console.log('[OTP] Contact Information + acuerdo ACH (intento de marcado) completados para OTP');
}


  // --- OTP-only: firma en modal "Please add your signature" ---

  async signAndSaveForOtp(): Promise<void> {
  console.log('[OTP] Iniciando flujo de firma para OTP');

  // 1) Verificamos primero si el modal ya está visible
  const modalAlreadyVisible = await this.signatureModal.isVisible().catch(() => false);

  if (!modalAlreadyVisible) {
    console.log('[OTP] Modal de firma no visible, abriéndolo con "Click to Sign"');

    await this.clickToSignButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.clickToSignButton.click();
    console.log('[OTP] Click realizado en "Click to Sign"');

    await this.signatureModal.waitFor({ state: 'visible', timeout: 20000 });
    console.log('[OTP] Modal de firma "Please add your signature" visible');
  } else {
    console.log('[OTP] Modal de firma ya estaba visible, no es necesario clickear "Click to Sign"');
  }

  // 2) Dentro del modal: marcar "Add Name To Sign"
  await this.addNameToSignCheckbox.waitFor({ state: 'visible', timeout: 10000 });
  await this.addNameToSignCheckbox.check();
  console.log('[OTP] Checkbox "Add Name To Sign" marcado');

  // 3) Click en botón Save
  await this.signatureSaveButton.waitFor({ state: 'visible', timeout: 10000 });
  await this.signatureSaveButton.click();
  console.log('[OTP] Click en botón Save del modal de firma');

  // 4) Esperar a que el modal se cierre
  await this.signatureModal.waitFor({ state: 'hidden', timeout: 20000 });
  console.log('[OTP] Modal de firma cerrado correctamente');
}


  // --- OTP-only: Next desde Step 2 hacia Step 3 ---

  async goToStep3FromStep2ForOtp(): Promise<void> {
    console.log('[OTP] Haciendo click en Next para ir al paso final (Step 3)');

    await this.expressPaymentNextButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.expressPaymentNextButton.click();
    console.log('[OTP] Click en Next realizado, esperando Step 3');

    await this.selectedStepLabel.waitFor({ state: 'visible', timeout: 30000 });
    const text = ((await this.selectedStepLabel.textContent().catch(() => '')) ?? '').trim();
    console.log('[OTP] Step seleccionado después de Next:', text);
  }

  // --- Confirmación final ---

  async printPaymentConfirmationData(): Promise<void> {
    console.log('[OTP] Esperando bloque de confirmación ACH');
    await this.achConfirmationContainer.waitFor({ state: 'visible', timeout: 30000 });

    const confirmationText = await this.achConfirmationContainer.innerText();
    console.log('================= [OTP] ACH Confirmation =================');
    console.log(confirmationText.trim());
    console.log('==========================================================');
  }
}
