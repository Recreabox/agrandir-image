import asyncio, os, sys, json, time
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://127.0.0.1:8788")
OUT = os.environ.get("OUT", "/data/workspace/tmp/agrandir-image/shots2")
os.makedirs(OUT, exist_ok=True)
CHROME = "/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome"
PATHS = sys.argv[1:] or ["/"]

async def overflow(page):
    return await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")

async def flow(page, slug, tag, res):
    btn = page.get_by_role("button", name="Essayer avec une image d’exemple")
    if not await btn.count():
        return
    await btn.first.click()
    go = page.locator("form.opts button[type=submit]")
    await go.wait_for(timeout=20000)
    await page.wait_for_timeout(300)
    await page.locator(".tool").first.screenshot(path=f"{OUT}/{slug}-{tag}-2-options.png")
    res[tag + "_options_overflow"] = await overflow(page)
    t0 = time.time()
    await go.click()
    await page.wait_for_timeout(1500)
    await page.locator(".tool").first.screenshot(path=f"{OUT}/{slug}-{tag}-3-traitement.png")
    dl = page.locator(".res a[download]").first
    await dl.wait_for(timeout=240000)
    res[tag + "_seconds"] = round(time.time() - t0, 1)
    res[tag + "_download"] = await dl.get_attribute("download")
    res[tag + "_result_head"] = (await page.locator(".res__head").first.inner_text()).replace("\n", " | ")
    await page.wait_for_timeout(400)
    await page.locator(".tool").first.screenshot(path=f"{OUT}/{slug}-{tag}-4-resultats.png")
    res[tag + "_results_overflow"] = await overflow(page)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=["--host-resolver-rules=" + os.environ["HOST_RULES"]] if os.environ.get("HOST_RULES") else [])
        errors = []
        for path in PATHS:
            slug = path.strip("/").replace("/", "_") or "accueil"
            res = {"path": path}
            ctx = await b.new_context(viewport={"width": 1440, "height": 900})
            page = await ctx.new_page()
            page.on("console", lambda m: errors.append(("console", m.type, m.text[:200])) if m.type in ("error",) else None)
            page.on("pageerror", lambda e: errors.append(("pageerror", str(e)[:300])))
            await page.goto(BASE + path, wait_until="networkidle")
            await page.wait_for_timeout(500)
            await page.screenshot(path=f"{OUT}/{slug}-desktop-1-fold.png")
            await page.screenshot(path=f"{OUT}/{slug}-desktop-full.png", full_page=True)
            await flow(page, slug, "desktop", res)
            await ctx.close()
            for w in (320, 375, 414, 768):
                ctx = await b.new_context(viewport={"width": w, "height": 800}, device_scale_factor=2 if w < 500 else 1, is_mobile=w < 500, has_touch=w < 500)
                page = await ctx.new_page()
                page.on("pageerror", lambda e: errors.append(("pageerror", str(e)[:300])))
                await page.goto(BASE + path, wait_until="networkidle")
                await page.wait_for_timeout(300)
                res[f"overflow_{w}"] = await overflow(page)
                if w == 375:
                    await page.screenshot(path=f"{OUT}/{slug}-mobile-1-fold.png")
                    await page.screenshot(path=f"{OUT}/{slug}-mobile-full.png", full_page=True)
                    if os.environ.get("MOBILE_FLOW"):
                        await flow(page, slug, "mobile", res)
                await ctx.close()
            print(json.dumps(res, ensure_ascii=False), flush=True)
        print("ERRORS", json.dumps(errors[:20], ensure_ascii=False))
        await b.close()
asyncio.run(main())
