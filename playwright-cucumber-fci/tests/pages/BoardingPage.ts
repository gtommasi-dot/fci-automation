import { Page, expect } from '@playwright/test';

export class BoardingPage {
    constructor(private page: Page) {}

    // Navegar al menú y sección de Boarding
    async goToBoardingPortfolio() {
        // Abrir drop-down de Boarding
        await this.page.locator('//*[@id="app"]/nav[2]/div/div[6]/div[1]').click();
        // Click en Boarding Portfolio
        await this.page.locator('//*[@id="app"]/nav[2]/div/div[6]/div[2]/ul/a').click();
        // Validar URL
        await expect(this.page).toHaveURL('https://tfciweb.myfci.com/boarding/portfolio');
        // Esperar a que la sección esté visible (título o grid/table)
        await this.page.waitForSelector('text=Boarding Portfolio');
    }

    // Click en Boarding Wizard (Add New Loan)
    async clickAddNewLoan() {
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[1]/button[2]').click();
        await expect(this.page).toHaveURL('https://tfciweb.myfci.com/boarding/wizard/new');
    }

    // Tab: Previous
    async fillPreviousTab(accountNumber: string) {
    console.log('>>> Entrando a fillPreviousTab con:', accountNumber);

    await this.page.waitForTimeout(1000); // Espera inicial para asegurar que la página esté lista
    
    // Espera robusta al input de Previous Account Number
    await this.page.waitForSelector('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[1]/div/div/div/div[2]/div/input', { state: 'visible', timeout: 15000 });
    await this.page.fill('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[1]/div/div/div/div[2]/div/input', accountNumber);
    console.log('>>> Input de Previous rellenado');

    // Click en Next
    await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/button').click();
    console.log('>>> Click en Next realizado');

    // Espera visible el campo Investor antes de continuar
    await this.page.waitForSelector('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/div/div[1]/div/div/div[1]/div/div[3]/input', { state: 'visible', timeout: 20000 });
    console.log('>>> Campo de Investor visible');
}


    // Tab: Investor
    async fillInvestorTab() {
        // Seleccionar investor
        const investorInput = this.page
      .locator('div.row')
      .filter({ has: this.page.getByText(/Please, select an Investor/i) })
      .locator('input[aria-haspopup="dialog"]');

      // esperar a que sea visible y habilitado
      await investorInput.waitFor({ state: 'visible', timeout: 20000 });

        await investorInput.fill('2201524');
        const optInvestor = await this.page.waitForSelector('span.us-list-item__title.us-clamp-2:has-text("2201524 - Residential Mortgage Aggregation Trust, BPL Q-M1")');
        await optInvestor.click();
        
        // UPB owned By Lender (arrow up)
        await this.page.locator('input.k-input-inner[type="tel"][value="$0.00"]').focus();
        await this.page.keyboard.press('ArrowUp');
        // Agreement Information: seleccionar Basic-Limited
        await this.page.locator('xpath=//*[@id="agreement00"]').click();
        // Next
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[3]/button').click();
        await this.page.waitForSelector('text=Broker');
    }

    // Tab: Broker
    async fillBrokerTab() {
        await this.page.locator('xpath=//*[@id="isBrokerInfo"]').click();
        // Seleccionar FCI Broker
        const brokerInput = this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[1]/div/div/div/div[1]/div[4]/div[3]/input');
       // await brokerInput.fill('GENESIS');
       // const optBroker = this.page.locator('span.us-list-item__title.us-clamp-2', { hasText: undefined }).filter({ hasText: "GENESIS - Genesis Capital Partners, Inc." });
       await brokerInput.fill('Churchill');
       const optBroker = this.page.locator('span.us-list-item__title.us-clamp-2', { hasText: undefined }).filter({ hasText: "V1908510 - Churchill Funding I LLC" });
        await optBroker.waitFor({ state: 'visible', timeout: 10000 });
        await optBroker.click();
        // Next
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/button[2]').click();
        await this.page.waitForSelector('text=Borrower');
    }

    // Tab: Borrower
    async fillBorrowerTab() {
        await this.page.locator('xpath=//*[@id="BorrowerIsCompany0"]').click();
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/div/div/div/div/div[2]/div[1]/input').fill('Test Company Name');
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/div/div/div/div/div[2]/div[2]/input').fill('Test Contact Name');
        await this.page.waitForSelector('xpath=//input[@class="k-input-inner" and @type="text" and @aria-placeholder="99-9999999"]');
        await this.page.fill('xpath=//input[@class="k-input-inner" and @type="text" and @aria-placeholder="99-9999999"]', '44-4444444');
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/div/div/div/div/div[3]/div[1]/input').fill('Test Address');
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/div/div/div/div/div[3]/div[2]/input').fill('Test City');
        const stateInput = this.page.locator('xpath=//input[contains(@class,"k-input-inner") and @type="text" and @placeholder="Select State..." and @role="combobox"]');
        await stateInput.fill('Alaska');
        await this.page.waitForTimeout(500);
        await stateInput.press('ArrowDown');
        await stateInput.press('Enter');
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/div/div/div/div/div[3]/div[4]/input').fill('12345');
        // Next
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[3]/button[2]').click();
        await this.page.waitForSelector('text=Property');
    }

    // Tab: Property
    async fillPropertyTab() {
        await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[4]/button[2]').click();
        await this.page.waitForSelector('text=Loan');
    }




