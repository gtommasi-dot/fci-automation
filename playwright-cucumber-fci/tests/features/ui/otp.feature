Feature: One-Time Express Payment OTP

  @otpA @smoke
  Scenario Outline: Camino A - OTP con SSN/EIN/TIN (Last 4 Digits)
    Given que ingreso a la página de One-Time Express Payment
    When valido la cuenta usando SSN con account number "<accountNumber>" y últimos 4 dígitos "<ssnLast4>"
    And manejo el popup opcional de cuenta con ACH mensual
    And manejo el popup opcional de pago adicional ACH
    And verifico los bloques de Loan Information y Express Payment y avanzo al paso 2
    And ingreso los datos bancarios para OTP y acepto el acuerdo
    And firmo y guardo en el modal de firma para OTP
    And confirmo el pago en el paso final para OTP
    Then imprimo los datos de confirmación del pago para OTP

    Examples:
      | accountNumber | ssnLast4 |
      | 399604019     | 6789     |
      | 399535638     | 6789     |
      | 399599045     | 6789     |
      | 9160059608    | 6789     |
      | 399579695     | 6789     |

  @otpB @smoke
  Scenario Outline: Camino B - OTP con Address Number y Zip Code
    Given que ingreso a la página de One-Time Express Payment
    And cambio el formulario para usar address number y zip code
    When valido la cuenta usando address number con account number "<accountNumber>", address number "<addressNumber>" y zip code "<zipCode>"
    And manejo el popup opcional de cuenta con ACH mensual
    And manejo el popup opcional de pago adicional ACH
    And verifico los bloques de Loan Information y Express Payment y avanzo al paso 2
    And ingreso los datos bancarios para OTP y acepto el acuerdo
    And firmo y guardo en el modal de firma para OTP
    And confirmo el pago en el paso final para OTP
    Then imprimo los datos de confirmación del pago para OTP

    Examples:
      | accountNumber | addressNumber | zipCode |
      | 399604019     | 509           | 19963   |
      | 399535638     | 2262          | 32456   |
      | 399599045     | 4234          | 98367   |
      | 9160059608    | 665           | 07607   |
      | 399579695     | 3325          | 90806   |
