/**
 * CONFIGURAR GOOGLE PARA EL MENÚ DE "EL PAYO"
 *
 * Crea en TU cuenta de Google (tú quedas como dueño):
 *   - La carpeta "Menú El Payo" con la hoja "Menú El Payo" (pestañas Platillos, Ajustes, Opiniones, Instrucciones)
 *   - El formulario "Opiniones El Payo", conectado a la pestaña Opiniones
 *   - La carpeta "Fotos menú" para que Payo suba sus fotos
 * y le da a Payo permiso de EDITOR en la hoja y en la carpeta de fotos.
 *
 * CÓMO USARLO
 *   1. Entra a https://script.google.com con tu cuenta → "Nuevo proyecto".
 *   2. Borra lo que aparece y pega TODO este archivo.
 *   3. Escribe el correo de Gmail de Payo abajo, en CORREO_DE_PAYO.
 *   4. Arriba, elige la función "configurarTodo" y presiona ▶ Ejecutar.
 *   5. Google te pedirá permisos: "Revisar permisos" → tu cuenta → "Configuración avanzada"
 *      → "Ir a … (no seguro)" → "Permitir". (Sale ese aviso porque el script es tuyo y no está verificado.)
 *   6. Al terminar, abre "Registro de ejecución": ahí salen el ID de la hoja y el enlace del formulario.
 *
 * Si lo vuelves a ejecutar, crea todo de nuevo (duplicado). Ejecútalo una sola vez.
 */

const CORREO_DE_PAYO = '';   // ej. 'payo@gmail.com'  (vacío = no se comparte todavía)

// ---------------------------------------------------------------------------

