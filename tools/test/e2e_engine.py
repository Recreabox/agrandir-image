"""Test de bout en bout du moteur dans Chromium (WASM puis WebGPU si dispo) :
compare la sortie du navigateur à l'implémentation de référence Python (même ONNX, même tuilage)."""
import asyncio, base64, io, json, os, sys, time
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "demo"))
import make_demos as ref  # noqa: E402

BASE = os.environ.get("BASE", "http://127.0.0.1:8788")
SAMPLE_URL = "/exemples/appareil-photo-avant.jpg"
SAMPLE_FILE = os.path.join(HERE, "..", "demo", "out", "appareil-photo-avant.jpg")

def psnr(a, b):
    mse = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return float("inf") if mse == 0 else 10 * np.log10(255 ** 2 / mse)

async def main():
    engines = sys.argv[1:] or ["cpu", "gpu"]
    small = Image.open(SAMPLE_FILE).convert("RGB")
    W, H = small.size
    cases = [
        ("x4", "realesr-general-x4v3-dn50", W * 4, H * 4),
        ("x2", "realesr-general-x4v3-dn50", W * 2, H * 2),
    ]
    refs = {}
    for name, model, tw, th in cases:
        big = np.asarray(ref.upscale_image(small, model))
        if (tw, th) != (W * 4, H * 4):
            big = np.asarray(Image.fromarray(big).resize((tw, th), Image.LANCZOS))
        refs[name] = big
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=os.environ.get("CHROME", "/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome"), args=[
            "--enable-unsafe-webgpu", "--enable-features=Vulkan,WebGPUDeveloperFeatures",
            "--use-webgpu-adapter=swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist",
        ])
        page = await browser.new_page()
        page.on("console", lambda m: print("  [console]", m.type, m.text[:300]))
        page.on("pageerror", lambda e: print("  [pageerror]", str(e)[:300]))
        await page.goto(BASE + "/test-moteur/")
        await page.wait_for_function("window.__engine !== undefined", timeout=30000)
        iso = await page.evaluate("crossOriginIsolated")
        caps = await page.evaluate("window.__engine.caps()")
        print("crossOriginIsolated:", iso, "caps:", json.dumps(caps))
        for engine in engines:
            for name, model, tw, th in cases:
                t0 = time.time()
                try:
                    res = await page.evaluate("([u,o]) => window.__engine.run(u,o)", [SAMPLE_URL, {"modelId": model, "targetW": tw, "targetH": th, "mime": "image/png", "quality": 0.92, "engine": engine}])
                except Exception as e:
                    print(f"{engine} {name}: ERREUR {str(e)[:400]}")
                    continue
                out = np.asarray(Image.open(io.BytesIO(base64.b64decode(res["b64"]))).convert("RGB"))
                print(f"{engine} {name}: backend={res['backend']} {res['width']}x{res['height']} {res['ms']} ms (mur {time.time()-t0:.1f}s) stages={res['stages']} PSNR vs ref = {psnr(out, refs[name]):.2f} dB")
                Image.fromarray(out).save(f"/tmp/agr-e2e-{engine}-{name}.png")
        await browser.close()

asyncio.run(main())
