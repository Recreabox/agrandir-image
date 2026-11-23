<script lang="ts">
  // L'outil, en 4 étapes : Import → Options → Traitement → Résultats.
  // Tout reste dans le navigateur : les images ne sont jamais envoyées.
  import { onMount } from 'svelte';
  import Compare from './Compare.svelte';
  import { getClient, type UpscaleClient } from '../lib/upscale/client';
  import { pickModel, type Kind, type Quality } from '../lib/upscale/models';
  import type { Caps, Backend, OutputMime, Stage } from '../lib/upscale/protocol';
  import { PRINT_FORMATS, SIDE_PRESETS, computeTarget, maxOutputPixels, fmtInt, fmtScale, fmtBytes, fmtDuration, type ScaleMode, type Target } from '../lib/upscale/sizing';
  import assets from '../generated/assets.json';

  type Format = 'auto' | 'png' | 'jpeg' | 'webp';
  interface Preset {
    kind?: Kind; mode?: ScaleMode; scale?: number; side?: number; print?: string; dpi?: number;
    format?: Format; jpegQuality?: number; allowSame?: boolean; writeDpi?: boolean; bgToggle?: boolean;
  }
  interface Cta { text: string; href: string; label: string }
  interface Props { preset?: Preset; cta?: Cta; sample?: string; sampleName?: string; features?: string[] }
  let { preset = {}, cta, sample = '/exemples/polaroid-avant.jpg', sampleName = 'polaroid-exemple.jpg', features = [] }: Props = $props();

  type Step = 'import' | 'options' | 'traitement' | 'resultats';
  type Status = 'pret' | 'attente' | 'calcul' | 'fini' | 'erreur';
  interface Result { url: string; blob: Blob; w: number; h: number; ms: number; backend: Backend; mime: string; name: string; scale: number }
  interface Item {
    key: string; file: File; name: string; url: string; w: number; h: number;
    status: Status; fatal?: boolean; stage?: Stage; done: number; total: number;
    tileStart?: number; eta?: number; result?: Result; error?: string; notice?: string; jobId?: number;
  }

  const svg = (d: string) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  const I = {
    upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>'),
    sliders: svg('<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>'),
    loader: svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
    fileCheck: svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    circleCheck: svg('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    right: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
    left: svg('<path d="m12 19-7-7 7-7M19 12H5"/>'),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
    refresh: svg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
    image: svg('<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
    camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
    history: svg('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'),
    pen: svg('<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>'),
    zap: svg('<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'),
    sparkles: svg('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>'),
    monitor: svg('<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    plus: svg('<path d="M5 12h14M12 5v14"/>'),
  };

  const STEPS: { id: Step; label: string; icon: string }[] = [
    { id: 'import', label: 'Import', icon: I.upload },
    { id: 'options', label: 'Options', icon: I.sliders },
    { id: 'traitement', label: 'Traitement', icon: I.loader },
    { id: 'resultats', label: 'Résultats', icon: I.fileCheck },
  ];
  const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,.heic,.heif';
  const MAX_FILES = 20;
  const KINDS: { v: Kind; t: string; s: string; icon: string }[] = [
    { v: 'photo', t: 'Photo', s: 'Portraits, paysages, objets', icon: I.camera },
    { v: 'abimee', t: 'Photo abîmée', s: 'Ancienne, floue, compressée', icon: I.history },
    { v: 'dessin', t: 'Dessin ou logo', s: 'Aplats, illustrations, captures', icon: I.pen },
  ];
  const FORMATS: { v: Format; t: string; s: string }[] = [
    { v: 'auto', t: 'Identique', s: 'Même format que l’original' },
    { v: 'jpeg', t: 'JPG', s: 'Léger, pour les photos' },
    { v: 'png', t: 'PNG', s: 'Sans perte, transparence' },
    { v: 'webp', t: 'WebP', s: 'Moderne et léger' },
  ];
  const DPIS = [
    { v: 300, t: '300 dpi', s: 'Tirage photo, vu de près' },
    { v: 200, t: '200 dpi', s: 'Bon compromis' },
    { v: 150, t: '150 dpi', s: 'Affiche vue de loin' },
  ];
  const AUTO = { threshold: 1000, small: 4, large: 2 };
  const ui = { allowSame: !!preset.allowSame, writeDpi: !!preset.writeDpi, bgToggle: !!preset.bgToggle, jpegQuality: preset.jpegQuality ?? 92 };

  let step = $state<Step>('import');
  let settings = $state({
    kind: (preset.kind ?? 'photo') as Kind,
    mode: (preset.mode ?? 'x') as ScaleMode,
    scale: preset.scale ?? 2,
    side: preset.side ?? 1920,
    sideCustom: false,
    print: preset.print ?? 'A4',
    dpi: preset.dpi ?? 300,
    format: (preset.format ?? 'auto') as Format,
    quality: 'standard' as Quality,
  });
  let scaleTouched = preset.scale !== undefined;
  let items = $state<Item[]>([]);
  let selectedKey = $state<string | null>(null);
  let caps = $state<Caps | null>(null);
  let busy = $state(false);
  let dragOver = $state(false);
  let maxPixels = $state(64e6);
  let needsDownload = $state(true);
  let announce = $state('');
  let cancelRequested = false;

  const stepIndex = $derived(STEPS.findIndex((s) => s.id === step));
  const valid = $derived(items.filter((i) => !i.fatal));
  const first = $derived(valid[0] ?? null);
  const maxSide = $derived(valid.reduce((m, i) => Math.max(m, i.w, i.h), 0));
  const recScale = $derived(ui.allowSame ? 2 : maxSide > 0 && maxSide <= AUTO.threshold ? 4 : 2);
  const factors = $derived(ui.allowSame ? [1, 2, 3, 4] : [2, 3, 4]);
  const modelId = $derived(pickModel(settings.kind, settings.quality));
  const modelSizes = assets.models as Record<string, { bytes: number }>;
  const runtimeBytes = $derived((caps && !caps.webgpu ? assets.ort.wasm.gzBytes : assets.ort.webgpu.gzBytes) as number);
  const firstRunBytes = $derived(runtimeBytes + (modelSizes[modelId]?.bytes ?? 0));
  const maxBytes = $derived(modelSizes[pickModel(settings.kind, 'max')]?.bytes ?? 0);
  const doneItems = $derived(items.filter((i) => i.status === 'fini' && i.result));
  const failed = $derived(items.filter((i) => i.status === 'erreur' && !i.fatal));
  const running = $derived(items.filter((i) => i.status === 'calcul' || i.status === 'attente' || i.status === 'fini' || (i.status === 'erreur' && !i.fatal)));
  const sel = $derived(doneItems.find((i) => i.key === selectedKey) ?? doneItems[0] ?? null);
  const currentIndex = $derived(Math.max(0, running.findIndex((i) => i.status === 'calcul')));

  function targetFor(it: Item, over: { mode?: ScaleMode; scale?: number; side?: number } = {}): Target {
    return computeTarget(it.w, it.h, {
      mode: over.mode ?? settings.mode, scale: over.scale ?? settings.scale, side: over.side ?? settings.side,
      print: settings.print, dpi: settings.dpi, auto: AUTO,
    }, maxPixels);
  }
  const dims = (w: number, h: number) => fmtInt(w) + ' × ' + fmtInt(h) + ' px';

  function outMime(it: Item): OutputMime {
    if (settings.format === 'png') return 'image/png';
    if (settings.format === 'jpeg') return 'image/jpeg';
    if (settings.format === 'webp') return 'image/webp';
    if (it.file.type === 'image/jpeg') return 'image/jpeg';
    if (it.file.type === 'image/webp') return 'image/webp';
    return 'image/png';
  }
  const extOf = (m: string) => (m === 'image/jpeg' ? 'jpg' : m === 'image/webp' ? 'webp' : 'png');
  const labelOf = (m: string) => (m === 'image/jpeg' ? 'JPG' : m === 'image/webp' ? 'WebP' : 'PNG');
  function outName(it: Item, w: number, h: number, mime: string): string {
    const base = it.name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'image';
    return base + '-agrandie-' + w + 'x' + h + '.' + extOf(mime);
  }

  function statusText(it: Item): string {
    if (it.status === 'attente') return 'En attente';
    if (it.status === 'erreur') return it.error ?? 'Erreur';
    if (it.status === 'fini' && it.result) return 'Terminée · ' + labelOf(it.result.mime) + ', ' + fmtBytes(it.result.blob.size);
    const pct = it.total ? Math.round((it.done / it.total) * 100) : 0;
    switch (it.stage) {
      case 'runtime': return 'Chargement de l’outil… ' + pct + '\u00a0%';
      case 'model': return 'Téléchargement de l’IA… ' + pct + '\u00a0%';
      case 'prepare': return 'Préparation…';
      case 'tiles': return 'Agrandissement… ' + pct + '\u00a0%' + (it.eta !== undefined && it.done > 0 ? ' · encore ' + fmtDuration(it.eta) : '');
      case 'encode': return 'Finalisation…';
      default: return 'Démarrage…';
    }
  }
  const progressOf = (it: Item) => (it.status === 'fini' ? 1 : it.status === 'calcul' && it.total ? it.done / it.total : 0);

  async function addFiles(list: FileList | File[] | null | undefined) {
    if (!list || busy) return;
    const files = [...list].filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|bmp|heic|heif)$/i.test(f.name));
    if (!files.length) { announce = 'Aucune image reconnue.'; return; }
    if (step === 'resultats') clearAll();
    const room = MAX_FILES - items.length;
    if (files.length > room) announce = 'Maximum ' + MAX_FILES + ' images à la fois : les suivantes sont ignorées.';
    for (const file of files.slice(0, Math.max(0, room))) {
      const key = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Math.random()).slice(2);
      const url = URL.createObjectURL(file);
      let w = 0, h = 0;
      let error: string | undefined;
      try {
        const bmp = await createImageBitmap(file);
        w = bmp.width; h = bmp.height;
        bmp.close();
      } catch {
        error = /\.hei[cf]$/i.test(file.name) || /heic|heif/.test(file.type)
          ? 'Format HEIC : ouvrez la page dans Safari ou convertissez en JPG.'
          : 'Fichier illisible.';
      }
      if (!error && w * h > maxPixels) error = 'Image déjà trop grande pour cet appareil.';
      items.push({ key, file, name: file.name, url, w, h, status: error ? 'erreur' : 'pret', fatal: !!error, done: 0, total: 0, error });
    }
    step = 'import';
  }

  async function trySample() {
    try {
      const blob = await (await fetch(sample)).blob();
      await addFiles([new File([blob], sampleName, { type: blob.type || 'image/jpeg' })]);
      toOptions();
    } catch {
      announce = 'Impossible de charger l’image d’exemple.';
    }
  }

  async function checkCache() {
    try {
      const cache = await caches.open('agrandir-image-assets-v1');
      const m = (assets.models as Record<string, { parts: string[] }>)[modelId];
      const rt = (caps && !caps.webgpu ? assets.ort.wasm : assets.ort.webgpu).wasmGz;
      needsDownload = !(m && (await cache.match(m.parts[0])) && (await cache.match(rt)));
    } catch { needsDownload = true; }
  }

  function toOptions() {
    if (!valid.length) return;
    if (!scaleTouched) settings.scale = recScale;
    step = 'options';
    checkCache();
  }
  function pickScale(s: number) { settings.scale = s; scaleTouched = true; }

  async function runOne(client: UpscaleClient, it: Item) {
    const t = targetFor(it);
    const mime = outMime(it);
    it.status = 'calcul';
    it.stage = undefined; it.done = 0; it.total = 0; it.tileStart = undefined; it.eta = undefined; it.notice = undefined; it.error = undefined;
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(it.file); } catch { it.status = 'erreur'; it.error = 'Fichier illisible.'; it.fatal = true; return; }
    const job = client.upscale(
      { modelId, targetW: t.w, targetH: t.h, mime, quality: ui.jpegQuality / 100, engine: 'auto', dpi: ui.writeDpi && settings.mode === 'print' ? settings.dpi : undefined },
      bitmap,
      (p) => {
        it.stage = p.stage; it.done = p.done; it.total = p.total;
        if (p.stage === 'tiles') {
          if (p.done === 0 || it.tileStart === undefined) it.tileStart = performance.now();
          else it.eta = ((performance.now() - it.tileStart) / p.done) * (p.total - p.done);
        }
      },
      (msg) => { it.notice = msg; },
    );
    it.jobId = job.id;
    try {
      const r = await job.promise;
      if (it.result) URL.revokeObjectURL(it.result.url);
      it.result = { url: URL.createObjectURL(r.blob), blob: r.blob, w: r.width, h: r.height, ms: r.ms, backend: r.backend, mime: r.mime, name: outName(it, r.width, r.height, r.mime), scale: r.width / it.w };
      it.status = 'fini';
    } catch (e) {
      const err = e as Error & { cancelled?: boolean };
      if (err.cancelled) it.status = 'pret';
      else { it.status = 'erreur'; it.error = err.message || 'Erreur inconnue.'; }
    } finally {
      it.jobId = undefined;
    }
  }

  async function launch() {
    if (busy) return;
    const todo = items.filter((i) => !i.fatal);
    if (!todo.length) return;
    for (const it of todo) { it.status = 'attente'; it.done = 0; it.total = 0; }
    step = 'traitement';
    busy = true;
    cancelRequested = false;
    const client = getClient();
    for (const it of todo) {
      if (cancelRequested || !items.includes(it)) { if (it.status === 'attente') it.status = 'pret'; continue; }
      await runOne(client, it);
    }
    busy = false;
    if (cancelRequested) { step = 'options'; announce = 'Traitement annulé.'; return; }
    selectedKey = items.find((i) => i.status === 'fini')?.key ?? null;
    step = 'resultats';
    const n = items.filter((i) => i.status === 'fini').length;
    announce = n + (n > 1 ? ' images agrandies.' : ' image agrandie.');
  }

  async function retry(it: Item) {
    if (busy) return;
    busy = true;
    await runOne(getClient(), it);
    busy = false;
    if (it.status === 'fini') selectedKey = it.key;
  }

  function cancelAll() {
    cancelRequested = true;
    const client = getClient();
    for (const it of items) {
      if (it.jobId !== undefined) client.cancel(it.jobId);
      if (it.status === 'attente') it.status = 'pret';
    }
  }

  function remove(it: Item) {
    if (busy) return;
    URL.revokeObjectURL(it.url);
    if (it.result) URL.revokeObjectURL(it.result.url);
    const idx = items.indexOf(it);
    if (idx >= 0) items.splice(idx, 1);
    if (!items.length) step = 'import';
  }

  function clearAll() {
    for (const it of [...items]) {
      URL.revokeObjectURL(it.url);
      if (it.result) URL.revokeObjectURL(it.result.url);
    }
    items.splice(0, items.length);
    selectedKey = null;
    step = 'import';
  }

  async function downloadZip() {
    const { zipSync } = await import('fflate');
    const files: Record<string, Uint8Array> = {};
    for (const it of doneItems) {
      let n = it.result!.name;
      let k = 2;
      while (files[n]) n = it.result!.name.replace(/(\.\w+)$/, '-' + k++ + '$1');
      files[n] = new Uint8Array(await it.result!.blob.arrayBuffer());
    }
    const url = URL.createObjectURL(new Blob([zipSync(files, { level: 0 }) as BlobPart], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images-agrandies.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    addFiles(e.dataTransfer?.files);
  }
  function onDragOver(e: DragEvent) {
    if (busy || !e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    dragOver = true;
  }

  onMount(() => {
    maxPixels = maxOutputPixels();
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 300));
    idle(() => getClient().caps().then((c) => (caps = c)));
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });
</script>

<div class="tool" class:is-over={dragOver} ondragover={onDragOver} ondragleave={() => (dragOver = false)} ondrop={onDrop} role="region" aria-label="Outil d’agrandissement d’image">
  <ol class="steps" aria-label="Étapes">
    {#each STEPS as s, i (s.id)}
      <li class="steps__item" class:is-done={i < stepIndex} class:is-current={i === stepIndex} class:is-spin={i === stepIndex && s.id === 'traitement'} aria-current={i === stepIndex ? 'step' : undefined}>
        <span class="steps__dot">{@html i < stepIndex ? I.check : s.icon}</span>
        <span class="steps__label">{s.label}</span>
      </li>
    {/each}
  </ol>

  {#if step === 'import'}
    {#if items.length === 0}
      <label class="drop">
        <input class="sr-only" type="file" accept={ACCEPT} multiple onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ''; }} />
        <span class="drop__ico">{@html I.upload}</span>
        <span class="drop__t">Glissez vos images ici</span>
        <span class="drop__s">ou cliquez pour parcourir</span>
        <span class="drop__f">{@html I.image} JPG, PNG, WebP, AVIF · Plusieurs fichiers</span>
      </label>
      <p class="sample">Pas d’image sous la main ? <button type="button" class="link" onclick={trySample}>Essayer avec une image d’exemple</button></p>
      {#if features.length}
        <div class="features">
          <p class="features__t">Ce que fait cet outil :</p>
          <ul>{#each features as f (f)}<li>{f}</li>{/each}</ul>
          <p class="features__n">100 % local : vos images restent sur votre appareil</p>
        </div>
      {/if}
    {:else}
      <div class="picked">
        <div class="bar">
          <p class="bar__t">{items.length} {items.length > 1 ? 'images sélectionnées' : 'image sélectionnée'}</p>
          {#if items.length < MAX_FILES}
            <label class="link add">
              <input class="sr-only" type="file" accept={ACCEPT} multiple onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ''; }} />
              + Ajouter
            </label>
          {/if}
        </div>
        <ul class="thumbs">
          {#each items as it (it.key)}
            <li class="thumb" class:is-bad={it.fatal}>
              {#if it.w}<img src={it.url} alt="" />{:else}<span class="thumb__ph">{@html I.image}</span>{/if}
              <button type="button" class="thumb__x" onclick={() => remove(it)} aria-label={'Retirer ' + it.name}>{@html I.x}</button>
              <span class="thumb__cap">{it.fatal ? it.error : dims(it.w, it.h)}</span>
            </li>
          {/each}
        </ul>
        <div class="actions">
          <button type="button" class="btn btn-primary btn-lg" disabled={!valid.length} onclick={toOptions}>Continuer {@html I.right}</button>
        </div>
      </div>
    {/if}
  {:else if step === 'options'}
    <form class="opts" onsubmit={(e) => { e.preventDefault(); launch(); }}>
      {#if settings.mode === 'x'}
        <fieldset class="group">
          <legend>Agrandissement</legend>
          <div class="cards cards--{factors.length}">
            {#each factors as f (f)}
              {@const t = first ? targetFor(first, { scale: f }) : null}
              <label class="opt opt--big" class:is-on={settings.scale === f}>
                <input class="sr-only" type="radio" name="scale" value={f} checked={settings.scale === f} onchange={() => pickScale(f)} />
                {#if f === recScale}<span class="opt__badge">Recommandé</span>{/if}
                <span class="opt__t">{f === 1 ? 'Même taille' : '×' + f}</span>
                <span class="opt__s num">{f === 1 ? 'Plus nette' : t && valid.length === 1 ? dims(t.w, t.h) : f + ' fois plus grande'}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      {:else if settings.mode === 'side'}
        <fieldset class="group">
          <legend>Taille voulue</legend>
          <div class="cards cards--4">
            {#each SIDE_PRESETS as s (s.v)}
              <label class="opt" class:is-on={!settings.sideCustom && settings.side === s.v}>
                <input class="sr-only" type="radio" name="side" value={s.v} checked={!settings.sideCustom && settings.side === s.v} onchange={() => { settings.sideCustom = false; settings.side = s.v; }} />
                <span class="opt__ico">{@html I.monitor}</span>
                <span class="opt__t">{s.label}</span>
                <span class="opt__s num">{fmtInt(s.v)} px</span>
              </label>
            {/each}
            <label class="opt" class:is-on={settings.sideCustom}>
              <input class="sr-only" type="radio" name="side" value="autre" checked={settings.sideCustom} onchange={() => (settings.sideCustom = true)} />
              <span class="opt__ico">{@html I.sliders}</span>
              <span class="opt__t">Autre</span>
              <span class="opt__s">Votre taille</span>
            </label>
          </div>
          {#if settings.sideCustom}
            <label class="inline">Plus grand côté <input class="input num" type="number" min="16" max="16000" step="1" bind:value={settings.side} /> px</label>
          {/if}
        </fieldset>
      {:else}
        <fieldset class="group">
          <legend>Format d’impression</legend>
          <select class="input" bind:value={settings.print} aria-label="Format d’impression">
            {#each PRINT_FORMATS as f (f.id)}<option value={f.id}>{f.label}</option>{/each}
          </select>
        </fieldset>
        <fieldset class="group">
          <legend>Qualité d’impression</legend>
          <div class="cards cards--3">
            {#each DPIS as d (d.v)}
              <label class="opt" class:is-on={settings.dpi === d.v}>
                <input class="sr-only" type="radio" name="dpi" value={d.v} bind:group={settings.dpi} />
                {#if d.v === 300}<span class="opt__badge">Recommandé</span>{/if}
                <span class="opt__t">{d.t}</span>
                <span class="opt__s">{d.s}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      {#if first}
        {@const t = targetFor(first)}
        {#if settings.mode === 'print'}
          <p class="info" class:info--warn={t.capped === 'max4'}>
            {#if t.capped === 'max4'}Agrandie au maximum (×4), {valid.length > 1 ? 'la première image' : 'votre image'} atteint {t.dpi}&nbsp;dpi sur ce format. Choisissez un format plus petit pour plus de finesse.
            {:else}Résultat : {dims(t.w, t.h)}, soit {t.dpi}&nbsp;dpi sur ce format{valid.length > 1 ? ' (première image)' : ''}.{/if}
          </p>
        {:else if settings.mode === 'side' && (t.needed ?? 1) < 1}
          <p class="info">L’image dépasse déjà cette taille : elle sera seulement rendue plus nette.</p>
        {:else if settings.mode === 'side' && t.capped === 'max4'}
          <p class="info info--warn">Agrandissement limité à ×4 : {dims(t.w, t.h)}.</p>
        {:else if t.capped === 'pixels'}
          <p class="info info--warn">Limité à {fmtScale(t.scale)} pour ménager la mémoire de cet appareil.</p>
        {/if}
      {/if}

      <fieldset class="group">
        <legend>Type d’image</legend>
        <div class="cards cards--3 cards--stack">
          {#each KINDS as k (k.v)}
            <label class="opt" class:is-on={settings.kind === k.v}>
              <input class="sr-only" type="radio" name="kind" value={k.v} bind:group={settings.kind} onchange={checkCache} />
              <span class="opt__ico">{@html k.icon}</span>
              <span class="opt__t">{k.t}</span>
              <span class="opt__s">{k.s}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <fieldset class="group">
        <legend>Format de sortie</legend>
        <div class="cards cards--4">
          {#each FORMATS as f (f.v)}
            <label class="opt" class:is-on={settings.format === f.v}>
              <input class="sr-only" type="radio" name="format" value={f.v} bind:group={settings.format} />
              {#if f.v === (preset.format ?? 'auto')}<span class="opt__badge">Recommandé</span>{/if}
              <span class="opt__t">{f.t}</span>
              <span class="opt__s">{f.s}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <fieldset class="group">
        <legend>Qualité</legend>
        <div class="cards cards--2">
          <label class="opt" class:is-on={settings.quality === 'standard'}>
            <input class="sr-only" type="radio" name="quality" value="standard" bind:group={settings.quality} onchange={checkCache} />
            <span class="opt__badge">Recommandé</span>
            <span class="opt__ico">{@html I.zap}</span>
            <span class="opt__t">Standard</span>
            <span class="opt__s">Rapide</span>
          </label>
          <label class="opt" class:is-on={settings.quality === 'max'}>
            <input class="sr-only" type="radio" name="quality" value="max" bind:group={settings.quality} onchange={checkCache} />
            <span class="opt__ico">{@html I.sparkles}</span>
            <span class="opt__t">Maximale</span>
            <span class="opt__s">Plus de détails, plus lent ({fmtBytes(maxBytes)})</span>
          </label>
        </div>
      </fieldset>

      <div class="actions">
        <button type="button" class="btn btn-outline btn-lg" onclick={() => (step = 'import')}>{@html I.left} Retour</button>
        <button type="submit" class="btn btn-primary btn-lg">Agrandir {valid.length > 1 ? valid.length + ' images' : '1 image'} {@html I.right}</button>
      </div>
      {#if needsDownload || (caps && !caps.webgpu)}
        <p class="hint">
          {#if needsDownload}Premier lancement : l’IA ({fmtBytes(firstRunBytes)}) est téléchargée une seule fois.{/if}
          {#if caps && !caps.webgpu} Votre navigateur n’utilise pas la carte graphique : le traitement sera plus lent.{/if}
        </p>
      {/if}
    </form>
  {:else if step === 'traitement'}
    <div class="proc">
      <p class="proc__t">Agrandissement en cours…</p>
      <p class="proc__s">{running.length > 1 ? 'Image ' + (currentIndex + 1) + ' sur ' + running.length + ' · ' : ''}Gardez cette page ouverte.</p>
      <ul class="rows">
        {#each running as it (it.key)}
          <li class="row">
            <img src={it.url} alt="" />
            <div class="row__body">
              <p class="row__name">{it.name}</p>
              <p class="row__st" class:is-err={it.status === 'erreur'}>{statusText(it)}</p>
              <span class="prog"><span class="prog__fill" style:transform="scaleX({progressOf(it)})"></span></span>
              {#if it.notice}<p class="row__note">{it.notice}</p>{/if}
            </div>
            {#if it.status === 'fini'}<span class="row__ok">{@html I.check}</span>{/if}
          </li>
        {/each}
      </ul>
      <div class="actions"><button type="button" class="btn btn-outline" onclick={cancelAll}>Annuler</button></div>
    </div>
  {:else}
    <div class="res">
      <div class="res__head">
        <div class="res__title">
          <span class="res__ok">{@html I.circleCheck}</span>
          <div>
            <p class="res__t">{doneItems.length} {doneItems.length > 1 ? 'images agrandies' : 'image agrandie'}{failed.length ? ', ' + failed.length + ' échec' + (failed.length > 1 ? 's' : '') : ''}</p>
            {#if sel?.result}<p class="res__s num">{dims(sel.w, sel.h)} → {dims(sel.result.w, sel.result.h)}</p>{/if}
          </div>
        </div>
        <div class="res__btns">
          <button type="button" class="btn btn-outline" onclick={() => (step = 'options')} disabled={busy}>{@html I.sliders} Modifier les réglages</button>
          <button type="button" class="btn btn-outline" onclick={clearAll} disabled={busy}>{@html I.refresh} Nouveau</button>
        </div>
      </div>

      {#if sel?.result}
        {#key sel.result.url}
          <Compare before={sel.url} after={sel.result.url} width={sel.result.w} height={sel.result.h}
            beforeLabel="Original" afterLabel={'Agrandie ' + fmtScale(sel.result.scale)} alt={sel.name} zoomable eager maxHeight="68vh" bgToggle={ui.bgToggle} />
        {/key}
      {/if}

      {#if doneItems.length === 1 && !failed.length && sel?.result}
        <div class="one">
          <p class="one__info num">{sel.result.name} · {fmtBytes(sel.result.blob.size)}</p>
          <a class="btn btn-primary btn-lg" href={sel.result.url} download={sel.result.name}>{@html I.download} Télécharger</a>
        </div>
      {:else}
        <ul class="grid">
          {#each items.filter((i) => !i.fatal) as it (it.key)}
            <li class="card" class:is-sel={sel?.key === it.key}>
              {#if it.result}
                <button type="button" class="card__img" onclick={() => (selectedKey = it.key)} aria-label={'Comparer ' + it.name}>
                  <img src={it.result.url} alt="" />
                  <span class="card__badge">{fmtScale(it.result.scale)}</span>
                  <span class="card__over num">{dims(it.result.w, it.result.h)}<br />{labelOf(it.result.mime)} · {fmtBytes(it.result.blob.size)}</span>
                </button>
                <a class="btn btn-primary card__dl" href={it.result.url} download={it.result.name}>{@html I.download} Télécharger</a>
              {:else}
                <div class="card__img card__img--err"><img src={it.url} alt="" /></div>
                <p class="card__err">{it.status === 'calcul' ? statusText(it) : it.error ?? 'Échec'}</p>
                <button type="button" class="btn btn-outline card__dl" onclick={() => retry(it)} disabled={busy}>{@html I.refresh} Réessayer</button>
              {/if}
            </li>
          {/each}
        </ul>
        {#if doneItems.length > 1}
          <div class="actions"><button type="button" class="btn btn-outline btn-lg" onclick={downloadZip}>{@html I.download} Tout télécharger (.zip)</button></div>
        {/if}
      {/if}

      {#if cta}<p class="cta">{cta.text} <a href={cta.href} rel="noopener">{cta.label}</a></p>{/if}
    </div>
  {/if}
  <p class="sr-only" aria-live="polite">{announce}</p>
</div>

<style>
  .tool { width: 100%; max-width: 768px; margin: 0 auto; }
  .tool :global(svg) { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  /* Étapes */
  .steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: 460px; margin: 0 auto 28px; padding: 0; list-style: none; }
  .steps__item { position: relative; display: grid; justify-items: center; gap: 7px; }
  .steps__item + .steps__item::before { content: ''; position: absolute; top: 15px; left: calc(-50% + 22px); right: calc(50% + 22px); height: 2px; border-radius: 2px; background: var(--border); }
  .steps__item.is-done::before, .steps__item.is-current::before { background: var(--primary); }
  .steps__dot { position: relative; z-index: 1; display: grid; place-items: center; width: 32px; height: 32px; border: 1.5px solid var(--border-2); border-radius: 50%; background: var(--card); color: var(--muted); }
  .steps__dot :global(svg) { width: 15px; height: 15px; }
  .steps__item.is-current .steps__dot { border: 2px solid var(--primary); background: var(--primary-50); color: var(--primary); box-shadow: 0 0 0 3px var(--primary-100); }
  .steps__item.is-done .steps__dot { border-color: var(--primary); background: var(--primary); color: #fff; }
  .steps__item.is-spin .steps__dot :global(svg) { animation: spin 1s linear infinite; }
  .steps__label { font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
  .steps__item.is-current .steps__label { color: var(--primary); font-weight: 600; }
  .steps__item.is-done .steps__label { color: var(--ink-2); }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Import */
  .drop {
    display: grid; justify-items: center; gap: 4px; padding: 44px 24px;
    border: 2px dashed var(--border-2); border-radius: var(--radius-xl);
    text-align: center; cursor: pointer; transition: border-color .15s, background-color .15s;
  }
  .drop:hover, .tool.is-over .drop { border-color: var(--primary); background: var(--primary-50); }
  .drop:focus-within { outline: 2px solid var(--primary); outline-offset: 3px; }
  .drop__ico { display: grid; place-items: center; width: 52px; height: 52px; margin-bottom: 10px; border-radius: 50%; background: var(--primary-100); color: var(--primary); }
  .drop__ico :global(svg) { width: 22px; height: 22px; }
  .drop__t { font-size: 18px; color: var(--ink); }
  .drop__s { color: var(--muted); }
  .drop__f { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; color: var(--muted); font-size: 13px; }
  .drop__f :global(svg) { width: 14px; height: 14px; }
  .sample { margin-top: 12px; text-align: center; color: var(--muted); font-size: 14px; }
  .features { margin-top: 16px; padding: 20px 24px; border-radius: var(--radius-lg); background: var(--subtle); text-align: center; }
  .features__t { color: var(--ink); font-weight: 500; }
  .features ul { display: inline-grid; gap: 4px; margin: 10px 0 0; padding: 0; list-style: none; text-align: left; color: var(--muted); font-size: 14px; }
  .features li { position: relative; padding-left: 16px; }
  .features li::before { content: ''; position: absolute; left: 0; top: .6em; width: 6px; height: 6px; border-radius: 50%; background: var(--primary); }
  .features__n { margin-top: 12px; color: var(--primary); font-size: 14px; font-weight: 500; }

  .picked { display: grid; gap: 16px; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .bar__t { font-size: 16px; color: var(--ink); }
  .add { cursor: pointer; }
  .add:focus-within { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 4px; }
  .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; }
  .thumb { position: relative; display: grid; gap: 6px; }
  .thumb img, .thumb__ph { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-lg); background: var(--subtle-2); }
  .thumb__ph { display: grid; place-items: center; color: var(--faint); }
  .thumb__ph :global(svg) { width: 28px; height: 28px; }
  .thumb.is-bad img, .thumb.is-bad .thumb__ph { opacity: .45; outline: 2px solid var(--danger); outline-offset: -2px; }
  .thumb__cap { color: var(--muted); font-size: 12px; text-align: center; line-height: 1.3; overflow-wrap: anywhere; }
  .thumb.is-bad .thumb__cap { color: var(--danger); }
  .thumb__x { position: absolute; top: 6px; right: 6px; display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: rgb(255 255 255 / .92); color: var(--ink-2); box-shadow: var(--shadow-sm); cursor: pointer; }
  .thumb__x:hover { color: var(--danger); }
  .thumb__x :global(svg) { width: 14px; height: 14px; }

  /* Options */
  .opts { display: grid; gap: 22px; max-width: 580px; margin: 0 auto; }
  .group { min-width: 0; margin: 0; padding: 0; border: 0; display: grid; gap: 10px; }
  .group legend { padding: 0; margin-bottom: 10px; color: var(--ink); font-size: 15px; font-weight: 500; }
  .cards { display: grid; gap: 10px; }
  .cards--1 { grid-template-columns: 1fr; }
  .cards--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cards--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cards--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 560px) {
    .cards--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cards--stack { grid-template-columns: 1fr; }
  }
  .opt {
    position: relative; display: grid; justify-items: center; align-content: center; gap: 3px;
    min-height: 76px; padding: 14px 10px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-lg);
    background: var(--card); text-align: center; cursor: pointer; transition: border-color .15s, background-color .15s;
  }
  .opt:hover { border-color: var(--border-2); }
  .opt:has(.opt__badge) { padding-top: 20px; }
  .opt.is-on { border-color: var(--primary); background: var(--primary-50); }
  .opt:has(input:focus-visible) { outline: 2px solid var(--primary); outline-offset: 2px; }
  .opt__badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); padding: 2px 8px; border-radius: 999px; background: var(--primary); color: #fff; font-size: 11px; font-weight: 600; line-height: 16px; white-space: nowrap; }
  .opt__ico { display: grid; place-items: center; width: 32px; height: 32px; margin-bottom: 3px; border-radius: 8px; background: var(--subtle-2); color: var(--ink-2); }
  .opt__ico :global(svg) { width: 16px; height: 16px; }
  .opt.is-on .opt__ico { background: var(--primary); color: #fff; }
  .opt__t { color: var(--ink); font-size: 15px; font-weight: 600; line-height: 1.3; }
  .opt--big .opt__t { font-size: 20px; }
  .opt__s { color: var(--muted); font-size: 12.5px; line-height: 1.35; }
  .input { width: 100%; min-height: 44px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: var(--radius-lg); background: var(--card); color: var(--ink); font-size: 15px; }
  .input:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
  .inline { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--muted); font-size: 14px; }
  .inline .input { width: 110px; min-height: 38px; text-align: center; }
  .info { padding: 10px 14px; border-radius: var(--radius); background: var(--subtle); color: var(--ink-2); font-size: 14px; text-align: center; }
  .info--warn { background: #fffbeb; color: #92400e; }
  .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
  .hint { color: var(--muted); font-size: 13px; text-align: center; }

  /* Traitement */
  .proc { display: grid; gap: 14px; max-width: 580px; margin: 0 auto; }
  .proc__t { font-size: 18px; font-weight: 600; text-align: center; }
  .proc__s { margin-top: -8px; color: var(--muted); font-size: 14px; text-align: center; }
  .rows { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
  .row { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
  .row img { width: 52px; height: 52px; object-fit: cover; border-radius: var(--radius); }
  .row__body { display: grid; gap: 4px; min-width: 0; }
  .row__name { overflow: hidden; color: var(--ink); font-size: 14px; white-space: nowrap; text-overflow: ellipsis; }
  .row__st { color: var(--muted); font-size: 13px; }
  .row__st.is-err { color: var(--danger); }
  .row__note { color: #92400e; font-size: 12px; }
  .row__ok { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--success-50); color: var(--success); }
  .row__ok :global(svg) { width: 15px; height: 15px; }
  .prog { display: block; height: 4px; overflow: hidden; border-radius: 4px; background: var(--subtle-2); }
  .prog__fill { display: block; height: 100%; background: var(--primary); transform-origin: 0 50%; transition: transform .2s linear; }

  /* Résultats */
  .res { display: grid; gap: 18px; }
  .res__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .res__title { display: flex; align-items: center; gap: 12px; }
  .res__ok { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 50%; background: var(--success-50); color: var(--success); }
  .res__ok :global(svg) { width: 20px; height: 20px; }
  .res__t { color: var(--ink); font-size: 18px; font-weight: 600; }
  .res__s { color: var(--muted); font-size: 14px; }
  .res__btns { display: flex; flex-wrap: wrap; gap: 8px; }
  .one { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .one__info { min-width: 0; color: var(--muted); font-size: 14px; overflow-wrap: anywhere; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; }
  .card { display: grid; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
  .card.is-sel { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary); }
  .card__img { position: relative; display: block; width: 100%; padding: 0; overflow: hidden; border: 0; border-radius: var(--radius); background: var(--subtle-2); cursor: pointer; aspect-ratio: 4 / 3; }
  .card__img img { width: 100%; height: 100%; object-fit: cover; }
  .card__img--err { cursor: default; }
  .card__img--err img { opacity: .5; }
  .card__badge { position: absolute; top: 8px; right: 8px; padding: 2px 8px; border-radius: 999px; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; }
  .card__over { position: absolute; inset: auto 0 0 0; padding: 22px 10px 8px; background: linear-gradient(to top, rgb(15 23 42 / .72), transparent); color: #fff; font-size: 12px; line-height: 1.35; text-align: left; }
  .card__dl { width: 100%; }
  .card__err { color: var(--danger); font-size: 13px; }
  .cta { color: var(--muted); font-size: 14px; text-align: center; }
  .cta a { color: var(--primary); font-weight: 500; text-underline-offset: 3px; }

  @media (max-width: 560px) {
    .steps { margin-bottom: 20px; }
    .steps__label { font-size: 10px; }
    .drop { padding: 32px 16px; }
    .res__btns { width: 100%; }
    .res__btns .btn { flex: 1 1 auto; padding: 0 12px; font-size: 14px; }
    .opt--big .opt__s { font-size: 11.5px; white-space: nowrap; }
    .opt { padding-inline: 6px; }
    .one .btn { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .steps__item.is-spin .steps__dot :global(svg) { animation: none; }
  }
</style>
