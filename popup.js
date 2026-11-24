const $ = (id) => document.getElementById(id);
const send = (msg) => chrome.runtime.sendMessage(msg);
const t = (k, ...a) => chrome.i18n.getMessage(k, a.map(String));
document.documentElement.lang = chrome.i18n.getUILanguage();
document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));

function render(items) {
  $("count").textContent = items.length;
  $("empty").style.display = items.length ? "none" : "block";
  $("download").disabled = $("clear").disabled = !items.length;
  const grid = $("grid");
  grid.replaceChildren(...items.map((it) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.title = it.url.startsWith("data:") ? `${t("popupEmbedded")} — ${it.pageTitle || ""}` : it.url;
    const img = document.createElement("img");
    img.src = it.url;
    img.loading = "lazy";
    const x = document.createElement("button");
    x.textContent = "✕";
    x.title = t("popupRemove");
    x.onclick = () => send({ type: "remove", url: it.url });
    cell.append(img, x);
    return cell;
  }));
}

async function refresh() {
  const { items = [], clearAfter = false } = await chrome.storage.local.get(["items", "clearAfter"]);
  $("clearAfter").checked = clearAfter;
  render(items);
}

chrome.storage.onChanged.addListener((c, area) => {
  if (area === "local" && c.items) render(c.items.newValue || []);
});

$("clearAfter").onchange = (e) => chrome.storage.local.set({ clearAfter: e.target.checked });

$("clear").onclick = async () => {
  if (confirm(t("popupConfirmClear"))) await send({ type: "clear" });
};

$("download").onclick = async () => {
  $("download").disabled = true;
  $("status").textContent = t("popupWorking");
  const r = await send({ type: "download" });
  $("status").textContent = r.ok
    ? t("zipReady", r.saved, r.fromPage) + (r.failed ? t("failedSuffix", r.failed) : "")
    : t("errorPrefix", r.error);
  $("download").disabled = false;
};

refresh();
