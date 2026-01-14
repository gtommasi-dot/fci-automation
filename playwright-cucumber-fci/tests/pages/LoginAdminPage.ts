import { Page, expect } from '@playwright/test';

export class LoginAdminPage {
  private page: Page;

  // Selectors (ajusta según tu HTML real)
  private usernameInput = 'xpath=//*[@id="root"]/div/div/div/div[1]/div/form/div[1]/div/input';
  private passwordInput = 'xpath=//*[@id="root"]/div/div/div/div[1]/div/form/div[2]/div/input';
  private loginBtn = 'xpath=//*[@id="btnSignIn"]';
  private searchInput = '.form-row:has(:text("User Name")) input.us-input__field';
  private searchBtn = 'css=button.us-button:has-text("Search")';


  constructor(page: Page) {
    this.page = page;
  }

  // Ir al login del portal admin (ajusta URL según tu entorno real)
  async goto() {
    await this.page.goto(process.env.ADMIN_LOGIN_URL as string); // Por ejemplo: https://myfci.com/admin/login
    await this.page.waitForSelector(this.usernameInput, { state: 'visible', timeout: 30000 });
  }

  async enterUsername(username: string) {
    await this.page.fill(this.usernameInput, username);
  }

  async enterPassword(password: string) {
    await this.page.fill(this.passwordInput, password);
  }

 async clickSignIn() {
  await this.page.locator('#btnSignIn, button:has-text("Sign In")').first().click();

  // Espera “alguna” señal de login ok
  await Promise.race([
    this.page.locator('#dropdown-profile small').first().waitFor({ state: 'visible', timeout: 60000 }),
    this.page.waitForURL(/tfciportal\.myfci\.com\/(home|dashboard|tools|lender)/i, { timeout: 60000 }).catch(() => null),
    this.page.getByText(/Loan Portfolio|Tools|Email Log/i).first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => null),
  ]);

  await this.page.waitForLoadState('networkidle').catch(() => {});
}


  // Buscar un lender por nombre/código/ID
 async searchLender(lender: string): Promise<Page> {
    // 1. Esperar que la página esté cargada y el input visible
    await this.page.waitForTimeout(7000); // Espera un segundo para asegurar que la página está lista
    await this.page.waitForSelector(this.searchInput, { state: 'visible', timeout: 30000 });
    await this.page.fill(this.searchInput, lender);
    await this.page.click(this.searchBtn);

    // 2. Esperar a que la tabla de resultados esté cargada (primer tr dentro del tbody)
    await this.page.waitForSelector('tbody.k-table-tbody tr', { state: 'visible', timeout: 30000 });

    // 3. Esperar resultado visible y haz click en el lender (abre modal en la misma pestaña)
    await this.page.waitForSelector(`text=${lender}`, { timeout: 30000 });
    await this.page.click(`xpath=//tbody[@class='k-table-tbody']//tr[1]//td//span[@class='text-info' and contains(@style, 'cursor: pointer')]`);

    // 4. Espera el modal y haz click en "Yes" (esto abre la nueva pestaña)
    await this.page.waitForSelector('xpath=//*[@id="btnYes"]', { timeout: 30000 });

    // 5. Captura la nueva pestaña que se abrirá al hacer click en "Yes"
    const [newPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.page.click('xpath=//*[@id="btnYes"]'),
    ]);

    // 6. Espera a que cargue la nueva pestaña
    await newPage.waitForLoadState('domcontentloaded');

    // 7. Cierra la pestaña original (admin)
    await this.page.close();

    // 8. Actualiza el contexto a la nueva pestaña (ahora lender)
    this.page = newPage;
    return newPage;
}
}
