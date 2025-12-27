@boardingPortal
Feature: Boarding Portal - Flujo completo

  Background:
    Given que ingreso al sistema como "admin"

  Scenario: Flujo completo de migración (Test-Board-001)
    Given que estoy en All Boarding del Portal
    When abro el boarding del PrevAccount "Test-Board-001"
    Then recuerdo el Loan Account mostrado en el header
    When completo el bloque Add Investor Charge con Payment Code "SECO101", Period "September 2025, Monthly" y Unit Price en 1
    And guardo la carga del Investor y confirmo el modal
    And expando el panel derecho y marco que ya recibimos los documentos pendientes
    And completo el Pre-Boarding
    And abro Email Log y firmo Setup Form del Broker
    And firmo los dos documentos del Lender desde Email Log
    And finalizo el boarding a Centurion
    Then verifico en Migration History que el Loan Account migró con éxito
