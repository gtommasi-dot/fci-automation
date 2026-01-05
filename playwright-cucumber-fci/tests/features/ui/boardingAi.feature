
Feature: Boarding AI Process
  @boardingAi @e2e @wip @ui
  Scenario: Completar los pasos del 1 al 13 del proceso Boarding AI
    Given que ingreso a la página de Boarding
    Then debería ver el título "Step 1: Are you currently a lender with FCI Lender Services?"
    When ingreso el número de cuenta "11053" y hago clic en Buscar
    Then espero que se valide el número de cuenta
    Then hago clic en el botón Next

    Then debería ver el título "Step 2: When Loan is Current (less than 60 days delinquent) Servicing Program is?"
    Then debería ver los siguientes textos:
      | STANDARD BASIC - $20 Base Fee per month |
      | HIGH TOUCH - $35 Base Fee per month     |
    Then debería ver el Boarding Tracker Code en consola
    Then hago clic en el botón Next

    Then debería ver el título "Step 3: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
    Then debería ver los siguientes textos:
      | Full Collection - $95 Base Fee per month |
      | Limited Collection - $35 Base Fee per month |
    Then hago clic en el botón Next

    Then debería ver el título "Step 4: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
    Then verifico el bloque de documentos requeridos
    When subo los documentos requeridos
    Then los documentos deberían haberse subido correctamente
    Then hago clic en el botón Next

    Then debería ver el título "Step 5: Is there a Broker on this loan?"
    Then verifico opciones Yes y No en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 6: Is Borrower in Negotiations on a loan mod or a forbearance plan?"
    Then verifico opciones Yes y No con nota en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 7: Has Borrower ever Filed Bankruptcy?"
    Then verifico opciones Yes y No en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 8:  Is Borrower in an active Foreclosure?"
    Then verifico opciones Yes y No en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 9: Payor/Borrower Information"
    Then completo la información del prestatario
    Then hago clic en el botón Next

    Then debería ver el título "Step 10: Property Details"
    Then verifico los bloques del paso 10
    Then en el Step 10 si Appraiser Market Value es 0 ingreso un monto aleatorio
    Then hago clic en el botón Next

    Then debería ver el título "Step 11: Loan Information"
    Then selecciono la opción either en todos los campos
    Then hago clic en el botón Next

    Then debería ver el título "LOAN SERVICING COMPLIANCE FORM"
    Then realizo la firma

    Then proceso y firmo el LSA

        # ——— Portal: PreBoarding → procesar
    Given que ingreso al sistema como "admin"
    Then voy a PreBoarding del Portal
    When selecciono la primera fila en PreBoarding y guardo el PrevAccount
    Then proceso los Pre-Boardings seleccionados

    # ——— Portal: abrir boarding y completar Investor + Pending Docs
    When abro el boarding desde AllBoarding usando el PrevAccount guardado
    Then voy a la pestaña Investor del boarding
    When completo Add Investor Charge con Payment Code "SECO101", Period "September 2025, Monthly" y Unit Price en 1
    Then guardo la carga del Investor y confirmo el modal
    Then expando el panel derecho y marco que ya recibimos los documentos pendientes

    # ——— Portal: Loan → sincronizar fechas y finalizar boarding con docs ya generados
    Then voy a la pestaña Loan del boarding
    Then sincronizo Interest Paid To con First Payment
    Then finalizo el boarding cuando los documentos ya existen

    # ——— Portal: Centurion + validar migración
    Then en FinalBoarding marco la fila por PrevAccount y boardeo a Centurion
    Then en Migration History verifico Migrated Success por PrevAccount



  @boardingAibroker @e2e @wip @ui
