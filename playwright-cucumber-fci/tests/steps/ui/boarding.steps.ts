import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BoardingPage } from '../../pages/BoardingPage';


When('navego a la sección de Boarding Portfolio', async function () {
    this.boardingPage = new BoardingPage(this.page);
    await this.boardingPage.goToBoardingPortfolio();
});

When('inicio el proceso de nuevo boarding', async function () {
    await this.boardingPage.clickAddNewLoan();
});
When('completo la tab Previous del boarding wizard', async function () {
    await this.boardingPage.fillPreviousTab('Test-Board-001');
});

When('completo la tab Investor del boarding wizard', async function () {
    await this.boardingPage.fillInvestorTab();
});

When('completo la tab Broker del boarding wizard', async function () {
    await this.boardingPage.fillBrokerTab();
});

When('completo la tab Borrower del boarding wizard', async function () {
    await this.boardingPage.fillBorrowerTab();
});

When('completo la tab Property del boarding wizard', async function () {
    await this.boardingPage.fillPropertyTab();
});

When('completo la tab Loan y guardo el boarding', async function () {
    await this.boardingPage.fillLoanTabAndSave();
});

Then('valido el popup de éxito de boarding', async function () {
    await this.boardingPage.validateBoardingSuccessPopup();
});
