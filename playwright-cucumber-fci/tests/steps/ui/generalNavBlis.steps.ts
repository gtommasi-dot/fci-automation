// tests/steps/GeneralNavBlis.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { GeneralNavBlisPage } from '../../pages/GeneralNavBlisPage';

When(
  'I navigate to the {string} section in BLIS',
  async function (this: any, sectionName: string) {
    const page = this.page;
    const generalNavBlisPage = new GeneralNavBlisPage(page);

    await generalNavBlisPage.navigateToSection(sectionName);
  },
);

Then(
  'the {string} section in BLIS should be displayed',
  async function (this: any, sectionName: string) {
    const page = this.page;
    const generalNavBlisPage = new GeneralNavBlisPage(page);

    await generalNavBlisPage.assertSectionIsDisplayed(sectionName);
  },
);

Then(
  'I can navigate through all main BLIS sections',
  async function (this: any) {
    const page = this.page;
    const generalNavBlisPage = new GeneralNavBlisPage(page);

    await generalNavBlisPage.navigateThroughAllMainSections();
  },
);
