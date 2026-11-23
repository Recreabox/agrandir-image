export type Backend = 'webgpu' | 'wasm';
export type Engine = 'auto' | 'gpu' | 'cpu';
export type OutputMime = 'image/png' | 'image/jpeg' | 'image/webp';

export interface Caps {
  webgpu: boolean;
  gpuName: string;
  fallbackAdapter: boolean;
  isolated: boolean;
  threads: number;
}

export interface JobSpec {
  id: number;
  modelId: string;
  targetW: number;
  targetH: number;
  mime: OutputMime;
  quality: number;
  engine: Engine;
  /** Résolution d'impression à écrire dans le fichier (JPEG/PNG), si demandée. */
  dpi?: number;
}

export type Stage = 'runtime' | 'model' | 'prepare' | 'tiles' | 'encode';

export type WorkerRequest =
  | { type: 'init' }
  | { type: 'job'; spec: JobSpec; bitmap: ImageBitmap }
  | { type: 'cancel'; id: number };

export type WorkerResponse =
  | { type: 'caps'; caps: Caps }
  | { type: 'progress'; id: number; stage: Stage; done: number; total: number; backend?: Backend; elapsedMs?: number }
  | { type: 'notice'; id: number; message: string }
  | { type: 'done'; id: number; blob: Blob; width: number; height: number; ms: number; backend: Backend; mime: string }
  | { type: 'error'; id: number; message: string; cancelled?: boolean };
