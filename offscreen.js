import { buildZip, fileNameFor } from "./zip.js";

const CONCURRENCY = 6;
const TIMEOUT_MS = 30_000;
const pageCache = new Map(); // url -> dataUrl obtenido desde la pestaña de origen

async function fetchImage(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { credentials: "include", signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = new Uint8Array(await r.arrayBuffer());
    return { data, mime: r.headers.get("content-type") };
  } finally {
    clearTimeout(t);
  }
}

async function buildFromItems(items) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const cached = pageCache.get(items[i].url);
      try {
        results[i] = await fetchImage(cached || items[i].url);
      } catch (e) {
        // Si lo de la página fallara por algo, último intento directo
        try {
          results[i] = cached ? await fetchImage(items[i].url) : { error: e.message };
        } catch (e2) {
          results[i] = { error: e2.message };
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  pageCache.clear();

  const used = new Set();
  const files = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.error) return failed.push(items[i].url);
    files.push({ name: fileNameFor(items[i].url, r.mime, used, i), data: r.data });
  });
  if (!files.length) return { ok: true, saved: 0, failed };
  const blobUrl = URL.createObjectURL(buildZip(files));
  return { ok: true, saved: files.length, failed, blobUrl };
}

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (msg.target !== "offscreen") return;
  if (msg.type === "build-zip") {
    buildFromItems(msg.items).then(send, (e) => send({ ok: false, error: e.message }));
    return true;
  }
  if (msg.type === "cache") {
    pageCache.set(msg.url, msg.dataUrl);
    send({ ok: true });
  }
  if (msg.type === "revoke") {
    URL.revokeObjectURL(msg.blobUrl);
    send({ ok: true });
  }
});
