// Écrit la résolution d'impression (dpi) dans un JPEG (en-tête JFIF) ou un PNG (bloc pHYs).
// canvas.convertToBlob() ne le fait pas : sans ça, les logiciels affichent 72 ou 96 dpi.

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function jpegWithDpi(b: Uint8Array, dpi: number): Uint8Array {
  if (b[0] !== 0xff || b[1] !== 0xd8) return b;
  const d = Math.min(65535, Math.max(1, Math.round(dpi)));
  // APP0 JFIF déjà présent juste après SOI : on modifie les densités sur place.
  if (b[2] === 0xff && b[3] === 0xe0 && b[6] === 0x4a && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0x00) {
    const out = b.slice();
    out[13] = 1; // unités : points par pouce
    out[14] = d >> 8; out[15] = d & 0xff;
    out[16] = d >> 8; out[17] = d & 0xff;
    return out;
  }
  const app0 = new Uint8Array([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, d >> 8, d & 0xff, d >> 8, d & 0xff, 0x00, 0x00]);
  const out = new Uint8Array(b.length + app0.length);
  out.set(b.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(b.subarray(2), 2 + app0.length);
  return out;
}

function pngWithDpi(b: Uint8Array, dpi: number): Uint8Array {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (b[i] !== sig[i]) return b;
  // déjà un pHYs ? on ne touche à rien
  for (let p = 8; p + 8 <= b.length;) {
    const len = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
    const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
    if (type === 'pHYs') return b;
    if (type === 'IDAT' || type === 'IEND') break;
    p += 12 + len;
  }
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // 'pHYs'
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  chunk[16] = 1; // unité : mètre
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const ihdrEnd = 8 + 12 + 13; // signature + chunk IHDR (13 octets de données)
  const out = new Uint8Array(b.length + chunk.length);
  out.set(b.subarray(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(b.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}

export async function withDpi(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let out = bytes;
  if (blob.type === 'image/jpeg') out = jpegWithDpi(bytes, dpi);
  else if (blob.type === 'image/png') out = pngWithDpi(bytes, dpi);
  else return blob;
  return new Blob([out as BlobPart], { type: blob.type });
}
