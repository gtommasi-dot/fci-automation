import { Given, When, Then } from '@cucumber/cucumber';
import { LoginAdminPage } from '../../pages/LoginAdminPage';
import { FciInvoicePage } from '../../pages/FciInvoicePage';
import { expect } from '@playwright/test';


When('hago click en el botón Pay By ACH', async function () {
  await this.fciInvoicePage.clickPayByACH();
});

When('completo el formulario de ACH y proceso el pago', async function () {
 await this.fciInvoicePage.fillAchFormAndSubmit();
});

Then('valido que aparezca el popup de pago exitoso y lo cierro', async function () {
 await this.fciInvoicePage.validateSuccessAndClose();
});
