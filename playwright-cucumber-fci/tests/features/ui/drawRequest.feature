
Feature: Draw Request
  As a Lender,
  I WANT TO create a DrawLoan Request,
  SO THAT I can request funds.

  Background:
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "2001670" desde admin
    When cierro el popup si está presente

  @drawrequest  @ui
  Scenario: Crear un DrawLoan Request y verificar la grilla
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
