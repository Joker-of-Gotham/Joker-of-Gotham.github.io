import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output='artifacts/tsukuyomi-v14-2026-09-08';

for(const theme of ['dark','light'] as const) test(`capture genuine site and clean scene posters — ${theme}`,async({page})=>{
  test.setTimeout(90000);
  await mkdir(output,{recursive:true});
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({colorScheme:theme});
  await page.goto('/');
  const root=page.locator('[data-observatory-root]');
  await expect(root).toHaveAttribute('data-render-state','ready',{timeout:20000});
  await page.waitForTimeout(1400);
  await page.screenshot({path:`${output}/home-${theme}.png`});
  // Hide descendants explicitly: frames carry visibility:visible inline.
  const hide=await page.addStyleTag({content:`.observatory > :not(.observatory-visual), .observatory > :not(.observatory-visual) *, .site-nav, .site-nav *, .skip-link, .home-scroll { visibility:hidden !important; }`});
  expect(await page.locator('.observatory-chapter-frame').evaluateAll(els=>els.every(el=>getComputedStyle(el).visibility==='hidden'))).toBe(true);
  await page.screenshot({path:`${output}/${theme==='dark'?'desktop':'day'}-world.png`});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(800);
  await page.screenshot({path:`${output}/${theme==='dark'?'phone':'phone-day'}-world.png`});
  await hide.evaluate(el=>el.remove());
  await page.screenshot({path:`${output}/home-phone-${theme}.png`});
  await page.setViewportSize({width:1440,height:900});
  for(const route of ['blog','roadmap','artifacts','about']) {
    await page.goto(`/${route}/`);
    await expect(root).toHaveAttribute('data-render-state','ready',{timeout:20000});
    await page.waitForTimeout(1000);
    await page.screenshot({path:`${output}/${route}-${theme}.png`});
  }
});
