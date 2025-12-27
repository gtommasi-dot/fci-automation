import { Page } from 'playwright';
import { PopupPage } from './PopupPage';
import { LoginPage } from './LoginPage'; // Asegúrate de que la ruta sea correcta   

export class ExpressPaymentPage {
  private page: Page;
  private popupPage: PopupPage;

  // Selectores globales
  private navBarToggler = 'xpath=//*[@id="bnNavBarToggler1"]';
  private onlinePaymentsBtn = 'xpath=//*[@id="root"]/nav[2]/div/a[6]/div[3]/span';
  private onlinePaymentsHeader = 'xpath=//*[@id="root"]/main/div/div[2]/div/div[1]'; // Ajusta si hace falta
  private onlinePaymentsTable = 'xpath=//*[@id="one-time-ach"]/div/div[1]/div/div[2]/div';

  // Botones
  private expressPaymentBtn = 'xpath=//*[@id="one-time-ach"]/div/div[2]/button[1]';
  private refreshBtn = 'xpath=//*[@id="one-time-ach"]/div/div[2]/button[2]';

  // Modales
  private nextBtnModal1 = 'div[role="dialog"] button:has-text("Next")';
  private exitBtnModal1 = 'div[role="dialog"] button:has-text("Exit")';

  // Modal 2 campos
  private routingInput = '#RoutingNumber:not([disabled])';
  private confirmRoutingInput = '#ConfirmRoutingNumber:not([disabled])';
  private accountInput = '#AccountNumber:not([disabled])';
  private confirmAccountInput = '#ConfirmAccountNumber:not([disabled])';
  private achIsAgreeCheckbox = 'xpath=/html/body/div[2]/div/div[1]/div/div/div[1]/div[4]/div/div/div[1]/div/label';
  private individualNameInput = '#IndividualName:not([disabled])';

  // Modal 3 firma
  private addNameToSignCheckbox = '#addAutomaticSign:not([disabled])';
  private saveBtnModal3 = '#signForm > div > div.p-1.pl-2.pr-2.modal-footer > button.btn.btn-info.btn-xs:not([disabled])';
  private nextBtnModal3 = 'xpath=/html/body/div[2]/div/div[1]/div/div/div[2]/button[2]';

  // Modal 4 confirmación
  private successMessage = 'xpath=//*[@id="achConfirmation"]/div[1]/div[2]/h4';
  private closeBtnFinalModal = 'xpath=/html/body/div[2]/div/div[1]/div/div/div[2]/button';

  constructor(page: Page) {
    this.page = page;
    this.popupPage = new PopupPage(page);
  }

  async loginAsBorrower(username: string, password: string, loginPage: LoginPage) {
    await loginPage.goto();
    await loginPage.enterUsername(process.env.BORROWER_USER as string);
    await loginPage.enterPassword(process.env.BORROWER_PASSWORD as string);
    await loginPage.clickSignIn();
  }

  async handlePopupIfPresent() {
    await this.popupPage.closeIfPresent();
  }

  async handleAdditionalPaymentModalIfPresent() {
  // Espera muy corta, solo si el checkbox aparece tras clickear Express Payment
  const modalCheckboxSelector = 'xpath=//*[@id="AdditionalPaymentACH"]';
  const submitBtnSelector = 'xpath=/html/body/div[2]/div/div[1]/div/div/div[2]/button[1]';

  const isPresent = await this.page.isVisible(modalCheckboxSelector).catch(() => false);
  if (isPresent) {
    await this.page.check(modalCheckboxSelector);
    await this.page.waitForSelector(submitBtnSelector, { state: 'visible', timeout: 5000 });
    await this.page.click(submitBtnSelector);
    // Opcional: espera a que desaparezca el modal
    await this.page.waitForSelector(modalCheckboxSelector, { state: 'detached', timeout: 10000 }).catch(() => {});
  }
  // Si no está el modal, simplemente continúa
}


