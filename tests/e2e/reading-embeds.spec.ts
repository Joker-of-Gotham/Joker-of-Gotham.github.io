import { test, expect } from '@playwright/test';
const topic = '/research/topics/' + ['具身智能','自主学习','模型结构'].map(encodeURIComponent).join('/') + '/';

for (const width of [320,768,1280]) test(`interactive atlas is usable at ${width}px`, async ({page},info) => {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(topic);
  const frameElement=page.locator('.html-embed iframe');
  await frameElement.scrollIntoViewIfNeeded();
  const atlas=page.frameLocator('.html-embed iframe');
  await expect(atlas.locator('#atlas-svg')).toBeVisible();
  await expect(page.locator('.paper-card')).toHaveCount(30);
  await expect(page.locator('.paper-abstract').filter({hasText:'摘要待补充'})).toHaveCount(0);
  for(const tab of ['vla','wm','wam','overview']) {
    await atlas.locator(`[data-tab="${tab}"]`).click();
    await expect(atlas.locator(`[data-tab="${tab}"]`)).toHaveAttribute('aria-pressed','true');
    await expect(atlas.locator('#atlas-svg')).toBeVisible();
  }
  const original=await atlas.locator('#zoomVal').textContent();
  await atlas.locator('#plus').click();
  await expect(atlas.locator('#zoomVal')).not.toHaveText(original!);
  await atlas.locator('#fit').click();
  if(await atlas.locator('#models-toggle').isVisible()) await atlas.locator('#models-toggle').click();
  await atlas.getByRole('textbox',{name:'搜索模型'}).fill('GE-Act');
  await expect(atlas.locator('.entry')).toHaveCount(1);
  await atlas.locator('.entry').click();
  await expect(atlas.locator('#selection a')).toHaveAttribute('href','https://arxiv.org/abs/2609.05588');
  await atlas.locator('#fit').click();
  await page.locator('[data-theme-toggle]').click();
  await expect(atlas.locator('body')).toHaveClass('light');
  const overflow=await frameElement.evaluate(frame => (frame as HTMLIFrameElement).getBoundingClientRect().width);
  expect(overflow).toBeLessThanOrEqual(width);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:info.outputPath(`atlas-${width}.png`)});
  await page.locator('.embed-fullscreen').click();
  await expect.poll(()=>page.evaluate(()=>document.fullscreenElement?.className)).toBe('html-embed');
  const fullscreen=await page.locator('.html-embed').boundingBox();
  expect(fullscreen?.width).toBeCloseTo(width,0);
  expect(fullscreen?.height).toBeCloseTo(900,0);
  await page.evaluate(()=>document.exitFullscreen());
  await page.locator('.site-nav a[href="/research/"]').click();
  await expect(page).toHaveURL(/\/research\/$/);
  await expect(page.locator('h1')).toHaveText('研究');
  await page.goBack();
  await expect(page).toHaveURL(topic);
  await page.locator('.html-embed iframe').scrollIntoViewIfNeeded();
  await expect(page.locator('.embed-fullscreen')).toHaveCount(1);
  await expect(page.frameLocator('.html-embed iframe').locator('#atlas-svg')).toBeVisible();
  expect(errors).toEqual([]);
});

test('native article video loads, plays, seeks and pauses on route change',async({page})=>{
  await page.goto('/research/notes/vla-series/');
  await page.evaluate(()=>{
    const video=document.createElement('video');
    video.src='/assets/img/observatory/about-signal-loop.mp4'; video.muted=true;
    document.querySelector('.content')!.prepend(video);
    document.dispatchEvent(new Event('astro:page-load'));
  });
  const video=page.locator('.content video');
  await expect(video).toHaveAttribute('controls','');
  await expect(video).toHaveAttribute('playsinline','');
  await expect(video).toHaveAttribute('preload','metadata');
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThan(0);
  await video.evaluate((v:HTMLVideoElement)=>v.play());
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0);
  await video.evaluate((v:HTMLVideoElement)=>{v.pause();v.currentTime=Math.min(1,v.duration/2);});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
  await video.evaluate((v:HTMLVideoElement)=>{Reflect.set(window,'testedVideo',v);return v.play();});
  await page.locator('.site-nav a[href="/research/"]').click();
  await expect(page).toHaveURL(/\/research\/$/);
  expect(await page.evaluate(()=>Reflect.get(window,'testedVideo').paused)).toBe(true);
});

test('HTML embeds retain independent and static fallback links without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
  const page=await context.newPage();await page.goto(topic);
  await expect(page.getByRole('link',{name:'独立页面查看 ↗'})).toBeVisible();
  const svg=await page.request.get('/embeds/embodied-architecture-atlas/overview.svg');
  expect(svg.ok()).toBe(true);expect(await svg.text()).toContain('<svg');
  await context.close();
});
