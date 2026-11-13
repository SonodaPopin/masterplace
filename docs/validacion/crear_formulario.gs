/**
 * Crea el Google Form de la validación con usuarios de MasterPlace (docs/validacion/plan_validacion.md).
 *
 * Cómo usarlo:
 *   1. Entrar a https://script.google.com con la cuenta de Google donde quieres el formulario → "Nuevo proyecto".
 *   2. Borrar el contenido, pegar este archivo completo y cambiar URL_PAGINA y URL_CARNET más abajo.
 *   3. Elegir la función crearFormulario en la barra superior → "Ejecutar" → aceptar los permisos.
 *   4. En "Registro de ejecución" aparecen tres enlaces: para responder, para editar y la hoja de respuestas.
 *   5. Revisar el formulario, probarlo una vez de principio a fin y borrar esa respuesta de prueba.
 *
 * Ejecutarlo dos veces crea dos formularios distintos (no reemplaza el anterior).
 */

const URL_PAGINA = 'https://masterplace.vercel.app';    // dirección publicada de MasterPlace
const URL_CARNET = 'https://drive.google.com/file/d/19_jtOscMLPtzyF_hpJkEXETlVV34QYrm/view?usp=sharing';  // imagen "DOCUMENTO FICTICIO SIN VALIDEZ"

const ESCALA_LOGRO = ['Sí, sin problemas', 'Sí, pero me costó', 'No pude', 'No lo intenté'];
const ESCALA_TIEMPO = ['Menos de 2 minutos', 'Entre 2 y 5 minutos', 'Entre 5 y 10 minutos', 'Más de 10 minutos'];

const ITEMS_SUS = [
  'Creo que me gustaría usar esta página con frecuencia.',
  'Encontré la página innecesariamente compleja.',
  'Pensé que la página era fácil de usar.',
  'Creo que necesitaría ayuda de una persona con conocimientos técnicos para usar esta página.',
  'Encontré que las distintas funciones de la página estaban bien integradas.',
  'Pensé que había demasiada inconsistencia en la página.',
  'Imagino que la mayoría de las personas aprendería a usar esta página muy rápidamente.',
  'Encontré la página muy difícil de usar.',
  'Me sentí muy seguro(a) usando la página.',
  'Necesité aprender muchas cosas antes de poder usar la página.',
];

const CONSENTIMIENTO =
  'Somos estudiantes de Ingeniería Civil Informática de la Universidad de Concepción y estamos desarrollando ' +
  'MasterPlace como proyecto académico. Le pediremos hacer algunas tareas en la página y responder preguntas; toma ' +
  'unos 10 a 15 minutos. Estamos evaluando la página, no a usted: si algo no resulta, es un problema de la página.\n\n' +
  'Participar es voluntario y puede dejar de responder en cualquier momento. Usará un correo y un carnet de prueba ' +
  'que le damos nosotros: no le pediremos su carnet, su RUT ni su correo real. Este formulario no registra su correo ' +
  'ni su nombre; lo identificamos solo con un código. Revisaremos en la base de datos de la página las acciones ' +
  'hechas con su código de prueba.\n\n' +
  'Los resultados se usarán solo para mejorar el proyecto y presentarlo en la asignatura; las respuestas se ' +
  'eliminarán al cerrar la evaluación y solo se conservarán resultados anónimos.';

