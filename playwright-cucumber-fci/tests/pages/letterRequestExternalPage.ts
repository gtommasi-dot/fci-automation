import { Page, BrowserContext, expect } from "@playwright/test";

export class LetterRequestExternalPage {
  constructor(private page: Page, private context: BrowserContext) {}

  // --- Locators iniciales ---
  private loanInput = this.page.locator("input.us-input__field").nth(0);
  private zipInput = this.page.locator("input.us-input__field").nth(1);
  private tinInput = this.page.locator("input.us-input__field").nth(2);
  private verifyButton = this.page.locator("button.us-button:has-text('Verify')");

  async goto() {
    await this.page.goto("https://tblis.myfci.com/payoffRequestLetter");
    await expect(this.verifyButton).toBeVisible({ timeout: 25000 });
  }

  async fillInitialForm(loan: string, zip: string, tin: string) {
    await this.loanInput.fill(loan);
    await this.zipInput.fill(zip);
    await this.tinInput.fill(tin);
    await this.verifyButton.click();
  }

  async validateBlocks(loan: string) {
  // Espera explícita al bloque principal
  await this.page.waitForSelector("span.text-black.text-center", { timeout: 25000 });
  await expect(this.page.locator("span.text-black.text-center"))
    .toContainText("Payoff Request", { timeout: 25000 });

  // Loan number dinámico
  await this.page.waitForSelector("p.ms-2", { timeout: 25000 });
  await expect(this.page.locator("p.ms-2"))
    .toContainText(loan, { timeout: 25000 });

  // Bloque 2
  await this.page.waitForSelector("h2:has-text('Complete the fields')", { timeout: 25000 });
  await expect(this.page.locator("h2", { hasText: "Complete the fields" }))
    .toBeVisible({ timeout: 25000 });

  // Bloque 3
  await this.page.waitForSelector("h5:has-text('Loan Information')", { timeout: 25000 });
  await expect(this.page.locator("h5", { hasText: "Loan Information" }))
    .toBeVisible({ timeout: 25000 });

  console.log("✅ Bloques de Letter validados correctamente");
}


async fillLetterFormRandom(authType: string) {
  // Reason
  await this.page.locator("div.form-group", { hasText: "Reason" }).locator("div.us-input").click();
  await this.page.locator(".us-list-item__title", { hasText: "Payoff" }).click();
  await this.page.waitForTimeout(400);

  // Requestor Company
  await this.page.locator("div.form-group", { hasText: "Requestor Company" }).locator("input.us-input__field")
    .fill("Company " + Math.random().toString(36).substring(7));
  await this.page.waitForTimeout(400);

  // Requestor Name
  await this.page.locator("div.form-group", { hasText: "Requestor Name" }).locator("input.us-input__field")
    .fill("Name " + Math.random().toString(36).substring(7));
  await this.page.waitForTimeout(400);

  // Phone Number
  await this.page.locator("div.form-group", { hasText: "Phone Number" }).locator("input.k-input-inner")
    .fill("123-456-7890");
  await this.page.waitForTimeout(400);

  // Email
  await this.page.locator("div.form-group", { hasText: "E-Mail" }).locator("input.us-input__field")
    .fill("test" + Date.now() + "@mail.com");
  await this.page.waitForTimeout(400);

  // Fax
  await this.page.locator("div.form-group", { hasText: "Requestor Fax" }).locator("input.us-input__field")
    .fill("123456");
  await this.page.waitForTimeout(400);

  // Who authorize
  await this.page.locator("div.form-group", { hasText: "Who authorize?" }).locator("div.us-input").click();
  await this.page.locator(".us-list-item__title", { hasText: authType }).click();
  await this.page.waitForTimeout(400);

  // Comments
  await this.page.locator("div.form-group", { hasText: "Comments" }).locator("textarea")
    .fill("Comentario " + Math.random().toString(36).substring(7));
  await this.page.waitForTimeout(400);
}



  async submitLetterRequest() {
    await this.page.locator("button.us-button:has-text('Submit')").click();
  }

 async validateLoadingAndResult(): Promise<"success" | "alreadyActive"> {
  const loading = this.page.locator('.us-loading-screen__label');
  await expect(loading).toBeVisible({ timeout: 25000 });
  await expect(loading).toContainText(
    "We have received your third party authorization request",
    { timeout: 25000 }
  );

  const successMsg = this.page.locator('.us-result__title');
  const errorToast = this.page.locator('.toast-error .toast-message');

  try {
    // Esperar cualquiera de los dos posibles
    const text = await Promise.race([
      successMsg.textContent({ timeout: 20000 }).catch(() => null),
      errorToast.textContent({ timeout: 20000 }).catch(() => null),
    ]);

    if (text?.includes("sent to the Lender")) {
      console.log("✅ Letter enviado y confirmado por Lender.");
      return "success";
    } else if (text?.includes("sent to the Borrower")) {
      console.log("✅ Letter enviado y confirmado por Borrower.");
      return "success";
    } else if (text?.includes("sent to the Broker")) {
      console.log("✅ Letter enviado y confirmado por Broker.");
      return "success";
    } else if (text?.includes("already a Payoff Request active")) {
      console.log("⚠️ Letter ya estaba activo, no se pudo enviar de nuevo.");
      return "alreadyActive";
    } else {
      throw new Error(`Texto inesperado en resultado: ${text}`);
    }
  } catch {
    throw new Error("❌ No se encontró ni éxito ni error esperado en el Letter Request.");
  }
}



