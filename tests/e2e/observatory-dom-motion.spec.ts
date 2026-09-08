import { expect, test } from "@playwright/test";

test("DOM composition follows the rendered director in both scroll directions", async ({ page }) => {
  await page.goto("/");
  const root = page.locator("[data-observatory-root]");
  await expect(root).toHaveAttribute("data-render-state", "ready");
  for (const [id, index] of [["observe",1],["orchestrate",3],["archive-afterlight",5],["signal-gate",0]] as const) {
    await page.locator("#"+id).evaluate(el => scrollTo({top: el.getBoundingClientRect().top + scrollY, behavior:"instant"}));
    await expect.poll(() => root.evaluate(el => Number(el.style.getPropertyValue("--journey-progress")) * 5)).toBeCloseTo(index, 1);
    const visible = await page.locator(".observatory-chapter-frame").evaluateAll(frames => frames.filter(f => getComputedStyle(f).visibility === "visible").map(f => f.parentElement?.id));
    expect(visible).toEqual([id]);
    await expect(page.locator("#"+id+" .observatory-chapter-frame")).not.toHaveAttribute("inert");
  }
});

test("bridge stop has a readable research composition", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-render-state","ready");
  await page.locator("#structure").evaluate(el => scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:"instant"}));
  await expect.poll(()=>page.locator(".observatory-chapter-frame").evaluateAll(fs=>fs.filter(f=>getComputedStyle(f).visibility==="visible").length )).toBe(1);
});

test("reduced motion retains six readable in-flow sections", async ({ page }) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-render-state","static");
  await expect(page.locator(".observatory-chapter-frame")).toHaveCount(6);
  const styles=await page.locator(".observatory-chapter-frame").evaluateAll(fs=>fs.map(f=>({position:getComputedStyle(f).position,visibility:getComputedStyle(f).visibility,inert:(f as HTMLElement).inert})));
  expect(styles.every(s=>s.position==="relative"&&s.visibility==="visible"&&!s.inert)).toBe(true);
});

test("editorial cards stay vertically stacked and inside the viewport", async ({ page }) => {
  for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:960,height:480}]) {
    await page.setViewportSize(viewport); await page.goto('/');
    await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-render-state','ready');
    for (const id of ['observe','orchestrate']) {
      await page.locator('#'+id).evaluate(el => scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:'instant'}));
      await expect.poll(() => page.locator('#'+id+' .observatory-chapter-frame').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      await page.waitForTimeout(1600);
      const cards = await page.locator('#'+id+' .home-entry').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};}));
      expect(cards[1].top).toBeGreaterThan(cards[0].bottom);
      cards.forEach(card=>{ expect(card.left).toBeGreaterThanOrEqual(0);expect(card.right).toBeLessThanOrEqual(viewport.width);expect(card.bottom).toBeLessThan(viewport.height); });
    }
  }
});

test('reading poses stay front-facing while the camera continues across a reading interval', async ({ page }) => {
  await page.goto('/');
  const root=page.locator('[data-observatory-root]');
  await expect(root).toHaveAttribute('data-render-state','ready');
  for(const offset of [0,.1,.2]) {
    await page.locator('#observe').evaluate((el, offset)=>{
      const r=el.getBoundingClientRect();scrollTo({top:r.top+scrollY+r.height*offset,behavior:'instant'});
    },offset);
    const frame=page.locator('.home-writing');
    await expect(frame).toHaveAttribute('data-reading-pose','settled');
    await expect(frame).toHaveCSS('transform','none');
    await expect.poll(()=>root.evaluate(el=>Number(el.style.getPropertyValue('--journey-progress'))*5)).toBeCloseTo(1+offset,2);
    const transforms=await frame.locator('.home-entries li').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
    expect(transforms).toEqual(['none','none']);
  }
});

test('every wheel input advances the journey immediately instead of accumulating at a threshold', async ({ page }) => {
  await page.goto('/');
  const root=page.locator('[data-observatory-root]');
  await expect(root).toHaveAttribute('data-render-state','ready');
  const progress=()=>root.evaluate(el=>Number(el.style.getPropertyValue('--journey-progress'))*5);
  for(const chapter of ['signal-gate','observe','structure','orchestrate','embodiment']) {
    await page.locator('#'+chapter).evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:'instant'}));
    await page.waitForTimeout(1400);
    for(let tick=0;tick<3;tick++) {
      const before=await progress();
      await page.mouse.wheel(0,100); await page.waitForTimeout(250);
      const after=await progress();
      expect(after-before).toBeGreaterThan(.025);
      expect(after-before).toBeLessThan(.2);
    }
  }
});
