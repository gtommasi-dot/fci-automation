@payoffRequestLender
Feature: Proceso de Payoff Request desde Lirs

  @payoffRequestLenderSuccess @ui
  Scenario: Firma y validación tras solicitud de Payoff exitosa como Lender
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "1707626" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Lender" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

    # ------ Firma y validación -------
    And espero el modal de éxito tras la solicitud de Payoff
    And hago click en Track My Payoff y valido el tracker
    And hago click en Review Payoff Demand y valido el documento
    And acepto los términos y continúo en el documento de review
    And abro el modal de firma
    And ingreso la firma y acepto en el modal
    And hago click en los campos de Signature, Print Name y Date
    # And marco el grupo y hago la firma del lender
    Then envío la firma y verifico la aprobación

    @payoffRequestBorrowerSuccess @ui
  Scenario: Firma y validación tras solicitud de Payoff exitosa como Borrower
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "1707626" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Borrower" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

    # ------ Firma y validación -------
    And espero el modal de éxito tras la solicitud de Payoff
    And hago click en Track My Payoff y valido el tracker
    And hago click en Review Payoff Demand y valido el documento
    And acepto los términos y continúo en el documento de review
    And abro el modal de firma
    And ingreso la firma y acepto en el modal
    And hago click en los campos de Signature, Print Name y Date
    # And marco el grupo y hago la firma del lender
    Then envío la firma y verifico la aprobación

  @payoffRequestBorrowerActive @ui
  Scenario: Solicitud de Payoff Activa, como Borrower
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "amercapgrp" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Borrower" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

    @payoffRequestLenderActive @ui
  Scenario: Solicitud de Payoff Activa, como Lender
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "amercapgrp" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Lender" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

    @payoffRequestLenderFuther @ui
  Scenario: Solicitud de Payoff Futher como Lender
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "v1908510" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Lender" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

     @payoffRequestBorrowerFuther @ui
  Scenario: Solicitud de Payoff Futher como Borrower
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "v1908510" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Borrower" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

      @payoffRequestBrokerFuther @ui
  Scenario: Solicitud de Payoff Futher como Broker
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "v1908510" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Broker" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

    @payoffRequestLenderPenalty @ui
  Scenario: Solicitud de Payoff Prepayment Penalty Lender
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "V2507502" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Lender" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff

     @payoffRequestBorrowerPenalty @ui
  Scenario: Solicitud de Payoff Prepayment Penalty como Borrower
    Given que ingreso al sistema como "admin"
    When busco y accedo al lender "V2507502" desde admin
    And cierro el popup si está presente
    And expando el menú Loan Portfolio
    And ingreso a Loan Portfolio
    And hago click en el botón INFO del primer loan
    And selecciono Loan Details en el dropdown de INFO
    And hago click en Send a Request Payoff
    And espero el modal de solicitud de Payoff
    And selecciono "Borrower" en Request By
    And selecciono "Payoff" en Reason
    And ingreso el comentario en la solicitud de Payoff
    And valido el texto informativo del modal
    And envío la solicitud de Payoff
    And gestionar el resultado de la solicitud de Payoff




