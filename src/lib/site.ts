// Données partagées du site : navigation, Coelus, liens suivis.
export const SITE = {
  name: 'Agrandir Image',
  domain: 'agrandir-image.fr',
  url: 'https://agrandir-image.fr',
  locale: 'fr_FR',
};

export const COELUS = {
  name: 'Coelus',
  url: 'https://coelus.fr/',
  city: 'Montpellier',
};

/** Lien vers coelus.fr avec UTM (utm_content : footer, resultats-<page>, faq, article-<slug>…). */
export function coelusLink(path: string, content: string, campaign = 'outil-gratuit'): string {
  const u = new URL(path, COELUS.url);
  u.searchParams.set('utm_source', 'agrandir-image.fr');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', campaign);
  u.searchParams.set('utm_content', content);
  return u.toString();
}

export interface NavTool { href: string; label: string; sub: string; short: string }
export const TOOLS: NavTool[] = [
  { href: '/', label: 'Agrandir une image', sub: '×2, ×3 ou ×4 avec l’IA', short: 'Agrandir' },
  { href: '/ameliorer-qualite-image/', label: 'Améliorer la qualité', sub: 'Plus nette, moins de bruit', short: 'Améliorer la qualité' },
  { href: '/augmenter-resolution-image/', label: 'Augmenter la résolution', sub: 'HD · Full HD · 4K', short: 'Résolution HD / 4K' },
  { href: '/agrandir-image-impression/', label: 'Agrandir pour imprimer', sub: 'A4 · A3 · poster', short: 'Impression' },
  { href: '/upscale-image/', label: 'Upscale IA', sub: 'Jusqu’à ×4', short: 'Upscale' },
  { href: '/depixeliser-image/', label: 'Dépixeliser une image', sub: 'Images floues ou pixelisées', short: 'Dépixeliser' },
  { href: '/agrandir-logo/', label: 'Agrandir un logo', sub: 'PNG transparent', short: 'Logo' },
  { href: '/agrandir-photo-ancienne/', label: 'Agrandir une photo ancienne', sub: 'Scans et vieux tirages', short: 'Photo ancienne' },
];
