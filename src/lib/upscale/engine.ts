// Calculs purs (sans ONNX) : plan de tuilage, rééchantillonnage Lanczos, remplissage des zones transparentes.
// L'algorithme de tuilage est identique à tools/demo/make_demos.py (implémentation de référence).

export const MODEL_SCALE = 4;
export const PAD = 16;

export interface Tile {
  /** Zone possédée, en pixels source : [x0, x1) x [y0, y1). */
  x0: number; x1: number; y0: number; y1: number;
  /** Origine du patch envoyé au modèle (peut être négative : bords répliqués). */
  ox: number; oy: number;
}

export interface TilePlan { pw: number; ph: number; tiles: Tile[] }

export function planTiles(W: number, H: number, tile: number, pad = PAD): TilePlan {
  const tw = Math.min(tile, W);
  const th = Math.min(tile, H);
  const tiles: Tile[] = [];
  for (let y0 = 0; y0 < H; y0 += tile) {
    const y1 = Math.min(H, y0 + tile);
    const oy = Math.min(y0, H - th) - pad;
    for (let x0 = 0; x0 < W; x0 += tile) {
      const x1 = Math.min(W, x0 + tile);
      const ox = Math.min(x0, W - tw) - pad;
      tiles.push({ x0, x1, y0, y1, ox, oy });
    }
  }
  return { pw: tw + 2 * pad, ph: th + 2 * pad, tiles };
}

/** Remplit le tenseur NCHW (1x3xphxpw) avec le patch, bords répliqués. mode alpha : canal alpha recopié sur RVB. */
export function fillPatch(src: Uint8ClampedArray, W: number, H: number, t: Tile, pw: number, ph: number, dst: Float32Array, alpha: boolean): void {
  const plane = pw * ph;
  const xs = new Int32Array(pw);
  for (let x = 0; x < pw; x++) xs[x] = Math.min(W - 1, Math.max(0, t.ox + x)) * 4;
  const k = 1 / 255;
  for (let y = 0; y < ph; y++) {
    const row = Math.min(H - 1, Math.max(0, t.oy + y)) * W * 4;
    const o = y * pw;
    if (alpha) {
      for (let x = 0; x < pw; x++) {
        const a = src[row + xs[x] + 3] * k;
        dst[o + x] = a; dst[plane + o + x] = a; dst[2 * plane + o + x] = a;
      }
    } else {
      for (let x = 0; x < pw; x++) {
        const i = row + xs[x];
        dst[o + x] = src[i] * k; dst[plane + o + x] = src[i + 1] * k; dst[2 * plane + o + x] = src[i + 2] * k;
      }
    }
  }
}

/** Axe de rééchantillonnage : pour chaque pixel cible, premier indice source (coordonnées x4 globales) + poids. */
export interface Axis { start: Int32Array; taps: number; weights: Float32Array; identity: boolean; }

function sinc(x: number): number {
  if (x === 0) return 1;
  const p = Math.PI * x;
  return Math.sin(p) / p;
}
const lanczos3 = (x: number) => (Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0);

export function buildAxis(srcLen: number, dstLen: number): Axis {
  if (dstLen === srcLen) {
    const start = new Int32Array(dstLen);
    for (let j = 0; j < dstLen; j++) start[j] = j;
    return { start, taps: 1, weights: new Float32Array(dstLen).fill(1), identity: true };
  }
  const k = srcLen / dstLen; // > 1 : réduction (on ne dépasse jamais x4)
  const scale = Math.max(1, k);
  const support = 3 * scale;
  const taps = Math.ceil(support) * 2 + 1;
  const start = new Int32Array(dstLen);
  const weights = new Float32Array(dstLen * taps);
  for (let j = 0; j < dstLen; j++) {
    const center = (j + 0.5) * k - 0.5;
    const s = Math.floor(center - support) + 1;
    start[j] = s;
    let sum = 0;
    for (let t = 0; t < taps; t++) {
      const w = lanczos3((s + t - center) / scale);
      weights[j * taps + t] = w;
      sum += w;
    }
    if (sum !== 0) for (let t = 0; t < taps; t++) weights[j * taps + t] /= sum;
  }
  return { start, taps, weights, identity: false };
}

/** Indices cibles possédés par une tuile [a0, a1) en pixels source, sur un axe (centres de pixels). */
export function ownedRange(a0: number, a1: number, srcLen: number, dstLen: number, scale = MODEL_SCALE): [number, number] {
  const k = (srcLen * scale) / dstLen;
  const j0 = Math.max(0, Math.ceil((a0 * scale) / k - 0.5));
  const j1 = Math.min(dstLen, Math.ceil((a1 * scale) / k - 0.5));
  return [j0, j1];
}

