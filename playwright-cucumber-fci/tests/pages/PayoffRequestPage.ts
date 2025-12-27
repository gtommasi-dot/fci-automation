import { Page } from 'playwright';

export class PayoffRequestPage {
  private page: Page;

  // Selector del link de Payoff Request en nav
  private payoffRequestNavBtn = 'xpath=//*[@id="root"]/nav[2]/div/a[7]';

  // Bloque principal de Payoff Request
  private mainBlock = 'h1:has-text("Payoff Request")';

  // Campos y controles del bloque
  private reasonDropdown = 'div.us-input__end-content'; // Ícono del dropdown Reason
  private reasonOption = (option: string) => `div.us-list-item:has(span.us-list-item__title:has-text("${option}"))`;
  private estimatedPayoffInput = 'xpath=//*[@id=":rm:-accessibility-id"]';
  private expirationDateInput = 'xpath=//*[@id=":ro:-accessibility-id"]';
  private commentsTextarea = "xpath=//textarea[@role='textbox' and contains(@class, 'k-input-inner')]"; // El id contiene ":" y debe escaparse con "\\"
  private submitBtn = 'xpath=//*[@id="root"]/main/div/div[2]/div/div/div/div[2]/div/form/div/div[7]/button';

  // Property checkboxes
  private propertyTable = 'table.us-table';
  private propertyCheckboxes = 'table.us-table input[type="checkbox"]';

  // Popups de resultado
  private popupSuccess = 'div.toast.toast-success .toast-message:has-text("Payoff Request has been successfully sent to your lender.")';
  private popupAlreadyDone = 'div.toast.toast-error .toast-message:has-text("already a Payoff Request active")';
  private popupError = 'div.toast.toast-error .toast-message:has-text("error has occurred")';

  constructor(page: Page) {
    this.page = page;
  }

  async goToPayoffRequestSection() {
    await this.page.waitForSelector(this.payoffRequestNavBtn, { state: 'visible', timeout: 10000 });
    await this.page.click(this.payoffRequestNavBtn);
    await this.page.waitForSelector(this.mainBlock, { state: 'visible', timeout: 10000 });
  }

  async verifyPayoffFields() {
    // Reason
    await this.page.waitForSelector(this.reasonDropdown, { state: 'visible', timeout: 10000 });
    // Estimated Payoff Date
    await this.page.waitForSelector(this.estimatedPayoffInput, { state: 'visible', timeout: 10000 });
    // Expiration Date
    await this.page.waitForSelector(this.expirationDateInput, { state: 'visible', timeout: 10000 });
    // Property table/checkboxes (puede que no estén)
    if (await this.page.isVisible(this.propertyTable).catch(() => false)) {
      await this.page.waitForSelector(this.propertyCheckboxes, { state: 'visible', timeout: 5000 }).catch(() => {});
    }
    // Comments
    await this.page.waitForSelector(this.commentsTextarea, { state: 'visible', timeout: 10000 });
    // Submit
    await this.page.waitForSelector(this.submitBtn, { state: 'visible', timeout: 10000 });
  }

  async selectReason(option: string) {
    await this.page.click(this.reasonDropdown);
    await this.page.waitForSelector(this.reasonOption(option), { state: 'visible', timeout: 5000 });
    await this.page.click(this.reasonOption(option));
  }

  async writeRandomComment() {
    const randomComment = `Test comment ${Math.floor(Math.random() * 100000)}`;
    await this.page.fill(this.commentsTextarea, randomComment);
  }

  async submitRequest() {
    await this.page.click(this.submitBtn);
  }

  async validatePayoffResultPopup(
    timeoutMs = 20000
  ): Promise<"success" | "alreadyActive" | "error"> {
    console.log("⏳ Esperando popup de resultado de Payoff...");

    const start = Date.now();

    const candidates: Array<{ key: "success" | "alreadyActive" | "error"; selector: string }> = [
      { key: "success", selector: this.popupSuccess },
      { key: "alreadyActive", selector: this.popupAlreadyDone },
      { key: "error", selector: this.popupError },
    ];

    // Polling corto para detectar el primero que aparezca (sin esperar 20s por cada selector)
    while (Date.now() - start < timeoutMs) {
      for (const c of candidates) {
        const isVisible = await this.page.isVisible(c.selector).catch(() => false);

        if (isVisible) {
          const msg = (await this.page.locator(c.selector).first().textContent().catch(() => ""))
            ?.replace(/\s+/g, " ")
            .trim();

          if (c.key === "success") {
            console.log(`✅ Popup SUCCESS detectado. ${msg ? `Texto: "${msg}"` : ""}`);
          } else if (c.key === "alreadyActive") {
            console.warn(`⚠️ Popup ALREADY ACTIVE detectado. ${msg ? `Texto: "${msg}"` : ""}`);
          } else {
            console.error(`❌ Popup ERROR detectado. ${msg ? `Texto: "${msg}"` : ""}`);
          }

          return c.key;
        }
      }

      await this.page.waitForTimeout(250);
    }

    // Debug si no apareció ninguno
    await this.page.screenshot({ path: `debug-payoff-popup-${Date.now()}.png`, fullPage: true });
    throw new Error("❌ No apareció ningún popup esperado tras enviar Payoff (success / alreadyActive / error).");
  }

}
