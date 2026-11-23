/// <reference lib="webworker" />
// Worker d'agrandissement : charge onnxruntime-web (WebGPU, sinon WASM), découpe l'image en tuiles,
// exécute le modèle, rééchantillonne vers la taille demandée et encode le résultat. Rien ne sort de l'appareil.
import assets from '../../generated/assets.json';
import { MODELS } from './models';
import { MODEL_SCALE, PAD, planTiles, fillPatch, buildAxis, ownedRange, resampleBlock, hasTransparency, bleedTransparent } from './engine';
import type { Backend, Caps, JobSpec, WorkerRequest, WorkerResponse } from './protocol';
import { withDpi } from './dpi';

declare const self: DedicatedWorkerGlobalScope;

type OrtModule = any;
const CACHE_NAME = 'agrandir-image-assets-v1';

let ort: OrtModule | null = null;
let ortKind: Backend | null = null;
let caps: Caps | null = null;
let current: { key: string; session: any } | null = null;
const cancelled = new Set<number>();
let queue: Promise<void> = Promise.resolve();

const post = (msg: WorkerResponse, transfer: Transferable[] = []) => self.postMessage(msg, transfer);

class CancelledError extends Error {}

async function detectCaps(): Promise<Caps> {
  const isolated = !!self.crossOriginIsolated;
  const threads = isolated ? Math.max(1, Math.min(8, (navigator.hardwareConcurrency || 4) - 1)) : 1;
  const gpu = (navigator as any).gpu;
  if (!gpu) return { webgpu: false, gpuName: '', fallbackAdapter: false, isolated, threads };
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return { webgpu: false, gpuName: '', fallbackAdapter: false, isolated, threads };
    const info = adapter.info || {};
    const gpuName = [info.vendor, info.architecture || info.device || info.description].filter(Boolean).join(' ');
    const fallbackAdapter = !!(info.isFallbackAdapter ?? adapter.isFallbackAdapter);
    return { webgpu: !fallbackAdapter, gpuName, fallbackAdapter, isolated, threads };
  } catch {
    return { webgpu: false, gpuName: '', fallbackAdapter: false, isolated, threads };
  }
}

// Supprime du cache les fichiers d'anciennes versions (modèles renommés à chaque changement, ORT versionné).
async function pruneCache(): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keep = new Set<string>();
    for (const k of ['webgpu', 'wasm']) keep.add((assets.ort as any)[k].wasmGz);
    for (const m of Object.values(assets.models as Record<string, { parts: string[] }>)) for (const p of m.parts) keep.add(p);
    for (const req of await cache.keys()) {
      if (!keep.has(new URL(req.url).pathname)) await cache.delete(req);
    }
  } catch { /* Cache Storage indisponible : rien à nettoyer */ }
}

async function cachedBytes(url: string, onDelta: (n: number) => void): Promise<Uint8Array> {
  let cache: Cache | null = null;
  try { cache = await caches.open(CACHE_NAME); } catch { cache = null; }
  if (cache) {
    const hit = await cache.match(url);
    if (hit) {
      const buf = new Uint8Array(await hit.arrayBuffer());
      onDelta(buf.byteLength);
      return buf;
    }
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error('Téléchargement impossible (' + res.status + ') : ' + url);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    n += value.byteLength;
    onDelta(value.byteLength);
  }
  const buf = new Uint8Array(n);
  let o = 0;
  for (const c of chunks) { buf.set(c, o); o += c.byteLength; }
  if (cache) {
    try { await cache.put(url, new Response(buf.slice(0), { headers: { 'content-type': 'application/octet-stream' } })); } catch { /* quota : tant pis */ }
  }
  return buf;
}

async function gunzip(buf: Uint8Array): Promise<ArrayBuffer> {
  if (buf[0] !== 0x1f || buf[1] !== 0x8b) return buf.slice(0).buffer; // déjà décompressé par le réseau
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).arrayBuffer();
}

async function loadRuntime(kind: Backend, jobId: number): Promise<void> {
  if (ort) return;
  const a = (assets.ort as any)[kind];
  const total = a.gzBytes;
  let done = 0;
  post({ type: 'progress', id: jobId, stage: 'runtime', done: 0, total });
  const [mod, gz] = await Promise.all([
    import(/* @vite-ignore */ new URL(a.js, self.location.origin).href),
    cachedBytes(a.wasmGz, (d) => { done += d; post({ type: 'progress', id: jobId, stage: 'runtime', done: Math.min(done, total), total }); }),
  ]);
  const wasmBinary = await gunzip(gz);
  ort = mod;
  ortKind = kind;
  ort.env.wasm.wasmBinary = wasmBinary;
  ort.env.wasm.wasmPaths = { mjs: new URL(a.glue, self.location.origin).href };
  ort.env.wasm.numThreads = caps?.threads ?? 1;
  ort.env.wasm.proxy = false;
  ort.env.logLevel = 'error';
  if (kind === 'webgpu' && ort.env.webgpu) ort.env.webgpu.powerPreference = 'high-performance';
}

