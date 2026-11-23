import asyncio
from playwright.async_api import async_playwright
ROOT = "/data/workspace/agrandir-image"
OUT = "/data/workspace/tmp/agrandir-image/cmp"
logo = open(ROOT + "/public/logo.svg").read()
fav = open(ROOT + "/public/favicon.svg").read()
ref = "/data/workspace/tmp/agrandir-image/ref/header.png"
html = f"""<html><body style='margin:0;background:#fcfcfc;font-family:system-ui'>
<div id='a' style='padding:24px;display:grid;gap:22px;width:900px'>
<div style='height:24px'>{logo.replace('<svg ', '<svg style="height:24px;width:auto" ')}</div>
<div style='height:20px'>{logo.replace('<svg ', '<svg style="height:20px;width:auto" ')}</div>
<img src='file://{ref}' style='width:900px'>
<div style='display:flex;gap:16px;align-items:end'>
{fav.replace('<svg ', '<svg style="width:16px;height:16px" ')}{fav.replace('<svg ', '<svg style="width:32px;height:32px" ')}{fav.replace('<svg ', '<svg style="width:64px;height:64px" ')}
</div></div></body></html>"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome", args=["--allow-file-access-from-files"])
        pg = await b.new_page(device_scale_factor=2)
        await pg.goto("file:///tmp/blank.html")
        await pg.set_content(html)
        await pg.wait_for_timeout(300)
        await pg.locator("#a").screenshot(path=OUT + "/logo-preview.png")
        # icône 180 px pour apple-touch-icon
        pg2 = await b.new_page(viewport={"width": 180, "height": 180})
        await pg2.set_content("<html><body style='margin:0'>" + fav.replace('<svg ', '<svg style="width:180px;height:180px;display:block" ') + "</body></html>")
        await pg2.screenshot(path=ROOT + "/public/apple-touch-icon.png", omit_background=True)
        await b.close()
asyncio.run(main())
