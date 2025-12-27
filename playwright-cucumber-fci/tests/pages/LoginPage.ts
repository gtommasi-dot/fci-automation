import { Page, BrowserContext, Locator } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config();

export class LoginPage {
  private page: Page;

  // ====== Selectors Login ======
  private usernameInput = '//*[@id="root"]/div[2]/div[2]/form/div[1]/input';
  private passwordInput = '//*[@id="root"]/div[2]/div[2]/form/div[2]/div/input';
  private signInButton  = '//*[@id="root"]/div[2]/div[2]/form/button';

  // ====== Selectors OTP ======
  private otpContainer: Locator;
  private otpInputs: Locator;

  constructor(page: Page) {
    this.page = page;

    // OTP UI
    this.otpContainer = page.locator('.containerVerifyCode, .containerLogin.containerVerifyCode');
    this.otpInputs    = page.locator('input[aria-label^="Please enter OTP character"]');
  }

  async goto() {
    await this.page.goto(process.env.BASE_URL as string, { timeout: 20000 });
    await this.page.waitForLoadState('networkidle');
  }

  async enterUsername(username: string) {
    await this.page.waitForSelector(this.usernameInput, { state: 'visible', timeout: 20000 });
    await this.page.fill(this.usernameInput, username);
  }

  async enterPassword(password: string) {
    await this.page.waitForSelector(this.passwordInput, { state: 'visible', timeout: 20000 });
    await this.page.fill(this.passwordInput, password);
  }

  async clickSignIn() {
    await this.page.waitForSelector(this.signInButton, { state: 'visible', timeout: 20000 });
    await this.page.click(this.signInButton);
  }

  // ====== NUEVO: esperar pantalla OTP ======
  async waitForOtpScreen(timeout = 30000) {
    await this.otpContainer.waitFor({ state: 'visible', timeout });
    await this.page.getByText('verification code', { exact: false }).waitFor({ state: 'visible', timeout });
  }

  // ====== NUEVO: completar OTP ======
  async fillOtp(code: string) {
    const clean = code.trim();
    if (!/^[A-Za-z0-9]{6}$/.test(clean)) {
      throw new Error(`OTP inválido: "${code}"`);
    }
    const count = await this.otpInputs.count();
    if (count < 6) throw new Error(`Se esperaban 6 inputs OTP, encontrados: ${count}`);

    const chars = clean.split('');
    for (let i = 0; i < 6; i++) {
      await this.otpInputs.nth(i).fill(chars[i]);
    }
  }

  // ====== NUEVO: obtener OTP desde Admin > Email Log y devolverlo ======
  async fetchOtpFromAdminEmailLog(context: BrowserContext): Promise<string> {
    const adminPage = await context.newPage();

    // 1) Login admin
    await adminPage.goto(process.env.ADMIN_LOGIN_URL as string, { timeout: 30000 });
    await adminPage.locator('input[type="text"], input[name="username"]').first().fill(process.env.ADMIN_USER as string);
    await adminPage.locator('input[type="password"], input[name="password"]').first().fill(process.env.ADMIN_PASSWORD as string);
    await adminPage.locator('#btnSignIn, button:has-text("Sign In")').first().click();
    await adminPage.locator('#dropdown-profile small, nav >> small').first().waitFor({ state: 'visible', timeout: 20000 });

    // 2) Ir a Email Log
    await adminPage.goto('https://tfciportal.myfci.com/tools/emailLog', { timeout: 30000 });
    await adminPage.locator('tbody.k-table-tbody tr').first().waitFor({ state: 'visible', timeout: 20000 });

    // 3) Buscar fila por Type = "Verification Code to login" y abrir modal (doble click)
    const row = adminPage.locator('tbody.k-table-tbody tr', { hasText: 'Verification Code to login' }).first();
    await row.waitFor({ state: 'visible', timeout: 20000 });
    await row.dblclick();

    // 4) Esperar modal + iframe del correo
    const modal = adminPage.locator('.us-modal-wrapper .us-modal');
    await modal.waitFor({ state: 'visible', timeout: 20000 });

    const iframeHandle = await adminPage.locator('.us-modal iframe.w-100, .us-modal iframe').elementHandle();
    if (!iframeHandle) throw new Error('No se encontró el iframe dentro del modal de Email Log.');
    const frame = await iframeHandle.contentFrame();
    if (!frame) throw new Error('No se pudo acceder al contenido del iframe.');

    // 5) Extraer el código dentro de <label>XXXXXX</label>
    const codeLabel = frame.locator('label', { hasText: /^[A-Za-z0-9]{6}$/ });
    await codeLabel.waitFor({ state: 'visible', timeout: 20000 });
    const code = (await codeLabel.innerText()).trim();

    if (!/^[A-Za-z0-9]{6}$/.test(code)) {
      throw new Error(`Código de verificación no válido: "${code}"`);
    }

    // 6) Cerrar pestaña admin
    await adminPage.close();

    return code;
  }

  async isLenderLoggedIn(): Promise<boolean> {
    try {
      const selector = '//*[@id="app"]/nav[1]/div[3]/ul/li/small';
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 20000 });
      const username = await this.page.textContent(selector);
      return username?.trim() === 'gentest';
    } catch {
      return false;
    }
  }

  async isBorrowerLoggedIn(): Promise<boolean> {
    try {
      const selector = '//*[@id="root"]/nav[1]/div/small';
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 20000 });
      const username = await this.page.textContent(selector);
      return username?.trim() === 'test8180';
    } catch {
      return false;
    }
  }
}
