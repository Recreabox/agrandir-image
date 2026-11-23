import asyncio
from playwright.async_api import async_playwright
from PIL import Image
ROOT = "/data/workspace/agrandir-image"
logo = open(ROOT + "/public/logo.svg").read()
BEFORE = "file://" + ROOT + "/tools/demo/out/polaroid-avant.jpg"
AFTER = "file://" + ROOT + "/tools/demo/out/polaroid-apres.webp"
OG = f"""<html><body style='margin:0'>
<div id='og' style='width:1200px;height:630px;box-sizing:border-box;background:#fcfcfc;display:grid;grid-template-columns:520px 1fr;gap:48px;padding:64px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a'>
  <div style='display:flex;flex-direction:column;justify-content:space-between'>
    <div style='height:34px'>{logo.replace('<svg ', '<svg style="height:34px;width:auto" ')}</div>
    <div>
      <div style='font-size:60px;font-weight:700;line-height:1.08;letter-spacing:-0.02em'>Agrandir une image avec l’IA</div>
      <div style='margin-top:20px;font-size:26px;line-height:1.4;color:#64748b'>×2, ×3 ou ×4, gratuit et sans inscription. <span style='color:#9333ea'>Traitement 100 % local.</span></div>
    </div>
    <div style='font-size:22px;color:#94a3b8'>agrandir-image.fr</div>
  </div>
  <div style='position:relative;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0'>
    <img src='{BEFORE}' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:45% 50%;image-rendering:auto'>
    <img src='{AFTER}' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:45% 50%;clip-path:inset(0 0 0 50%)'>
    <span style='position:absolute;top:0;bottom:0;left:50%;width:3px;margin-left:-1.5px;background:#fff'></span>
    <span style='position:absolute;top:16px;left:16px;padding:6px 12px;border-radius:8px;background:rgba(15,23,42,.72);color:#fff;font-size:18px;font-weight:500'>Avant</span>
    <span style='position:absolute;top:16px;right:16px;padding:6px 12px;border-radius:8px;background:#9333ea;color:#fff;font-size:18px;font-weight:500'>Après ×4</span>
  </div>
</div></body></html>"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome", args=["--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": 1200, "height": 630})
        await pg.goto("file:///tmp/blank.html")
        await pg.set_content(OG)
        await pg.wait_for_timeout(700)
        await pg.locator("#og").screenshot(path="/tmp/og.png")
        pg2 = await b.new_page(device_scale_factor=1)
        await pg2.goto("file:///tmp/blank.html")
        await pg2.set_content("<html><body style='margin:0;background:transparent'><div id='l' style='display:inline-block;padding:4px'>" + logo.replace('<svg ', '<svg style="height:44px;width:auto;display:block" ') + "</div></body></html>")
        await pg2.wait_for_timeout(200)
        await pg2.locator("#l").screenshot(path="/tmp/logo-big.png", omit_background=True)
        await b.close()
    Image.open("/tmp/og.png").convert("RGB").save(ROOT + "/public/og/agrandir-image.jpg", quality=86, optimize=True, progressive=True)
    big = Image.open("/tmp/logo-big.png").convert("RGBA")
    w = 220; h = round(big.height * w / big.width)
    big.resize((w, h), Image.LANCZOS).save(ROOT + "/public/exemples/logo-exemple.png", optimize=True)
    print("og ok; logo sample", big.size, "->", (w, h))
asyncio.run(main())
