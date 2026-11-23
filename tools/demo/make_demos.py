"""Génère les démonstrations avant/après du site (images réelles CC0 / domaine public).

Pour chaque démo : recadrage 3:2 de la photo d'origine -> réduction (Lanczos) -> JPEG q75
(= « petite image du web ») -> agrandissement x4 avec le même modèle ONNX et le même tuilage
que le navigateur (tuile 128, marge 16, bords répliqués) -> WebP.

C'est aussi l'implémentation de référence utilisée par le test de bout en bout du worker.
"""
import json, os, sys, time
import numpy as np
import onnxruntime as ort
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, "..", "models", "onnx")
SRC = os.path.join(HERE, "src")
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

_sessions = {}
def session(model_id):
    if model_id not in _sessions:
        so = ort.SessionOptions(); so.intra_op_num_threads = 10
        _sessions[model_id] = ort.InferenceSession(os.path.join(MODELS, model_id + ".onnx"), so, providers=["CPUExecutionProvider"])
    return _sessions[model_id]

def upscale_rgb(rgb, model_id, tile=128, pad=16):
    """rgb: float32 HxWx3 in [0,1] -> float32 4Hx4Wx3. Même algorithme que src/lib/upscale/engine.ts."""
    H, W, _ = rgb.shape
    tw, th = min(tile, W), min(tile, H)
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    sess = session(model_id)
    for y0 in range(0, H, tile):
        y1 = min(H, y0 + tile)
        oy = min(y0, H - th) - pad
        for x0 in range(0, W, tile):
            x1 = min(W, x0 + tile)
            ox = min(x0, W - tw) - pad
            ys = np.clip(np.arange(oy, oy + th + 2 * pad), 0, H - 1)
            xs = np.clip(np.arange(ox, ox + tw + 2 * pad), 0, W - 1)
            patch = rgb[ys][:, xs]  # (th+2p, tw+2p, 3)
            inp = np.ascontiguousarray(patch.transpose(2, 0, 1)[None])
            res = sess.run(None, {"input": inp})[0][0].transpose(1, 2, 0)
            ly0, lx0 = (y0 - oy) * 4, (x0 - ox) * 4
            out[y0 * 4:y1 * 4, x0 * 4:x1 * 4] = res[ly0:ly0 + (y1 - y0) * 4, lx0:lx0 + (x1 - x0) * 4]
    return np.clip(out, 0, 1)

def upscale_image(im, model_id):
    arr = np.asarray(im.convert("RGB"), np.float32) / 255.0
    out = upscale_rgb(arr, model_id)
    return Image.fromarray((out * 255.0 + 0.5).astype(np.uint8))

DEMOS = [
    # id, source, crop (fractions x0,y0,x1,y1), largeur de l'entrée, modèle
    ("appareil-photo", "camera.jpg", (0.47, 0.05, 0.93, 0.5167), 400, "realesr-general-x4v3-dn50"),
    ("chat", "chat.png", (0.08, 0.17, 0.66, 0.63), 400, "realesr-general-x4v3-dn50"),
    ("place-de-la-comedie-1920", "comedie-1920.jpg", (0.05, 0.19, 0.62, 0.76), 400, "realesr-general-x4v3"),
    ("polaroid", "polaroid.jpg", (0.30, 0.16, 0.98, 0.89), 400, "realesr-general-x4v3-dn50"),
    ("rue-foch", "rue-foch.jpg", (0.52, 0.10, 0.99, 0.6233), 400, "realesr-general-x4v3-dn50"),
]

def make(demo):
    did, src, (x0, y0, x1, y1), w_in, model_id = demo
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    W, H = im.size
    box = (round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))
    crop = im.crop(box)
    h_in = round(w_in * crop.height / crop.width)
    small = crop.resize((w_in, h_in), Image.LANCZOS)
    in_path = os.path.join(OUT, f"{did}-avant.jpg")
    small.save(in_path, quality=75, optimize=True)
    small = Image.open(in_path).convert("RGB")
    t0 = time.time()
    big = upscale_image(small, model_id)
    dt = time.time() - t0
    big.save(os.path.join(OUT, f"{did}-apres.webp"), quality=88, method=6)
    big.save(os.path.join(OUT, f"{did}-apres.png"))
    info = {"id": did, "source": src, "crop_px": box, "input": list(small.size), "output": list(big.size), "model": model_id,
            "cpu_seconds": round(dt, 1), "bytes_in": os.path.getsize(in_path), "bytes_out_webp": os.path.getsize(os.path.join(OUT, f"{did}-apres.webp"))}
    print(json.dumps(info), flush=True)
    return info

# Échantillons d'entrée seuls (bouton « Essayer avec une photo d'exemple » de certaines pages)
SAMPLES = [
    ("appareil-photo-1000", "camera.jpg", (0.47, 0.05, 0.93, 0.5167), 1000),
    ("rue-foch-600", "rue-foch.jpg", (0.52, 0.10, 0.99, 0.6233), 600),
]

def make_sample(sample):
    sid, src, (x0, y0, x1, y1), w_in = sample
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    W, H = im.size
    crop = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
    small = crop.resize((w_in, round(w_in * crop.height / crop.width)), Image.LANCZOS)
    path = os.path.join(OUT, sid + ".jpg")
    small.save(path, quality=80, optimize=True)
    print(sid, small.size, os.path.getsize(path), "octets")

if __name__ == "__main__":
    if sys.argv[1:] == ["--samples"]:
        for s in SAMPLES:
            make_sample(s)
        sys.exit(0)
    ids = set(sys.argv[1:])
    report = [make(d) for d in DEMOS if not ids or d[0] in ids]
    with open(os.path.join(OUT, "demos.json"), "w") as f:
        json.dump(report, f, indent=2)
