// Mantén pulsada la tecla O y:
//   clic izquierdo sobre una imagen -> añadir / quitar de la selección
//   clic derecho en cualquier sitio  -> descargar la selección en ZIP
(() => {
  if (window.__izcLoaded) return;
  window.__izcLoaded = true;

  const KEY = "o";
  const t = (k, ...a) => chrome.i18n.getMessage(k, a.map(String));
  const zipResult = (r) => t("zipReady", r.saved, r.fromPage) + (r.failed ? t("failedSuffix", r.failed) : "");
  let armed = false;
  let selected = new Set();

  const isEditable = (el) =>
    el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

  function setArmed(v) {
    armed = v;
    document.documentElement.classList.toggle("izc-armed", v);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === KEY && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(e.target)) {
      setArmed(true);
    }
  }, true);
  window.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === KEY) setArmed(false);
  }, true);
  window.addEventListener("blur", () => setArmed(false));

  // --- Encontrar la imagen bajo el puntero -------------------------------
  function bgUrl(el) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    return m ? m[1] : null;
  }

  function imageAt(x, y, target) {
    const stack = [target, ...document.elementsFromPoint(x, y)];
    for (const el of stack) {
      if (!el || el.nodeType !== 1) continue;
      if (el.tagName === "IMG" && (el.currentSrc || el.src)) {
        return { el, url: el.currentSrc || el.src };
      }
      if (el.tagName === "VIDEO" && el.poster) return { el, url: el.poster };
      if (el.tagName === "image" && el.href?.baseVal) {
        return { el, url: new URL(el.href.baseVal, location.href).href };
      }
      const u = bgUrl(el);
      if (u && !u.startsWith("data:image/svg")) {
        el.setAttribute("data-izc-bg", "");
        return { el, url: new URL(u, location.href).href };
      }
    }
    return null;
  }

  // blob: solo existe dentro de esta página -> lo convertimos a data: al seleccionar
  async function portableUrl(url) {
    if (!url.startsWith("blob:")) return url;
    const blob = await (await fetch(url)).blob();
    return await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  // --- Interceptar clics mientras O está pulsada -------------------------
  const swallow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "auxclick"]) {
    window.addEventListener(type, (e) => { if (armed && e.button !== 1) swallow(e); }, true);
  }

  window.addEventListener("click", async (e) => {
    if (!armed || e.button !== 0) return;
    swallow(e);
    const hit = imageAt(e.clientX, e.clientY, e.target);
    if (!hit) return toast(t("noImage"));
    try {
      const url = await portableUrl(hit.url);
      const res = await chrome.runtime.sendMessage({
        type: "toggle", url, pageUrl: location.href, pageTitle: document.title,
      });
      toast(t(res.added ? "added" : "removed", res.count));
    } catch (err) {
      toast(t("errorPrefix", err.message));
    }
  }, true);

  window.addEventListener("contextmenu", async (e) => {
    if (!armed) return;
    swallow(e);
    toast(t("preparing"));
    const res = await chrome.runtime.sendMessage({ type: "download" });
    toast(res.ok ? zipResult(res) : res.error);
  }, true);

  // --- Marcado visual de lo seleccionado ---------------------------------
  function urlOf(el) {
    if (el.tagName === "IMG") return el.currentSrc || el.src;
    if (el.tagName === "VIDEO") return el.poster;
    const u = bgUrl(el);
    return u ? new URL(u, location.href).href : null;
  }

  function paint() {
    document.querySelectorAll(".izc-selected").forEach((el) => {
      if (!selected.has(urlOf(el))) el.classList.remove("izc-selected");
    });
    if (!selected.size) return;
    document.querySelectorAll("img, video[poster], [data-izc-bg]").forEach((el) => {
      if (selected.has(urlOf(el))) el.classList.add("izc-selected");
    });
  }

  function load(items) {
    selected = new Set((items || []).map((i) => i.url));
    paint();
  }

  chrome.storage.local.get("items").then(({ items }) => load(items));
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === "local" && c.items) load(c.items.newValue);
  });
  let paintTimer;
  new MutationObserver(() => {
    clearTimeout(paintTimer);
    paintTimer = setTimeout(paint, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // --- Toast ---------------------------------------------------------------
  let toastTimer;
  function toast(msg) {
    if (window.top !== window) return; // sólo en el frame principal
    let t = document.getElementById("izc-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "izc-toast";
      document.documentElement.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.style.opacity = "0"), 1800);
  }

  // Pedir la imagen desde la propia página (mismo origen, cookies y Referer de la página)
  async function fetchInPage(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30_000);
    try {
      const r = await fetch(url, { credentials: "include", signal: ctrl.signal, cache: "force-cache" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const dataUrl = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });
      return { ok: true, dataUrl };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      clearTimeout(t);
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, send) => {
    if (msg.type === "toast") toast(msg.text);
    if (msg.type === "fetch-in-page") {
      if (window.top !== window) return; // responde sólo el frame principal
      fetchInPage(msg.url).then(send);
      return true;
    }
  });
})();
