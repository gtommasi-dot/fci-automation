import { Given, Then, When } from '@cucumber/cucumber';
import { BoardingAiPage } from '../../pages/BoardingAiPage';
import { Locator, expect } from '@playwright/test';

let boarding: BoardingAiPage;

Given('que ingreso a la página de Boarding', async function () {
  boarding = new BoardingAiPage(this.page);
  await boarding.goToBoardingPage();
});

Then('debería ver el título {string}', async function (titulo: string) {
  await boarding.verifyStepTitle(titulo);
});

When('ingreso el número de cuenta {string} y hago clic en Buscar', async function (account: string) {
  await boarding.fillAccountAndSearch(account);
});

Then('espero que se valide el número de cuenta', async function () {
  await boarding.waitForValidationIcon();
});

Then('hago clic en el botón Next', async function () {
  await boarding.clickNext();
});1

Then('debería ver los siguientes textos:', async function (dataTable) {
  const texts = dataTable.raw().flat();
  await boarding.verifyTextsPresent(texts);
});

Then('debería ver el Boarding Tracker Code en consola', async function () {
  await boarding.verifyBoardingTrackerCode();
});

Then('verifico el bloque de documentos requeridos', async function () {
  await boarding.verifyDocumentUploadBlock();
});

When('subo los documentos requeridos', async function () {
  await boarding.uploadDocuments(['HUD-1.pdf', 'Note.pdf', 'Mortgage.pdf']);
  /*await boarding.uploadDocuments([
    'C:/Archivos Test/Boarding/HUD-1.pdf',
    'C:/Archivos Test/Boarding/Mortgage.pdf',
    'C:/Archivos Test/Boarding/Note.pdf'
  ]);*/
});

Then('los documentos deberían haberse subido correctamente', async function () {
  await boarding.verifyDocumentsUploaded(3);
});

Then('verifico opciones Yes y No en el paso', async function () {
  await boarding.verifyRadioOptions(['Yes', 'No']);
});

Then('verifico opciones Yes y No con nota en el paso', async function () {
  await boarding.verifyRadioOptions([
    'Yes (Please provide supporting materials when uploading documents)',
    'No'
  ]);
});

Then('completo la información del prestatario', async function () {
  await boarding.fillBorrowerFields();
});

Then('verifico los bloques del paso 10', async function () {
  await boarding.verifyBlocksPresent([
    '//*[@id="questionBoarding"]/div[3]/div/div[1]',
    '//*[@id="questionBoarding"]/div[3]/div/div[2]',
    '//*[@id="questionBoarding"]/div[3]/div/div[3]'
  ]);
});

Then('selecciono la opción either en todos los campos', async function () {
  await boarding.fillFundingAndFirstPaymentDates();
  await boarding.selectEitherInAuthorizationsApprovals();
});

Then('realizo la firma', async function () {
  await boarding.signAndSave();
});

Then('proceso y firmo el LSA', async function () {
  await boarding.waitLsaProcessingAndOpenEditInfo(); // tu método que espera el WIP y hace click en "Edit info"
  await boarding.fillEditInformationAndAccept();     // << el de arriba
  await boarding.signDocPlaceholdersAndSubmit();
  await boarding.verifySuccessAndGoToMyFci();  // tu método que hace los 4 clicks y "Submit approval"
});

// === Step 1: selecciono "No" (segundo radio) y espero el formulario ===
When('selecciono que no tengo cuenta de lender', async function () {
  await boarding.selectNoLenderAndWaitForm();
});


// === Completar datos básicos del nuevo lender ===
When('completo el formulario básico del nuevo lender', async function () {
  await boarding.fillNewLenderBasicInfo();
});

// === Modal de pago ===
Then('espero que el modal de Pay By Credit Card esté cargado', async function () {
  await boarding.waitForPayByCardModal();
});

// === Pago con tarjeta ===
When('completo los datos de tarjeta {string} y pago', async function (cardType: string) {
  await boarding.fillCardFormAndPay(cardType);
  // submitCreditCard ya espera hasta ~90s y cierra el modal si corresponde.
});

// === Selección de estado en Property Details (Step 10) ===
Then('selecciono el estado {string} en Property Details', async function (state: string) {
  await boarding.selectStateInStep10(state);
  // sanity check opcional: validar que el input quedó con el valor correcto
  await expect(boarding.stateCombobox()).toHaveValue(/georgia/i, { timeout: 20000 });
});

When(
  'en el Step 5 selecciono Yes, ingreso el broker {string} y busco',
  async function (this: any, brokerCode: string) {
    const boarding = new BoardingAiPage(this.page);

    await boarding.step5_selectYes();
    await boarding.step5_waitModalVisible();

    await boarding.step5_fillBrokerAccount(brokerCode);
    await boarding.step5_clickSearchBroker();

    await boarding.step5_waitBrokerDataLoaded(brokerCode);
  }
);

Then(
  'debería verse el modal de broker con datos cargados para {string}',
  async function (this: any, brokerCode: string) {
    const boarding = new BoardingAiPage(this.page);
    await boarding.step5_assertBrokerDataPopulated(brokerCode);
  }
);

When(
  'en el Step 5 habilito "Is there a yield spread..." en Yes y coloco {string} por ciento',
  async function (this: any, pct: string) {
    const boarding = new BoardingAiPage(this.page);
    await boarding.step5_enableYieldSpreadYes();
    await boarding.step5_setYieldSpreadPercent(pct); // ej: "15"
  }
);

When(
  'en el Step 5 habilito "Is the broker due a servicing fee..." en Yes',
  async function (this: any) {
    const boarding = new BoardingAiPage(this.page);
    await boarding.step5_enableServicingFeeYes();
  }
);

When(
  'en el Step 5 incremento por teclado los campos "Principal Balance %", "Plus Amount" y "Minimun"',
  async function (this: any) {
    const boarding = new BoardingAiPage(this.page);
    await boarding.step5_bumpPrincipalPlusMin();
  }
);

Then('en el Step 10 si Appraiser Market Value es 0 ingreso un monto aleatorio', async function () {
  await boarding.ensureAppraiserMarketValueNonZero(); // usa el POM
});



