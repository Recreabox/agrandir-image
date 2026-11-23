// Catalogue des modèles (poids officiels Real-ESRGAN, licence BSD-3-Clause, exportés en ONNX
// par tools/models/export_onnx.py). Tous agrandissent ×4 ; les autres tailles sont obtenues
// par réduction Lanczos du résultat ×4, tuile par tuile.

/** Type d'image choisi dans l'outil. */
export type Kind = 'photo' | 'abimee' | 'dessin';
export type Quality = 'standard' | 'max';

export interface ModelInfo {
  id: string;
  label: string;
  family: 'compact' | 'rrdb';
  /** Coût de calcul relatif par pixel (compact x4v3 = 1), mesuré sur processeur. */
  cost: number;
  /** Côté de tuile (pixels source) selon le moteur. */
  tile: { webgpu: number; wasm: number };
}

export const MODELS: Record<string, ModelInfo> = {
  'realesr-general-x4v3': { id: 'realesr-general-x4v3', label: 'Real-ESRGAN general x4v3', family: 'compact', cost: 1, tile: { webgpu: 256, wasm: 128 } },
  'realesr-general-x4v3-dn50': { id: 'realesr-general-x4v3-dn50', label: 'Real-ESRGAN general x4v3 (débruitage 0,5)', family: 'compact', cost: 1, tile: { webgpu: 256, wasm: 128 } },
  'realesr-animevideov3': { id: 'realesr-animevideov3', label: 'Real-ESRGAN animevideo v3', family: 'compact', cost: 0.7, tile: { webgpu: 256, wasm: 128 } },
  'RealESRGAN_x4plus': { id: 'RealESRGAN_x4plus', label: 'Real-ESRGAN x4plus', family: 'rrdb', cost: 10.7, tile: { webgpu: 96, wasm: 96 } },
  'RealESRGAN_x4plus_anime_6B': { id: 'RealESRGAN_x4plus_anime_6B', label: 'Real-ESRGAN x4plus anime 6B', family: 'rrdb', cost: 3.6, tile: { webgpu: 128, wasm: 96 } },
};

export function pickModel(kind: Kind, quality: Quality): string {
  if (kind === 'dessin') return quality === 'max' ? 'RealESRGAN_x4plus_anime_6B' : 'realesr-animevideov3';
  if (quality === 'max') return 'RealESRGAN_x4plus';
  return kind === 'abimee' ? 'realesr-general-x4v3' : 'realesr-general-x4v3-dn50';
}
