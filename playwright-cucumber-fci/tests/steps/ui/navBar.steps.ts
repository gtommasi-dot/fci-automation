import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { FciWebPage } from '../../pages/fciWebPage';

let fci: FciWebPage;

Given('que estoy en el sitio público de FCI', async function () {
  fci = new FciWebPage(this.page);
  await fci.gotoHome();
});

Then('veo la página pública cargada correctamente', async function () {
  await fci.expectHomeLoaded();
});

When('recorro y valido todos los enlaces del navbar', async function () {
  await fci.verifyNavbarAll();
});

Then('cada enlace del navbar cambia la URL y carga su sección', async function () {
  // La verificación de URL y carga ya ocurre dentro de verifyNavbarAll.
  // Dejar un assert “sentinela” final en la home.
  await fci.gotoHome();
  await expect(this.page).toHaveURL(/test\.myfci\.com\/?$/i);
});
