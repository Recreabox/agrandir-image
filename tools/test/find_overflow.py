import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/data/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome")
        ctx = await b.new_context(viewport={"width": 375, "height": 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        await page.goto("http://127.0.0.1:8788/", wait_until="networkidle")
        await page.wait_for_timeout(500)
        res = await page.evaluate("""() => {
          const out = { innerWidth: innerWidth, docW: document.documentElement.scrollWidth, vv: visualViewport.width };
          const wide = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.right > 380 && r.width > 0) wide.push({ tag: el.tagName, cls: el.className && el.className.baseVal === undefined ? String(el.className).slice(0,60) : '', w: Math.round(r.width), right: Math.round(r.right) });
          }
          out.wide = wide.slice(0, 25);
          return out;
        }""")
        print(json.dumps(res, indent=1))
        await b.close()
asyncio.run(main())
