# tests/features/GeneralNavBlis.feature
@ui @blisnav
Feature: General navigation through BLIS as borrower
  In order to access all borrower loan information
  As a borrower user
  I want to be able to navigate through all main BLIS sections

  Background:
    # Ajustá estas frases para que coincidan con los steps ya definidos en common.steps.ts
    Given que ingreso al sistema como "borrower"
    When cierro el popup si está presente

  Scenario: Borrower can navigate through all main BLIS sections
    Then I can navigate through all main BLIS sections

  # Ejemplo opcional si querés usar los steps parametrizados:
  #
  # Scenario: Borrower can open Payment History
  #   When I navigate to the "Payment History" section in BLIS
  #   Then the "Payment History" section in BLIS should be displayed