/**
 * Rééchantillonne la sortie du modèle (planaire, C x OH x OW, coordonnées x4 locales au patch)
 * vers le bloc cible [jx0,jx1) x [jy0,jy1). Renvoie un tableau planaire C x bh x bw (valeurs 0..1 non bornées).
 */
export function resampleBlock(
  out: Float32Array, C: number, OW: number, OH: number,
  originX4: number, originY4: number,
  ax: Axis, ay: Axis, jx0: number, jx1: number, jy0: number, jy1: number,
): Float32Array {
  const bw = jx1 - jx0, bh = jy1 - jy0;
  const plane = OW * OH;
  // lignes source nécessaires
  let rMin = Infinity, rMax = -Infinity;
  for (let i = jy0; i < jy1; i++) {
    const s = ay.start[i] - originY4;
    rMin = Math.min(rMin, s); rMax = Math.max(rMax, s + ay.taps - 1);
  }
  rMin = Math.max(0, rMin); rMax = Math.min(OH - 1, rMax);
  const rows = rMax - rMin + 1;
  const tmp = new Float32Array(C * rows * bw);
  for (let c = 0; c < C; c++) {
    const base = c * plane;
    for (let r = 0; r < rows; r++) {
      const srow = base + (rMin + r) * OW;
      const trow = (c * rows + r) * bw;
      for (let j = 0; j < bw; j++) {
        const gj = jx0 + j;
        const s = ax.start[gj] - originX4;
        if (ax.identity) { tmp[trow + j] = out[srow + Math.min(OW - 1, Math.max(0, s))]; continue; }
        let acc = 0;
        const wo = gj * ax.taps;
        for (let t = 0; t < ax.taps; t++) {
          const x = Math.min(OW - 1, Math.max(0, s + t));
          acc += ax.weights[wo + t] * out[srow + x];
        }
        tmp[trow + j] = acc;
      }
    }
  }
  const res = new Float32Array(C * bh * bw);
  for (let c = 0; c < C; c++) {
    for (let i = 0; i < bh; i++) {
      const gi = jy0 + i;
      const s = ay.start[gi] - originY4 - rMin;
      const ro = (c * bh + i) * bw;
      if (ay.identity) {
        const tr = (c * rows + Math.min(rows - 1, Math.max(0, s))) * bw;
        for (let j = 0; j < bw; j++) res[ro + j] = tmp[tr + j];
        continue;
      }
      const wo = gi * ay.taps;
      for (let j = 0; j < bw; j++) {
        let acc = 0;
        for (let t = 0; t < ay.taps; t++) {
          const r = Math.min(rows - 1, Math.max(0, s + t));
          acc += ay.weights[wo + t] * tmp[(c * rows + r) * bw + j];
        }
        res[ro + j] = acc;
      }
    }
  }
  return res;
}

/** true si au moins un pixel n'est pas totalement opaque. */
export function hasTransparency(px: Uint8ClampedArray): boolean {
  for (let i = 3; i < px.length; i += 4) if (px[i] < 255) return true;
  return false;
}

/**
 * Donne aux pixels (quasi) transparents la couleur du pixel visible le plus proche (parcours en largeur).
 * Évite le liseré sombre autour des logos : sans ça, le modèle voit du noir derrière la transparence.
 */
export function bleedTransparent(px: Uint8ClampedArray, W: number, H: number, minAlpha = 8): void {
  const N = W * H;
  const filled = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  for (let p = 0; p < N; p++) {
    if (px[p * 4 + 3] >= minAlpha) { filled[p] = 1; queue[tail++] = p; }
  }
  if (tail === 0) return; // image entièrement transparente
  while (head < tail) {
    const p = queue[head++];
    const x = p % W;
    const r = px[p * 4], g = px[p * 4 + 1], b = px[p * 4 + 2];
    for (let k = 0; k < 4; k++) {
      let q: number;
      if (k === 0) { if (x === 0) continue; q = p - 1; }
      else if (k === 1) { if (x === W - 1) continue; q = p + 1; }
      else if (k === 2) { q = p - W; if (q < 0) continue; }
      else { q = p + W; if (q >= N) continue; }
      if (filled[q]) continue;
      filled[q] = 1;
      px[q * 4] = r; px[q * 4 + 1] = g; px[q * 4 + 2] = b;
      queue[tail++] = q;
    }
  }
}
