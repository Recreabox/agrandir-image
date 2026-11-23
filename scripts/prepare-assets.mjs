// Prépare les assets lourds servis en statique (exécuté avant chaque build).
// - onnxruntime-web : JS + glue copiés tels quels, .wasm compressé en gzip (Cloudflare limite un asset à 25 Mio).
// - modèles ONNX : nom haché (cache immuable), découpés en parties de 20 Mio max.
// - écrit src/generated/assets.json, lu par le worker.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { gzipSync, constants } from 'node:zlib';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'public');
const ortDist = path.join(root, 'node_modules/onnxruntime-web/dist');
const modelsDir = path.join(root, 'tools/models/onnx');
const MAX_PART = 20 * 1024 * 1024;
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

const ortVersion = JSON.parse(readFileSync(path.join(root, 'node_modules/onnxruntime-web/package.json'), 'utf8')).version;
const ortOut = path.join(pub, 'ort');
rmSync(ortOut, { recursive: true, force: true });
mkdirSync(path.join(ortOut, ortVersion), { recursive: true });

const ort = {};
for (const [key, js, glue, wasm] of [
  ['webgpu', 'ort.webgpu.min.mjs', 'ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm'],
  ['wasm', 'ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'],
]) {
  const base = '/ort/' + ortVersion + '/';
  for (const f of [js, glue]) copyFileSync(path.join(ortDist, f), path.join(ortOut, ortVersion, f));
  const raw = readFileSync(path.join(ortDist, wasm));
  const gz = gzipSync(raw, { level: constants.Z_BEST_COMPRESSION });
  writeFileSync(path.join(ortOut, ortVersion, wasm + '.gz'), gz);
  ort[key] = { js: base + js, glue: base + glue, wasmGz: base + wasm + '.gz', wasmBytes: raw.length, gzBytes: gz.length };
}

const modelsOut = path.join(pub, 'models');
rmSync(modelsOut, { recursive: true, force: true });
mkdirSync(modelsOut, { recursive: true });
const MODEL_IDS = [
  'realesr-general-x4v3',
  'realesr-general-x4v3-dn50',
  'realesr-animevideov3',
  'RealESRGAN_x4plus',
  'RealESRGAN_x4plus_anime_6B',
];
const models = {};
for (const id of MODEL_IDS) {
  const file = path.join(modelsDir, id + '.onnx');
  if (!existsSync(file)) throw new Error('Modèle manquant : ' + file + ' (lancer tools/models/export_onnx.py)');
  const buf = readFileSync(file);
  const hash = sha(buf).slice(0, 10);
  const parts = [];
  if (buf.length <= MAX_PART) {
    const name = id + '.' + hash + '.onnx';
    writeFileSync(path.join(modelsOut, name), buf);
    parts.push('/models/' + name);
  } else {
    for (let i = 0, p = 0; i < buf.length; i += MAX_PART, p++) {
      const name = id + '.' + hash + '.part' + p;
      writeFileSync(path.join(modelsOut, name), buf.subarray(i, Math.min(buf.length, i + MAX_PART)));
      parts.push('/models/' + name);
    }
  }
  models[id] = { parts, bytes: buf.length, sha256: sha(buf) };
}

mkdirSync(path.join(root, 'src/generated'), { recursive: true });
writeFileSync(path.join(root, 'src/generated/assets.json'), JSON.stringify({ ortVersion, ort, models }, null, 2) + '\n');
console.log('[prepare-assets] ORT ' + ortVersion + ', ' + Object.keys(models).length + ' modèles');
for (const [k, v] of Object.entries(ort)) console.log('  ort/' + k + ' wasm.gz ' + (v.gzBytes / 1048576).toFixed(1) + ' Mo');
for (const [k, v] of Object.entries(models)) console.log('  ' + k + ' ' + (v.bytes / 1048576).toFixed(1) + ' Mo en ' + v.parts.length + ' partie(s)');
