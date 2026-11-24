# Privacy Policy — Image ZIP Collector

_Last updated: November 21, 2026_

Image ZIP Collector does **not collect, store remotely, sell, or share any personal data**.

## What the extension does with data

- **Selected image URLs.** When you select an image (O + click or the right-click menu), its URL, the URL and title of the page it came from, and the time you selected it are saved **only on your device**, in the browser's local extension storage (`chrome.storage.local`). This list is used solely to show your selection and to build the ZIP. You can remove items or clear the whole list at any time from the extension popup; uninstalling the extension deletes it.
- **Downloading images.** When you ask for the ZIP, the extension requests the selected images directly from the websites that host them (from the original tab if it is still open, otherwise from the extension itself), packs them into a ZIP **on your device**, and saves it through the browser's downloads. No image or URL is sent to the developer or to any third party.
- **Preference.** The "clear the list after downloading" option is stored locally.

## What the extension does not do

- No analytics, tracking, telemetry, cookies of its own, or advertising.
- No servers operated by the developer; no remote code.
- No reading of page content other than locating the image under the cursor when you click while holding O.

## Permissions

- **Access to all sites** — needed to detect O + click on any page you choose and to fetch the images you selected from whatever site hosts them.
- **storage / unlimitedStorage** — keep your selection locally (embedded images can be large).
- **downloads** — save the ZIP file.
- **offscreen** — build the ZIP in the background.
- **contextMenus** — right-click menu entries.

## Contact

Questions about this policy: open an issue at the project's repository or use the contact email shown on the Chrome Web Store listing.

---

# Política de privacidad — Image ZIP Collector

Image ZIP Collector **no recopila, envía, vende ni comparte datos personales**. Las URLs de las imágenes seleccionadas (y la página de origen) se guardan **solo en tu dispositivo** (`chrome.storage.local`) para mostrar tu selección y armar el ZIP; puedes borrarlas cuando quieras desde el popup y se eliminan al desinstalar la extensión. Las imágenes se piden directamente a los sitios que las alojan y el ZIP se crea en tu equipo. No hay analítica, rastreo, publicidad ni servidores del desarrollador.
