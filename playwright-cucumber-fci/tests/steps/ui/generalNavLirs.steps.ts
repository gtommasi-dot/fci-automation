import { Given, When, Then } from '@cucumber/cucumber';
import { GeneralNavLirsPage } from '../../pages/GeneralNavLirsPage';
import * as dotenv from 'dotenv';
dotenv.config();

let navPage: GeneralNavLirsPage;


Then('navego por todas las secciones y valido navegación, contenido y screenshots', async function () {
  navPage = new GeneralNavLirsPage(this.page);
  await navPage.navigateAndValidate();
});
