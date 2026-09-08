import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const output = 'artifacts/tsukuyomi-v13-2026-09-08';

test('short outlines begin at the top with bounded spacing instead of stretching across the viewport', async({page})=>{
  await mkdir(output,{recursive:true});
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/blog/2026-08-14-agent-orchestration/');
  const marks=page.locator('[data-outline-mark]');
  expect(await marks.count()).toBeLessThan(25);
  const first=await marks.first().boundingBox(),last=await marks.last().boundingBox();
  expect(first!.y).toBeLessThan(180);
  expect(last!.y+last!.height).toBeLessThan(650);
  const sizes = await marks.evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(8);
  expect(Math.max(...sizes)).toBeLessThanOrEqual(22);
  await page.screenshot({path:`${output}/outline-short-closed.png`});
});

test('long outline preserves minimum spacing and follows reading while expanded content scrolls independently', async ({ page }) => {
  await mkdir(output, {recursive:true});
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/blog/2025-08-11-前端开发-四/');
  const dock = page.locator('.reading-outline');
  const nav = dock.locator('.outline-scroll');
  const headingCount = await page.locator('.archive-prose :is(h2,h3,h4,h5,h6)[id]').count();
  expect(headingCount).toBeGreaterThan(30);
  await expect(dock.locator('[data-toc-link]')).toHaveCount(headingCount);
  for (const height of [900, 480]) {
    await page.setViewportSize({ width: 1440, height });
    await expect.poll(() => dock.locator('.outline-minimap').evaluate(el => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
    const sizes = await dock.locator('[data-outline-mark]').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(8);
  }
  await page.locator('.archive-prose :is(h2,h3,h4,h5,h6)[id]').last().scrollIntoViewIfNeeded();
  await expect.poll(() => dock.locator('.outline-minimap').evaluate(el => el.scrollTop)).toBeGreaterThan(100);
  await dock.locator('summary').click();
  const before = await page.evaluate(() => scrollY);
  await nav.focus(); await page.keyboard.press('Control+End');
  await expect.poll(() => nav.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(2);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(dock.locator('[data-toc-link]').last()).toBeInViewport();
  await page.screenshot({path:`${output}/outline-open-desktop.png`});
  await page.keyboard.press('Escape'); await expect(dock).not.toHaveAttribute('open');
  await page.setViewportSize({ width: 390, height: 650 });
  await dock.locator('summary').click();
  const box = await dock.boundingBox(); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.y + box!.height).toBeLessThanOrEqual(650);
  await nav.hover(); await page.mouse.wheel(0, 12000);
  await expect.poll(() => nav.evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(2);
  await expect(dock.locator('[data-toc-link]').last()).toBeInViewport();
  await page.screenshot({path:`${output}/outline-open-phone.png`});
});

test('outline disclosure and heading links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto('/blog/2026-08-14-agent-orchestration/');
  await page.locator('.reading-outline summary').click();
  await expect(page.locator('.outline-scroll')).toBeVisible();
  await page.locator('[data-toc-link]').first().click();
  expect(new URL(page.url()).hash).not.toBe('');
  await context.close();
});

test('outline morph is interruptible and the closed map redistributes around the active heading', async ({ page }) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/blog/2025-08-11-前端开发-四/');
  const dock=page.locator('.reading-outline'), summary=dock.locator('summary');
  const closed=await dock.boundingBox();
  await summary.focus(); await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  const middle=await dock.boundingBox();
  expect(middle!.width).toBeGreaterThan(closed!.width+20);
  expect(middle!.width).toBeLessThan(336);
  await page.keyboard.press('Enter'); await page.waitForTimeout(70); await page.keyboard.press('Enter');
  await expect.poll(()=>dock.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  await expect(dock).toHaveAttribute('open');
  await page.keyboard.press('Escape'); await expect(dock).not.toHaveAttribute('open');
  const initial=await dock.locator('[data-outline-mark]').first().getAttribute('style');
  await page.locator('.archive-prose :is(h2,h3,h4,h5,h6)[id]').nth(45).scrollIntoViewIfNeeded();
  await expect.poll(()=>dock.locator('[data-outline-mark]').first().getAttribute('style')).not.toBe(initial);
  const distribution=await dock.locator('[data-outline-mark]').evaluateAll(els=>els.map(el=>parseFloat((el as HTMLElement).style.getPropertyValue('--mark-size'))));
  expect(Math.max(...distribution)-Math.min(...distribution)).toBeGreaterThan(.3);
  await expect(dock).toHaveCSS('border-top-width','0px');
  await summary.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(70);
  await page.setViewportSize({width:390,height:650});
  await expect.poll(()=>dock.evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(390);
  await expect(dock.locator('.outline-scroll')).toBeVisible();
});

test('hover closes after a heading click leaves focus inside, while keyboard focus remains usable', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/blog/2026-08-14-agent-orchestration/');
  const dock=page.locator('.reading-outline'), summary=dock.locator('summary');
  await summary.hover(); await expect(dock).toHaveAttribute('open');
  await dock.locator('[data-toc-link]').nth(2).click();
  await page.mouse.move(300,100);
  await expect(dock).not.toHaveAttribute('open');
  await summary.hover(); await expect(dock).toHaveAttribute('open');
  await page.mouse.move(300,100); await expect(dock).not.toHaveAttribute('open');
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(dock).toHaveAttribute('open');
  await page.keyboard.press('Tab');
  await page.mouse.move(300,100); await page.waitForTimeout(500);
  await expect(dock).toHaveAttribute('open');
  await page.keyboard.press('Escape'); await expect(dock).not.toHaveAttribute('open');
});
