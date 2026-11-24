# Image ZIP Collector

Extensión de Chrome/Edge (Manifest V3): mantén **O + clic** sobre imágenes para juntarlas mientras navegas y descárgalas todas en un **ZIP** (O + clic derecho, `Alt+Shift+Z`, el popup o el menú contextual). En inglés y español; todo ocurre en el equipo del usuario.

## Desarrollo

`chrome://extensions` → Modo de desarrollador → **Cargar descomprimida** → esta carpeta. Tras cambiar código: botón ↻ de la extensión y recargar las pestañas.

## Publicar

1. Sube `version` en `manifest.json` si es una actualización.
2. Ejecuta `powershell -File build.ps1` → genera `dist/image-zip-collector-<versión>.zip`.
3. **Chrome Web Store**: <https://chrome.google.com/webstore/devconsole> → registra la cuenta (pago único de 5 USD) → *Nuevo elemento* → sube el ZIP.
4. Rellena la ficha y la pestaña de privacidad con los textos de [store/LISTING.md](store/LISTING.md) y las imágenes de `store/`.
5. Publica `store/PRIVACY.md` en una URL pública (Gist o GitHub Pages) y pégala como política de privacidad.
6. Envía a revisión. Con permiso sobre todos los sitios suele tardar unos días.
7. **Edge Add-ons** (gratis): <https://partner.microsoft.com/dashboard/microsoftedge> → mismo ZIP y mismos textos.

## Estructura

| Archivo | Qué hace |
|---|---|
| `content.js` / `content.css` | Detecta O + clic, marca lo seleccionado, avisos, descarga desde la propia página |
| `background.js` | Lista de seleccionadas, menú contextual, atajo, orquesta la descarga |
| `offscreen.js` + `zip.js` | Baja las imágenes que falten y arma el ZIP (sin dependencias) |
| `popup.*` | Miniaturas, quitar/vaciar, botón de descarga |
| `_locales/` | Textos en inglés y español |
| `store/` | Ficha, política de privacidad, capturas y mosaicos para la tienda (no va en el paquete) |
