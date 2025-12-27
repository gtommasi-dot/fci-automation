// tests/pages/KanbanTasksPage.ts
import { expect, Page, Locator } from '@playwright/test';

const BASE_URL = process.env.PORTAL_BASE_URL ?? 'https://tfciportal.myfci.com';

export class KanbanBoardPage {
  private page: Page;
  constructor(page: Page) { this.page = page; }

  // ============ NAV DIRECTA ============
  async goDirectToManageKanban() {
    await this.page.goto(`${BASE_URL}/ManageKanbanBoard`, { waitUntil: 'domcontentloaded' });
    await this.waitForManageKanbanBoardLoaded();
  }
  async goDirectToMasterDashboard() {
    await this.page.goto(`${BASE_URL}/MasterDashboard`, { waitUntil: 'domcontentloaded' });
    await this.waitForMasterDashboardLoaded();
  }
  private async waitForManageKanbanBoardLoaded() {
    const row = this.page.getByRole('cell', { name: /Boarding/i }).first();
    await Promise.race([
      row.waitFor({ state: 'visible', timeout: 45000 }),
      this.page.locator('tbody.k-table-tbody tr').first().waitFor({ state: 'visible', timeout: 45000 }),
    ]);
  }
  private async waitForMasterDashboardLoaded() {
    await this.page.locator('input.k-checkbox[type="checkbox"]').first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  // ============ HELPERS DE MODALES VISIBLES ============
  private visibleModalByTitle = (titleRe: RegExp) =>
    this.page.locator('.modal.fade.show .modal-content').filter({
      has: this.page.locator('.modal-header .modal-title', { hasText: titleRe }),
    }).last();

  private editKanbanModal = () => this.visibleModalByTitle(/^\s*Edit\s+KanbanBoard\s*$/i);
  private editTaskModal   = () => this.visibleModalByTitle(/^\s*Edit\s+Task\s*$/i);

  private taskListModalFor = (columnName: string) =>
    this.page.locator('.modal.fade.show .modal-content').filter({
      has: this.page.locator('.modal-header .modal-title', {
        hasText: new RegExp(`^\\s*Task\\s*-\\s*${this.escapeRegex(columnName)}\\s*$`, 'i'),
      }),
    }).last();

  private taskListModal = () =>
    this.page.locator('.modal.fade.show .modal-content:has(.modal-header .modal-title:has-text("Task -"))').last();

  // ============ GRID DE BOARDS ============
  private gridRowByText = (text: string) =>
    this.page.locator('td.k-table-td, td[role="gridcell"]').filter({ hasText: text }).first();
  private editButton = () => this.page.locator('#btnEdit');

  async selectBoardAndEdit(boardName: string) {
    await this.gridRowByText(boardName).click();
    await expect(this.editButton()).toBeEnabled({ timeout: 20000 });
    await this.editButton().click();
    await expect(this.editKanbanModal()).toBeVisible({ timeout: 20000 });
  }

  // ============ EDIT KANBAN: TABS ============
  private kanbanTab = (tab: 'Info' | 'Columns' | 'Users') =>
    this.editKanbanModal().locator('.nav-tabs .nav-link', { hasText: tab }).first();

  private async ensureColumnsActive() {
    const modal = this.editKanbanModal();
    const tabBtn = this.kanbanTab('Columns');
    await tabBtn.click();
    await expect(tabBtn).toHaveClass(/active/, { timeout: 10000 });
    await modal.locator('li.list-group-item').first().waitFor({ state: 'visible', timeout: 30000 });
  }

  async openTab(tab: 'Info' | 'Columns' | 'Users') {
    const modal = this.editKanbanModal();
    await expect(modal).toBeVisible({ timeout: 20000 });

    const tabBtn = this.kanbanTab(tab);
    await tabBtn.click();
    await expect(tabBtn).toHaveClass(/active/, { timeout: 10000 });

    if (tab === 'Columns') {
      await modal.locator('li.list-group-item').first().waitFor({ state: 'visible', timeout: 30000 });
    } else if (tab === 'Users') {
      await expect(modal.locator('#saveKanbanOptions')).toBeVisible({ timeout: 20000 });
    }
  }

  // ============ COLUMNS ============
  private escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private columnListItem = (name: string) => {
    const modal = this.editKanbanModal();
    const labelCell = modal.locator('div.col, div.col-sm-2', {
      hasText: new RegExp(`^\\s*${this.escapeRegex(name)}\\s*$`, 'i'),
    }).first();
    return modal.locator('li.list-group-item').filter({ has: labelCell }).first();
  };

  private addTaskButtonWithin = (item: Locator) =>
    item.locator('button.us-button:has(i.mdi-plus)');

  private columnsRefreshBtn = () =>
    this.editKanbanModal().getByRole('button', { name: /Refresh/i }).first();

  async refreshColumns() {
    await this.ensureColumnsActive();
    const btn = this.columnsRefreshBtn();
    await expect(btn).toBeVisible({ timeout: 20000 });
    await btn.click();
    const modal = this.editKanbanModal();
    await modal.locator('li.list-group-item').first().waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(120);
  }

  async addTaskToColumn(columnName: string) {
    await this.ensureColumnsActive();

    const modal = this.editKanbanModal();
    let row = this.columnListItem(columnName);

    // Si no aparece de una, refresca una vez y reintenta
    if (!(await row.isVisible().catch(() => false))) {
      const btn = this.columnsRefreshBtn();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await modal.locator('li.list-group-item').first().waitFor({ state: 'visible', timeout: 30000 });
        await this.page.waitForTimeout(150);
        row = this.columnListItem(columnName);
      }
    }

    await expect(row).toBeVisible({ timeout: 20000 });

    await this.addTaskButtonWithin(row).click();

    // Espera el modal "Task - <columnName>"
    const listModal = this.taskListModalFor(columnName);
    await expect(listModal).toBeVisible({ timeout: 20000 });
    await listModal.locator('ul.todo-list').first().waitFor({ state: 'visible', timeout: 20000 });
    await listModal.locator('li.todo-list-item').first().waitFor({ state: 'visible', timeout: 20000 });
  }

