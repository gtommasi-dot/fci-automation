@letterExternal @ui @wip
Feature: Letter Request External

  Scenario Outline: Flujo completo de Letter Request External con "<authType>"
    Given que abro la página de Letter Request External
    When completo el formulario inicial de Letter con "<loan>" "<zip>" "<tin>"
    Then verifico los bloques de Letter con el loan guardado "<loan>"
    When completo el formulario de Letter con "<authType>"
    And envío el Letter Request
    Then valido el resultado del Letter Request
    Given que ingreso al sistema como "admin"
    When navego a Email Log y autorizo el Letter "<loan>"
    Then firmo el documento y valido el mensaje final

  Examples:
    | loan      | zip   | tin  | authType  |
    #  | 399383445 | 02740 | 6789 | Borrower  |
    #  | 399383478	| 94103 | 6789 | Lender    |
     | 399579695 | 90806 | 6789 | Broker    |
    #  | 399442479 | 10467 | 6789 | Broker    |
    #  | 399449073 | 90039 | 6789 | Borrower  |
