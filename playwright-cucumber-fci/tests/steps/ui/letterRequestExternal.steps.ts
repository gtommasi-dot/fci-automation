import { Given, When, Then } from "@cucumber/cucumber";
import { LetterRequestExternalPage } from "../../pages/letterRequestExternalPage";

let authorizationType: string;

Given("que abro la página de Letter Request External", async function () {
  this.letter = new LetterRequestExternalPage(this.page, this.context);
  await this.letter.goto();
});

When(
  "completo el formulario inicial de Letter con {string} {string} {string}",
  async function (loan: string, zip: string, tin: string) {
    this.loanNumber = loan; // guardamos loan en contexto para pasos siguientes
    await this.letter.fillInitialForm(loan, zip, tin);
  }
);

Then(
  "verifico los bloques de Letter con el loan guardado {string}",
  async function (loan: string) {
    await this.letter.validateBlocks(loan);
  }
);

When("completo el formulario de Letter con {string}", async function (authType: string) {
  authorizationType = authType;
  await this.letter.fillLetterFormRandom(authType);
});

When("envío el Letter Request", async function () {
  await this.letter.submitLetterRequest();
});

Then("valido el resultado del Letter Request", { timeout: 40000 }, async function () {
  const result = await this.letter.validateLoadingAndResult();

  if (result === "alreadyActive") {
    console.log("⏭️ Test terminado anticipadamente porque ya había un request activo.");
    this.skipScenario = true; // bandera para cortar pasos posteriores
    return;
  }
});

When("navego a Email Log y autorizo el Letter {string}", async function (loan: string) {
  if (this.skipScenario) {
    return; // si ya estaba activo, no seguimos
  }
  await this.letter.authorizeFromEmailLog(loan);
});

Then("firmo el documento y valido el mensaje final", async function () {
  if (this.skipScenario) {
    return; // cortamos flujo si ya estaba activo
  }
  await this.letter.acceptTermsAndEditInfo(); 
  await this.letter.signDocument();            
});