  // ============ EDIT TASK ============
  private modalTab = (tabName: 'Information' | 'Assignation' | 'Timeline') =>
    this.editTaskModal().locator('.nav-tabs .nav-link', { hasText: tabName }).first();

  private modalRowByLabel(label: string) {
    const modal = this.editTaskModal();
    return modal.locator('.row.mb-1').filter({
      has: modal.locator('.label', { hasText: new RegExp(`^\\s*${this.escapeRegex(label)}`, 'i') }),
    }).first();
  }

  private async waitEditTaskInformationReady() {
    const modal = this.editTaskModal();
    await expect(modal).toBeVisible({ timeout: 20000 });
    const infoTab = this.modalTab('Information');
    await infoTab.click();
    await expect(infoTab).toHaveClass(/active/, { timeout: 10000 });
    await this.modalRowByLabel('Name').locator('input').first()
      .waitFor({ state: 'visible', timeout: 20000 });
  }

  private taskListItemByName = (taskName: string) => {
    const listModal = this.taskListModalFor(taskName);
    return listModal
      .locator('li.todo-list-item')
      .filter({
        has: listModal.locator('span.flex-column', {
          hasText: new RegExp(`^\\s*${this.escapeRegex(taskName)}\\b`, 'i'),
        }),
      })
      .first();
  };

