/*  CONFIGURACIÓN DEL MENÚ DIGITAL — esto se llena UNA sola vez (ver LEEME.md).
    Después, Payo actualiza todo desde su hoja de Google, sin tocar código.  */
window.PAYO_CONFIG = {
  // ID de la hoja de Google Sheets: es el texto largo entre "/d/" y "/edit" en el enlace.
  // Ejemplo: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
  // Vacío = se usa el menú de respaldo (menu-respaldo.js).
  hojaDeGoogle: "",

  // Enlace "prellenado" del formulario de opiniones de Google Forms (ver LEEME.md, paso 3).
  // Vacío = las opiniones se envían a Payo por WhatsApp.
  formularioOpiniones: "",

  // Nombres de las pestañas de la hoja (solo cámbialos si renombras las pestañas).
  pestanas: { platillos: "Platillos", ajustes: "Ajustes", opiniones: "Opiniones" }
};