  async authorizeFromEmailLog(loan: string) {
    const adminPage = await this.context.newPage();
    await adminPage.goto("https://tfciportal.myfci.com/tools/emailLog");

    const row = adminPage.locator(`td:text-is("${loan}")`).first();
    await expect(row).toBeVisible({ timeout: 25000 });
    await row.dblclick();

    const modal = adminPage.locator(".us-modal-body");
    await expect(modal).toBeVisible({ timeout: 25000 });

    const iframe = modal.locator("iframe");
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error("No se pudo acceder al iframe del Email Log");

    const authLink = frame.locator("a.fci-button", { hasText: "Authorize here" });
    await expect(authLink).toBeVisible({ timeout: 20000 });

    const [newPage] = await Promise.all([
      this.context.waitForEvent("page"),
      authLink.click(),
    ]);

    await newPage.waitForLoadState("domcontentloaded");
    this.page = newPage;
  }

  async acceptTermsAndEditInfo() {
  const checkbox = this.page.locator('#accept-terms');
  await expect(checkbox).toBeVisible({ timeout: 30000 });
  await checkbox.click();
  console.log("✅ Checkbox marcado");

  const continueBtn = this.page.locator('button', { hasText: 'CONTINUE' });
  await expect(continueBtn).toBeEnabled({ timeout: 20000 });
  await continueBtn.click();
  console.log("✅ Botón CONTINUE presionado");

  // Esperar y hacer click en "Edit info"
  const editInfoBtn = this.page.locator('button', { hasText: 'Edit info' });
  await expect(editInfoBtn).toBeVisible({ timeout: 25000 });
  await editInfoBtn.click();
  console.log("✅ Botón Edit info presionado");

  // Modal de edición
  const clientNameInput = this.page.locator('.us-modal input.us-input__field');
  await expect(clientNameInput).toBeVisible({ timeout: 10000 });
  await clientNameInput.fill('Firma Automatizada QA Kraken');
  console.log("✍️ Nombre ingresado en Edit info");

  const acceptBtn = this.page.locator('.us-modal button', { hasText: 'Accept' });
  await expect(acceptBtn).toBeEnabled({ timeout: 5000 });
  await acceptBtn.click();
  console.log("✅ Botón Accept presionado");
}


async signDocument() {
  const signatureBoxes = this.page.locator('.us-visor-box');
  await expect(signatureBoxes.first()).toBeVisible({ timeout: 15000 });
  const count = await signatureBoxes.count();

  console.log(`🖊️ Encontrados ${count} campos de firma`);

  for (let i = 0; i < count; i++) {
    const box = signatureBoxes.nth(i);
    await box.scrollIntoViewIfNeeded();
    await box.click({ delay: 300 });
    await this.page.waitForTimeout(1000);
  }

  const submitBtn = this.page.locator('button', { hasText: 'SUBMIT APPROVAL' });
  await expect(submitBtn).toBeEnabled({ timeout: 20000 });
  await submitBtn.click();
  console.log("✅ SUBMIT APPROVAL presionado");

  const loadingLabel = this.page.locator('.us-loading-screen__label');
  await expect(loadingLabel).toBeVisible({ timeout: 20000 });

  // 🔧 Aceptamos varios resultados posibles
  const finalText = await loadingLabel.textContent({ timeout: 60000 });

  if (finalText?.includes('Loan has payoff demand task pending or active.')) {
    console.log("📄 Final: Loan has payoff demand task pending or active.");
  } else if (finalText?.includes('The document has been signed satisfactorily.')) {
    console.log("📄 Final: The document has been signed satisfactoriamente.");
  } else if (finalText?.includes('Signing document...')) {
    // Esperar a que cambie a uno de los textos finales
    await expect(loadingLabel).toHaveText(
      /Loan has payoff demand task pending or active.|The document has been signed satisfactorily./,
      { timeout: 60000 }
    );
    console.log("📄 Final alcanzado tras transición: " + await loadingLabel.textContent());
  } else {
    throw new Error(`❌ Texto inesperado al firmar documento: ${finalText}`);
  }
}



}
