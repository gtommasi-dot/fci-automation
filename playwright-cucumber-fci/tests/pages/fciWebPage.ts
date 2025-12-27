import { expect, Page, Locator } from '@playwright/test';

type LinkItem = {
  text: string;
  href: string;
  menu?: string;
  external?: boolean;
  // opcional: forzar origen "top" para desambiguar textos repetidos
  origin?: 'top' | 'dropdown' | 'footer';
};

export class FciWebPage {
  constructor(public page: Page) {}

  // ---------- Selectors base ----------
  homeUrl = 'https://test.myfci.com/';
  navRoot = '.secctionMenu';
  footerRoot = 'footer.containerBody';

  // ---------- Data: Navbar ----------
  private loanServicingLinks: LinkItem[] = [
    // Upload My Loan dentro del dropdown de "Loan servicing"
    { text: 'Upload My Loan', href: '/boarding', menu: 'Loan servicing', origin: 'dropdown' },
    { text: 'Boarding Tracker', href: '/boardingTracker', menu: 'Loan servicing' },
    { text: 'Standard Basic', href: '/StandardLoanServicing', menu: 'Loan servicing' },
    { text: 'High Touch Performing', href: '/HighPerformingLoanServicing#Servicing', menu: 'Loan servicing' },
    { text: 'Specialty Servicing', href: '/SpecialtyLoanServicing', menu: 'Loan servicing' },
    { text: 'Securitization Servicing', href: '/SecuritizationFullServicing', menu: 'Loan servicing' },
    { text: 'Backup Loan Servicing', href: '/BackupLoanServicing', menu: 'Loan servicing' },
    { text: 'Fund Administration', href: '/FundAdministration', menu: 'Loan servicing' },
    { text: 'All Forms', href: '/TransmittalForms', menu: 'Loan servicing' },
    { text: 'Pricing', href: '/Pricing', menu: 'Loan servicing' },
  ];

  private developersLinks: LinkItem[] = [
    { text: 'Financial Cloud', href: '/ReportsDataOptions', menu: 'Developers' },
    { text: 'API Documentation', href: 'https://integrate.myfci.com/', menu: 'Developers', external: true },
  ];

  private payoffLinks: LinkItem[] = [
    { text: 'Request a Payoff', href: '/PayoffRequest', menu: 'Payoff Request' },
    // externo que a veces NO abre popup—lo manejamos robusto:
    { text: 'Payoff Tracker', href: 'https://tblis.myfci.com/payoffTracker', menu: 'Payoff Request', external: true },
  ];

  private topButtons: LinkItem[] = [
    { text: 'Contact Us', href: '/ContactUs', origin: 'top' },
    { text: 'Sign In', href: '/Login', origin: 'top' },
    // Upload My Loan del bloque derecho (botón superior)
    { text: 'Upload My Loan', href: '/boarding', origin: 'top' },
    { text: 'Make a Payment', href: '/BorrowerPaymentOptions', origin: 'top' },
  ];

  // ---------- Data: Footer ----------
  private footerLinks: LinkItem[] = [
    // About FCI
    { text: 'About Us', href: '/AboutUs' },
    { text: 'Partners', href: '/StrategicPartners' },
    { text: 'Pricing', href: '/Pricing' },
    { text: 'Contact Us', href: '/ContactUs' },
    // Services
    { text: 'Loan Servicing', href: '/Start' },
    { text: 'Reports & Data', href: '/ReportsDataOptions' },
    { text: 'Mortgage Fund', href: '/FundAdministration' },
    { text: 'Foreclosure Support', href: '/ForeclosureSupport' },
    { text: 'Reo Management', href: '/ReoManagement' },
    // Borrowers
    { text: 'Login Portal', href: '/Login' },
    { text: 'Payment Options', href: '/BorrowerPaymentOptions' },
    { text: 'Help & Avoid Foreclosure', href: '/BorrowerContactAvoidForeclosure' },
    { text: 'State Disclosure', href: '/BorrowerStateDisclosures' },
    // Quick Tools
    { text: 'Transmittal Forms', href: '/TransmittalForms' },
    { text: 'Payoff Request', href: '/PayoffRequest' },
    { text: 'Terms of Use', href: '/TermsofUse' },
    { text: 'Privacy Statement', href: '/PrivacyStatement' },
    // Barra legal inferior
    { text: 'Terms Of Use', href: '/TermsofUse' },
    { text: 'Privacy Notice', href: '/PrivacyStatement' },
    { text: 'California Consumer Privacy Act Notice', href: '/CaliforniaConsumerPrivacy' },
    { text: 'Federal Privacy Statement', href: '/FederalPrivacyStatement' },
  ];

  // ---------- Navegación base ----------
  async gotoHome() {
    await this.page.goto(this.homeUrl, { waitUntil: 'domcontentloaded' });
    await this.expectHomeLoaded();
  }

  async expectHomeLoaded() {
    await expect(this.page).toHaveURL(/test\.myfci\.com\/?$/i);
    await expect(this.page.locator(this.navRoot)).toBeVisible();
    await expect(this.page.locator(this.footerRoot)).toBeVisible();
  }

  // ---------- Helpers ----------
  private normalizeHref(href: string) {
    return (href || '').trim();
  }

  private navDropdownLocator(menuText: string) {
    return this.page.locator(`${this.navRoot} .frame232 >> text=${menuText}`);
  }