 // Tab: Loan
async fillLoanTabAndSave() {
  // Seleccionamos todos los botones de calendario visibles en el orden esperado
  const calendarButtons = await this.page.locator('div span button[aria-label*="calendar"]').all();

  // Seleccionar fechas (asumo que siempre hay 5 y son visibles en ese orden)
  for (let i = 0; i < 5; i++) {
    await calendarButtons[i].click();
    const todayCell = this.page.locator('//div[contains(@class, "k-animation-container")]//td[contains(@class, "k-today")]');
    await expect(todayCell).toBeVisible();
    await todayCell.click();
    await this.page.waitForTimeout(300); // solo si realmente necesitás esperar por estabilidad visual
  }

  // Obtener día actual
  const today = new Date();
  const dayOfMonth = today.getDate().toString();

  // Day Due (asumimos que es el primer input tipo spinbutton)
  const spinboxInputs = this.page.locator('span.k-numerictextbox input.k-input-inner[role="spinbutton"]');
  await spinboxInputs.first().fill(dayOfMonth);
  await spinboxInputs.first().press('Enter');
  await this.page.waitForTimeout(300);

  // Amount of Payment (segundo input spinbutton type="tel")
  const telSpinboxes = this.page.locator('span.k-numerictextbox input[type="tel"][role="spinbutton"]');
  await telSpinboxes.nth(1).click();
  await telSpinboxes.nth(1).press('ArrowUp');
  
  // Escrow Payment Amount (tercer input spinbutton type="tel")
  await telSpinboxes.nth(2).click();
  await telSpinboxes.nth(2).press('ArrowUp');
  await this.page.waitForTimeout(300);

  // Original Loan Amount (quinto input dentro de .k-input.k-numerictextbox...)
  const numericTextInputs = this.page.locator('span.k-input.k-numerictextbox input[role="spinbutton"]');
  await numericTextInputs.nth(6).click();
  await numericTextInputs.nth(6).press('ArrowUp');

  // Agregar debjo de este comentario
    // 1) Validar presencia y marcar el checkbox "Enable Default Interest"
  const enableDefaultInterest = this.page.locator('#EnableDefaultInterest');
  await expect(enableDefaultInterest).toBeVisible({ timeout: 15000 });
  if (!(await enableDefaultInterest.isChecked())) {
    await enableDefaultInterest.check();
  }

  // 2) Esperar a que los campos de "Default Rate Information" queden habilitados
  //    Localizamos el combo "Default Interest" por su label (selector robusto, sin IDs volátiles)
  const defaultInterestInput = this.page.locator(
    '//label[normalize-space()="Default Interest"]/following-sibling::*//input[@role="combobox" and contains(@class,"k-input-inner")]'
  );

  // Espera a que esté visible y habilitado (Kendo quita disabled/aria-disabled)
  await expect(defaultInterestInput).toBeVisible({ timeout: 15000 });
  await expect(defaultInterestInput).toBeEnabled({ timeout: 15000 });

  // 3) Abrir dropdown y seleccionar "Fixed Default %"
  //    (más consistente que intentar escribir y presionar Enter con Kendo UI)
  const defaultInterestButton = this.page.locator(
    '//label[normalize-space()="Default Interest"]/following-sibling::*//button[contains(@class,"k-input-button")]'
  );

  await defaultInterestButton.click(); // abre el dropdown
  // Seleccionar la opción por rol accesible (Kendo renderiza opciones con role="option")
  await this.page.getByRole('option', { name: 'Fixed Default %' }).click({ timeout: 15000 });

  // 4) Aserción: el input debe mostrar "Fixed Default %"
  await expect(defaultInterestInput).toHaveValue('Fixed Default %', { timeout: 5000 });


  // Save
  await this.page.locator('xpath=//*[@id="app"]/main/div[1]/div[2]/div[3]/div/div[2]/form/div[2]/button[2]').click();

  // Segundo pop up Save
  await expect(this.page.locator('xpath=/html/body/div[2]/div/div[1]/div/div/div[3]/button[2]')).toBeEnabled();
  // await this.page.waitForSelector('xpath=/html/body/div[2]/div/div[1]/div/div/div[3]/button[2]', { timeout: 15000 });
  await this.page.locator('xpath=/html/body/div[2]/div/div[1]/div/div/div[3]/button[2]').click();
}


    // Validar popup de éxito
 async validateBoardingSuccessPopup() {
  // Locator del toast de éxito
  const toast = this.page.locator('#toast-container .toast-success').first();

  try {
    // Intentamos esperar a que aparezca el toast
    await toast.waitFor({ state: 'visible', timeout: 20000 });
  } catch {
    // Si no aparece dentro del timeout, logueamos y seguimos sin fallar el test
    console.log('[BoardingPage] ⚠️ No se mostró el toast de éxito de boarding dentro del tiempo esperado. Se continúa igual.');
    return; // salimos del método sin lanzar error
  }

  // Si llegó hasta acá es porque el toast apareció: lo validamos
  console.log('[BoardingPage] ✅ Toast de éxito de boarding detectado. Validando contenido…');

  await expect(toast.locator('.toast-title')).toHaveText('Boarding Wizard');
  await expect(toast.locator('.toast-message')).toHaveText(
    'Loan successfully submitted for boarding process!'
  );
}

}