  async openTaskEditorFor(taskName: string) {
    if (await this.editTaskModal().isVisible().catch(() => false)) {
      await this.closeEditTaskModal();
      await this.page.waitForTimeout(120);
    }

    const listModal = this.taskListModalFor(taskName);
    await expect(listModal).toBeVisible({ timeout: 20000 });
    await listModal.locator('ul.todo-list').first().waitFor({ state: 'visible', timeout: 20000 });

    const item = this.taskListItemByName(taskName);
    await expect(item).toBeVisible({ timeout: 20000 });
    await item.scrollIntoViewIfNeeded().catch(() => {});
    await item.hover().catch(() => {});

    const editIcon = item.locator('i.action.mdi-circle-edit-outline').first();
    await expect(editIcon).toBeVisible({ timeout: 20000 });
    await editIcon.scrollIntoViewIfNeeded().catch(() => {});

    const tryOpen = async () => {
      try { await editIcon.click({ timeout: 1200 }); } catch {}
      if (!(await this.editTaskModal().isVisible().catch(() => false))) {
        try { await editIcon.dispatchEvent('click'); } catch {}
      }
      if (!(await this.editTaskModal().isVisible().catch(() => false))) {
        const box = await editIcon.boundingBox();
        if (box) {
          await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await this.page.mouse.down();
          await this.page.mouse.up();
        }
      }
    };

    let opened = false;
    for (let i = 0; i < 3; i++) {
      await tryOpen();
      if (await this.editTaskModal().isVisible().catch(() => false)) { opened = true; break; }
      await this.page.waitForTimeout(200);
    }
    if (!opened) {
      await item.focus().catch(() => {});
      await item.press('Enter').catch(() => {});
      await expect(this.editTaskModal()).toBeVisible({ timeout: 5000 });
    }

    await this.waitEditTaskInformationReady();

    const nameInput = this.modalRowByLabel('Name').locator('input').first();
    try {
      await expect(nameInput).toHaveValue(new RegExp(`^\\s*${this.escapeRegex(taskName)}\\s*$`, 'i'), { timeout: 3000 });
    } catch {
      await this.closeEditTaskModal();
      await this.page.waitForTimeout(150);
      await tryOpen();
      await this.waitEditTaskInformationReady();
      await expect(nameInput).toHaveValue(new RegExp(`^\\s*${this.escapeRegex(taskName)}\\s*$`, 'i'), { timeout: 5000 });
    }

    await this.page.waitForTimeout(100);
  }

  async validateTaskInfo(expectedNameOrColumn: string) {
    await this.waitEditTaskInformationReady();

    const nameInput = this.modalRowByLabel('Name').locator('input').first();
    await expect(nameInput).toHaveValue(expectedNameOrColumn, { timeout: 20000 });

    const typeValue = this.modalRowByLabel('Type')
      .locator('.k-dropdownlist .k-input-value-text').first();
    await expect(typeValue).toHaveText(/^\s*Bool\s*$/, { timeout: 20000 });

    const colValue = this.modalRowByLabel('Column')
      .locator('.k-dropdownlist .k-input-value-text').first();
    await expect(colValue).toContainText(expectedNameOrColumn, { timeout: 20000 });

    const deadlineSpin = this.editTaskModal()
      .locator('.row.mb-1:has(.label:has-text("Dead Line"))')
      .getByRole('spinbutton').first();
    await expect(deadlineSpin).toHaveValue('4', { timeout: 20000 });

    const isActive = this.editTaskModal()
      .locator('input[type="checkbox"][name="IsActive"]').first();
    await expect(isActive).toBeChecked({ timeout: 20000 });
  }

  // ======== Asignación (Assignation) ========
  private assignRowByUserInModal = (user: string) =>
    this.editTaskModal().locator(`li.list-group-item:has(.col:has-text("${user}"))`).first();
  private checkboxWithin = (row: Locator) =>
    row.locator('input[type="checkbox"]').first();

