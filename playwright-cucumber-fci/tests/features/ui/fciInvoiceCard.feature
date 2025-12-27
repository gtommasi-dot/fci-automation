
Feature: Pago de factura por Credit Card con diferentes marcas
  @fciInvoiceCard @ui
  Scenario: Pago exitoso de una factura por <tipo>
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "2001670" desde admin
    And cierro el popup si está presente
    And navego a la sección de Fci Invoices
    And verifico que se muestra la página de facturas pendientes
    And selecciono la primera factura de la tabla
    And hago click en el botón Pay By Credit Card
    And completo el formulario de tarjeta y proceso el pago para "<tipo>"
    Then valido el resultado del pago y cierro popup

    Examples:
      | tipo         |
       | amex         |
      # | discover     |
      # | jcb          |
      # | visa         |
      # | mastercard   |
      # | unionpay     |
      # | diners       |
      # | laser      |
      # | dankort      |

      # | elo          |
      # | hipercard    |  

      
