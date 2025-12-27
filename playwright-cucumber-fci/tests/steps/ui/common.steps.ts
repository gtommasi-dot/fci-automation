import { Given, When } from '@cucumber/cucumber';
import { LoginPage } from '../../pages/LoginPage';
import { LoginAdminPage } from '../../pages/LoginAdminPage';
import { PopupPage } from '../../pages/PopupPage';
import { FciInvoicePage } from '../../pages/FciInvoicePage';
import { FciInvoiceCardPage } from '../../pages/FciInvoiceCardPage';


Given('que ingreso al sistema como {string}', async function (userType) {
  if (userType.toLowerCase() === 'admin') {
    this.loginAdminPage = new LoginAdminPage(this.page);
    await this.loginAdminPage.goto();
    await this.loginAdminPage.enterUsername(process.env.ADMIN_USER as string);
    await this.loginAdminPage.enterPassword(process.env.ADMIN_PASSWORD as string);
    await this.loginAdminPage.clickSignIn();
  } else if (userType.toLowerCase() === 'lender') {
    this.loginPage = new LoginPage(this.page);
    await this.loginPage.goto();
    await this.loginPage.enterUsername(process.env.LENDER_USER as string);
    await this.loginPage.enterPassword(process.env.LENDER_PASSWORD as string);
    await this.loginPage.clickSignIn();
  } else if (userType.toLowerCase() === 'borrower') {
    this.loginPage = new LoginPage(this.page);
    await this.loginPage.goto();
    await this.loginPage.enterUsername(process.env.BORROWER_USER as string);
    await this.loginPage.enterPassword(process.env.BORROWER_PASSWORD as string);
    await this.loginPage.clickSignIn();
  } else {
    throw new Error(`Tipo de usuario no soportado: ${userType}`);
  }
});

When('cierro el popup si está presente', async function () {
  this.popupPage = new PopupPage(this.page);
  await this.popupPage.closeIfPresent();
});

// Step para buscar lender desde admin y cambiar de contexto
When('busco y accedo al lender {string} desde admin', async function (lenderCode) {
  this.page = await this.loginAdminPage.searchLender(lenderCode);

  // 🔧 Instanciación de ambas páginas (ambas pueden coexistir)
  this.fciInvoicePage = new FciInvoicePage(this.page);
  this.fciInvoiceCardPage = new FciInvoiceCardPage(this.page);
});

// Step para navegar a la sección Fci Invoices
When('navego a la sección de Fci Invoices', async function () {
  await this.fciInvoiceCardPage.goToFciInvoices();
});

// Step para verificar la página de facturas
When('verifico que se muestra la página de facturas pendientes', async function () {
  await this.fciInvoiceCardPage.verifyPendingInvoicesLoaded();
});

// Step para seleccionar la primera factura de la tabla
When('selecciono la primera factura de la tabla', async function () {
  await this.fciInvoiceCardPage.selectFirstInvoiceCheckbox();
});
