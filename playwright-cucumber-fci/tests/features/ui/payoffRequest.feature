
Feature: Payoff Request

  @payoff @ui
  Scenario: Solicitud de Payoff exitosa o con validación de resultado
    Given que ingreso al sistema como "borrower"
    When cierro el popup si está presente
    And navego a la sección de Payoff Request
    And verifico los campos y controles del bloque de Payoff Request
    And selecciono "Payoff" como motivo
    And escribo un comentario en el campo Comments
    And hago click en el botón Submit
    Then valido el popup de resultado de solicitud de Payoff
