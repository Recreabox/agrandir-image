// Calcul de la taille de sortie selon le mode choisi.
export type ScaleMode = 'x' | 'side' | 'print';

export interface PrintFormat { id: string; label: string; mm: [number, number] }

export const PRINT_FORMATS: PrintFormat[] = [
  { id: '10x15', label: '10 × 15 cm', mm: [100, 150] },
  { id: '13x18', label: '13 × 18 cm', mm: [130, 180] },
  { id: 'A5', label: 'A5 · 14,8 × 21 cm', mm: [148, 210] },
  { id: 'A4', label: 'A4 · 21 × 29,7 cm', mm: [210, 297] },
  { id: '30x40', label: '30 × 40 cm', mm: [300, 400] },
  { id: 'A3', label: 'A3 · 29,7 × 42 cm', mm: [297, 420] },
  { id: '40x60', label: '40 × 60 cm', mm: [400, 600] },
  { id: 'A2', label: 'A2 · 42 × 59,4 cm', mm: [420, 594] },
  { id: '50x70', label: '50 × 70 cm', mm: [500, 700] },
  { id: '60x90', label: '60 × 90 cm', mm: [600, 900] },
  { id: 'A1', label: 'A1 · 59,4 × 84,1 cm', mm: [594, 841] },
];

export const SIDE_PRESETS = [
  { v: 1280, label: 'HD' },
  { v: 1920, label: 'Full HD' },
  { v: 3840, label: '4K' },
];

/** scale = 0 : facteur automatique (×small si le plus grand côté <= threshold, sinon ×large). */
export interface AutoRule { threshold: number; small: number; large: number }

export interface SizeSettings { mode: ScaleMode; scale: number; side: number; print: string; dpi: number; auto: AutoRule }

export interface Target {
  w: number;
  h: number;
  scale: number;
  /** max4 : la taille demandée dépasse ×4 ; pixels : plafond mémoire de l'appareil. */
  capped: 'max4' | 'pixels' | null;
  /** Mode tirage : finesse obtenue (pixels par pouce) et facteur qu'il aurait fallu. */
  dpi?: number;
  needed?: number;
}

export const MAX_SCALE = 4;

export function maxOutputPixels(): number {
  if (typeof navigator === 'undefined') return 64e6;
  const uaMobile = (navigator as any).userAgentData?.mobile;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  // Téléphones ET tablettes (Chrome sur tablette Android déclare mobile=false, d'où le test Android).
  const mobile = !!uaMobile || ios || /Android/.test(navigator.userAgent);
  return mobile ? 16e6 : 64e6;
}

export function autoScale(w: number, h: number, rule: AutoRule): number {
  return Math.max(w, h) <= rule.threshold ? rule.small : rule.large;
}

export function computeTarget(w: number, h: number, s: SizeSettings, maxPixels: number): Target {
  let scale: number;
  let needed: number | undefined;
  const fmt = PRINT_FORMATS.find((f) => f.id === s.print) ?? PRINT_FORMATS[3];
  const longIn = Math.max(...fmt.mm) / 25.4;
  const shortIn = Math.min(...fmt.mm) / 25.4;
  if (s.mode === 'x') scale = s.scale === 0 ? autoScale(w, h, s.auto) : s.scale;
  else if (s.mode === 'side') { needed = s.side / Math.max(w, h); scale = needed; }
  else {
    needed = Math.max((longIn * s.dpi) / Math.max(w, h), (shortIn * s.dpi) / Math.min(w, h));
    scale = needed;
  }
  let capped: Target['capped'] = null;
  if (!(scale > 0)) scale = 1;
  if (scale > MAX_SCALE) { scale = MAX_SCALE; capped = 'max4'; }
  if (scale < 1) scale = 1;
  if (w * h * scale * scale > maxPixels) {
    scale = Math.max(1, Math.sqrt(maxPixels / (w * h)));
    capped = 'pixels';
  }
  // Tirage : on arrondit au pixel supérieur pour ne jamais passer sous la finesse visée.
  const r = s.mode === 'print' && !capped ? Math.ceil : Math.round;
  let tw = Math.max(1, r(w * scale - 1e-9));
  let th = Math.max(1, r(h * scale - 1e-9));
  if (s.mode === 'side' && !capped && needed !== undefined && needed >= 1) {
    // taille exacte demandée sur le plus grand côté
    if (w >= h) { tw = s.side; th = Math.max(1, Math.round((h * s.side) / w)); }
    else { th = s.side; tw = Math.max(1, Math.round((w * s.side) / h)); }
  }
  const t: Target = { w: tw, h: th, scale, capped, needed };
  if (s.mode === 'print') t.dpi = Math.round(Math.min(Math.max(tw, th) / longIn, Math.min(tw, th) / shortIn));
  return t;
}

const nf = new Intl.NumberFormat('fr-FR');
export const fmtInt = (n: number) => nf.format(Math.round(n)).replace(/\u202f|\u00a0/g, '\u202f');
export const fmtScale = (s: number) => '×' + (Math.round(s * 10) / 10).toString().replace('.', ',');
export function fmtBytes(n: number): string {
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + '\u00a0Ko';
  return (n / (1024 * 1024)).toFixed(1).replace('.', ',') + '\u00a0Mo';
}
export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return Math.max(1, s) + '\u00a0s';
  return Math.floor(s / 60) + '\u00a0min\u00a0' + String(s % 60).padStart(2, '0') + '\u00a0s';
}