Scenario: Completar Boarding AI con broker en Step 5 (Yes + búsqueda + spread/fees)
  Given que ingreso a la página de Boarding
  Then debería ver el título "Step 1: Are you currently a lender with FCI Lender Services?"
  When ingreso el número de cuenta "11053" y hago clic en Buscar
  Then espero que se valide el número de cuenta
  Then hago clic en el botón Next

  Then debería ver el título "Step 2: When Loan is Current (less than 60 days delinquent) Servicing Program is?"
  Then debería ver los siguientes textos:
    | STANDARD BASIC - $20 Base Fee per month |
    | HIGH TOUCH - $35 Base Fee per month     |
  Then debería ver el Boarding Tracker Code en consola
  Then hago clic en el botón Next

  Then debería ver el título "Step 3: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
  Then debería ver los siguientes textos:
    | Full Collection - $95 Base Fee per month   |
    | Limited Collection - $35 Base Fee per month |
  Then hago clic en el botón Next

  Then debería ver el título "Step 4: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
  Then verifico el bloque de documentos requeridos
  When subo los documentos requeridos
  Then los documentos deberían haberse subido correctamente
  Then hago clic en el botón Next

  Then debería ver el título "Step 5: Is there a Broker on this loan?"
  Then verifico opciones Yes y No en el paso

  When en el Step 5 selecciono Yes, ingreso el broker "V1908510" y busco
  Then debería verse el modal de broker con datos cargados para "V1908510"
  When en el Step 5 habilito "Is there a yield spread..." en Yes y coloco "15" por ciento
  And en el Step 5 habilito "Is the broker due a servicing fee..." en Yes
  And en el Step 5 incremento por teclado los campos "Principal Balance %", "Plus Amount" y "Minimun"
  Then hago clic en el botón Next

  Then debería ver el título "Step 6: Is Borrower in Negotiations on a loan mod or a forbearance plan?"
  Then verifico opciones Yes y No con nota en el paso
  Then hago clic en el botón Next

  Then debería ver el título "Step 7: Has Borrower ever Filed Bankruptcy?"
  Then verifico opciones Yes y No en el paso
  Then hago clic en el botón Next

  Then debería ver el título "Step 8:  Is Borrower in an active Foreclosure?"
  Then verifico opciones Yes y No en el paso
  Then hago clic en el botón Next

  Then debería ver el título "Step 9: Payor/Borrower Information"
  Then completo la información del prestatario
  Then hago clic en el botón Next

  Then debería ver el título "Step 10: Property Details"
  Then verifico los bloques del paso 10
  Then en el Step 10 si Appraiser Market Value es 0 ingreso un monto aleatorio
  Then hago clic en el botón Next

  Then debería ver el título "Step 11: Loan Information"
  Then selecciono la opción either en todos los campos
  Then hago clic en el botón Next

  Then debería ver el título "LOAN SERVICING COMPLIANCE FORM"
  Then realizo la firma

  Then proceso y firmo el LSA


    @boardingAiCardPayment @e2e @wip @ui
    Scenario: Completar Pago de tarjeta en Step 1 y luego continuar hasta firmar LSA 
    Given que ingreso a la página de Boarding
    Then debería ver el título "Step 1: Are you currently a lender with FCI Lender Services?"
    When selecciono que no tengo cuenta de lender
    When completo el formulario básico del nuevo lender
    Then hago clic en el botón Next
    Then espero que el modal de Pay By Credit Card esté cargado
    When completo los datos de tarjeta "visa" y pago

    Then debería ver el título "Step 2: When Loan is Current (less than 60 days delinquent) Servicing Program is?"
    Then debería ver los siguientes textos:
      | STANDARD BASIC - $20 Base Fee per month |
      | HIGH TOUCH - $35 Base Fee per month     |
    Then debería ver el Boarding Tracker Code en consola
    Then hago clic en el botón Next

    Then debería ver el título "Step 3: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
    Then debería ver los siguientes textos:
      | Full Collection - $95 Base Fee per month |
      | Limited Collection - $35 Base Fee per month |
    Then hago clic en el botón Next

    Then debería ver el título "Step 4: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
    Then verifico el bloque de documentos requeridos
    When subo los documentos requeridos
    Then los documentos deberían haberse subido correctamente
    Then hago clic en el botón Next

    Then debería ver el título "Step 5: Is there a Broker on this loan?"
    Then verifico opciones Yes y No en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 6: Is Borrower in Negotiations on a loan mod or a forbearance plan?"
    Then verifico opciones Yes y No con nota en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 7: Has Borrower ever Filed Bankruptcy?"
    Then verifico opciones Yes y No en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 8:  Is Borrower in an active Foreclosure?"
    Then verifico opciones Yes y No en el paso
    Then hago clic en el botón Next

    Then debería ver el título "Step 9: Payor/Borrower Information"
    Then completo la información del prestatario
    Then hago clic en el botón Next

    Then debería ver el título "Step 10: Property Details"
    Then verifico los bloques del paso 10
    Then en el Step 10 si Appraiser Market Value es 0 ingreso un monto aleatorio
    Then hago clic en el botón Next

    Then debería ver el título "Step 11: Loan Information"
    Then selecciono la opción either en todos los campos
    Then hago clic en el botón Next

    Then debería ver el título "LOAN SERVICING COMPLIANCE FORM"
    Then realizo la firma
    
    

    @boardingAiGeorgia @e2e @wip @ui
    Scenario: Completar los pasos del 1 al 13 del proceso Boarding AI , Seleccionando Georgia en el Step 10
      Given que ingreso a la página de Boarding
      Then debería ver el título "Step 1: Are you currently a lender with FCI Lender Services?"
      When ingreso el número de cuenta "11053" y hago clic en Buscar
      Then espero que se valide el número de cuenta
      Then hago clic en el botón Next

      Then debería ver el título "Step 2: When Loan is Current (less than 60 days delinquent) Servicing Program is?"
      Then debería ver los siguientes textos:
        | STANDARD BASIC - $20 Base Fee per month |
        | HIGH TOUCH - $35 Base Fee per month     |
      Then debería ver el Boarding Tracker Code en consola
      Then hago clic en el botón Next

      Then debería ver el título "Step 3: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
      Then debería ver los siguientes textos:
        | Full Collection - $95 Base Fee per month |
        | Limited Collection - $35 Base Fee per month |
      Then hago clic en el botón Next

      Then debería ver el título "Step 4: When Loan is Delinquent (60 or more days delinquent) Servicing Program is?"
      Then verifico el bloque de documentos requeridos
      When subo los documentos requeridos
      Then los documentos deberían haberse subido correctamente
      Then hago clic en el botón Next

      Then debería ver el título "Step 5: Is there a Broker on this loan?"
      Then verifico opciones Yes y No en el paso
      Then hago clic en el botón Next

      Then debería ver el título "Step 6: Is Borrower in Negotiations on a loan mod or a forbearance plan?"
      Then verifico opciones Yes y No con nota en el paso
      Then hago clic en el botón Next

      Then debería ver el título "Step 7: Has Borrower ever Filed Bankruptcy?"
      Then verifico opciones Yes y No en el paso
      Then hago clic en el botón Next

      Then debería ver el título "Step 8:  Is Borrower in an active Foreclosure?"
      Then verifico opciones Yes y No en el paso
      Then hago clic en el botón Next

      Then debería ver el título "Step 9: Payor/Borrower Information"
      Then completo la información del prestatario
      Then hago clic en el botón Next

      Then debería ver el título "Step 10: Property Details"
      Then verifico los bloques del paso 10
      Then selecciono el estado "Georgia" en Property Details
      Then en el Step 10 si Appraiser Market Value es 0 ingreso un monto aleatorio
      Then hago clic en el botón Next

      Then debería ver el título "Step 11: Loan Information"
      Then selecciono la opción either en todos los campos
      Then hago clic en el botón Next

      Then debería ver el título "LOAN SERVICING COMPLIANCE FORM"
      Then realizo la firma

      Then proceso y firmo el LSA
