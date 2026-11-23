// Vérifie le site construit : liens internes, ressources, balises SEO de base, liens Coelus suivis.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
const dist = path.resolve(import.meta.dirname, '..', '..', 'dist');
const pages = [];
(function walk(d) { for (const e of readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.html')) pages.push(p); } })(dist);
const exists = (u) => {
  const clean = decodeURIComponent(u.split('#')[0].split('?')[0]);
  const f = path.join(dist, clean);
  if (clean.endsWith('/')) return existsSync(path.join(f, 'index.html'));
  return (existsSync(f) && statSync(f).isFile()) || existsSync(path.join(f, 'index.html'));
};
const broken = [], seo = [], coelusNoUtm = new Set(), external = {};
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const rel = '/' + path.relative(dist, p).replace(/index\.html$/, '');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const u = m[1].replace(/&amp;/g, '&');
    if (u.startsWith('/') && !u.startsWith('//')) { if (!exists(u)) broken.push(rel + ' -> ' + u); }
    else if (/^https?:/.test(u)) {
      const host = new URL(u).host; external[host] = (external[host] || 0) + 1;
      if (host === 'coelus.fr' && !u.includes('utm_source=agrandir-image.fr')) coelusNoUtm.add(rel + ' -> ' + u);
    }
  }
  if (rel.startsWith('/404')) continue;
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const ld = (html.match(/application\/ld\+json/g) || []).length;
  const issues = [];
  if (h1 !== 1) issues.push('h1=' + h1);
  if (!title || title.length > 65) issues.push('title(' + title.length + ')');
  if (!desc || desc.length > 160) issues.push('desc(' + desc.length + ')');
  if (canon !== 'https://agrandir-image.fr' + rel) issues.push('canonical=' + canon);
  if (!ld) issues.push('no-jsonld');
  seo.push(rel + ' · ' + title.length + 'c · ' + (issues.length ? 'KO ' + issues.join(', ') : 'ok'));
}
console.log('pages:', pages.length);
console.log('liens internes cassés:', broken.length ? '\n  ' + broken.join('\n  ') : 0);
console.log('coelus sans UTM:', coelusNoUtm.size ? '\n  ' + [...coelusNoUtm].join('\n  ') : 0);
console.log('domaines externes:', JSON.stringify(external));
console.log('SEO:\n  ' + seo.join('\n  '));
