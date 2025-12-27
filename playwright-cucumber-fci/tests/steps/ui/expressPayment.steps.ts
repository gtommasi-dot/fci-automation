import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { LoginPage } from '../../pages/LoginPage';
import { ExpressPaymentPage } from '../../pages/ExpressPaymentPage';
import * as dotenv from 'dotenv';
dotenv.config();

let expressPage: ExpressPaymentPage;


When('navego a la sección de Online Payments', async function () {
  // await expressPage.clickOnNavBarToggler();
  expressPage = new ExpressPaymentPage(this.page);
  await expressPage.goToOnlinePayments();
});

When('verifico información de Online Payments', async function () {
  await expressPage.verifyOnlinePaymentsLoaded();
});

When('hago click en el botón Express Payment', async function () {
  await expressPage.clickExpressPayment();
});

When('verifico modal de Express Payment paso 1 y avanzo', async function () {
  await expressPage.verifyFirstModalAndNext();
});

When('ingreso los datos bancarios y acepto el acuerdo', async function () {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Espera para asegurar que el modal esté visible
  await expressPage.fillBankData();
});

When('firmo y guardo en el modal de firma', async function () {
  await expressPage.signAndSaveInModal();
});

When('confirmo el pago en el paso final del modal', async function () {
  await expressPage.confirmFinalPayment();
});

Then('debería ver el mensaje de confirmación de pago exitoso y cerrar el modal final', async function () {
  const result = await expressPage.verifySuccessMessageAndClose();
  expect(result).to.be.true;
});
