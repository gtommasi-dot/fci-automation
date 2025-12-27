import { Given, When, Then } from "@cucumber/cucumber";
import { PayoffRequestExternalPage } from "../../pages/payoffRequestExternalPage";
import { expect } from "@playwright/test";

let verificationCode = "";
const randomComment = "Automated test comment - " + Date.now();

let borrowerPage: any;
let adminPage: any;

Given("que abro la página de Payoff Request External", async function () {
  borrowerPage = this.page;
  this.payoff = new PayoffRequestExternalPage(borrowerPage);
  await this.payoff.goto();
  await this.payoff.verifyPayoffPageVisible();
});

When(
  "completo el formulario inicial de payoff con {string} {string} {string}",
  async function (loan: string, zip: string, tin: string) {
    // Guardamos para reutilizar en otros steps
    this.loan = loan;
    this.zip = zip;
    this.tin = tin;

    await this.payoff.fillInitialForm(loan, zip, tin);
    await this.payoff.verifyCodePageVisible();
  }
);


When("abro una pestaña de admin y busco el código de verificación", async function () {
  // --- Nueva pestaña para admin ---
  adminPage = await this.context.newPage();
  this.page = adminPage; // ⚠️ reasignamos para que funcione con el step "Given que ingreso al sistema como 'admin'"
});

When(
  "navego a Email Log y obtengo el código del loan {string}",
  async function (loan: string) {
    await this.page.goto("https://tfciportal.myfci.com/tools/emailLog");

    const row = this.page.locator(`td:text-is("${loan}")`).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.dblclick();

    const modal = this.page.locator(".us-modal-body");
    await expect(modal).toBeVisible({ timeout: 15000 });

    const iframe = modal.locator("iframe");
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error("No se pudo acceder al iframe del Email Log");

    const codeElement = frame.locator("p", { hasText: "Code:" });
    await expect(codeElement).toBeVisible({ timeout: 10000 });

    const text = await codeElement.textContent();
    if (!text) throw new Error("No se encontró el texto con el Code");

    const match = text.match(/\d+/);
    if (!match) throw new Error("No se pudo extraer el número de código");

    verificationCode = match[0];

    await adminPage.close();
    this.page = borrowerPage;
  }
);


When("ingreso el código de verificación en borrower", async function () {
  await this.payoff.enterVerificationCode(verificationCode);
});

Then(
  "valido que los bloques de payoff se muestren correctamente para {string}",
  async function (loan: string) {
    await this.payoff.validatePayoffBlocks(loan);
  }
);

When("completo el formulario de payoff y lo envío", async function () {
  await this.payoff.completePayoffForm(randomComment);
  await this.payoff.waitForProcessingOrSuccess();
});

Then("valido el mensaje de éxito del payoff", async function () {
  await this.payoff.validateResult();
});


