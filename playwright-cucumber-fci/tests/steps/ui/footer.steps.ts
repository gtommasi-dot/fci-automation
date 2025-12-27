import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { FciWebPage } from '../../pages/fciWebPage';

let pageObj: FciWebPage;

Given('que abro el home público de FCI', async function () {
  pageObj = new FciWebPage(this.page);
  await this.page.goto('https://test.myfci.com/', { waitUntil: 'domcontentloaded' });
  await expect(this.page).toHaveURL(/test\.myfci\.com/i);
});

When('recorro y valido todos los enlaces del footer', async function () {
  await pageObj.verifyFooterAll();
});

Then('cada enlace del footer cambia la URL y carga su sección', async function () {
  // La verificación se hace en verifyFooterAll(), aquí dejamos un assert final simple:
  await expect(this.page).toHaveURL(/test\.myfci\.com/i);
});
