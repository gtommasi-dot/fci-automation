// tests/steps/ui/ocr.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { OcrPage } from '../../pages/OcrPage';

declare global {
  // @ts-ignore
  interface World {
    page: import('@playwright/test').Page;
    ocrPage?: OcrPage;
  }
}

Given('voy a OCR Check Groups desde el menú', async function () {
  this.ocrPage = new OcrPage(this.page);
  await this.ocrPage.openSidebar();
  await this.ocrPage.expandOcrPaymentMenu();
  await this.ocrPage.goToOcrCheckGroups();
});

When('abro el modal New Split Image y subo el archivo {string}', async function (relativeFilePath: string) {
  const ocr = this.ocrPage!;
  await ocr.clickNewButton();
  await ocr.uploadTiffFromAssets(relativeFilePath);
});


When('ejecuto Split Image and Generate', async function () {
  await this.ocrPage!.splitImageAndGenerate();
});

Then('veo la página de información del split con los campos básicos', async function () {
  await this.ocrPage!.assertInfoAfterSplit();
});

When('regreso a OCR Check Groups', async function () {
  await this.ocrPage!.returnToGroups();
});

When('entro a Details del primer registro', {timeout: 30000} , async function () {
  await this.ocrPage!.clickFirstRowDetails();
});

When('abro Info del primer check', async function () {
  await this.ocrPage!.clickFirstInfoInDetails();
});

Then('veo los bloques Pending Task, Loan y OCR Image', async function () {
  await this.ocrPage!.assertThreeBlocksPresent();
});

When('selecciono la cuenta {string} en el combobox Loan', async function (accountValue: string) {
  await this.ocrPage!.selectAccount(accountValue);
});

When('ingreso el Total Amount {int}', async function (amount: number) {
  await this.ocrPage!.setTotalAmount(amount);
});

Then('veo el bloque de resumen verde y registro sus datos en consola', async function () {
  await this.ocrPage!.verifyAndLogGreenSummary();
});
