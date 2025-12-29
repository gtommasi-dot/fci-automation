// tests/steps/ui/drawRequest.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { DrawRequestPage } from '../../pages/DrawRequestPage';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {}
  }
  // @ts-ignore
  interface World {
    page: import('@playwright/test').Page;
    drawRequestPage?: DrawRequestPage;
  }
}

When('navego a Draw Request', async function () {
  this.drawRequestPage = new DrawRequestPage(this.page);
  await this.drawRequestPage.goToDrawRequestAndVerify();
});

When('abro el modal de New DrawLoan', async function () {
  await this.drawRequestPage!.openNewDrawLoanModal();
});

When(
  'completo el formulario con Loan {string}, Account {string}, Amount {int} y Comments {string}',
  async function (loanNumber: string, investorAccount: string, amount: number, comments: string) {
    await this.drawRequestPage!.fillModalAndConfirm(loanNumber, investorAccount, amount, comments);
  }
);

Then(
  'debería ver la nueva fila con Loan {string}, Account {string} y Amount mínimo {int}',
  async function (loanNumber: string, investorAccount: string, minAmount: number) {
    await this.drawRequestPage!.expectRowAppears(loanNumber, investorAccount, minAmount);
  }
);
