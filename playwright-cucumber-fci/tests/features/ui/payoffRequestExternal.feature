Feature: Payoff Request External como Borrower
  Como borrower externo
  Quiero solicitar un payoff request
  Para que se envíe la petición correctamente a mi lender

  @ui @payoffExternal
  Scenario Outline: Flujo completo de Payoff Request External - "<loan>"
    Given que abro la página de Payoff Request External
    When completo el formulario inicial de payoff con "<loan>" "<zip>" "<tin>"

    # --- Pestaña Admin ---
    And abro una pestaña de admin y busco el código de verificación
    Given que ingreso al sistema como "admin"
    And navego a Email Log y obtengo el código del loan "<loan>"

    # --- Volvemos a Borrower ---
    And ingreso el código de verificación en borrower
    Then valido que los bloques de payoff se muestren correctamente para "<loan>"
    When completo el formulario de payoff y lo envío
    Then valido el mensaje de éxito del payoff

  Examples:
    | loan      | zip   | tin  |
    | 399383445 | 02740 | 6789 |
    | 399383478 | 94103 | 6789 |
    | 399604019 | 19963 | 6789 |
