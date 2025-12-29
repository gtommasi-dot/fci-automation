
Feature: Pago Express Online

  @express @ui @ci @smoke
  Scenario: Pago Express exitoso para borrower
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "test8180" desde admin
    When cierro el popup si está presente
    And navego a la sección de Online Payments
    And verifico información de Online Payments
    And hago click en el botón Express Payment
    And verifico modal de Express Payment paso 1 y avanzo
    And ingreso los datos bancarios y acepto el acuerdo
    And firmo y guardo en el modal de firma
    And confirmo el pago en el paso final del modal
    Then debería ver el mensaje de confirmación de pago exitoso y cerrar el modal final
