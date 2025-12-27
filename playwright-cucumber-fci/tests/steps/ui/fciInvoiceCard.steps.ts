import { When, Then } from '@cucumber/cucumber';
import { FciInvoiceCardPage } from '../../pages/FciInvoiceCardPage';


When('hago click en el botón Pay By Credit Card', async function () {
  await this.fciInvoiceCardPage.clickPayByCard();
});

When('completo el formulario de tarjeta y proceso el pago para {string}', async function (tipo) {
  await this.fciInvoiceCardPage.fillCardFormAndSubmit(tipo);
});

Then('valido el resultado del pago y cierro popup', async function () {
  await this.fciInvoiceCardPage.validateResultAndClose();
});
