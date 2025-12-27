import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { LoginPage } from '../../pages/LoginPage';
import * as dotenv from 'dotenv';
dotenv.config();

let loginPage: LoginPage;

Given('que navego a la página de login', async function () {
  loginPage = new LoginPage(this.page); // Usa la page creada en el hook
  await loginPage.goto();
});

When('ingreso usuario y contraseña', async function () {
  await loginPage.enterUsername(process.env.LENDER_USER as string);
  await loginPage.enterPassword(process.env.LENDER_PASSWORD as string);
});

When('hago click en el botón Sign In', async function () {
  await loginPage.clickSignIn();
});

Then('debo ver el nombre del usuario', async function () {
  // Cambia el selector al de tu dashboard real
  const loggedIn = await loginPage.isLenderLoggedIn();
  expect(loggedIn).to.be.true;
});

let otpCode = '';

When('debo ver la pantalla de verificación de código', async function () {
  await loginPage.waitForOtpScreen(30000);
});

When('obtengo el código de verificación desde Email Log como {string}', async function (role: string) {
  if (role.toLowerCase() !== 'admin') {
    throw new Error(`Rol no soportado: ${role}. Usa "admin".`);
  }
  otpCode = await loginPage.fetchOtpFromAdminEmailLog(this.context); // usa BrowserContext del World
});

When('ingreso el código de verificación en la pantalla', async function () {
  await loginPage.fillOtp(otpCode);
});