@sessionTimeout 
Feature: Session inactivity timeout

  Scenario: Cierre de sesión luego de 60 minutos de inactividad (Admin Portal)
    Given que ingreso al sistema como "admin"
    When cierro el popup si está presente
    And comienzo a medir el tiempo de inactividad
    Then la sesión debe cerrarse por inactividad en un máximo de 60 minutos
