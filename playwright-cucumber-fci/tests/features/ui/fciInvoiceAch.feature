
Feature: Pago de factura por ACH desde el portal Admin
  @fciInvoiceAch @ui @smoke
  Scenario: Pago exitoso de una factura por ACH
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "2001670" desde admin
    And cierro el popup si está presente
    And navego a la sección de Fci Invoices
    And verifico que se muestra la página de facturas pendientes
    And selecciono la primera factura de la tabla
    And hago click en el botón Pay By ACH
    And completo el formulario de ACH y proceso el pago
    Then valido que aparezca el popup de pago exitoso y lo cierro

