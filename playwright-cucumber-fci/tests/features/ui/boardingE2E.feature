@ui @boardinge2e @ci
Feature: Boarding end-to-end (crear y migrar)

  Background:
    Given que ingreso al sistema como "admin"

  Scenario: Crear un Boarding Portfolio y migrarlo en el Portal
    # --- Creación del boarding (antes eras @boarding) ---
    When busco y accedo al lender "2001670" desde admin
    And cierro el popup si está presente
    And navego a la sección de Boarding Portfolio
    And inicio el proceso de nuevo boarding
    And completo la tab Previous del boarding wizard
    And completo la tab Investor del boarding wizard
    And completo la tab Broker del boarding wizard
    And completo la tab Borrower del boarding wizard
    And completo la tab Property del boarding wizard
    And completo la tab Loan y guardo el boarding
    Then valido el popup de éxito de boarding

    # --- Flujo de Portal (antes era @boardingPortal) ---
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
