import asyncio, base64, io, json, os
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
BASE = "http://127.0.0.1:8788"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome")
        page = await b.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:200]))
        await page.goto(BASE + "/test-moteur/")
        await page.wait_for_function("window.__engine !== undefined")
        # 1) logo PNG avec transparence, modèle illustration, x4, PNG
        src = Image.open("/data/workspace/agrandir-image/public/exemples/logo-exemple.png")
        W, H = src.size
        res = await page.evaluate("([u,o]) => window.__engine.run(u,o)", ["/exemples/logo-exemple.png", {"modelId": "realesr-animevideov3", "targetW": W*4, "targetH": H*4, "mime": "image/png", "quality": 0.92, "engine": "cpu"}])
        out = Image.open(io.BytesIO(base64.b64decode(res["b64"])))
        out.save("/data/workspace/tmp/agrandir-image/cmp/logo-x4.png")
        a = np.asarray(out.convert("RGBA"))
        alpha = a[..., 3]
        print("logo:", out.mode, out.size, "alpha min/max", int(alpha.min()), int(alpha.max()), "transparent px %", round(float((alpha < 10).mean() * 100), 1), res["ms"], "ms")
        # halo check: mean luminance of semi-transparent edge pixels vs opaque text pixels
        edge = (alpha > 20) & (alpha < 230)
        print("edge px:", int(edge.sum()), "edge mean RGB", a[edge][:, :3].mean(axis=0).round(1).tolist())
        # 2) JPEG avec dpi 300
        res2 = await page.evaluate("([u,o]) => window.__engine.run(u,o)", ["/exemples/appareil-photo-avant.jpg", {"modelId": "realesr-general-x4v3", "targetW": 1200, "targetH": 813, "mime": "image/jpeg", "quality": 0.95, "engine": "cpu", "dpi": 300}])
        im2 = Image.open(io.BytesIO(base64.b64decode(res2["b64"])))
        print("jpeg dpi:", im2.info.get("dpi"), im2.size, im2.info.get("jfif_unit"), im2.info.get("jfif_density"))
        # 3) PNG avec dpi 150
        res3 = await page.evaluate("([u,o]) => window.__engine.run(u,o)", ["/exemples/appareil-photo-avant.jpg", {"modelId": "realesr-general-x4v3", "targetW": 800, "targetH": 542, "mime": "image/png", "quality": 0.95, "engine": "cpu", "dpi": 150}])
        im3 = Image.open(io.BytesIO(base64.b64decode(res3["b64"])))
        print("png dpi:", im3.info.get("dpi"), im3.size)
        # 4) WebP
        res4 = await page.evaluate("([u,o]) => window.__engine.run(u,o)", ["/exemples/appareil-photo-avant.jpg", {"modelId": "realesr-animevideov3", "targetW": 1200, "targetH": 813, "mime": "image/webp", "quality": 0.9, "engine": "cpu"}])
        print("webp:", res4["mime"], res4["bytes"])
        print("errors:", errs)
        await b.close()
asyncio.run(main())
