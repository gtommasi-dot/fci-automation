// tests/steps/ui/drawRequest.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { DataTable } from '@cucumber/cucumber';
import path from 'path';
import { DrawRequestPage } from '../../pages/DrawRequestPage';
import { expect } from '@playwright/test';

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


When('abro el modal de Bulk Draw Request', async function () {
  await this.drawRequestPage!.openBulkDrawRequestModal();
});

When('cargo el archivo de Bulk Draw Request desde assets', async function () {
  // ✅ robusto para Windows/CI: usar ruta relativa dentro del repo
  const filePath = path.resolve(
    process.cwd(),
    'tests',
    'assets',
    'drawRequest',
    'plantilla drawLoan 2.xlsx'
  );

  await this.drawRequestPage!.uploadBulkDrawFile(filePath);
});

Then('debería ver {int} filas cargadas en el modal de Bulk Draw Request', async function (expectedCount: number) {
  await this.drawRequestPage!.expectBulkModalRowCount(expectedCount);
});

When('selecciono Select All en el modal de Bulk Draw Request', async function () {
  await this.drawRequestPage!.bulkSelectAll();
});

When('confirmo Load Draw Loan y espero el cierre del modal', async function () {
  await this.drawRequestPage!.bulkLoadDrawLoanAndWaitClose();
});

Then(
  'debería ver en la grilla de Draw Request los loans cargados:',
  async function (table: DataTable) {
    const rows = table.hashes() as Array<{ LoanNumber: string; InvestorAccount: string; MinAmount: string }>;

    await this.drawRequestPage!.expectRowsInMainGrid(
      rows.map(r => ({
        loanNumber: r.LoanNumber,
        investorAccount: r.InvestorAccount,
        minAmount: Number(r.MinAmount),
      }))
    );
  }
);