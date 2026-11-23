// Préréglages de l'outil et ligne Coelus (après les résultats) par page.
import { coelusLink } from '../lib/site';
import type { Kind } from '../lib/upscale/models';

export interface ToolPreset {
  kind?: Kind;
  mode?: 'x' | 'side' | 'print';
  /** Facteur imposé ; absent = facteur recommandé selon la taille des images (×4 si ≤ 1 000 px, sinon ×2). */
  scale?: number;
  side?: number;
  print?: string;
  dpi?: number;
  format?: 'auto' | 'png' | 'jpeg' | 'webp';
  jpegQuality?: number;
  allowSame?: boolean;
  writeDpi?: boolean;
  bgToggle?: boolean;
}
export interface Cta { text: string; href: string; label: string }
export interface ToolConfig { preset: ToolPreset; cta: Cta; sample?: string; sampleName?: string }

const agency = (page: string): Cta => ({
  text: 'Cet outil gratuit est proposé par Coelus, agence web à Montpellier.',
  href: coelusLink('/', 'resultats-' + page),
  label: 'Découvrir l’agence',
});

export const HOME: ToolConfig = {
  preset: { kind: 'photo', mode: 'x' },
  cta: agency('accueil'),
  sample: '/exemples/polaroid-avant.jpg',
  sampleName: 'polaroid-exemple.jpg',
};

export const HOME_FEATURES = [
  'Agrandit vos images ×2, ×3 ou ×4 grâce à l’IA',
  'Rend les photos plus nettes et atténue le bruit',
  'Fonctionne aussi pour les logos et les dessins',
  'Exporte en JPG, PNG ou WebP, sans filigrane',
];

export const TOOL_CONFIG: Record<string, ToolConfig> = {
  'ameliorer-qualite-image': {
    preset: { kind: 'photo', mode: 'x', scale: 2, allowSame: true },
    cta: agency('ameliorer-qualite-image'),
    sample: '/exemples/chat-avant.jpg',
    sampleName: 'chat-exemple.jpg',
  },
  'augmenter-resolution-image': {
    preset: { kind: 'photo', mode: 'side', side: 1920 },
    cta: agency('augmenter-resolution-image'),
    sample: '/exemples/rue-foch-600.jpg',
    sampleName: 'rue-foch-exemple.jpg',
  },
  'agrandir-image-impression': {
    preset: { kind: 'photo', mode: 'print', print: 'A4', dpi: 300, format: 'jpeg', jpegQuality: 95, writeDpi: true },
    cta: {
      text: 'Affiches, flyers, kakémonos : Coelus les conçoit directement aux bonnes dimensions.',
      href: coelusLink('/service/graphisme/', 'resultats-agrandir-image-impression'),
      label: 'Voir l’offre graphisme',
    },
    sample: '/exemples/appareil-photo-1000.jpg',
    sampleName: 'appareil-photo-exemple.jpg',
  },
  'upscale-image': {
    preset: { kind: 'photo', mode: 'x', scale: 4 },
    cta: agency('upscale-image'),
    sample: '/exemples/polaroid-avant.jpg',
    sampleName: 'polaroid-exemple.jpg',
  },
  'depixeliser-image': {
    preset: { kind: 'abimee', mode: 'x', scale: 4 },
    cta: agency('depixeliser-image'),
    sample: '/exemples/polaroid-avant.jpg',
    sampleName: 'polaroid-exemple.jpg',
  },
  'agrandir-logo': {
    preset: { kind: 'dessin', mode: 'x', scale: 4, format: 'png', bgToggle: true },
    cta: {
      text: 'Pour une enseigne ou un textile, il faut un logo vectoriel : Coelus peut le redessiner.',
      href: coelusLink('/service/graphisme/', 'resultats-agrandir-logo'),
      label: 'Voir l’offre graphisme',
    },
    sample: '/exemples/logo-exemple.png',
    sampleName: 'logo-exemple.png',
  },
  'agrandir-photo-ancienne': {
    preset: { kind: 'abimee', mode: 'x', scale: 2, format: 'jpeg', jpegQuality: 95 },
    cta: agency('agrandir-photo-ancienne'),
    sample: '/exemples/place-de-la-comedie-1920-avant.jpg',
    sampleName: 'carte-postale-exemple.jpg',
  },
};
