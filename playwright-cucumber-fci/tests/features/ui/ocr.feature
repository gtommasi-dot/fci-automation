
Feature: OCR Check Groups - Split, revisar info y completar Loan
  Como admin
  Quiero cargar un TIF, generar el split y completar la info del check
  Para verificar que el flujo de OCR funciona correctamente

  Background:
    # Tu login de admin ya existe en otros steps
    Given que ingreso al sistema como "admin"
   # And estoy en el Home del portal

  @ocr @ui
  Scenario: Subir TIF, generar split, revisar info y completar Loan
    Given voy a OCR Check Groups desde el menú
    And abro el modal New Split Image y subo el archivo "ocr/Batch_001_TEST.tif"
    And ejecuto Split Image and Generate
    Then veo la página de información del split con los campos básicos
    When regreso a OCR Check Groups
    And entro a Details del primer registro
    And abro Info del primer check
    Then veo los bloques Pending Task, Loan y OCR Image
    When selecciono la cuenta "test8180" en el combobox Loan
    And ingreso el Total Amount 3487
    Then veo el bloque de resumen verde y registro sus datos en consola
