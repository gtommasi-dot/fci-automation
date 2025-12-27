import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { LoginPage } from '../../pages/LoginPage';
import { PopupPage } from '../../pages/PopupPage';
import { PayoffRequestPage } from '../../pages/PayoffRequestPage';
import * as dotenv from 'dotenv';
dotenv.config();


let payoffPage: PayoffRequestPage;


When('navego a la sección de Payoff Request', async function () {
  payoffPage = new PayoffRequestPage(this.page);
  await payoffPage.goToPayoffRequestSection();
});

When('verifico los campos y controles del bloque de Payoff Request', async function () {
  await payoffPage.verifyPayoffFields();
});

When('selecciono {string} como motivo', async function (motivo: string) {
  await payoffPage.selectReason(motivo);
});

When('escribo un comentario en el campo Comments', async function () {
  await payoffPage.writeRandomComment();
});

When('hago click en el botón Submit', async function () {
  await payoffPage.submitRequest();
});

Then('valido el popup de resultado de solicitud de Payoff', async function () {
  const result = await payoffPage.validatePayoffResultPopup();

  // success y alreadyActive son resultados válidos para este escenario
  if (result === "success" || result === "alreadyActive") {
    expect(true).to.be.true;
    return;
  }

  // si llegó acá, fue "error"
  throw new Error("❌ Payoff falló: se mostró popup de error.");
});