  async goToOnlinePayments() {
    await this.page.waitForSelector(this.onlinePaymentsBtn, { state: 'visible', timeout: 20000 });
    await this.page.click(this.onlinePaymentsBtn);
    await this.page.waitForSelector(this.onlinePaymentsHeader, { state: 'visible', timeout: 20000 });
  }

  async verifyOnlinePaymentsLoaded() {
    await this.page.waitForSelector(this.onlinePaymentsHeader, { state: 'visible', timeout: 20000 });
    const headerText = await this.page.textContent(this.onlinePaymentsHeader);
    if (!headerText?.includes('Online Payments: test8180')) {
      throw new Error('No se encontró el header de Online Payments para borrower');
    }
    await this.page.waitForSelector(this.onlinePaymentsTable, { state: 'visible', timeout: 20000 });
    await this.page.waitForSelector(this.expressPaymentBtn, { state: 'visible', timeout: 20000 });
    await this.page.waitForSelector(this.refreshBtn, { state: 'visible', timeout: 20000 });
  }

  async clickExpressPayment() {
    await this.page.click(this.expressPaymentBtn);
    await this.handleAdditionalPaymentModalIfPresent();
  }

  async clickOnNavBarToggler() {
  // Espera a que desaparezcan overlays
  await this.page.waitForSelector('.us-backdrop', { state: 'detached', timeout: 20000 }).catch(() => {});
  await this.page.click(this.navBarToggler);
}


  async verifyFirstModalAndNext() {
    await this.page.waitForSelector(this.nextBtnModal1, { state: 'visible', timeout: 20000 });
    await this.page.waitForSelector(this.exitBtnModal1, { state: 'visible', timeout: 20000 });
    await this.page.click(this.nextBtnModal1);
  }

  async fillBankData() {
  await this.page.waitForSelector(this.routingInput, { state: 'visible', timeout: 20000 });
  await this.page.fill(this.routingInput, '026009593');
  await this.page.waitForSelector(this.confirmRoutingInput, { state: 'visible', timeout: 20000 });
  await this.page.fill(this.confirmRoutingInput, '026009593');
  await this.page.waitForSelector(this.accountInput, { state: 'visible', timeout: 20000 });
  await this.page.fill(this.accountInput, '33333');
  await this.page.waitForSelector(this.confirmAccountInput, { state: 'visible', timeout: 20000 });
  await this.page.fill(this.confirmAccountInput, '33333');
  await this.page.waitForSelector(this.individualNameInput, { state: 'visible', timeout: 20000 });
  await this.page.fill(this.individualNameInput, 'John Doe');
}

  async signAndSaveInModal() {
    await this.page.waitForSelector(this.achIsAgreeCheckbox, { state: 'visible', timeout: 20000 });
    await this.page.click(this.achIsAgreeCheckbox);
    await this.page.waitForSelector(this.addNameToSignCheckbox, { state: 'visible', timeout: 20000 });
    await this.page.check(this.addNameToSignCheckbox);
    await this.page.waitForSelector(this.saveBtnModal3, { state: 'visible', timeout: 20000 });
    await this.page.click(this.saveBtnModal3);
    await this.page.waitForSelector(this.nextBtnModal3, { state: 'visible', timeout: 20000 });
    await this.page.click(this.nextBtnModal3);
  }

  async confirmFinalPayment() {
    // Este paso puede incluir esperas adicionales si el pago tarda en procesar
    await this.page.waitForSelector(this.successMessage, { state: 'visible', timeout: 20000 });
  }

  async verifySuccessMessageAndClose(): Promise<boolean> {
    await this.page.waitForSelector(this.successMessage, { state: 'visible', timeout: 20000 });
    const msg = await this.page.textContent(this.successMessage);
    const expected = 'You are done. A confirmation will be automatically be emailed to you!';
    const found = msg?.includes(expected);
    await this.page.waitForSelector(this.closeBtnFinalModal, { state: 'visible', timeout: 20000 });
    await this.page.click(this.closeBtnFinalModal);
    return !!found;
  }
}
