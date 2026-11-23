# agrandir-image

Agrandir une image avec l'IA, **100 % dans le navigateur**. *Free AI image upscaler (Real-ESRGAN) that runs entirely in your browser: WebGPU, falling back to multi-threaded WebAssembly. Nothing is uploaded.*

En ligne : **https://agrandir-image.fr** (outil gratuit, sans compte, sans filigrane, sans quota), proposé par [Coelus](https://coelus.fr).

## Ce que ça fait
- Agrandit une ou plusieurs images (jusqu'à 20) en ×2, ×3 ou ×4, ou à une taille voulue (HD, Full HD, 4K, format d'impression).
- Les images ne sont **jamais envoyées** : lecture, calcul et réencodage se font dans l'onglet (Web Worker). Seuls le moteur de calcul et le modèle choisi sont téléchargés une fois, puis gardés en cache.
- Calcul sur la carte graphique quand le navigateur expose WebGPU, repli automatique sur le processeur (WebAssembly multicœur).
- Formats acceptés : JPG, PNG, WebP, AVIF, GIF, BMP (HEIC dans Safari). Sortie : comme l'original, JPG, PNG ou WebP ; transparence conservée en PNG et WebP.
- Comparateur avant / après, téléchargement image par image ou en `.zip`.

## Pile
- [Astro](https://astro.build) 7 (pages statiques, SEO) et [Svelte](https://svelte.dev) 5 (l'outil).
- [onnxruntime-web](https://github.com/microsoft/onnxruntime) (WebGPU / WebAssembly) pour exécuter les modèles ONNX, [fflate](https://github.com/101arrowz/fflate) pour le ZIP.
- Hébergement : Cloudflare Workers (assets statiques, `wrangler.jsonc`). Les en-têtes COOP/COEP de `public/_headers` sont indispensables au WebAssembly multicœur.
- Polices auto-hébergées (Geist, Geist Mono).

## Arborescence
- `src/lib/upscale/` : le moteur. `worker.ts` (ONNX Runtime, tuilage, rééchantillonnage, encodage), `engine.ts` (calculs purs), `sizing.ts` (tailles et formats de tirage), `dpi.ts` (dpi dans JPEG/PNG), `models.ts` (catalogue), `client.ts` (pilotage depuis la page).
- `src/components/Agrandisseur.svelte` : l'outil en 4 étapes (Import, Options, Traitement, Résultats) ; `Compare.svelte` : comparateur avant / après.
- `src/data/tools.ts` : préréglages par page (facteur, taille, tirage, type, format) ; `src/data/faq.ts` : FAQ.
- `src/content/` : pages outils et articles (textes du site, voir « Licences »).
- `tools/models/` : conversion des modèles en ONNX ; `tools/test/` : tests de bout en bout ; `tools/render/` : génération du logo et des images.

## Modèles
Les modèles ne sont pas dans le dépôt. `tools/models/export_onnx.py` convertit les poids officiels [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (BSD-3-Clause) en ONNX (calcul fp32, poids stockés en fp16, vérification PyTorch contre ONNX Runtime).

```bash
cd tools/models
uv venv .venv --python 3.11
uv pip install --python .venv/bin/python torch --index-url https://download.pytorch.org/whl/cpu
uv pip install --python .venv/bin/python onnx onnxruntime numpy pillow
# télécharger les fichiers .pth dans weights/ (adresses dans le script), puis :
.venv/bin/python export_onnx.py
```

`scripts/prepare-assets.mjs` (lancé par `npm run build`) copie onnxruntime-web dans `public/ort/<version>/` (le `.wasm` est compressé en gzip : Cloudflare refuse les fichiers de plus de 25 Mio) et les modèles dans `public/models/` (nom haché, découpage en parties de 20 Mio).

## Démarrer
```bash
npm install
npm run dev            # prépare les assets puis lance Astro
npm run build          # prepare-assets + astro build + garde-fou des 25 Mio
npm run preview        # wrangler dev sur http://127.0.0.1:8788 (en-têtes de production)
npm run build:test     # build avec la page technique /test-moteur/ (tests)
npx wrangler deploy    # déploiement (CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID)
```

Mesure d'audience : facultative. Copier `.env.example` en `.env` et renseigner `PUBLIC_RYBBIT_SITE_ID` pour charger le script [Rybbit](https://rybbit.io) (sans cookie) ; sans cette variable, aucun script de mesure n'est chargé. Le COEP `require-corp` du site impose que le serveur Rybbit envoie `Cross-Origin-Resource-Policy: cross-origin` pour ce script.

## Tests
- `tools/test/e2e_engine.py` : sortie du navigateur (WASM / WebGPU) comparée à l'implémentation Python de référence (`tools/demo/make_demos.py`) ; PSNR attendu supérieur à 90 dB en ×4.
- `tools/test/e2e_formats.py` : transparence PNG, dpi JPEG/PNG, WebP.
- `tools/test/ui_check.py` : parcours réel en 4 étapes, débordements à 320, 375, 414 et 768 px, captures (`MOBILE_FLOW=1` pour le parcours mobile).

Les scripts de `tools/` ont été écrits pour notre machine : ils contiennent des chemins absolus (dont celui de Chromium) à adapter.

## Contribuer
Les issues et les propositions sont les bienvenues : anomalie sur une image, navigateur qui ne fonctionne pas, idée de réglage. Joindre le navigateur, le système et, si possible, une image qui reproduit le problème.

## Licences
- **Code** : [MIT](LICENSE).
- **Textes du site** (`src/content/`, FAQ, pages), **logo et identité de Coelus** : © Coelus, tous droits réservés. Ils ne sont pas couverts par la licence MIT.
- **Modèles** Real-ESRGAN : © 2021 Xintao Wang et al., BSD-3-Clause. **onnxruntime-web** : © Microsoft, MIT. **Polices** Geist : SIL Open Font License.
- **Photos de démonstration** : domaine public / CC0 (Wikimedia Commons), voir `src/pages/credits.astro`.
