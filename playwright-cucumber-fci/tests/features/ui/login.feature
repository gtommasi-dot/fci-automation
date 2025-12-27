Feature: Login FCI Lender

  @login @ui @2fa @ci
  Scenario: Login exitoso con verificación por código
    Given que navego a la página de login
    When ingreso usuario y contraseña
    And hago click en el botón Sign In
    And debo ver la pantalla de verificación de código
    And obtengo el código de verificación desde Email Log como "admin"
    And ingreso el código de verificación en la pantalla
    Then debo ver el nombre del usuario
