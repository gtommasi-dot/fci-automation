import { Page } from 'playwright';

export class PopupPage {
  private page: Page;


  constructor(page: Page) {
    this.page = page;
  }

 async closeIfPresent() {
  // Selector robusto para el popup y el botón
  const popupSelector = '.us-modal .us-modal-header__title:has-text("Two-Factor Authentication Coming Soon")';
  const markAsReadBtn = 'button.us-button:has-text("Mark as read")';

  try {
    // Espera hasta 10 segundos a que aparezca el popup (si no aparece, lanza error, que atrapamos)
    await this.page.waitForSelector(popupSelector, { state: 'visible', timeout: 15000 });

    // Cuando aparece, espera que el botón esté visible y clickeable
    await this.page.waitForSelector(markAsReadBtn, { state: 'visible', timeout: 2000 });
    await this.page.click(markAsReadBtn, { force: true });

    // Espera a que el popup desaparezca
    await this.page.waitForSelector('.us-modal', { state: 'hidden', timeout: 15000 }).catch(() => {});
  } catch {
    // Si no aparece el popup en 10s, sigue normalmente (no lanza error)
  }
}


}
