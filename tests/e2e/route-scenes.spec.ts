import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const output='artifacts/tsukuyomi-v13-2026-09-08';

test('home entry retains the same live canvas in Blog, freezes the viewpoint and restores home on back', async({page})=>{
  test.setTimeout(60000);
  await mkdir(output,{recursive:true});
  const errors:string[]=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/');
  const root=page.locator('[data-observatory-root]');
  await expect(root).toHaveAttribute('data-render-state','ready');
  await page.locator('canvas[data-observatory-canvas]').evaluate(canvas => Reflect.set(window,'retainedCanvas',canvas));
  await page.locator('.home-intro a').click();
  await expect(page).toHaveURL(/\/blog\/\?scene=signal-gate$/);
  await expect(root).toHaveAttribute('data-scene-chapter','signal-gate');
  await expect(root).toHaveAttribute('data-render-state','ready');
  expect(await root.locator('canvas').evaluate(canvas=>canvas===Reflect.get(window,'retainedCanvas'))).toBe(true);
  await expect.poll(()=>root.getAttribute('data-camera-progress')).toBe('0.00000');
  await page.mouse.wheel(0,800); await page.waitForTimeout(700);
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(100);
  expect(await root.getAttribute('data-camera-progress')).toBe('0.00000');
  await page.screenshot({path:`${output}/blog-retained.png`});
  await page.goBack(); await expect(page).toHaveURL(/\/$/);
  await expect(root).toHaveAttribute('data-dom-motion','active');
  expect(await root.locator('canvas').evaluate(canvas=>canvas===Reflect.get(window,'retainedCanvas'))).toBe(true);
  await expect(page.locator('.home-intro')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('fixed route viewpoints survive reload and scroll, and detail reading pauses WebGL',async({page})=>{
  test.setTimeout(90000);
  await mkdir(output,{recursive:true});
  for(const [path,chapter,index] of [['blog','observe',1],['roadmap','structure',2],['artifacts','orchestrate',3],['about','embodiment',4]] as const){
    await page.goto(`/${path}/?scene=${chapter}`);
    const root=page.locator('[data-observatory-root]');
    await expect(root).toHaveAttribute('data-render-state','ready');
    await expect(root).toHaveAttribute('data-active-chapter',chapter);
    await expect.poll(()=>root.getAttribute('data-camera-progress')).toBe(index.toFixed(5));
    await page.mouse.wheel(0,600); await page.waitForTimeout(500);
    expect(await root.getAttribute('data-camera-progress')).toBe(index.toFixed(5));
    await page.screenshot({path:`${output}/${path}-scene.png`});
  }
  await page.goto('/blog/?scene=signal-gate');
  await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-render-state','ready');
  await page.locator('a.journal-lead').click();
  await expect(page).toHaveURL(/\/blog\/[^/?]+\/$/);
  await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-animation-active','false');
  await page.goBack();
  await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-render-state','ready');
});

test('shared header, sidebar and scenery are usable on a narrow light page and reduced motion',async({page})=>{
  await mkdir(output,{recursive:true});
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  for(const path of ['/','/artifacts/','/blog/2026-08-14-agent-orchestration/']) {
    await page.goto(path);
    const header=page.locator('.site-nav');
    await expect(header.getByText('Komari',{exact:true})).toBeVisible();
    const controls=await header.locator('a,button').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().width>0).map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})));
    expect(controls.every(box=>box.left>=0 && box.right<=390)).toBe(true);
    await page.locator('#drawer-toggle').click();
    await expect(page.locator('#site-sidebar')).toHaveAttribute('aria-hidden','false');
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-sidebar')).toHaveAttribute('aria-hidden','true');
    await page.screenshot({path:`${output}/header-${path==='/'?'home':path.includes('artifacts')?'artifacts':'article'}-phone.png`});
  }
});

test('each home section opens its own retained scene and keeps that context through history',async({page})=>{
  test.setTimeout(90000);
  await page.emulateMedia({colorScheme:'dark'});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  const root=page.locator('[data-observatory-root]');
  await expect(root).toHaveAttribute('data-render-state','ready');
  await root.locator('canvas').evaluate(canvas=>Reflect.set(window,'journeyCanvas',canvas));
  for(const [chapter,label,path,index] of [
    ['observe','全部文章','blog',1], ['structure','方向与进展','roadmap',2],
    ['orchestrate','全部作品','artifacts',3], ['embodiment','阅读简介','about',4]
  ] as const) {
    await page.locator(`#${chapter}`).evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:'instant'}));
    await expect(root).toHaveAttribute('data-active-chapter',chapter);
    await page.locator(`#${chapter}`).getByRole('link',{name:label,exact:false}).click();
    await expect(page).toHaveURL(new RegExp(`/${path}/\\?scene=${chapter}$`));
    await expect(root).toHaveAttribute('data-render-state','ready');
    await expect.poll(()=>root.getAttribute('data-camera-progress')).toBe(index.toFixed(5));
    expect(await root.locator('canvas').evaluate(canvas=>canvas===Reflect.get(window,'journeyCanvas'))).toBe(true);
    await page.locator('[data-theme-toggle]').click();
    await expect(root).toHaveAttribute('data-resolved-theme','light');
    await page.locator('[data-theme-toggle]').click();
    await page.goBack();
    await expect(root).toHaveAttribute('data-dom-motion','active');
    await expect(root).toHaveAttribute('data-active-chapter',chapter);
  }
  expect(errors).toEqual([]);
});
