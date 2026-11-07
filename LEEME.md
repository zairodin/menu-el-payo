# Menú digital · Desayunos “El Payo”

Es un menú para celular. El cliente escanea el QR, ve las fotos reales, arma su pedido a su gusto y lo manda por WhatsApp al **55 3787 6816**. También puede dejar su opinión.

Payo actualiza todo (platillos, precios, fotos, aviso del día, horario) **desde una hoja de Google en su celular**, sin tocar código. La guía para él está en `ayuda.html`. Su liga queda en el pie del menú: *“¿Eres Payo? Así actualizas tu menú”*.

---

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `estilos.css`, `app.js` | El menú. No hace falta editarlos. |
| `configuracion.js` | **El único archivo que se edita, y solo una vez**: aquí van la hoja de Google y el formulario de opiniones. |
| `menu-respaldo.js` | El menú que se muestra mientras no conectes la hoja, o si Google no responde. |
| `fotos/` | Las fotos de Payo, ya optimizadas para cargar rápido. |
| `plantilla/…xlsx` | La plantilla para la hoja de Google, ya llena con el menú oficial. |
| `qr.html` | Genera el póster con el QR para imprimir. |
| `ayuda.html` | La guía para Payo. |
| `administracion/configurar-google.gs` | Script que crea la hoja, el formulario y la carpeta de fotos en tu cuenta de Google (Paso 2). |

## Quién administra qué

| Cosa | Dueño | Payo |
|---|---|---|
| Repositorio de GitHub y página | Tú | No lo necesita |
| Hoja "Menú El Payo" (platillos, ajustes, opiniones) | Tú | **Editor**: cambia el menú desde su celular |
| Carpeta "Fotos menú" en Drive | Tú | **Editor**: sube sus fotos |
| Formulario "Opiniones El Payo" | Tú | Ve las opiniones en la pestaña *Opiniones* |

Si pierden contacto, Payo puede seguir actualizando todo porque su permiso de editor no depende de ti. Lo único que no debes hacer es **borrar la hoja ni el repositorio**, porque el menú dejaría de actualizarse. Si algún día quieres pasarle todo, en Drive se usa *Compartir → Transferir propiedad* y en GitHub *Settings → Transfer ownership*.

---

## Paso 1 · Publicar la página (GitHub Pages, gratis)

1. En tu cuenta de <https://github.com> crea un repositorio **público** llamado `menu-el-payo`, vacío (sin README).
2. Sube esta carpeta, que ya es un repositorio de git:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/menu-el-payo.git
   git push -u origin main
   ```
3. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y presiona **Save**.
4. Unos minutos después el menú queda en `https://TU_USUARIO.github.io/menu-el-payo/`.

Con esto el menú ya funciona con los datos de `menu-respaldo.js`. El paso 2 sirve para que Payo lo actualice sin ti.

> ¿Por qué GitHub Pages? Es gratis, no se cae, tiene HTTPS y no caduca. Netlify o Cloudflare Pages también sirven, y se usan igual (arrastras la carpeta). Una vez que imprimas el QR, **no cambies el nombre del repositorio ni del usuario**, porque la dirección cambiaría y el QR dejaría de funcionar. Si quieren un dominio propio (como `elpayo.com.mx`, unos $300 MXN al año), se conecta en *Settings → Pages → Custom domain*.

## Paso 2 · Hoja, formulario y carpeta de fotos (automático)

El script `administracion/configurar-google.gs` crea todo en **tu** cuenta de Google y le da permiso de editor a Payo.

1. Entra a <https://script.google.com> con tu cuenta y presiona **Nuevo proyecto**.
2. Borra lo que aparece, pega **todo** el contenido de `administracion/configurar-google.gs` y guarda con 💾.
3. Arriba del todo, escribe el Gmail de Payo en `CORREO_DE_PAYO = '…'`. Si todavía no lo tienes, déjalo vacío y más adelante ejecuta la función `compartirConPayo`.
4. Junto al botón ▶, elige la función **configurarTodo** y presiona **▶ Ejecutar**.
5. Google pide permisos. Presiona **Revisar permisos**, elige tu cuenta, luego **Configuración avanzada → Ir a … (no seguro) → Permitir**. El aviso sale porque el script es tuyo y Google no lo ha revisado. Solo crea archivos en tu Drive.
6. Cuando termine, el **Registro de ejecución** muestra los enlaces y dos datos:
   - `hojaDeGoogle: "…"`
   - `formularioOpiniones: "…"`
7. Pégalos en `configuracion.js` y súbelo (`git commit` + `git push`, o con el lápiz ✏️ en GitHub).

Qué crea el script, todo dentro de la carpeta **Menú El Payo** de tu Drive:
- **Hoja "Menú El Payo"** con las pestañas *Platillos* (ya con el menú oficial), *Ajustes*, *Opiniones* e *Instrucciones*. Se comparte como “Cualquier persona con el enlace: Lector”, para que la página la pueda leer, y con Payo como editor.
- **Formulario "Opiniones El Payo"** con Calificación (1 a 5), Nombre y Comentario. Las respuestas caen en la pestaña *Opiniones*, que ya trae la columna *Ocultar* para esconder opiniones groseras.
- **Carpeta "Fotos menú"**, compartida con enlace y con Payo como editor. Las fotos que suba ahí ya quedan listas para pegarse en la columna *Fotos*.

**Revisa dos cosas después de ejecutarlo:**
- Abre el enlace del formulario en una ventana de incógnito. Debe dejarte responder sin iniciar sesión. Si dice que no está publicado o pide cuenta, presiona **Publicar** en el formulario y, en *Configuración*, deja que responda cualquier persona con el enlace.
- Haz una prueba. Deja una opinión desde la página y en 1 o 2 minutos debe salir en la pestaña *Opiniones* y en el menú.

Si no quieres usar el script, `plantilla/Menu El Payo - plantilla Google Sheets.xlsx` tiene los mismos datos. Súbelo a Drive, ábrelo y conviértelo con *Archivo → Guardar como Hojas de cálculo de Google*.

## Paso 3 · El QR

Abre `https://USUARIO.github.io/menu-el-payo/qr.html`. Ahí puedes imprimir el póster o descargar el QR. Antes de imprimir muchos, pruébalo con dos o tres celulares.

---

## Cosas que conviene revisar con Payo

- **Precios**: el menú oficial no los trae, así que la columna *Precio* va vacía y el cliente ve “A tu gusto”. Payo le confirma el total por WhatsApp. Cuando ponga precios, el menú suma solo el total, incluidos los extras.
- **Tacos, huevos montados y enchiladas de mole**: no vienen en la lona, pero sí en sus fotos. Si ya no los hace, que ponga `OCULTAR`.
- **Hojaldra con mole**: no tiene foto. Que le tome una.
- **Entregas**: en *Ajustes → Entregas* se pone `SI` si lleva pedidos cerca o `NO` si solo es para recoger.
- **Horario y ubicación**: van vacíos. Conviene llenarlos.
- **Redes**: Instagram y Facebook van vacíos en *Ajustes*. Si Payo los llena, aparecen solos en el menú.
- No puse sus datos bancarios a propósito. Si los quiere en el menú, se pueden agregar en *Métodos de pago*.

## Probar en tu computadora

Desde esta carpeta, ejecuta `python -m http.server 8000` y abre <http://localhost:8000>.
