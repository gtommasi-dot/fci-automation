import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export class GeneralNavLirsPage {
  private page: Page;

  // Barra lateral y sus secciones principales (ajusta los XPaths según el HTML real)
  private sideNav = 'xpath=//*[@id="app"]/nav[2]/div';
  private sections = [
     {
    name: 'FCI Important Notices',
    btn: 'a.us-menu-item[href="/lenImportantNotices"]',
    urlPart: '/lenImportantNotices',
    contentSelector: '.us-menu-item__title:has-text("FCI Important Notices")'
    },
    {
      name: 'Portfolio Dashboard',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[2]',
      urlPart: '',
      contentSelector: '.us-menu-item__title:has-text("Portfolio Dashboard")'
    }, 
    {
      name: 'Loan Portfolio',
      dropdown: 'xpath=//*[@id="app"]/nav[2]/div/div[2]/div[1]',
      options: [
        {
          name: 'Loan Portfolio',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[2]/div[2]/ul/a[1]',
          urlPart: '/lender/loans',
          contentSelector: '.us-menu-item__title:has-text("Loan Portfolio")'
        },
        {
          name: 'Partial Ownership Portfolio',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[2]/div[2]/ul/a[2]',
          urlPart: '/partialOwnershipPortfolio',
          contentSelector: '.us-menu-item__title:has-text("Partial Ownership Portfolio")'
        }
        // Agrega más opciones según HTML real
      ]
    },
    {
      name: 'Lender Attachments',
      dropdown: 'xpath=//*[@id="app"]/nav[2]/div/div[3]/div[1]',
      options: [
        {
          name: 'Lender Statement',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[3]/div[2]/ul/a[1]',
          urlPart: '/attachment/lender_statements',
          contentSelector: '.us-menu-item__title:has-text("Lender Statement")'
        },
        {
          name: 'Notification of Deposits',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[3]/div[2]/ul/a[2]',
          urlPart: '/attachment/notification_of_deposits',
          contentSelector: '.us-menu-item__title:has-text("Notification of Deposits")'
        },
        {
          name: 'Tax Forms',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[3]/div[2]/ul/a[3]',
          urlPart: '/attachment/tax_forms',
          contentSelector: '.us-menu-item__title:has-text("Tax Form")'
        },
        {
          name: 'Lender Attachment',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[3]/div[2]/ul/a[4]',
          urlPart: '/attachment/all_attachment',
          contentSelector: '.us-menu-item__title:has-text("Lender Attachment")'
        } 
        // Agrega más opciones si hay
      ]
    },
    {
      name: 'Portfolio Reports',
      dropdown: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[1]',
      options: [
        {
          name: 'ACH Status',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[1]',
          urlPart: '/reports/achstatus',
          contentSelector: '.us-menu-item__title:has-text("ACH Status")'
        } ,
        {
          name: 'Borrower Portal Report',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[2]',
          urlPart: '/reports/BorrowerReports',
          contentSelector: '.us-menu-item__title:has-text("Borrower Portal Report")'
        } ,
        {
          name: 'FC Time Lines',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[3]',
          urlPart: '/reports/foreclosureTimeLines',
          contentSelector: '.us-menu-item__title:has-text("FC Time Lines")'
        } ,
        {
          name: 'Default Interest Report',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[4]',
          urlPart: '/reports/InterestDistribution',
          contentSelector: '.us-menu-item__title:has-text("Default Interest Report")'
        } ,
        {
          name: 'Investor Earnings',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[5]',
          urlPart: '/reports/investorEarnings',
          contentSelector: '.us-menu-item__title:has-text("Investor Earnings")'
        } ,
        {
          name: 'Lender Disbursement',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[6]',
          urlPart: '/reports/LenderDisbursement',
          contentSelector: '.us-menu-item__title:has-text("Lender Disbursement")'
        } ,
        {
          name: 'Lender Trust Ledger',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[7]',
          urlPart: '/reports/lenderTrustLedger',
          contentSelector: '.us-menu-item__title:has-text("Lender Trust Ledger")'
        } ,
        {
          name: 'Loan Cash Flow',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[8]',
          urlPart: '/reports/loancashflow',
          contentSelector: '.us-menu-item__title:has-text("Loan Cash Flow")'
        } ,
        {
          name: 'Loan Charges',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[9]',
          urlPart: '/reports/LoanCharges',
          contentSelector: '.us-menu-item__title:has-text("Loan Charges")'
        } ,
        {
          name: 'Loan Delinquency',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[10]',
          urlPart: '/reports/loanDelinquency',
          contentSelector: '.us-menu-item__title:has-text("Loan Delinquency")'
        } ,
        {
          name: 'Loan Portfolio',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[11]',
          urlPart: '/reports/loanPortfolio',
          contentSelector: '.us-menu-item__title:has-text("Loan Portfolio")'
        } ,
        {
          name: 'Loan Portfolio Statistics',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[12]',
          urlPart: '/reports/loanPortfolioStatistics',
          contentSelector: '.us-menu-item__title:has-text("Loan Portfolio Statistics")'
        } ,
        {
          name: 'Loan Servicing Notes',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[13]',
          urlPart: '/reports/LoanServicingNotes',
          contentSelector: '.us-menu-item__title:has-text("Loan Servicing Notes")'
        } ,
        {
          name: 'Pay String',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[14]',
          urlPart: '/reports/PayString',
          contentSelector: '.us-menu-item__title:has-text("Pay String")'
        } ,
        {
          name: 'Scheduled vs. Actual Monthly Payments',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[15]',
          urlPart: '/reports/SvAPayString',
          contentSelector: '.us-menu-item__title:has-text("Scheduled vs. Actual Monthly Payments")'
        },
        {
          name: 'Payoff Demand Status',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[16]',
          urlPart: '/reports/payOffDemandStatus',
          contentSelector: '.us-menu-item__title:has-text("Payoff Demand Status")'
        } ,
        {
          name: 'Trust Balance',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[17]',
          urlPart: '/reports/TrustBalance',
          contentSelector: '.us-menu-item__title:has-text("Trust Balance")'
        } ,
        {
          name: 'Total Servicing Fee Discount',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[18]',
          urlPart: '/reports/lenderServicingFee',
          contentSelector: '.us-menu-item__title:has-text("Total Servicing Fee Discount")'
        } ,
        {
          name: 'Lien Release',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[19]',
          urlPart: '/reports/lienRelease',
          contentSelector: '.us-menu-item__title:has-text("Lien Release")'
        } ,
        {
          name: 'Portfolio Escrow Advance',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[20]',
          urlPart: '/reports/portfolioEscrowAdvance',
          contentSelector: '.us-menu-item__title:has-text("Portfolio Escrow Advance")'
        } ,
        {
          name: 'Loss Mit Report',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[21]',
          urlPart: '/reports/lossMitReport',
          contentSelector: '.us-menu-item__title:has-text("Loss Mit Report")'
        } ,
        {
          name: 'Bankruptcy Report',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[22]',
          urlPart: '/reports/bankruptcyReport',
          contentSelector: '.us-menu-item__title:has-text("Bankruptcy Report")'
        } ,
        {
          name: 'TOS Report',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[23]',
          urlPart: '/reports/TOS',
          contentSelector: '.us-menu-item__title:has-text("TOS Report")'
        } ,
        {
          name: 'Borrower Portal Accounts',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[4]/div[2]/ul/a[24]',
          urlPart: '/reports/AssignAccountsReport',
          contentSelector: '.us-menu-item__title:has-text("Borrower Portal Accounts")'
        }
      ]
    },
    { 
      name: 'Customer Journey',
      dropdown: 'xpath=//*[@id="app"]/nav[2]/div/div[5]/div[1]',
      options: [
          {
          name: 'Message Automation',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[5]/div[2]/ul/a[1]',
          urlPart: '/customerJourney/messageAutomation',
          contentSelector: '.us-menu-item__title:has-text("Message Automation")'
          }
        ]
    },
    {
      name: 'FCI Invoices',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[4]',
      urlPart: '/invoice/pending',
      contentSelector: '.us-menu-item__title:has-text("FCI Invoices")'  
    },
    { 
      name: 'Payments to Lender',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[5]',
      urlPart: '/paymentsToLender',
      contentSelector: '.us-menu-item__title:has-text("Payments to Lender")'
    },
    { 
      name: 'Lender Information',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[6]',
      urlPart: '/lenderInformation',
      contentSelector: '.us-menu-item__title:has-text("Lender Information")'
    },
    { 
      name: 'Payoff Tracker',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[7]',
      urlPart: '/trackerPayoff',
      contentSelector: '.us-menu-item__title:has-text("Payoff Tracker")' 
    }, 
    { 
      name: 'Boarding',
      dropdown: 'xpath=//*[@id="app"]/nav[2]/div/div[6]/div[1]',
      options: [
          {
          name: 'Boarding Portfolio',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[6]/div[2]/ul/a',
          urlPart: '/boarding/portfolio',
          contentSelector: '.us-menu-item__title:has-text("Boarding Portfolio")'
          }
        ]
    },
    { 
      name: 'Draw Request',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[8]',
      urlPart: '/drawRequest',
      contentSelector: '.us-menu-item__title:has-text("Draw Request")' 
    }, 
    {
        name: 'Fund Administration',
        dropdown: 'xpath=//*[@id="app"]/nav[2]/div/div[7]/div[1]',
        options: [
          {
          name: 'Partnerships',
          btn: 'xpath=//*[@id="app"]/nav[2]/div/div[7]/div[2]/ul/a',
          urlPart: '/partnerships',
          contentSelector: '.us-menu-item__title:has-text("Partnerships")'
          }
        ]
    },
    { 
      name: 'Client Notes',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[9]',
      urlPart: '/clientNotes',
      contentSelector: '.us-menu-item__title:has-text("Client Notes")' 
    },
    { 
      name: 'Contact Us',
      btn: 'xpath=//*[@id="app"]/nav[2]/div/a[10]',
      urlPart: '/contactUs',
      contentSelector: '.us-menu-item__title:has-text("Contact Us")' 
    }
    // Agrega las demás secciones/dropdowns aquí...
    // Portfolio Reports, Lender Disbursements, Boarding, Fund Administration
  ];

  constructor(page: Page) {
    this.page = page;
  }

  private async log(msg: string) {
    // Puedes mejorar este método para enviar logs a un reporte o consola
    console.log(`[GeneralNavLirsPage] ${msg}`);
  }

  private async screenshot(name: string) {
    const folder = 'reports/screenshots/nav';
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    const filename = `${folder}/${Date.now()}_${name.replace(/\s+/g, '_')}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    this.log(`Screenshot guardado: ${filename}`);
  }

  async navigateAndValidate() {
    for (const section of this.sections) {
      if (section.btn) {
        await this.navigateToSection(section);
      }
      if (section.dropdown) {
        await this.openDropdown(section.dropdown);
        for (const opt of section.options) {
          await this.navigateToDropdownOption(opt, section.name);
        }
      }
    }
  }

  async navigateToSection(section: any) {
    this.log(`Navegando a sección: ${section.name}`);
    await this.page.waitForSelector(section.btn, { state: 'visible', timeout: 30000 });
    await this.page.click(section.btn);
    await this.page.waitForTimeout(500); // Espera corta para animaciones/transición
    await this.validateUrl(section.urlPart);
    await this.page.waitForSelector(section.contentSelector, { state: 'visible', timeout: 30000 });
    await this.screenshot(section.name);
    this.log(`Validada sección: ${section.name}`);
  }

  async openDropdown(dropdownSelector: string) {
    await this.page.waitForSelector(dropdownSelector, { state: 'visible', timeout: 30000 });
    await this.page.click(dropdownSelector);
    this.log(`Dropdown abierto: ${dropdownSelector}`);
    await this.page.waitForTimeout(500);
  }

  async navigateToDropdownOption(opt: any, parentName: string) {
    this.log(`Navegando a opción: ${parentName} > ${opt.name}`);
    await this.page.waitForSelector(opt.btn, { state: 'visible', timeout: 30000 });
    await this.page.click(opt.btn);
    await this.page.waitForTimeout(500);
    await this.validateUrl(opt.urlPart);
    await this.page.waitForSelector(opt.contentSelector, { state: 'visible', timeout: 30000 });
    await this.screenshot(`${parentName}_${opt.name}`);
    this.log(`Validada opción: ${parentName} > ${opt.name}`);
  }

  async validateUrl(urlPart: string) {
  if (!urlPart) {
    this.log('URL válida: sin urlPart (se omite chequeo específico)');
    return;
  }
  try {
    await this.page.waitForURL(`**${urlPart}**`, { timeout: 30000 });
  } catch (e) {
    const current = await this.page.evaluate(() => window.location.pathname);
    this.log(`DEBUG pathname actual: "${current}" (esperado contiene "${urlPart}")`);
    // Fallback por si la app no navega con navegación "real"
    await this.page.waitForFunction(
      (expected: string) => window.location.pathname.includes(expected),
      urlPart,
      { timeout: 10000 }
    );
  }
  this.log(`URL válida: contiene "${urlPart}"`);
}

}
