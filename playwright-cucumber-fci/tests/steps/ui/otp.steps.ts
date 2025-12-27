import { Given, When, Then } from '@cucumber/cucumber';
import { OtpPage } from '../../pages/OtpPage';
import { ExpressPaymentPage } from '../../pages/ExpressPaymentPage';

let otpPage: OtpPage;
let expressPaymentPage: ExpressPaymentPage;

Given('que ingreso a la página de One-Time Express Payment', async function () {
  otpPage = new OtpPage(this.page);
  await otpPage.goto();
  await otpPage.verifyOtpCardVisible();
});

// ---------- Camino A: LoanAccount + SSN/EIN/TIN (Last 4 Digits) ----------

When(
  'valido la cuenta usando SSN con account number {string} y últimos 4 dígitos {string}',
  async function (accountNumber: string, ssnLast4: string) {
    otpPage = otpPage || new OtpPage(this.page);
    await otpPage.fillLoanAccountAndSsn(accountNumber, ssnLast4);
    await otpPage.submitAndVerifySuccessToast();
  },
);

When('manejo el popup opcional de cuenta con ACH mensual', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.handleOptionalMonthlyAchModal();
});

When('manejo el popup opcional de pago adicional ACH', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.handleOptionalAdditionalPaymentAchModal();
});

When('verifico los bloques de Loan Information y Express Payment y avanzo al paso 2', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.verifyLoanInformationBlock();
  await otpPage.verifyExpressPaymentStep1AndClickNext();
  await otpPage.waitForBankAccountInformationSection();
});

// ---------- Camino B: LoanAccount + Address Number + Zip Code ----------

When('cambio el formulario para usar address number y zip code', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.switchToAddressAndZipMode();
});

When(
  'valido la cuenta usando address number con account number {string}, address number {string} y zip code {string}',
  async function (accountNumber: string, addressNumber: string, zipCode: string) {
    otpPage = otpPage || new OtpPage(this.page);
    await otpPage.fillLoanAccountAddressAndZip(accountNumber, addressNumber, zipCode);
    await otpPage.submitAndVerifySuccessToast();
  },
);

// ---------- Pasos comunes: datos bancarios + contacto + firma + confirmación (OTP only) ----------

When('ingreso los datos bancarios para OTP y acepto el acuerdo', async function () {
  otpPage = otpPage || new OtpPage(this.page);

  // Reutilizamos la lógica existente para datos bancarios
  expressPaymentPage = new ExpressPaymentPage(this.page);
  await expressPaymentPage.fillBankData();

  // Y complementamos con Contact Information + checkbox achIsAgree desde OtpPage
  await otpPage.completeContactInfoAndAcceptAgreementForOtp();
});

When('firmo y guardo en el modal de firma para OTP', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.signAndSaveForOtp();
});

When('confirmo el pago en el paso final para OTP', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.goToStep3FromStep2ForOtp();
});

Then('imprimo los datos de confirmación del pago para OTP', async function () {
  otpPage = otpPage || new OtpPage(this.page);
  await otpPage.printPaymentConfirmationData();
});
