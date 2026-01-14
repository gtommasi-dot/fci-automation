import { expect, Page } from "@playwright/test";

export class PayoffRequestExternalPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Selectores Borrower ---
  get payoffTitle() {
    return this.page.locator("h1 span:text('Payoff Request')");
  }
  get loanNumberInput() {
    return this.page.locator("input.us-input__field").nth(0);
  }
  get propZipInput() {
    return this.page.locator("input.us-input__field").nth(1);
  }
  get tinInput() {
    return this.page.locator("input.us-input__field").nth(2);
  }
  get verifyButton() {
    return this.page.locator("button.us-button:has-text('Verify')");
  }

  get verifyCodeTitle() {
    return this.page.locator("h1 span:text('Verify Payoff Request Code')");
  }
  get codeInput() {
    return this.page.locator("input.us-input__field");
  }
  get verifyCodeButton() {
    return this.page.locator("button.us-button:has-text('Verify')");
  }

  get payoffHeaderBlock() {
    return this.page.locator("span.text-black:text('Payoff Request')");
  }
  get loanInfoBlock() {
    return this.page.locator("h5:text('Loan Information')");
  }
  get completeFieldsBlock() {
    return this.page.locator("h2:text('Complete the fields')");
  }

  // ⚠️ Locators específicos
  // Locators estrictos para Reason y Comments
get reasonDropdown() {
  return this.page.locator("div.form-group", { has: this.page.locator("div.col-form-label", { hasText: "Reason" }) })
                  .locator("div.us-input");
}

get reasonOptionPayoff() {
  return this.page.locator(".us-list-item__title", { hasText: "Payoff" });
}

get commentsTextarea() {
  return this.page.locator("div.form-group", { has: this.page.locator("div.col-form-label", { hasText: "Comments" }) })
                  .locator("textarea");
}

  get submitButton() {
    return this.page.locator("button.us-button:has-text('Submit')");
  }

  get loadingScreen() {
    return this.page.locator(".us-loading-screen__label");
  }
  get successToast() {
    return this.page.locator(".toast-success .toast-message");
  }
  get successResultBlock() {
    return this.page.locator(".us-result__title");
  }

  // --- Métodos Borrower ---
  async goto() {
    await this.page.goto("https://tblis.myfci.com/payoffRequestByBorrower");
  }

  async verifyPayoffPageVisible() {
    await expect(this.payoffTitle).toBeVisible({ timeout: 15000 });
  }

  async fillInitialForm(loan: string, zip: string, tin: string) {
    await this.loanNumberInput.fill(loan);
    await this.propZipInput.fill(zip);
    await this.tinInput.fill(tin);
    await this.verifyButton.click();
  }

  async verifyCodePageVisible() {
    await expect(this.verifyCodeTitle).toBeVisible({ timeout: 15000 });
  }

  async enterVerificationCode(code: string) {
    await this.codeInput.fill(code);
    await this.verifyCodeButton.click();
  }

  async validatePayoffBlocks(loan: string) {
    const payoffLoan = this.page.locator("p.fw-bold", { hasText: loan });

    await expect(this.payoffHeaderBlock).toBeVisible();
    await expect(payoffLoan).toHaveText(loan);
    await expect(this.loanInfoBlock).toBeVisible();
    await expect(this.completeFieldsBlock).toBeVisible();
  }

 async completePayoffForm(comment: string) {
  // --- Debug: contar locators antes de usarlos ---
  const reasonCount = await this.reasonDropdown.count();
  const commentsCount = await this.commentsTextarea.count();

  console.log("🔎 Reason dropdown encontrados:", reasonCount);
  console.log("🔎 Comments textarea encontrados:", commentsCount);

  // --- Delay de 3s para observar el DOM ---
  await this.page.waitForTimeout(3000);

  // Solo Reason
  await this.reasonDropdown.first().click();
  await this.reasonOptionPayoff.click();

  // Otro delay para ver selección
  await this.page.waitForTimeout(2000);

  // Solo Comments
  await this.commentsTextarea.first().fill(comment);

  // Delay antes de submit
  await this.page.waitForTimeout(2000);

  await this.submitButton.click();
}


  async waitForProcessingOrSuccess() {
    try {
      await expect(this.loadingScreen).toBeVisible({ timeout: 7000 });
      await expect(this.loadingScreen).not.toBeVisible({ timeout: 20000 });
    } catch {
      console.log("⚠️ Loading screen no detectado, se continúa a validación de éxito");
    }
  }

async validateResult() {
  const successToast = this.successToast;
  const errorToast = this.page.locator(".toast-error .toast-message").first();

  // ✅ Caso ÉXITO
  const successVisible = await successToast.isVisible({ timeout: 5000 }).catch(() => false);
  if (successVisible) {
    await expect(successToast).toContainText("Payoff Request has been successfully sent");
    await expect(this.successResultBlock).toContainText("Payoff Request has been successfully sent");
    console.log("✅ Payoff enviado con éxito");
    return;
  }

  // ⚠️ Caso ERROR (aceptamos múltiples mensajes)
  const errorVisible = await errorToast.isVisible({ timeout: 5000 }).catch(() => false);
  if (errorVisible) {
    const msg = ((await errorToast.textContent().catch(() => "")) || "").trim();

    // Lista de mensajes aceptados (pueden variar)
    const acceptedPatterns: RegExp[] = [
      /There is already a Payoff Request active/i,
      /Loan has payoff demand task pending or active/i,
      /payoff.*(pending|active)/i, // fallback más flexible por si cambian el wording
    ];

    const matched = acceptedPatterns.some((re) => re.test(msg));

    if (!matched) {
      throw new Error(`❌ Toast de error inesperado en Payoff: "${msg}"`);
    }

    console.log(`⚠️ Payoff ya estaba activo/pending (toast): "${msg}"`);
    return;
  }

  // ❌ Nada apareció
  throw new Error("❌ No apareció ni el toast de éxito ni el toast de error");
}


}