function crearFormulario() {
  const form = FormApp.create('MasterPlace · Prueba de la página');
  form.setDescription(
    'Gracias por ayudarnos. Tenga a mano su código de participante (P1, P2...) y el celular o computador donde ' +
      'hará las tareas. Toma unos 10 a 15 minutos.',
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('¡Muchas gracias! Sus respuestas nos ayudan a mejorar MasterPlace.');

  // --- Sección 1: consentimiento -------------------------------------------------
  form.addSectionHeaderItem().setTitle('Consentimiento').setHelpText(CONSENTIMIENTO);
  const acepta = form.addMultipleChoiceItem().setTitle('¿Acepta participar bajo estas condiciones?').setRequired(true);

  // --- Sección 2: datos -------------------------------------------------------------
  const pagDatos = form.addPageBreakItem().setTitle('Sus datos para la prueba');
  form
    .addTextItem()
    .setTitle('Código de participante')
    .setHelpText('El que le enviamos por WhatsApp, por ejemplo P3.')
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern('^[Pp][0-9]{1,2}$')
        .setHelpText('Escriba P seguido del número, por ejemplo P3.')
        .build(),
    )
    .setRequired(true);
  form
    .addListItem()
    .setTitle('¿En qué comuna vive o trabaja?')
    .setChoiceValues(['Concepción', 'Talcahuano', 'Hualpén', 'San Pedro de la Paz', 'Chiguayante', 'Penco', 'Otra'])
    .setRequired(true);
  form
    .addMultipleChoiceItem()
    .setTitle('¿Desde qué aparato hará la prueba?')
    .setChoiceValues(['Celular', 'Tablet', 'Computador'])
    .setRequired(true);
  form
    .addMultipleChoiceItem()
    .setTitle('¿Conoce o ha usado 2x3 u otra página para buscar u ofrecer servicios de maestros?')
    .setChoiceValues(['La he usado', 'La conozco, pero no la he usado', 'No la conozco'])
    .setRequired(true);
  const perfil = form.addMultipleChoiceItem().setTitle('Usted participa como...').setRequired(true);

  // --- Sección 3M: maestro ---------------------------------------------------------
  const pagMaestro = form
    .addPageBreakItem()
    .setTitle('Prueba para maestros')
    .setHelpText(
      'Abra la página en otra pestaña: ' + URL_PAGINA + '\n' +
        'Su correo de prueba es p + su número + @prueba.masterplace.cl (por ejemplo, p3@prueba.masterplace.cl). ' +
        'La contraseña la elige usted.\n' +
        'Descargue el carnet de prueba aquí: ' + URL_CARNET + '\n\n' +
        'Si una tarea no le resulta, no se preocupe: cuéntenos qué pasó y siga con la siguiente.',
    );
  form
    .addParagraphTextItem()
    .setTitle('Antes de empezar: ¿cómo consigue clientes nuevos hoy?')
    .setRequired(true);
  agregarTarea(
    form,
    'Tarea 1 · Registrarse',
    'Imagine que quiere ofrecer sus servicios en esta página. Regístrese como maestro con su correo de prueba, su ' +
      'oficio, las comunas donde trabaja y la imagen del carnet de prueba. Cuando termine, vuelva aquí.',
  );

  // --- Sección 3C: cliente -----------------------------------------------------------
  const pagCliente = form
    .addPageBreakItem()
    .setTitle('Prueba para clientes')
    .setHelpText(
      'Abra la página en otra pestaña: ' + URL_PAGINA + '\n' +
        'Su correo de prueba es p + su número + @prueba.masterplace.cl (por ejemplo, p7@prueba.masterplace.cl). ' +
        'La contraseña la elige usted.\n\n' +
        'Si una tarea no le resulta, no se preocupe: cuéntenos qué pasó y siga con la siguiente.',
    );
  form
    .addParagraphTextItem()
    .setTitle('Antes de empezar: cuéntenos la última vez que buscó un maestro. ¿Cómo lo encontró y qué le preocupaba?')
    .setRequired(true);
  agregarTarea(form, 'Tarea 1 · Crear su cuenta', 'Cree una cuenta de cliente con su correo de prueba.');
  agregarTarea(
    form,
    'Tarea 2 · Buscar un maestro',
    'Imagine que se le rompió una cañería en su casa. Busque un gásfiter que atienda en su comuna.',
  );
  form
    .addParagraphTextItem()
    .setTitle('¿Qué maestro eligió y por qué cree que apareció primero?')
    .setRequired(true);
  agregarTarea(
    form,
    'Tarea 3 · Contactar al maestro',
    'Escríbale a ese maestro para preguntarle si puede ir mañana.',
  );

  // --- Sección 4: señales de confianza (todos) -----------------------------------------
  const pagSenales = form.addPageBreakItem().setTitle('Lo que muestran los perfiles');
  form
    .addParagraphTextItem()
    .setTitle(
      'En la página, los perfiles muestran marcas como "Identidad verificada", las reseñas y "Certificado". ' +
        'Explique con sus palabras qué significa cada una.',
    )
    .setRequired(true);

  // --- Sección 5: SUS -------------------------------------------------------------------
  form
    .addPageBreakItem()
    .setTitle('Su opinión sobre la página')
    .setHelpText('Marque qué tan de acuerdo está con cada frase. 1 = totalmente en desacuerdo, 5 = totalmente de acuerdo.');
  ITEMS_SUS.forEach(function (texto, i) {
    form
      .addScaleItem()
      .setTitle(i + 1 + '. ' + texto)
      .setBounds(1, 5)
      .setLabels('Totalmente en desacuerdo', 'Totalmente de acuerdo')
      .setRequired(true);
  });

  // --- Sección 6: preguntas finales ---------------------------------------------------
  form.addPageBreakItem().setTitle('Para terminar');
  form
    .addGridItem()
    .setTitle(
      'Para elegir a un maestro (o para que lo elijan a usted), ¿qué tan importante es cada cosa? ' +
        'Use cada número una sola vez: 1 = la más importante.',
    )
    .setRows(['Identidad verificada', 'Reseñas de otros clientes', 'Certificado del oficio', 'Que esté cerca'])
    .setColumns(['1', '2', '3', '4'])
    .setValidation(FormApp.createGridValidation().requireLimitOneResponsePerColumn().build())
    .setRequired(true);
  form
    .addParagraphTextItem()
    .setTitle('Ya existen páginas como 2x3. ¿Qué tendría que tener esta para que usted la usara?');
  form.addParagraphTextItem().setTitle('¿Qué fue lo más difícil? ¿Qué cambiaría primero?');

  // --- Navegación ----------------------------------------------------------------------
  acepta.setChoices([
    acepta.createChoice('Sí, acepto', pagDatos),
    acepta.createChoice('No acepto', FormApp.PageNavigationType.SUBMIT),
  ]);
  perfil.setChoices([
    perfil.createChoice('Maestro (ofrezco servicios de un oficio)', pagMaestro),
    perfil.createChoice('Cliente (contrato maestros para mi casa)', pagCliente),
  ]);
  // Al terminar la sección de maestro, saltar la de cliente.
  pagCliente.setGoToPage(pagSenales);

  // --- Hoja de respuestas ------------------------------------------------------------------
  const hoja = SpreadsheetApp.create('MasterPlace · Respuestas de la prueba');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('Enlace para responder: ' + form.getPublishedUrl());
  Logger.log('Enlace para editar: ' + form.getEditUrl());
  Logger.log('Hoja de respuestas: ' + hoja.getUrl());
}

function agregarTarea(form, titulo, instruccion) {
  form.addSectionHeaderItem().setTitle(titulo).setHelpText(instruccion);
  form.addMultipleChoiceItem().setTitle('¿Pudo hacerlo?').setChoiceValues(ESCALA_LOGRO).setRequired(true);
  form
    .addMultipleChoiceItem()
    .setTitle('¿Cuánto se demoró, aproximadamente?')
    .setChoiceValues(ESCALA_TIEMPO)
    .setRequired(true);
  form.addParagraphTextItem().setTitle('¿Dónde se confundió o qué le faltó? (opcional)');
}
