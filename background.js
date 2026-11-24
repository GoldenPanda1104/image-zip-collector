const t = (k, ...a) => chrome.i18n.getMessage(k, a.map(String));
const zipResult = (r) => r.ok ? t("zipReady", r.saved, r.fromPage) + (r.failed ? t("failedSuffix", r.failed) : "") : r.error;

// Fuente única de verdad: chrome.storage.local -> { items: [{url, pageUrl, pageTitle, addedAt}], clearAfter }

async function getItems() {
  return (await chrome.storage.local.get("items")).items || [];
}

async function setItems(items) {
  await chrome.storage.local.set({ items });
  await updateBadge(items.length);
}

async function updateBadge(n) {
  await chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
  await chrome.action.setBadgeText({ text: n ? String(n) : "" });
}

// Serializa las escrituras para que clics rápidos no se pisen entre sí
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn, fn));

function toggle({ url, pageUrl, pageTitle }) {
  return serial(async () => {
    const items = await getItems();
    const i = items.findIndex((it) => it.url === url);
    let added;
    if (i >= 0) {
      items.splice(i, 1);
      added = false;
    } else {
      items.push({ url, pageUrl, pageTitle, addedAt: Date.now() });
      added = true;
    }
    await setItems(items);
    return { added, count: items.length };
  });
}

// --- Documento offscreen: descarga las imágenes y arma el ZIP -------------
async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument?.();
  if (exists) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["BLOBS"],
    justification: "Fetch the selected images and pack them into a ZIP",
  });
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const stripHash = (u) => { try { const x = new URL(u); x.hash = ""; return x.href; } catch { return u; } };

// Primero intenta bajar cada imagen desde su pestaña de origen si sigue abierta.
// Lo conseguido se cachea en el offscreen; el resto lo baja el offscreen por su cuenta.
async function prefetchFromOpenTabs(items) {
  const tabs = await chrome.tabs.query({});
  const tabByUrl = new Map();
  for (const t of tabs) if (t.url && t.id != null) tabByUrl.set(stripHash(t.url), t.id);

  const jobs = items
    .filter((it) => !it.url.startsWith("data:") && it.pageUrl)
    .map((it) => ({ url: it.url, tabId: tabByUrl.get(stripHash(it.pageUrl)) }))
    .filter((j) => j.tabId != null);

  let fromPage = 0;
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const j = jobs[next++];
      try {
        const r = await chrome.tabs.sendMessage(j.tabId, { type: "fetch-in-page", url: j.url }, { frameId: 0 });
        if (r?.ok) {
          await chrome.runtime.sendMessage({ target: "offscreen", type: "cache", url: j.url, dataUrl: r.dataUrl });
          fromPage++;
        }
      } catch { /* pestaña sin content script o cerrada: usamos el método normal */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));
  return fromPage;
}

let downloading = false;

async function downloadZip() {
  if (downloading) return { ok: false, error: t("alreadyRunning") };
  const items = await getItems();
  if (!items.length) return { ok: false, error: t("nothingSelected") };
  downloading = true;
  try {
    await chrome.action.setBadgeText({ text: "…" });
    await ensureOffscreen();
    const fromPage = await prefetchFromOpenTabs(items);
    const res = await chrome.runtime.sendMessage({ target: "offscreen", type: "build-zip", items });
    if (!res?.ok) throw new Error(res?.error || t("zipFailed"));
    if (!res.saved) throw new Error(t("noneDownloaded", res.failed.length));

    await chrome.downloads.download({ url: res.blobUrl, filename: `imagenes-${stamp()}.zip`, saveAs: false });
    setTimeout(() => chrome.runtime.sendMessage({ target: "offscreen", type: "revoke", blobUrl: res.blobUrl }).catch(() => {}), 60_000);

    // Opcional: vaciar la lista, dejando sólo las que fallaron
    const { clearAfter } = await chrome.storage.local.get("clearAfter");
    if (clearAfter) {
      const failed = new Set(res.failed);
      await serial(async () => setItems((await getItems()).filter((it) => failed.has(it.url))));
    }
    return { ok: true, saved: res.saved, fromPage, failed: res.failed.length, failedUrls: res.failed };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    downloading = false;
    await updateBadge((await getItems()).length);
  }
}

async function notifyActiveTab(text) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "toast", text }).catch(() => {});
}

// --- Mensajes ---------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (msg.target === "offscreen") return; // no son para nosotros
  const handlers = {
    toggle: () => toggle(msg),
    list: async () => ({ items: await getItems() }),
    remove: () => serial(async () => {
      await setItems((await getItems()).filter((it) => it.url !== msg.url));
      return { ok: true };
    }),
    clear: () => serial(async () => { await setItems([]); return { ok: true }; }),
    download: downloadZip,
  };
  const h = handlers[msg.type];
  if (!h) return;
  h().then(send, (e) => send({ ok: false, error: e.message }));
  return true;
});

chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "download-zip") return;
  await notifyActiveTab(t("preparing"));
  const r = await downloadZip();
  await notifyActiveTab(zipResult(r));
});

// --- Menú contextual (alternativa al O + clic) -----------------------------
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "izc-toggle", title: t("menuToggle"), contexts: ["image"] });
    chrome.contextMenus.create({ id: "izc-download", title: t("menuDownload"), contexts: ["all"] });
  });
  await updateBadge((await getItems()).length);
});

chrome.runtime.onStartup.addListener(async () => updateBadge((await getItems()).length));

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "izc-toggle" && info.srcUrl) {
    const r = await toggle({ url: info.srcUrl, pageUrl: info.pageUrl, pageTitle: tab?.title });
    notifyActiveTab(t(r.added ? "added" : "removed", r.count));
  } else if (info.menuItemId === "izc-download") {
    await notifyActiveTab(t("preparing"));
    const r = await downloadZip();
    notifyActiveTab(zipResult(r));
  }
});