async function getSession(modelId: string, backend: Backend, jobId: number): Promise<any> {
  const key = modelId + '|' + backend;
  if (current && current.key === key) return current.session;
  if (current) {
    try { await current.session.release(); } catch { /* ignore */ }
    current = null;
  }
  const m = (assets.models as any)[modelId];
  if (!m) throw new Error('Modèle inconnu : ' + modelId);
  let done = 0;
  post({ type: 'progress', id: jobId, stage: 'model', done: 0, total: m.bytes });
  const parts: Uint8Array[] = [];
  for (const url of m.parts) {
    parts.push(await cachedBytes(url, (d) => { done += d; post({ type: 'progress', id: jobId, stage: 'model', done: Math.min(done, m.bytes), total: m.bytes }); }));
  }
  let bytes: Uint8Array;
  if (parts.length === 1) bytes = parts[0];
  else {
    bytes = new Uint8Array(parts.reduce((s, p) => s + p.byteLength, 0));
    let o = 0;
    for (const p of parts) { bytes.set(p, o); o += p.byteLength; }
  }
  post({ type: 'progress', id: jobId, stage: 'prepare', done: 0, total: 1 });
  const session = await ort.InferenceSession.create(bytes, {
    executionProviders: [backend === 'webgpu' ? 'webgpu' : 'wasm'],
    graphOptimizationLevel: 'all',
  });
  current = { key, session };
  return session;
}

function chooseBackend(spec: JobSpec): Backend {
  if (spec.engine === 'cpu') return 'wasm';
  if (spec.engine === 'gpu') return caps?.webgpu || caps?.fallbackAdapter ? 'webgpu' : 'wasm';
  return caps?.webgpu ? 'webgpu' : 'wasm';
}

