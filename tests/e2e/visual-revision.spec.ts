import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const output = "artifacts/tsukuyomi-v12-2026-09-08";

test("catalogue has bounded media and no displaced search overlay at every width", async ({page}) => {
  for (const width of [320, 390, 768, 960, 1440, 1920]) {
    await page.setViewportSize({width,height:1000}); await page.goto("/blog/");
    const layout = await page.evaluate(() => {
      const toolbar = document.querySelector<HTMLElement>(".roadmap-toolbar")!;
      const first = document.querySelector(".journal-entry")!;
      return {
        gap:first.getBoundingClientRect().top-toolbar.getBoundingClientRect().bottom,
        blur:getComputedStyle(toolbar).backdropFilter,
        overflow:document.documentElement.scrollWidth-innerWidth,
        ratios:Array.from(document.querySelectorAll(".journal-entry:not(.journal-featured) .journal-media")).map(el=>{const r=el.getBoundingClientRect();return r.width/r.height;})
      };
    });
    expect(layout.gap).toBeGreaterThanOrEqual(12); expect(layout.gap).toBeLessThan(60);
    expect(layout.blur).toBe("none"); expect(layout.overflow).toBeLessThanOrEqual(1);
    layout.ratios.forEach(r=>expect(r).toBeCloseTo(1.6,1));
    await expect(page.locator(".journal-featured")).toHaveCount(3);
  }
  await page.locator("#blog-query").fill("ontology");
  await expect(page.locator(".journal-featured:visible")).toHaveCount(0);
});

test("artifact media does not create implicit grid columns or displaced copy",async({page})=>{
  for(const width of [390,768,1440,1920]){
    await page.setViewportSize({width,height:1000});await page.goto("/artifacts/");
    const rows=await page.locator(".archive-record-link").evaluateAll(els=>els.map(el=>{
      const media=el.querySelector(".archive-record-media")!.getBoundingClientRect();
      const copy=el.querySelector(".archive-record-copy")!.getBoundingClientRect();
      return {ratio:media.width/media.height,mediaBottom:media.bottom,copyTop:copy.top,mediaTop:media.top};
    }));
    for(const row of rows){
      expect(row.ratio).toBeCloseTo(1.6,1);
      if(width>600) expect(Math.abs(row.copyTop-row.mediaTop)).toBeLessThan(2);
      else expect(row.copyTop-row.mediaBottom).toBeLessThan(30);
    }
  }
});

for (const theme of ["light","dark"] as const) {
  test(`editorial and image scrim evidence: ${theme}`, async({page})=>{
    await mkdir(output,{recursive:true}); await page.setViewportSize({width:1440,height:1000});
    await page.addInitScript(t=>localStorage.setItem("lunar-observatory-theme",t),theme);
    await page.goto("/blog/"); await page.evaluate(()=>document.fonts.ready); await page.screenshot({path:`${output}/blog-${theme}.png`});
    await page.goto("/about/");
    await expect(page.locator(".about-hero-banner-inner")).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
    await expect(page.locator(".archive-about-hero")).toHaveCSS("opacity","1");
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:`${output}/about-${theme}.png`});
  });
}

test("relative outline includes third-level sections and code really changes theme",async({page})=>{
  await page.goto("/blog/2026-08-14-agent-orchestration/");
  const third=page.locator(".archive-prose h4").first();
  const id=await third.getAttribute("id");
  await expect(page.locator(`.toc-outline-item.depth-3 a[href="#${id}"]`)).toHaveCount(1);
  // Mermaid source is asynchronously replaced by SVG; inspect an actual code
  // block so both theme samples refer to the same stable element.
  const code=page.locator('.archive-prose pre.astro-code:not([data-language="mermaid"])').first();
  await expect(code).toHaveAttribute('data-language', /^(?!mermaid$).+/);
  const colors=[];
  for(const theme of ["dark","light"]){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    colors.push(await code.evaluate(el=>({background:getComputedStyle(el).backgroundColor,token:getComputedStyle(el.querySelector("span[style]")!).color})));
    await code.scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/code-${theme}.png`});
  }
  expect(colors[0].background).not.toBe(colors[1].background);
  expect(colors[0].token).not.toBe(colors[1].token);
  const table=await page.locator(".table-wrap").first().evaluate(el=>({border:getComputedStyle(el).borderLeftWidth,overflow:el.scrollWidth-el.clientWidth}));
  expect(table.border).toBe("0px"); expect(table.overflow).toBeLessThanOrEqual(1);
});
