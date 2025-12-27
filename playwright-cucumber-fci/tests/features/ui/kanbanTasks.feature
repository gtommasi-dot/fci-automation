@kanbanAssign
Feature: Asignar tasks de Boarding y re-asignar desde Master Dashboard (navegación directa)

  Background:
    Given que ingreso al sistema como "admin"
    And voy directo a "Manage Kanban Board"

  Scenario: Configurar Set Up y Pre Boarding, marcar Responsible y re-asignar desde Master Dashboard
    When edito el board "Boarding"
    And en Columns refresco la lista
    And en Columns agrego y asigno la task "Set Up" al usuario "admin test"
    And en Columns agrego y asigno la task "Pre Boarding" al usuario "admin test"
    And marco a "admin test" como Responsible del board
    And en Master Dashboard re-asigno la primera task a "admin test"
    Then veo toasts de éxito en la operación actual
