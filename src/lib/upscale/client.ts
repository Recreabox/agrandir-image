// Côté page : pilote le worker d'agrandissement.
import type { Caps, JobSpec, WorkerRequest, WorkerResponse, Stage, Backend } from './protocol';

export interface Progress { stage: Stage; done: number; total: number; backend?: Backend; elapsedMs?: number }
export interface UpscaleResult { blob: Blob; width: number; height: number; ms: number; backend: Backend; mime: string }

interface Pending {
  resolve: (r: UpscaleResult) => void;
  reject: (e: Error & { cancelled?: boolean }) => void;
  onProgress?: (p: Progress) => void;
  onNotice?: (m: string) => void;
}

export class UpscaleClient {
  private worker: Worker | null = null;
  private capsPromise: Promise<Caps> | null = null;
  private capsResolve: ((c: Caps) => void) | null = null;
  private pending = new Map<number, Pending>();
  private seq = 1;

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'agrandir-image' });
    w.onmessage = (ev: MessageEvent<WorkerResponse>) => this.onMessage(ev.data);
    w.onerror = (ev) => {
      const err = Object.assign(new Error(ev.message || 'Le moteur d’agrandissement a planté.'), { cancelled: false });
      for (const p of this.pending.values()) p.reject(err);
      this.pending.clear();
      this.worker?.terminate();
      this.worker = null;
      this.capsPromise = null;
    };
    this.worker = w;
    return w;
  }

  caps(): Promise<Caps> {
    if (!this.capsPromise) {
      this.capsPromise = new Promise((res) => (this.capsResolve = res));
      this.send({ type: 'init' });
    }
    return this.capsPromise;
  }

  upscale(spec: Omit<JobSpec, 'id'>, bitmap: ImageBitmap, onProgress?: (p: Progress) => void, onNotice?: (m: string) => void): { id: number; promise: Promise<UpscaleResult> } {
    const id = this.seq++;
    const promise = new Promise<UpscaleResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress, onNotice });
    });
    this.send({ type: 'job', spec: { ...spec, id }, bitmap }, [bitmap]);
    return { id, promise };
  }

  cancel(id: number): void {
    this.worker?.postMessage({ type: 'cancel', id } satisfies WorkerRequest);
  }

  private send(msg: WorkerRequest, transfer: Transferable[] = []): void {
    this.ensureWorker().postMessage(msg, transfer);
  }

  private onMessage(msg: WorkerResponse): void {
    if (msg.type === 'caps') { this.capsResolve?.(msg.caps); return; }
    const p = this.pending.get(msg.id);
    if (!p) return;
    if (msg.type === 'progress') p.onProgress?.({ stage: msg.stage, done: msg.done, total: msg.total, backend: msg.backend, elapsedMs: msg.elapsedMs });
    else if (msg.type === 'notice') p.onNotice?.(msg.message);
    else if (msg.type === 'done') { this.pending.delete(msg.id); p.resolve({ blob: msg.blob, width: msg.width, height: msg.height, ms: msg.ms, backend: msg.backend, mime: msg.mime }); }
    else if (msg.type === 'error') { this.pending.delete(msg.id); p.reject(Object.assign(new Error(msg.message), { cancelled: !!msg.cancelled })); }
  }
}

let shared: UpscaleClient | null = null;
export const getClient = () => (shared ??= new UpscaleClient());
