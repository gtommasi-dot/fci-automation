
Feature: Navegación general del Lender (barra lateral)

  @lendernav @ui @ci @smoke
  Scenario: Navegación completa por todas las secciones del menú lateral como lender
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "gentest" desde admin
    When cierro el popup si está presente
    Then navego por todas las secciones y valido navegación, contenido y screenshots