const DATOS = {
 "columnas": [
  "Categoría",
  "Platillo",
  "Descripción",
  "Precio",
  "Fotos",
  "Título opciones",
  "Opciones",
  "Cuántas puede elegir",
  "Título opciones 2",
  "Opciones 2",
  "Extras",
  "Disponible",
  "Destacado"
 ],
 "platillos": [
  {
   "Categoría": "Chilaquiles",
   "Platillo": "Chilaquiles",
   "Descripción": "Totopos bañados en salsa, con crema, queso y cebolla.",
   "Precio": "",
   "Fotos": "chilaquiles-1.jpg, chilaquiles-2.jpg, chilaquiles-3.jpg, chilaquiles-4.jpg, chilaquiles-5.jpg",
   "Título opciones": "Acompáñalos con",
   "Opciones": "Pollo asado, Pollo desmenuzado, Bistec, Longaniza, Huevo estrellado",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "Salsa",
   "Opciones 2": "Verde, Roja",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "SI"
  },
  {
   "Categoría": "Tortas y sándwiches",
   "Platillo": "Torta",
   "Descripción": "Bien servida, con verdura fresca y el relleno que tú elijas.",
   "Precio": "",
   "Fotos": "torta-1.jpg, torta-2.jpg",
   "Título opciones": "Elige tu relleno",
   "Opciones": "Pollo desmenuzado, Tocino, Atún, Pollo asado, Pechuga de pavo, Jamón, 3 quesos, Pierna",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "SI"
  },
  {
   "Categoría": "Tortas y sándwiches",
   "Platillo": "Sándwich",
   "Descripción": "Con verdura fresca y el relleno que más te guste.",
   "Precio": "",
   "Fotos": "sandwich-1.jpg, sandwich-2.jpg, sandwich-3.jpg, sandwich-4.jpg",
   "Título opciones": "Elige tu relleno",
   "Opciones": "Pollo desmenuzado, Tocino, Atún, Pollo asado, Pechuga de pavo, Jamón, 3 quesos, Pierna",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "Pan",
   "Opciones 2": "Blanco, Integral",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Tortas y sándwiches",
   "Platillo": "Cuernito",
   "Descripción": "Cuernito dorado relleno a tu gusto, con verdura fresca.",
   "Precio": "",
   "Fotos": "cuernito-1.jpg",
   "Título opciones": "Elige tu relleno",
   "Opciones": "Pollo desmenuzado, Tocino, Atún, Pollo asado, Pechuga de pavo, Jamón, 3 quesos, Pierna",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Antojitos",
   "Platillo": "Molletes",
   "Descripción": "Pan con frijoles, queso y pico de gallo, con el ingrediente que elijas.",
   "Precio": "",
   "Fotos": "molletes-1.jpg, molletes-2.jpg",
   "Título opciones": "Con",
   "Opciones": "Pierna, Longaniza, Pollo, Tocino",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "SI"
  },
  {
   "Categoría": "Antojitos",
   "Platillo": "Sincronizadas",
   "Descripción": "Tortillas de harina doradas, con pico de gallo y frijoles.",
   "Precio": "",
   "Fotos": "sincronizadas-1.jpg",
   "Título opciones": "",
   "Opciones": "",
   "Cuántas puede elegir": "",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Antojitos",
   "Platillo": "Tacos",
   "Descripción": "Tortilla de maíz con frijoles, rajas, aguacate y pico de gallo.",
   "Precio": "",
   "Fotos": "tacos-1.jpg, tacos-2.jpg",
   "Título opciones": "Relleno",
   "Opciones": "Pollo, Bistec",
   "Cuántas puede elegir": "1",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Antojitos",
   "Platillo": "Huevos montados",
   "Descripción": "Tortillas con frijoles, huevo estrellado, salsa roja, aguacate y queso.",
   "Precio": "",
   "Fotos": "huevos-montados-1.jpg",
   "Título opciones": "",
   "Opciones": "",
   "Cuántas puede elegir": "",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Antojitos",
   "Platillo": "Enchiladas de mole",
   "Descripción": "Bañadas en mole, con crema, queso y aguacate.",
   "Precio": "",
   "Fotos": "enchiladas-mole-1.jpg",
   "Título opciones": "",
   "Opciones": "",
   "Cuántas puede elegir": "",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Antojitos",
   "Platillo": "Hojaldra con mole",
   "Descripción": "Hojaldra bañada en mole, especialidad de la casa.",
   "Precio": "",
   "Fotos": "",
   "Título opciones": "",
   "Opciones": "",
   "Cuántas puede elegir": "",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Ensaladas",
   "Platillo": "Ensalada",
   "Descripción": "Fresca y bien surtida: verdura, fruta y la proteína que elijas.",
   "Precio": "",
   "Fotos": "ensalada-1.jpg, ensalada-2.jpg, ensalada-3.jpg, ensalada-4.jpg",
   "Título opciones": "Proteína",
   "Opciones": "Atún, Pollo asado, Huevo cocido, Pollo desmenuzado",
   "Cuántas puede elegir": "1",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Dulce y ligero",
   "Platillo": "Hot cakes",
   "Descripción": "Esponjosos y calientitos, báñalos a tu gusto.",
   "Precio": "",
   "Fotos": "hotcakes-1.jpg",
   "Título opciones": "Báñalos con",
   "Opciones": "Mermelada de fresa, Miel maple, Lechera",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "SI"
  },
  {
   "Categoría": "Dulce y ligero",
   "Platillo": "Pan francés",
   "Descripción": "Pan francés doradito, bañado a tu gusto.",
   "Precio": "",
   "Fotos": "pan-frances-1.jpg",
   "Título opciones": "Báñalo con",
   "Opciones": "Mermelada de fresa, Miel maple, Lechera",
   "Cuántas puede elegir": "2",
   "Título opciones 2": "",
   "Opciones 2": "",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  },
  {
   "Categoría": "Dulce y ligero",
   "Platillo": "Cereal o yogurt con fruta",
   "Descripción": "Tu cereal con leche o yogurt, y fruta picada.",
   "Precio": "",
   "Fotos": "yogurt-fruta-1.jpg",
   "Título opciones": "Con",
   "Opciones": "Leche, Yogurt",
   "Cuántas puede elegir": "1",
   "Título opciones 2": "¿Le pongo fruta?",
   "Opciones 2": "Con fruta, Sin fruta",
   "Extras": "",
   "Disponible": "SI",
   "Destacado": "NO"
  }
 ],
 "ajustes": [
  {
   "Ajuste": "Nombre del negocio",
   "Valor": "Desayunos \"El Payo\"",
   "Ayuda": "Aparece arriba en grande."
  },
  {
   "Ajuste": "Frase",
   "Valor": "Hecho al momento y a tu gusto",
   "Ayuda": "Frase corta debajo del nombre."
  },
  {
   "Ajuste": "WhatsApp",
   "Valor": "55 3787 6816",
   "Ayuda": "Número de 10 dígitos al que llegan los pedidos."
  },
  {
   "Ajuste": "Aviso",
   "Valor": "",
   "Ayuda": "Mensaje del día, ej. 'Hoy hay tamales'. Déjalo vacío para no mostrar nada."
  },
  {
   "Ajuste": "Horario",
   "Valor": "",
   "Ayuda": "Ej. Lunes a viernes de 7 a 12"
  },
  {
   "Ajuste": "Ubicación",
   "Valor": "",
   "Ayuda": "Ej. Afuera del metro Chabacano"
  },
  {
   "Ajuste": "Enlace de Google Maps",
   "Valor": "",
   "Ayuda": "Copia el enlace de 'Compartir' en Google Maps."
  },
  {
   "Ajuste": "Métodos de pago",
   "Valor": "Efectivo, transferencia y tarjeta",
   "Ayuda": "Ej. Efectivo, transferencia y tarjeta"
  },
  {
   "Ajuste": "Entregas",
   "Valor": "SI",
   "Ayuda": "SI = el cliente puede pedir que se lo lleves. NO = solo para recoger."
  },
  {
   "Ajuste": "Instagram",
   "Valor": "martinrm6439",
   "Ayuda": "Solo el usuario, sin @"
  },
  {
   "Ajuste": "Facebook",
   "Valor": "",
   "Ayuda": "Enlace completo de la página."
  }
 ]
};

