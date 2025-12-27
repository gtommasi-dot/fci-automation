import { When, Then } from '@cucumber/cucumber';
import { DrawRequestPage } from '../../pages/DrawRequestPage';

When('navego a Draw Request', async function () {
  const dr = new DrawRequestPage(this.page);
  await dr.goToDrawRequestAndVerify();
});

When('abro el modal de New DrawLoan', async function () {
  const dr = new DrawRequestPage(this.page);
  await dr.openNewDrawLoanModal();
});

When(
  'completo el formulario con Loan {string}, Account {string}, Amount {int} y Comments {string}',
  async function (loanNumber: string, investorAccount: string, amount: number, comments: string) {
    const dr = new DrawRequestPage(this.page);
    await dr.fillModalAndConfirm(loanNumber, investorAccount, amount, comments);
  }
);

Then(
  'debería ver la nueva fila con Loan {string}, Account {string} y Amount mínimo {int}',
  async function (loanNumber: string, investorAccount: string, minAmount: number) {
    const dr = new DrawRequestPage(this.page);
    await dr.expectRowAppears(loanNumber, investorAccount, minAmount);
  }
);
