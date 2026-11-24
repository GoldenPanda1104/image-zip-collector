# Ficha para la Chrome Web Store / Edge Add-ons

Copia y pega cada bloque en el campo correspondiente del panel de desarrollador.

## Datos básicos

- **Nombre:** Image ZIP Collector (lo toma del manifest)
- **Categoría:** Productividad → Herramientas (Productivity → Tools)
- **Idioma principal:** English (la extensión también está en español; añade la ficha en español como segundo idioma)
- **Resumen (máx. 132 caracteres):** lo toma del manifest (`extDesc`), en inglés y en español.

## Descripción — English

```
Collect images while you browse and download them all at once in a single ZIP.

HOW IT WORKS
• Hold the O key and left-click any image → it's added to your selection (click again to remove it). Selected images get a green border.
• Keep browsing: your selection is saved across pages, tabs and browser restarts.
• When you're ready, hold O and right-click, press Alt+Shift+Z, or click "Download ZIP" in the popup.

FEATURES
• Works with regular images, images inside links (the link won't open), CSS background images and video posters.
• Saves the exact version of the image shown on screen.
• Downloads from the original page when it's still open, so sites that block hotlinking still work.
• Unique, readable file names with the correct extension.
• Popup with thumbnails: remove single images or clear the whole list.
• Optional: clear the list automatically after downloading.
• Right-click menu alternative: "Add to / remove from ZIP selection".
• English and Spanish.

PRIVACY
Everything happens on your device. No accounts, no tracking, no analytics, no servers. Your selection is stored locally and the ZIP is built in your browser.

TIP: if you're typing in a text field, O types normally — click on an empty area of the page first.
```

## Descripción — Español

```
Junta imágenes mientras navegas y descárgalas todas de una vez en un solo ZIP.

CÓMO FUNCIONA
• Mantén pulsada la tecla O y haz clic izquierdo en cualquier imagen → se añade a tu selección (otro clic la quita). Las imágenes seleccionadas se marcan con un borde verde.
• Sigue navegando: la selección se guarda entre páginas, pestañas y reinicios del navegador.
• Cuando quieras, mantén O y haz clic derecho, pulsa Alt+Shift+Z o usa el botón "Descargar ZIP" del popup.

CARACTERÍSTICAS
• Funciona con imágenes normales, imágenes dentro de enlaces (el enlace no se abre), fondos CSS y portadas de vídeo.
• Guarda exactamente la versión de la imagen que se ve en pantalla.
• Descarga desde la página original si sigue abierta, así funciona también en sitios que bloquean el hotlinking.
• Nombres de archivo únicos y legibles, con la extensión correcta.
• Popup con miniaturas: quita imágenes sueltas o vacía la lista.
• Opcional: vaciar la lista automáticamente tras descargar.
• Alternativa en el menú del clic derecho: "Añadir/quitar de la selección ZIP".
• En español e inglés.

PRIVACIDAD
Todo ocurre en tu dispositivo. Sin cuentas, sin rastreo, sin analítica, sin servidores. La selección se guarda localmente y el ZIP se arma en tu navegador.

CONSEJO: si estás escribiendo en un campo de texto, la O se escribe normal; haz clic en una zona vacía de la página antes.
```

## Pestaña "Prácticas de privacidad"

**Propósito único (Single purpose):**
```
Let the user select images on web pages and download the selected images together as a single ZIP file.
```

**Justificación de permisos:**

| Permiso | Justificación (pegar en inglés) |
|---|---|
| Host permission `<all_urls>` | The user can select images on any website they visit (O + click is detected by a content script on every page), and the selected images must be fetched from whatever domain hosts them to build the ZIP. |
| `storage` | Saves the user's list of selected image URLs and one preference locally so the selection survives page changes and restarts. |
| `unlimitedStorage` | Selected embedded images (data/blob URLs) are stored locally and can exceed the default storage quota. |
| `downloads` | Saves the generated ZIP file to the user's Downloads folder. |
| `offscreen` | The ZIP is built in an offscreen document because Manifest V3 service workers cannot create Blob URLs for downloading. |
| `contextMenus` | Adds "Add to / remove from ZIP selection" and "Download selection as ZIP" to the right-click menu. |

**¿Usa código remoto?** No.

**Uso de datos:** marca que **no** recopila ninguna de las categorías (ni datos personales, ni historial, ni actividad del usuario, ni contenido del sitio web). Las URLs se guardan solo en el dispositivo y nunca salen de él, así que no cuentan como "recopilación".

Marca las tres certificaciones (no vendo datos, no los uso para fines ajenos, no para solvencia crediticia).

**URL de la política de privacidad:** sube `store/PRIVACY.md` a algún sitio público (por ejemplo, un Gist de GitHub o GitHub Pages) y pega esa URL.

## Recursos gráficos (`store/`)

| Archivo | Uso en la tienda |
|---|---|
| `icons/icon128.png` | Icono de la tienda (128×128) |
| `store/screenshots/*.png` | Capturas (1280×800) — sube las de `en-` en la ficha inglesa y las de `es-` en la española |
| `store/promo-small-440x280.png` | Mosaico promocional pequeño |
| `store/promo-marquee-1400x560.png` | Mosaico de marquesina (opcional) |