const INSTRUCCIONES = [
 [
  "CÓMO ACTUALIZAR TU MENÚ",
  ""
 ],
 [
  "",
  ""
 ],
 [
  "Los cambios se ven en la página en 1 o 2 minutos. No hay que tocar código.",
  ""
 ],
 [
  "",
  ""
 ],
 [
  "COLUMNA",
  "QUÉ PONER"
 ],
 [
  "Categoría",
  "La sección del menú. Platillos con la misma categoría salen juntos. El orden de la hoja es el orden de la página."
 ],
 [
  "Platillo",
  "Nombre del platillo."
 ],
 [
  "Descripción",
  "Una frase corta que antoje."
 ],
 [
  "Precio",
  "Solo el número, ej. 45. Si lo dejas vacío, el cliente verá 'Precio por WhatsApp'."
 ],
 [
  "Fotos",
  "Una o varias fotos separadas por coma. Puede ser el nombre de una foto del sitio (ej. torta-1.jpg) o el enlace de una foto de Google Drive compartida como 'Cualquier persona con el enlace'."
 ],
 [
  "Título opciones",
  "Lo que el cliente va a elegir, ej. 'Elige tu relleno'."
 ],
 [
  "Opciones",
  "Las opciones separadas por coma, ej. 'Jamón, Pierna, Pollo'. Si una cuesta más, ponle el precio: 'Bistec $10'."
 ],
 [
  "Cuántas puede elegir",
  "Número de opciones que puede escoger el cliente (1, 2, 3…). Vacío = 1."
 ],
 [
  "Título opciones 2 / Opciones 2",
  "Un segundo grupo para elegir solo una, ej. Salsa: 'Verde, Roja'."
 ],
 [
  "Extras",
  "Cosas que se pueden agregar, separadas por coma, con precio si cuestan: 'Aguacate $10, Queso extra $5'."
 ],
 [
  "Disponible",
  "SI = se puede pedir. NO = sale como 'Hoy no hay'. OCULTAR = no aparece."
 ],
 [
  "Destacado",
  "SI = aparece en 'Lo más pedido' arriba del menú."
 ],
 [
  "",
  ""
 ],
 [
  "PARA AGREGAR UN PLATILLO",
  "Escribe una fila nueva al final (o insértala donde quieras que aparezca)."
 ],
 [
  "PARA QUITAR UN PLATILLO",
  "Pon OCULTAR en 'Disponible' o borra la fila."
 ],
 [
  "OPINIONES",
  "Las opiniones de tus clientes llegan a la pestaña 'Opiniones'. Si alguna es grosera, borra esa fila."
 ],
 [
  "AJUSTES",
  "En la pestaña 'Ajustes' cambias tu número, horario, ubicación, aviso del día y redes."
 ]
];

