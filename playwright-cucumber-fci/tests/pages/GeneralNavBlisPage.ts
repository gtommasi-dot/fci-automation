// tests/pages/GeneralNavBlisPage.ts
import { Page, expect } from '@playwright/test';

interface SectionConfig {
  linkName: string;
  expectedPath: RegExp;
}

export class GeneralNavBlisPage {
  constructor(private readonly page: Page) {}

  /** 
   * Mapa de secciones principales de BLIS con:
   * - linkName: texto visible del link en el menú lateral
   * - expectedPath: fragmento de URL que esperamos después del click
   */
  private readonly sections: Record<string, SectionConfig> = {
    'Loan Listing': {
      linkName: 'Loan Listing',
      expectedPath: /\/loans(?:\/|$|\?)/,
    },
    'Loan Detail': {
      linkName: 'Loan Detail',
      expectedPath: /\/loan\/detail\//,
    },
    'Payment History': {
      linkName: 'Payment History',
      expectedPath: /\/loan\/history\//,
    },
    'Charges': {
      linkName: 'Charges',
      expectedPath: /\/loan\/charges\//,
    },
    'Borrower Attachments': {
      linkName: 'Borrower Attachments',
      expectedPath: /\/loan\/statements\//,
    },
    'Online Payments': {
      linkName: 'Online Payments',
      expectedPath: /\/loan\/payments\//,
    },
    'Payoff Request': {
      linkName: 'Payoff Request',
      expectedPath: /\/loan\/payoffRequest\//,
    },
    'Account Settings': {
      linkName: 'Account Settings',
      expectedPath: /\/settings\/account(?:\/|$|\?)/,
    },
  };

  private getSectionConfig(sectionName: string): SectionConfig {
    const config = this.sections[sectionName];

    if (!config) {
      throw new Error(
        `Unsupported BLIS section "${sectionName}". ` +
          `Available sections: ${Object.keys(this.sections).join(', ')}`,
      );
    }

    return config;
  }

  /**
   * Navega a una sección concreta del menú lateral de BLIS.
   * Usa getByRole('link') para tener selectores robustos.
   */
 async navigateToSection(sectionName: string): Promise<void> {
  const { linkName } = this.getSectionConfig(sectionName);

  // Buscamos SOLO el link cuyo nombre accesible sea EXACTAMENTE el esperado
  const link = this.page.getByRole('link', {
    name: linkName,
    exact: true,
  });

  await expect(
    link,
    `BLIS nav link "${linkName}" should be visible before clicking`,
  ).toBeVisible();

  await link.click();
  await this.page.waitForLoadState('networkidle');
}


  /**
   * Verifica que la sección está correctamente cargada.
   * - URL contiene el fragmento esperado
   * - El ítem de menú seleccionado corresponde a la sección
   */
  async assertSectionIsDisplayed(sectionName: string): Promise<void> {
    const { expectedPath, linkName } = this.getSectionConfig(sectionName);

    await expect(
      this.page,
      `URL should contain "${expectedPath}" for section "${sectionName}"`,
    ).toHaveURL(expectedPath);

    // Check adicional: el elemento de menú seleccionado debe ser el esperado
    const selectedNavItem = this.page
      .locator('.us-menu-item--selected')
      .filter({ hasText: linkName });

    await expect(
      selectedNavItem,
      `Selected BLIS menu item should be "${linkName}"`,
    ).toBeVisible();
  }

  /**
   * Recorre todas las secciones principales de BLIS en orden
   * y valida cada una.
   */
  async navigateThroughAllMainSections(): Promise<void> {
    const orderedSections: string[] = [
      'Loan Listing',
      'Loan Detail',
      'Payment History',
      'Charges',
      'Borrower Attachments',
      'Online Payments',
      'Payoff Request',
      'Account Settings',
    ];

    for (const section of orderedSections) {
      await this.navigateToSection(section);
      await this.assertSectionIsDisplayed(section);
    }
  }
}
