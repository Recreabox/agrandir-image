import asyncio, json
from playwright.async_api import async_playwright
BASE = "http://127.0.0.1:8788"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome")
        ctx = await b.new_context()
        page = await ctx.new_page()
        await page.goto(BASE + "/test-moteur/")
        await page.wait_for_function("window.__engine !== undefined")
        await page.evaluate("window.__engine.prefetch('/exemples/polaroid-avant.jpg')")
        opts = {"modelId": "realesr-general-x4v3-dn50", "targetW": 800, "targetH": 482, "mime": "image/jpeg", "quality": 0.9, "engine": "cpu"}
        r1 = await page.evaluate("(o) => window.__engine.run(null, o)", opts)
        print("en ligne :", r1["width"], "x", r1["height"], r1["ms"], "ms", r1["stages"])
        await ctx.set_offline(True)
        r2 = await page.evaluate("(o) => window.__engine.run(null, o)", opts)
        print("hors ligne, même modèle :", r2["width"], "x", r2["height"], r2["ms"], "ms", r2["stages"])
        try:
            r3 = await page.evaluate("(o) => window.__engine.run(null, o)", {**opts, "modelId": "RealESRGAN_x4plus_anime_6B"})
            print("hors ligne, modèle non téléchargé : OK ?!", r3["stages"])
        except Exception as e:
            print("hors ligne, modèle non téléchargé : erreur attendue ->", str(e).split("\n")[0][:160])
        await ctx.set_offline(False)
        await b.close()
asyncio.run(main())