function configurarTodo() {
  const carpeta = DriveApp.createFolder('Menú El Payo');
  const fotos = carpeta.createFolder('Fotos menú');
  fotos.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // ---- hoja ----
  const ss = SpreadsheetApp.create('Menú El Payo');
  DriveApp.getFileById(ss.getId()).moveTo(carpeta);

  const pl = ss.getSheets()[0].setName('Platillos');
  llenar(pl, DATOS.columnas, DATOS.platillos.map((p) => DATOS.columnas.map((c) => p[c] || '')));
  const anchos = [150, 160, 320, 70, 280, 150, 320, 90, 130, 170, 220, 95, 95];
  anchos.forEach((w, i) => pl.setColumnWidth(i + 1, w));
  pl.setFrozenRows(1);
  pl.setFrozenColumns(2);
  const filas = 300;
  pl.getRange(2, 12, filas, 1).setDataValidation(lista(['SI', 'NO', 'OCULTAR']));
  pl.getRange(2, 13, filas, 1).setDataValidation(lista(['SI', 'NO']));

  const aj = ss.insertSheet('Ajustes');
  llenar(aj, ['Ajuste', 'Valor', 'Ayuda'], DATOS.ajustes.map((a) => [a.Ajuste, a.Valor, a.Ayuda || '']));
  aj.setColumnWidth(1, 190); aj.setColumnWidth(2, 300); aj.setColumnWidth(3, 460);
  aj.setFrozenRows(1);
  const filaEntregas = DATOS.ajustes.findIndex((a) => a.Ajuste === 'Entregas') + 2;
  if (filaEntregas > 1) aj.getRange(filaEntregas, 2).setDataValidation(lista(['SI', 'NO']));

  const ins = ss.insertSheet('Instrucciones');
  ins.getRange(1, 1, INSTRUCCIONES.length, 2).setValues(INSTRUCCIONES).setWrap(true).setVerticalAlignment('top');
  ins.setColumnWidth(1, 260); ins.setColumnWidth(2, 720);
  ins.getRange('A1').setFontSize(16).setFontWeight('bold').setFontColor('#e3262e');
  INSTRUCCIONES.forEach((r, i) => { if (r[0] && r[0] === r[0].toUpperCase()) ins.getRange(i + 1, 1).setFontWeight('bold'); });

  // ---- formulario de opiniones ----
  const form = FormApp.create('Opiniones El Payo')
    .setDescription('¡Gracias por tu opinión! Nos ayuda a mejorar.')
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setConfirmationMessage('¡Gracias por tu opinión! 💛');
  DriveApp.getFileById(form.getId()).moveTo(carpeta);
  const qCalif = form.addScaleItem().setTitle('Calificación').setBounds(1, 5).setLabels('Nada bien', '¡Lo mejor!').setRequired(true);
  const qNombre = form.addTextItem().setTitle('Nombre');
  const qComent = form.addParagraphTextItem().setTitle('Comentario');
  try { form.setRequireLogin(false); } catch (e) { /* solo existe en cuentas de empresa */ }
  try { if (form.setPublished) form.setPublished(true); } catch (e) { Logger.log('Aviso: publica el formulario a mano (botón Publicar).'); }

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(3000);
  const ss2 = SpreadsheetApp.openById(ss.getId());
  const hojaOp = ss2.getSheets().find((s) => s.getFormUrl && s.getFormUrl());
  if (hojaOp) {
    hojaOp.setName('Opiniones');
    const col = Math.max(hojaOp.getLastColumn(), 4) + 1;
    hojaOp.getRange(1, col).setValue('Ocultar');
    hojaOp.getRange(2, col, 1000, 1).setDataValidation(lista(['SI']));
    hojaOp.setColumnWidth(col - 1, 360);
    ss2.setActiveSheet(ss2.getSheetByName('Platillos'));
    ss2.moveActiveSheet(1);
  } else {
    Logger.log('Aviso: no encontré la pestaña de respuestas. Renómbrala a "Opiniones" a mano.');
  }

  const prellenado = form.createResponse()
    .withItemResponse(qCalif.createResponse(5))
    .withItemResponse(qNombre.createResponse('NOMBRE'))
    .withItemResponse(qComent.createResponse('COMENTARIO'))
    .toPrefilledUrl();

  // ---- permisos ----
  DriveApp.getFileById(ss.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  if (CORREO_DE_PAYO.trim()) {
    ss.addEditor(CORREO_DE_PAYO.trim());
    fotos.addEditor(CORREO_DE_PAYO.trim());
  }

  Logger.log('================  LISTO  ================');
  Logger.log('Hoja:        ' + ss.getUrl());
  Logger.log('Formulario:  ' + form.getEditUrl());
  Logger.log('Fotos:       ' + fotos.getUrl());
  Logger.log('');
  Logger.log('Copia estos dos datos a configuracion.js:');
  Logger.log('hojaDeGoogle:        "' + ss.getId() + '"');
  Logger.log('formularioOpiniones: "' + prellenado + '"');
  Logger.log(CORREO_DE_PAYO.trim() ? 'Payo (' + CORREO_DE_PAYO.trim() + ') ya es editor de la hoja y de la carpeta de fotos.'
                                    : 'Falta compartir con Payo: Compartir → su correo → Editor (hoja y carpeta de fotos).');
}

/** Si después quieres agregar a Payo (o a otra persona) como editor, pon su correo y ejecuta esta función. */
function compartirConPayo() {
  if (!CORREO_DE_PAYO.trim()) throw new Error('Escribe el correo en CORREO_DE_PAYO');
  const hoja = DriveApp.getFilesByName('Menú El Payo');
  while (hoja.hasNext()) { const f = hoja.next(); if (f.getMimeType() === MimeType.GOOGLE_SHEETS) f.addEditor(CORREO_DE_PAYO.trim()); }
  const fotos = DriveApp.getFoldersByName('Fotos menú');
  while (fotos.hasNext()) fotos.next().addEditor(CORREO_DE_PAYO.trim());
  Logger.log('Listo: ' + CORREO_DE_PAYO.trim() + ' ya puede editar.');
}

function llenar(hoja, encabezados, filas) {
  const todo = [encabezados, ...filas];
  const rango = hoja.getRange(1, 1, Math.max(todo.length, 300), encabezados.length);
  rango.setNumberFormat('@');  // todo como texto, para que Google no cambie los datos
  hoja.getRange(1, 1, todo.length, encabezados.length).setValues(todo).setWrap(true).setVerticalAlignment('top');
  hoja.getRange(1, 1, 1, encabezados.length).setFontWeight('bold').setFontColor('#ffffff').setBackground('#e3262e');
}

function lista(valores) {
  return SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(true).build();
}
