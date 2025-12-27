// tests/steps/boardingPortal.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect, Page } from '@playwright/test';
import { BoardingPortalPage } from '../../pages/BoardingPortalPage';

let loanAccountRemembered = '';

Given('que estoy en All Boarding del Portal', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.gotoAllBoarding();
});

When('abro el boarding del PrevAccount {string}', async function (prevAccount: string) {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.openBoardingRowByPrevAccount(prevAccount);
  await portal.waitForBoardingDetailLoaded();
});

Then('recuerdo el Loan Account mostrado en el header', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  loanAccountRemembered = await portal.getLoanAccountFromHeader();
  expect(loanAccountRemembered).toBeTruthy();
});

When(
  'completo el bloque Add Investor Charge con Payment Code {string}, Period {string} y Unit Price en {int}',
  async function (paymentCode: string, period: string, increments: number) {
    const page = this.page!;
    const portal = new BoardingPortalPage(page);
    await portal.goToInvestorTab(); // ← ahora espera al bloque Add Investor Charge visible
    await portal.fillInvestorCharge({ paymentCode, periodText: period, unitPriceIncrements: increments });
  }
);

When('guardo la carga del Investor y confirmo el modal', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.saveInvestorChargeAndConfirm();
});

When('expando el panel derecho y marco que ya recibimos los documentos pendientes', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.expandRightPanel();
  await portal.goToPendingDocumentsTab();
  await portal.confirmAllPendingDocumentsAndWaitProcessing();
});

When('completo el Pre-Boarding', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.goToLoanTab();
  await portal.completePreBoardingAndWaitSuccess();
});

When('abro Email Log y firmo Setup Form del Broker', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);

  await portal.gotoEmailLog();
  await portal.openEmailLogModalByAccount('V1908510');
  const docTarget = await portal.clickDocLinkInEmailModal('Setup From'); // tolera Form/From

  await portal.docSignFlow({ target: docTarget, editInfoValue: 'Broker', signButtonsCount: 3 });

  // Si fue popup (Page), lo cierro
  if ((docTarget as any).close) {
    await (docTarget as import('@playwright/test').Page).close().catch(() => {});
  }

  // Cierro modal
  await page.locator('.us-modal .us-modal-header__end-content svg').click();
});


When('firmo los dos documentos del Lender desde Email Log', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);

  await portal.openEmailLogModalByAccount('2201524');

  const lsaTarget = await portal.clickDocLinkInEmailModal('Loan Servicing Agreement');
  await portal.docSignFlow({ target: lsaTarget, editInfoValue: 'Lender', signButtonsCount: 4 });
  if ((lsaTarget as any).close) await (lsaTarget as import('@playwright/test').Page).close().catch(() => {});

  const setupTarget = await portal.clickDocLinkInEmailModal('Setup Form');
  await portal.docSignFlow({ target: setupTarget, editInfoValue: 'Lender', signButtonsCount: 3 });
  if ((setupTarget as any).close) await (setupTarget as import('@playwright/test').Page).close().catch(() => {});

  await page.locator('.us-modal .us-modal-header__end-content svg').click();
});


When('finalizo el boarding a Centurion', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.gotoFinalBoarding();
  await portal.markRowAndBoardToCenturion();
});

Then('verifico en Migration History que el Loan Account migró con éxito', async function () {
  const page = this.page!;
  const portal = new BoardingPortalPage(page);
  await portal.gotoMigrationHistory();
  await portal.assertMigrationRow(loanAccountRemembered);
});


// ——— Portal: PreBoarding
Then('voy a PreBoarding del Portal', async function () {
  this.portalPage = this.portalPage ?? new BoardingPortalPage(this.page);
  await this.portalPage.gotoPreBoarding();
});

When('selecciono la primera fila en PreBoarding y guardo el PrevAccount', async function () {
  const prev = await this.portalPage.selectFirstPreBoardingRow();
  this.prevAccountSaved = prev;
});



Then('proceso los Pre-Boardings seleccionados', async function () {
  await this.portalPage.clickProcessingPreBoardingAndWaitSuccess();
});

// ——— Portal: AllBoarding → abrir por PrevAccount
When('abro el boarding desde AllBoarding usando el PrevAccount guardado', async function () {
  const prev = this.prevAccountSaved!;
  expect(prev).toBeTruthy();
  await this.portalPage.gotoAllBoarding();
  await this.portalPage.openBoardingRowByPrevAccount(prev);
  await this.portalPage.waitForBoardingDetailLoaded();
});

// ——— Portal: Investor (usas tus propios steps existentes si quieres)
// Aquí solo dejo dos pasos utilitarios por si prefieres llamarlos directo:
Then('voy a la pestaña Investor del boarding', async function () {
  await this.portalPage.goToInvestorTab();
});

When(
  'completo Add Investor Charge con Payment Code {string}, Period {string} y Unit Price en {int}',
  async function (paymentCode: string, periodText: string, unitPrice: number) {
    await this.portalPage.fillInvestorCharge({ paymentCode, periodText, unitPriceIncrements: unitPrice });
  }
);

// ——— Portal: Loan + Complete Boarding
Then('voy a la pestaña Loan del boarding', async function () {
  await this.portalPage.goToLoanTab();
});

Then('sincronizo Interest Paid To con First Payment', async function () {
  await this.portalPage.syncInterestPaidToFirstPayment();
});

Then('finalizo el boarding cuando los documentos ya existen', async function () {
  await this.portalPage.completeBoardingWhenDocsAlreadyGenerated();
});

// ——— Portal: FinalBoarding y Migration History
Then('en FinalBoarding marco la fila por PrevAccount y boardeo a Centurion', async function () {
  await this.portalPage.checkFinalBoardingRowByPrevAccount(this.prevAccountSaved!);
  await this.portalPage.markRowAndBoardToCenturion();
});

Then('en Migration History verifico Migrated Success por PrevAccount', async function () {
  await this.portalPage.assertMigrationRowByPrev(this.prevAccountSaved!);
});