  async assignUserInTask(user: string) {
    const modal = this.editTaskModal();
    await expect(modal).toBeVisible({ timeout: 20000 });

    const assignTab = this.modalTab('Assignation');
    await assignTab.click();
    await expect(assignTab).toHaveClass(/active/, { timeout: 10000 });
    await modal.locator('li.list-group-item').first().waitFor({ state: 'visible', timeout: 20000 });

    const userRow = this.assignRowByUserInModal(user);
    await expect(userRow).toBeVisible({ timeout: 20000 });

    const chk = this.checkboxWithin(userRow);
    if (!(await chk.isChecked().catch(() => false))) {
      await chk.check();
    }

    await modal.locator('#btnMilestoneSave').click();

    await expect(
      this.page.locator('#toast-container .toast-success .toast-message', {
        hasText: 'Milestone Updated!',
      })
    ).toBeVisible({ timeout: 20000 });

    await this.closeEditTaskModal();
    await this.closeTaskListModal();
  }

  // ============ CIERRES ============
  private async closeModal(modal: Locator) {
    const xBtn = modal.locator('.modal-header .btn-close').first();
    if (await xBtn.isVisible().catch(() => false)) {
      try { await xBtn.click(); } catch { await this.page.keyboard.press('Escape').catch(() => {}); }
    } else {
      const cancelBtn = modal.getByRole('button', { name: /^Cancel$/i }).first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click().catch(() => {});
      } else {
        await this.page.keyboard.press('Escape').catch(() => {});
      }
    }
    await modal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await this.page.locator('.modal-backdrop').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(100);
  }
  private async closeEditTaskModal() { await this.closeModal(this.editTaskModal()); }
  private async closeTaskListModal() { await this.closeModal(this.taskListModal()); }

  // ============ USERS TAB ============
  private usersResponsibleCheckbox = (user: string) =>
    this.editKanbanModal()
      .locator('tr, li, div')
      .filter({ has: this.editKanbanModal().locator('.text-left, td, div', { hasText: user }) })
      .first()
      .locator('input[type="checkbox"]').first();

  private kanbanSaveBtn = () => this.editKanbanModal().locator('#saveKanbanOptions');

  async setResponsible(user: string) {
    await this.openTab('Users');
    const chk = this.usersResponsibleCheckbox(user);
    await expect(chk).toBeVisible({ timeout: 20000 });
    if (!(await chk.isChecked().catch(() => false))) await chk.check();
    await this.kanbanSaveBtn().click();
    await expect(
      this.page.locator('#toast-container .toast-success .toast-message', { hasText: 'KanbanBoard Updated!' })
    ).toBeVisible({ timeout: 20000 });
  }

  // ============ MASTER DASHBOARD ============
  private firstTaskCheckbox = () => this.page.locator('input.k-checkbox[type="checkbox"]').first();
  private reassignBtn = () => this.page.locator('button.btn.btn-primary:has-text("Reassign User")');
  private reassignModalTitle = () => this.page.locator('.modal-title', { hasText: 'Reassing users' });
  private reassignDropdown = () => this.page.locator('.modal-content .k-dropdownlist').first();
  private reassignNativeSelect = () => this.page.locator('.modal-content select[name="KanbanUsersCombo"]');
  private reassignSave = () => this.page.locator('.modal-content .btn.btn-success', { hasText: 'Save' });

  async reassignFirstTaskTo(user: string) {
    await this.firstTaskCheckbox().check();
    await this.reassignBtn().click();
    await expect(this.reassignModalTitle()).toBeVisible({ timeout: 20000 });

    await this.reassignDropdown().click();
    const option = this.page.getByRole('option', { name: user }).first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
    } else if (await this.reassignNativeSelect().isVisible().catch(() => false)) {
      await this.reassignNativeSelect().selectOption({ label: user }).catch(async () => {
        await this.reassignDropdown().pressSequentially(user, { delay: 40 });
        await this.reassignDropdown().press('Enter');
      });
    } else {
      await this.reassignDropdown().pressSequentially(user, { delay: 40 });
      await this.reassignDropdown().press('Enter');
    }

    await this.reassignSave().click();
    await expect(
      this.page.locator('#toast-container .toast-success .toast-message', { hasText: 'Updated Users Successfully' })
    ).toBeVisible({ timeout: 20000 });
  }
}