async function upscale(spec: JobSpec, bitmap: ImageBitmap, backend: Backend): Promise<{ blob: Blob; mime: string; backend: Backend }> {
  const t0 = performance.now();
  const W = bitmap.width, H = bitmap.height;
  const canvas = new OffscreenCanvas(W, H);
  const cx = canvas.getContext('2d', { willReadFrequently: true })!;
  cx.drawImage(bitmap, 0, 0);
  const src = cx.getImageData(0, 0, W, H).data;
  const alpha = hasTransparency(src);
  if (alpha) bleedTransparent(src, W, H);

  // Le runtime « webgpu » contient aussi le moteur WASM : on charge celui qui sert au mieux.
  await loadRuntime(caps?.webgpu || spec.engine === 'gpu' ? 'webgpu' : 'wasm', spec.id);
  if (backend === 'webgpu' && ortKind !== 'webgpu') backend = 'wasm';
  const session = await getSession(spec.modelId, backend, spec.id);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  const model = MODELS[spec.modelId];
  const tileSize = backend === 'webgpu' ? model.tile.webgpu : model.tile.wasm;
  const plan = planTiles(W, H, tileSize);
  const TW = spec.targetW, TH = spec.targetH;
  const ax = buildAxis(W * MODEL_SCALE, TW);
  const ay = buildAxis(H * MODEL_SCALE, TH);
  const passes = alpha ? 2 : 1;
  const total = plan.tiles.length * passes;
  const input = new Float32Array(3 * plan.pw * plan.ph);
  const OW = plan.pw * MODEL_SCALE, OH = plan.ph * MODEL_SCALE;
  const out = new OffscreenCanvas(TW, TH);
  const ox = out.getContext('2d')!;
  const alphaPlane = alpha ? new Uint8ClampedArray(TW * TH) : null;
  let done = 0;
  post({ type: 'progress', id: spec.id, stage: 'tiles', done, total, backend, elapsedMs: performance.now() - t0 });

  for (let pass = alpha ? 0 : 1; pass < 2; pass++) {
    const isAlphaPass = pass === 0;
    for (const t of plan.tiles) {
      if (cancelled.has(spec.id)) throw new CancelledError('Annulé');
      fillPatch(src, W, H, t, plan.pw, plan.ph, input, isAlphaPass);
      const feeds = { [inputName]: new ort.Tensor('float32', input, [1, 3, plan.ph, plan.pw]) };
      const results = await session.run(feeds);
      const tensor = results[outputName];
      const data = (tensor.data ?? (await tensor.getData())) as Float32Array;
      if (done === 0 && backend === 'webgpu') {
        for (let i = 0; i < data.length; i += 97) if (!Number.isFinite(data[i])) throw new Error('webgpu-nan');
      }
      const [jx0, jx1] = ownedRange(t.x0, t.x1, W, TW);
      const [jy0, jy1] = ownedRange(t.y0, t.y1, H, TH);
      if (jx1 > jx0 && jy1 > jy0) {
        const bw = jx1 - jx0, bh = jy1 - jy0;
        const block = resampleBlock(data, 3, OW, OH, t.ox * MODEL_SCALE, t.oy * MODEL_SCALE, ax, ay, jx0, jx1, jy0, jy1);
        const plane = bw * bh;
        if (isAlphaPass) {
          for (let i = 0; i < bh; i++) {
            const row = (jy0 + i) * TW + jx0;
            for (let j = 0; j < bw; j++) {
              const p = i * bw + j;
              alphaPlane![row + j] = ((block[p] + block[plane + p] + block[2 * plane + p]) / 3) * 255;
            }
          }
        } else {
          const img = new ImageData(bw, bh);
          const d = img.data;
          for (let i = 0; i < bh; i++) {
            for (let j = 0; j < bw; j++) {
              const p = i * bw + j, q = p * 4;
              d[q] = block[p] * 255;
              d[q + 1] = block[plane + p] * 255;
              d[q + 2] = block[2 * plane + p] * 255;
              d[q + 3] = alphaPlane ? alphaPlane[(jy0 + i) * TW + jx0 + j] : 255;
            }
          }
          ox.putImageData(img, jx0, jy0);
        }
      }
      tensor.dispose?.();
      done++;
      post({ type: 'progress', id: spec.id, stage: 'tiles', done, total, backend, elapsedMs: performance.now() - t0 });
    }
  }

  post({ type: 'progress', id: spec.id, stage: 'encode', done: 0, total: 1, backend });
  let target: OffscreenCanvas = out;
  if (alpha && spec.mime === 'image/jpeg') {
    target = new OffscreenCanvas(TW, TH);
    const tx = target.getContext('2d')!;
    tx.fillStyle = 'rgb(255,255,255)';
    tx.fillRect(0, 0, TW, TH);
    tx.drawImage(out, 0, 0);
  }
  let blob = await target.convertToBlob(spec.mime === 'image/png' ? { type: 'image/png' } : { type: spec.mime, quality: spec.quality });
  if (spec.dpi) blob = await withDpi(blob, spec.dpi);
  return { blob, mime: blob.type || spec.mime, backend };
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/Failed to fetch|NetworkError|Load failed|Téléchargement impossible/i.test(msg)) {
    return 'Téléchargement impossible : vérifiez la connexion (le modèle n’est pas encore enregistré sur cet appareil).';
  }
  if (/memory|allocat|out of memory|OOM|RangeError|Array buffer/i.test(msg)) {
    return 'Mémoire insuffisante sur cet appareil : essayez un facteur plus petit, une image plus petite ou le réglage sans « Détails max ».';
  }
  return 'Le calcul a échoué (' + msg.slice(0, 160) + ').';
}

async function runJob(spec: JobSpec, bitmap: ImageBitmap): Promise<void> {
  const t0 = performance.now();
  let backend = chooseBackend(spec);
  try {
    let result;
    try {
      result = await upscale(spec, bitmap, backend);
    } catch (e) {
      if (e instanceof CancelledError || backend !== 'webgpu') throw e;
      // Échec GPU (mémoire, pilote, NaN) : on recommence sur le processeur.
      post({ type: 'notice', id: spec.id, message: 'La carte graphique a refusé le calcul : on continue avec le processeur, c’est plus lent.' });
      if (current) { try { await current.session.release(); } catch { /* ignore */ } current = null; }
      backend = 'wasm';
      result = await upscale(spec, bitmap, backend);
    }
    post({ type: 'done', id: spec.id, blob: result.blob, width: spec.targetW, height: spec.targetH, ms: Math.round(performance.now() - t0), backend: result.backend, mime: result.mime });
  } catch (e) {
    const isCancel = e instanceof CancelledError;
    post({ type: 'error', id: spec.id, message: isCancel ? 'Annulé' : friendlyError(e), cancelled: isCancel });
  } finally {
    cancelled.delete(spec.id);
    try { bitmap.close(); } catch { /* ignore */ }
  }
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  if (msg.type === 'init') {
    (async () => {
      caps = caps ?? (await detectCaps());
      post({ type: 'caps', caps });
      pruneCache();
    })();
  } else if (msg.type === 'cancel') {
    cancelled.add(msg.id);
  } else if (msg.type === 'job') {
    queue = queue.then(async () => {
      caps = caps ?? (await detectCaps());
      if (cancelled.has(msg.spec.id)) {
        cancelled.delete(msg.spec.id);
        post({ type: 'error', id: msg.spec.id, message: 'Annulé', cancelled: true });
        return;
      }
      await runJob(msg.spec, msg.bitmap);
    });
  }
};
