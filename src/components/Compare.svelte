<script lang="ts">
  // Comparateur avant / après : curseur glissable, zoom (boutons, Ctrl + molette, pincement, double-clic) et déplacement.
  // Sans JavaScript, le rendu serveur affiche déjà les deux images coupées à 50 %.
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    before: string;
    after: string;
    width: number;
    height: number;
    beforeLabel?: string;
    afterLabel?: string;
    alt?: string;
    zoomable?: boolean;
    eager?: boolean;
    maxHeight?: string;
    bgToggle?: boolean;
    children?: Snippet;
  }
  let {
    before, after, width, height,
    beforeLabel = 'Avant', afterLabel = 'Après', alt = '',
    zoomable = false, eager = false, maxHeight = '72vh', bgToggle = false, children,
  }: Props = $props();
  let bg = $state<'sombre' | 'clair' | 'damier'>(bgToggle ? 'damier' : 'sombre');

  let box: HTMLDivElement | undefined = $state();
  let pos = $state(50);
  let boxW = $state(0);
  let boxH = $state(0);
  let zoom = $state(0); // 0 = ajusté au cadre, sinon échelle (1 = 100 %)
  let tx = $state(0);
  let ty = $state(0);

  const fit = $derived(boxW > 0 ? boxW / width : 1);
  const scale = $derived(zoom === 0 ? fit : zoom);
  const transform = $derived('translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')');
  // Ajusté : dimensions en % (correct dès le rendu serveur, sans JS) ; zoomé : pixels + transformation.
  const imgStyle = $derived(zoom === 0 ? 'width:100%;height:100%;transform:none' : 'width:' + width + 'px;height:' + height + 'px;transform:' + transform);
  const zoomLabel = $derived(Math.round(scale * 100) + ' %');

  function clampPan() {
    if (zoom === 0) { tx = 0; ty = 0; return; }
    const w = width * scale, h = height * scale;
    tx = w <= boxW ? (boxW - w) / 2 : Math.min(0, Math.max(boxW - w, tx));
    ty = h <= boxH ? (boxH - h) / 2 : Math.min(0, Math.max(boxH - h, ty));
  }

  function setZoom(z: number, cx = boxW / 2, cy = boxH / 2) {
    const s0 = scale;
    const target = z === 0 ? 0 : Math.min(8, Math.max(fit, z));
    const s1 = target === 0 ? fit : target;
    const ix = (cx - tx) / s0, iy = (cy - ty) / s0;
    zoom = target <= fit + 1e-6 ? 0 : target;
    tx = cx - ix * s1;
    ty = cy - iy * s1;
    clampPan();
  }

  function moveSlider(clientX: number) {
    if (!box) return;
    const r = box.getBoundingClientRect();
    pos = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
  }

  type Drag = { kind: 'slider' } | { kind: 'pan'; x: number; y: number; tx: number; ty: number } | null;
  let drag: Drag = null;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch: { d: number; s: number } | null = null;

  const dist = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  function onPointerDown(e: PointerEvent) {
    if (!box || e.button > 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    box.setPointerCapture(e.pointerId);
    if (zoomable && pointers.size === 2) { pinch = { d: dist(), s: scale }; drag = null; return; }
    const onHandle = (e.target as HTMLElement).closest('.cmp__handle');
    if (zoom !== 0 && !onHandle) drag = { kind: 'pan', x: e.clientX, y: e.clientY, tx, ty };
    else { drag = { kind: 'slider' }; moveSlider(e.clientX); }
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2 && box) {
      const r = box.getBoundingClientRect();
      const [a, b] = [...pointers.values()];
      setZoom((pinch.s * dist()) / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      return;
    }
    if (!drag) return;
    if (drag.kind === 'slider') moveSlider(e.clientX);
    else { tx = drag.tx + (e.clientX - drag.x); ty = drag.ty + (e.clientY - drag.y); clampPan(); }
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) drag = null;
  }

  function onDblClick(e: MouseEvent) {
    if (!zoomable || !box) return;
    const r = box.getBoundingClientRect();
    setZoom(zoom === 0 ? 1 : 0, e.clientX - r.left, e.clientY - r.top);
  }

  function onKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') pos = Math.max(0, pos - step);
    else if (e.key === 'ArrowRight') pos = Math.min(100, pos + step);
    else if (e.key === 'Home') pos = 0;
    else if (e.key === 'End') pos = 100;
    else return;
    e.preventDefault();
  }

  onMount(() => {
    if (!box) return;
    const el = box;
    const ro = new ResizeObserver(() => {
      boxW = el.clientWidth;
      boxH = el.clientHeight;
      clampPan();
    });
    ro.observe(el);
    const onWheel = (e: WheelEvent) => {
      if (!zoomable || (zoom === 0 && !e.ctrlKey && !e.metaKey)) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      setZoom(scale * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { ro.disconnect(); el.removeEventListener('wheel', onWheel); };
  });
</script>

<div class="cmp-wrap">
  <div class="cmp-frame" style:width="min(100%, calc({maxHeight} * {width / height}))">
  <div
    class="cmp"
    class:is-zoomed={zoom !== 0}
    class:bg-clair={bg === 'clair'}
    class:bg-damier={bg === 'damier'}
    class:bg-sombre={bg === 'sombre' && bgToggle}
    bind:this={box}
    style:aspect-ratio="{width} / {height}"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    ondblclick={onDblClick}
    role="group"
    aria-label={alt ? 'Comparaison avant / après : ' + alt : 'Comparaison avant / après'}
  >
    <div class="cmp__layer">
      <img class="cmp__img" src={before} alt={alt ? alt + ' (avant)' : ''} width={width} height={height}
        style={imgStyle} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />
    </div>
    <div class="cmp__layer cmp__layer--after" style:clip-path="inset(0 0 0 {pos}%)">
      <img class="cmp__img" src={after} alt={alt ? alt + ' (après)' : ''} width={width} height={height}
        style={imgStyle} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable="false" />
    </div>
    <span class="cmp__tag cmp__tag--before" aria-hidden="true">{beforeLabel}</span>
    <span class="cmp__tag cmp__tag--after" aria-hidden="true">{afterLabel}</span>
    <div class="cmp__handle" style:left="{pos}%" role="slider" tabindex="0"
      aria-label="Position du comparateur" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(pos)}
      aria-valuetext={Math.round(pos) + ' % avant'} onkeydown={onKey}>
      <span class="cmp__knob" aria-hidden="true"></span>
    </div>
  </div>
  {@render children?.()}
  </div>
  {#if zoomable || bgToggle}
    <div class="cmp__tools" role="toolbar" aria-label="Affichage">
      {#if zoomable}
        <button type="button" class="chip" aria-pressed={zoom === 0} onclick={() => setZoom(0)}>Ajuster</button>
        <button type="button" class="chip" aria-pressed={zoom === 1} onclick={() => setZoom(1)}>Zoom 100 %</button>
      {/if}
      {#if bgToggle}
        <span class="cmp__sep" aria-hidden="true"></span>
        <button type="button" class="chip" aria-pressed={bg === 'damier'} onclick={() => (bg = 'damier')}>Damier</button>
        <button type="button" class="chip" aria-pressed={bg === 'clair'} onclick={() => (bg = 'clair')}>Fond clair</button>
        <button type="button" class="chip" aria-pressed={bg === 'sombre'} onclick={() => (bg = 'sombre')}>Fond sombre</button>
      {/if}
      <span class="cmp__hint">Faites glisser le curseur pour comparer</span>
    </div>
  {/if}
</div>

<style>
  .cmp-wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; min-width: 0; width: 100%; }
  .cmp-frame { margin-inline: auto; max-width: 100%; min-width: 0; }
  .cmp {
    position: relative; width: 100%; overflow: hidden;
    border: 1px solid var(--border); border-radius: var(--radius-lg);
    background: var(--subtle-2); touch-action: pan-y; user-select: none; cursor: ew-resize;
  }
  .cmp.is-zoomed { touch-action: none; cursor: grab; }
  .cmp.is-zoomed:active { cursor: grabbing; }
  .cmp.bg-clair { background: #fff; }
  .cmp.bg-damier { background: repeating-conic-gradient(#f1f5f9 0 25%, #dbe1e8 0 50%) 0 0 / 18px 18px; }
  .cmp.bg-sombre { background: #1e293b; }
  .cmp__layer { position: absolute; inset: 0; }
  .cmp__img { position: absolute; left: 0; top: 0; max-width: none; transform-origin: 0 0; will-change: transform; }
  .cmp__tag {
    position: absolute; top: 10px; padding: 3px 8px; border-radius: 6px;
    background: rgb(15 23 42 / .7); color: #fff; font-size: 12px; font-weight: 500; pointer-events: none;
  }
  .cmp__tag--before { left: 10px; }
  .cmp__tag--after { right: 10px; background: var(--primary); }
  .cmp__handle { position: absolute; top: 0; bottom: 0; width: 44px; margin-left: -22px; display: grid; place-items: center; cursor: ew-resize; touch-action: none; }
  .cmp__handle::before { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; background: #fff; box-shadow: 0 0 0 1px rgb(15 23 42 / .15); }
  .cmp__knob { position: relative; width: 36px; height: 36px; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgb(15 23 42 / .25); }
  .cmp__knob::before, .cmp__knob::after { content: ''; position: absolute; top: 50%; width: 0; height: 0; margin-top: -5px; border-block: 5px solid transparent; }
  .cmp__knob::before { left: 8px; border-right: 6px solid var(--primary); }
  .cmp__knob::after { right: 8px; border-left: 6px solid var(--primary); }
  .cmp__handle:focus-visible { outline: none; }
  .cmp__handle:focus-visible .cmp__knob { outline: 2px solid var(--primary); outline-offset: 2px; }
  .cmp__tools { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .chip { min-height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--card); color: var(--ink-2); font-size: 13px; cursor: pointer; }
  .chip:hover { background: var(--subtle); }
  .chip[aria-pressed='true'] { border-color: var(--primary); background: var(--primary-50); color: var(--primary); }
  .cmp__sep { width: 1px; height: 18px; margin: 0 4px; background: var(--border); }
  .cmp__hint { margin-left: auto; color: var(--muted); font-size: 12px; }
  @media (max-width: 560px) { .cmp__hint { display: none; } }
</style>
