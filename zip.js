// Generador ZIP mínimo (método "store", sin compresión: las imágenes ya vienen comprimidas).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

/**
 * @param {{name: string, data: Uint8Array}[]} files
 * @returns {Blob}
 */
export function buildZip(files) {
  const enc = new TextEncoder();
  const { time, date } = dosDateTime(new Date());
  const parts = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); // firma local header
    lh.setUint16(4, 20, true);         // versión necesaria
    lh.setUint16(6, 0x0800, true);     // flag: nombres en UTF-8
    lh.setUint16(8, 0, true);          // método: store
    lh.setUint16(10, time, true);
    lh.setUint16(12, date, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);
    lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(lh.buffer, name, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); // firma central directory
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true);
    ch.setUint16(14, date, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true);
    ch.setUint32(24, size, true);
    ch.setUint16(28, name.length, true);
    // extra, comment, disk, int attr, ext attr = 0
    ch.setUint32(42, offset, true);
    central.push(ch.buffer, name);

    offset += 30 + name.length + size;
  }

  const cdSize = central.reduce((s, p) => s + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

const EXT_BY_MIME = {
  "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
  "image/avif": "avif", "image/svg+xml": "svg", "image/bmp": "bmp", "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico", "image/tiff": "tif", "image/heic": "heic",
};

/** Nombre de archivo único y seguro a partir de la URL y el content-type. */
export function fileNameFor(url, mime, used, index) {
  let base = "";
  if (!url.startsWith("data:")) {
    try {
      const seg = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
      base = decodeURIComponent(seg);
    } catch { /* URL rara: usamos nombre genérico */ }
  }
  base = base.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+/, "").slice(0, 120);

  const wanted = EXT_BY_MIME[(mime || "").split(";")[0].trim().toLowerCase()];
  let stem = base, ext = "";
  const dot = base.lastIndexOf(".");
  if (dot > 0) { stem = base.slice(0, dot); ext = base.slice(dot + 1).toLowerCase(); }
  if (!stem) stem = `imagen-${String(index + 1).padStart(3, "0")}`;
  if (wanted && ext !== wanted && !(wanted === "jpg" && ext === "jpeg")) ext = wanted;
  if (!ext) ext = "bin";

  let name = `${stem}.${ext}`;
  for (let n = 2; used.has(name.toLowerCase()); n++) name = `${stem} (${n}).${ext}`;
  used.add(name.toLowerCase());
  return name;
}
