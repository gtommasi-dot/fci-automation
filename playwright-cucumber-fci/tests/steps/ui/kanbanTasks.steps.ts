// tests/steps/ui/kanbanTasks.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { KanbanBoardPage } from '../../pages/KanbanTasksPage';

When('voy directo a {string}', async function (destino: string) {
  this.kanban = new KanbanBoardPage(this.page);
  if (destino === 'Manage Kanban Board') {
    await this.kanban.goDirectToManageKanban();
  } else if (destino === 'Master Dashboard') {
    await this.kanban.goDirectToMasterDashboard();
  } else {
    throw new Error(`Destino no soportado: ${destino}`);
  }
});

When('edito el board {string}', async function (boardName: string) {
  await this.kanban.selectBoardAndEdit(boardName);
});

When('en Columns refresco la lista', async function () {
  await this.kanban.refreshColumns();
});

When(
  'en Columns agrego y asigno la task {string} al usuario {string}',
  async function (taskName: string, userName: string) {
    await this.kanban.openTab('Columns');         // ya estamos en Edit Kanban
    await this.kanban.addTaskToColumn(taskName);  // abre "Task - <taskName>"
    await this.kanban.openTaskEditorFor(taskName);
    await this.kanban.validateTaskInfo(taskName);
    await this.kanban.assignUserInTask(userName);
  }
);

When('marco a {string} como Responsible del board', async function (usuario: string) {
  await this.kanban.setResponsible(usuario);
});

When('en Master Dashboard re-asigno la primera task a {string}', async function (usuario: string) {
  await this.kanban.goDirectToMasterDashboard();
  await this.kanban.reassignFirstTaskTo(usuario);
});

Then('veo toasts de éxito en la operación actual', async function () {
  await expect(this.page.locator('#toast-container .toast-success')).toBeVisible({ timeout: 20000 });
});
