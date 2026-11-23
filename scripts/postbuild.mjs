// Garde-fou : Cloudflare Workers refuse tout asset statique > 25 Mio.
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
const dist = path.resolve(import.meta.dirname, '..', 'dist');
const LIMIT = 25 * 1024 * 1024;
let count = 0, total = 0;
const big = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else { const s = statSync(p).size; count++; total += s; if (s > LIMIT) big.push(p + ' (' + (s / 1048576).toFixed(1) + ' Mio)'); }
  }
})(dist);
if (big.length) { console.error('[postbuild] Fichiers trop gros pour Cloudflare :\n' + big.join('\n')); process.exit(1); }
console.log('[postbuild] ' + count + ' fichiers, ' + (total / 1048576).toFixed(1) + ' Mio, aucun > 25 Mio');
