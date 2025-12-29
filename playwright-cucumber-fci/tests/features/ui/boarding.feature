
Feature: Crear nuevo Boarding Portfolio
  
  Background:
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "2001670" desde admin
    When cierro el popup si está presente

  @boarding  @ci @smoke
  Scenario: Creación exitosa de un Boarding Portfolio
    When navego a la sección de Boarding Portfolio
    And inicio el proceso de nuevo boarding
    And completo la tab Previous del boarding wizard
    And completo la tab Investor del boarding wizard
    And completo la tab Broker del boarding wizard
    And completo la tab Borrower del boarding wizard
    And completo la tab Property del boarding wizard
    And completo la tab Loan y guardo el boarding
    Then valido el popup de éxito de boarding