  private async ensureDropdownOpen(menuText: string) {
    const trigger = this.navDropdownLocator(menuText);
    await expect(trigger).toBeVisible();

    const block = trigger.locator('xpath=ancestor::*[contains(@class,"frame3466309")][1]');
    await block.hover();

    const chevron = block.locator('.chevronDown3, .iconarror').first();
    if (await chevron.isVisible()) {
      await chevron.click().catch(() => {});
    }

    const submenu = block.locator('ul.subMenu');
    await submenu.first().waitFor({ state: 'visible' });
    return submenu;
  }

  private async assertSectionLoaded(href: string) {
    const clean = this.normalizeHref(href);
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    await expect(this.page).toHaveURL(new RegExp(`${escaped}(?:[?#/].*)?$`, 'i'));
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.locator('body')).toBeVisible();
    const typical = this.page.locator('main, .containerBody, section, .content, .hero, .contentBody').first();
    await typical.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  private async ensureTopRightVisible() {
    const frameButton = this.page.locator(`${this.navRoot} .frameButton`).first();
    if (await frameButton.isHidden()) {
      await this.page.locator(this.navRoot).hover({ force: true }).catch(() => {});
      await frameButton.scrollIntoViewIfNeeded().catch(() => {});
    }
  }

  private async forceOpenInNewTab(aLocator: Locator) {
    await aLocator.evaluate((el: HTMLAnchorElement) => {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    }).catch(() => {});
  }

  private async clickExternalRobust(aLocator: Locator, expectedHref: string) {
    const clean = this.normalizeHref(expectedHref);
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    await this.forceOpenInNewTab(aLocator);

    const popupPromise = this.page.waitForEvent('popup', { timeout: 2500 }).catch(() => null);
    await aLocator.click();

    const popup = await popupPromise;

    if (popup) {
      await popup.waitForLoadState('domcontentloaded');
      await expect(popup).toHaveURL(new RegExp('^' + escaped, 'i'));
      await popup.close();
      return;
    }

    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(new RegExp('^' + escaped, 'i'));
    await this.gotoHome();
  }

  // ---------- Clickers segmentados ----------
  private async clickTopButtonByText(text: string) {
    await this.ensureTopRightVisible();
    // Dentro de .frameButton, que es el contenedor de los botones del header derecho
    const withinTop = this.page.locator(`${this.navRoot} .frameButton`).first();
    // A: botón "Upload My Loan" del header derecho
    const aBtn = withinTop.locator(`a:has-text("${text}")`).first();
    if (await aBtn.isVisible()) return aBtn;

    // B: alternativa: span dentro del botón que contiene el texto (e.g., <span class="signIn">Upload My Loan</span>)
    const spanBtn = withinTop.locator(`.frame237 span:has-text("${text}"), .button2 span:has-text("${text}")`).first();
    if (await spanBtn.isVisible()) {
      // subimos al <a> contenedor clickeable
      return spanBtn.locator('xpath=ancestor-or-self::a[1]');
    }

    // fallback global (pero dentro del navRoot)
    return this.page.locator(`${this.navRoot} a:has-text("${text}")`).first();
  }

  private async clickFromNavbar(link: LinkItem) {
    await this.gotoHome();

    if (link.menu) {
      const submenu = await this.ensureDropdownOpen(link.menu);
      const item = submenu.locator(`a:has-text("${link.text}")`).first();
      await expect(item).toBeVisible();

      if (link.external) {
        await this.clickExternalRobust(item, link.href);
      } else {
        await Promise.all([
          this.page.waitForURL('**' + this.normalizeHref(link.href).replace(/^\//, '/**')),
          item.click(),
        ]);
        await this.assertSectionLoaded(link.href);
        await this.gotoHome();
      }
      return;
    }

    // enlaces/botones directos del top bar (lado derecho)
    const direct = await this.clickTopButtonByText(link.text);
    await direct.scrollIntoViewIfNeeded().catch(() => {});
    await expect(direct).toBeVisible();

    if (link.external) {
      await this.clickExternalRobust(direct, link.href);
    } else {
      await Promise.all([
        this.page.waitForURL('**' + this.normalizeHref(link.href).replace(/^\//, '/**')),
        direct.click(),
      ]);
      await this.assertSectionLoaded(link.href);
      await this.gotoHome();
    }
  }

  private async clickFromFooter(link: LinkItem) {
    await this.gotoHome();
    const footerLink = this.page.locator(`${this.footerRoot} a:has-text("${link.text}")`).first();
    await footerLink.scrollIntoViewIfNeeded().catch(() => {});
    await footerLink.waitFor({ state: 'visible' });
    await expect(footerLink).toBeVisible();

    if (link.external) {
      await this.clickExternalRobust(footerLink, link.href);
    } else {
      await Promise.all([
        this.page.waitForURL('**' + this.normalizeHref(link.href).replace(/^\//, '/**')),
        footerLink.click(),
      ]);
      await this.assertSectionLoaded(link.href);
      await this.gotoHome();
    }
  }

  // ---------- Public API para steps ----------
  async verifyNavbarAll() {
    const all = [
      ...this.loanServicingLinks,
      ...this.developersLinks,
      ...this.payoffLinks,
      ...this.topButtons,
    ];
    for (const link of all) {
      await this.clickFromNavbar(link);
    }
  }

  async verifyFooterAll() {
    for (const link of this.footerLinks) {
      await this.clickFromFooter(link);
    }
  }
}
