Feature: Draw Request
  As a Lender,
  I WANT TO create a DrawLoan Request,
  SO THAT I can request funds.

  Background:
    Given que ingreso al sistema como "admin"

  @drawrequest @ui @ci @smoke
  Scenario: Crear un DrawLoan Request y verificar la grilla
    When busco y accedo al lender "2001670" desde admin
    And cierro el popup si está presente
    When navego a Draw Request
    And abro el modal de New DrawLoan
    And completo el formulario con Loan "<LoanNumber>", Account "<InvestorAccount>", Amount <Amount> y Comments "<Comments>"
    Then debería ver la nueva fila con Loan "<LoanNumber>", Account "<InvestorAccount>" y Amount mínimo <Amount>

    Examples:
      | LoanNumber | InvestorAccount | Amount | Comments             |
      | 399312954  | 2210504         | 100    | Test draw request A  |
      | 399312954  | 2404674         | 150    | Test draw request B  |
      | 399312954  | 2001670         | 200    | Test draw request C  |
      | 399312954  | 2107640         | 300    | Test draw request D  |

  @drawrequestBulk @ui @ci @smoke
  Scenario: Bulk Draw Request - Cargar archivo y verificar la grilla
    When busco y accedo al lender "gentest" desde admin
    And cierro el popup si está presente
    When navego a Draw Request
    And abro el modal de Bulk Draw Request
    And cargo el archivo de Bulk Draw Request desde assets
    Then debería ver 11 filas cargadas en el modal de Bulk Draw Request
    When selecciono Select All en el modal de Bulk Draw Request
    And confirmo Load Draw Loan y espero el cierre del modal
    Then debería ver en la grilla de Draw Request los loans cargados:
      | LoanNumber | InvestorAccount | MinAmount |
      | G17057296  | 16614           | 500       |
      | G16082754  | 16607           | 600       |
      | G16082754  | 16610           | 700       |
      | G17026593  | 16610           | 1000      |
      | G15002532  | 16610           | 1100      |
      | G15002532  | 16607           | 1200      |
      | G15002532  | 16613           | 1300      |
      | G20082494  | 1711696         | 1400      |
      | G15002296  | 16603           | 1500      |
