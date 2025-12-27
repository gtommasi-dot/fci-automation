
Feature: Navegación pública del sitio FCI (Navbar y Footer)
  Como usuario visitante
  Quiero navegar por los enlaces del navbar y del footer
  Para verificar que cada sección carga correctamente

  @navbar @ui
  Scenario: Recorrer todos los enlaces del navbar
    Given que estoy en el sitio público de FCI
    Then veo la página pública cargada correctamente
    When recorro y valido todos los enlaces del navbar
    Then cada enlace del navbar cambia la URL y carga su sección

  @footer @ui
  Scenario: Recorrer todos los enlaces del footer
    Given que abro el home público de FCI
    When recorro y valido todos los enlaces del footer
    Then cada enlace del footer cambia la URL y carga su sección
