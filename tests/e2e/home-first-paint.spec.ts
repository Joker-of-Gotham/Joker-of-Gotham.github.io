import { test, expect } from '@playwright/test';

for (const viewport of [{width:757,height:899}, {width:390,height:844}, {width:960,height:480}]) {
  test(`intro is correctly composed before any module loads at ${viewport.width}x${viewport.height}`, async ({page}, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route('https://fonts.googleapis.com/**', route=>route.abort());
    let release!: ()=>void;
    const pending = new Promise<void>(resolve=>{release=resolve;});
    await page.route('**/_astro/*.js', async route=>{await pending; await route.continue();});
    try {
      await page.goto('/', {waitUntil:'commit'});
      const intro=page.locator('.home-intro');
      await expect(intro).toBeVisible();
      await expect(intro).toHaveCSS('position','absolute');
      await expect(intro).toHaveCSS('text-align','center');
      const before=await intro.boundingBox();
      expect(before!.y).toBeGreaterThan(viewport.height*.5);
      expect(before!.y+before!.height).toBeLessThanOrEqual(viewport.height);
      expect(Math.abs(before!.x+before!.width/2-viewport.width/2)).toBeLessThan(1);
      const next=await page.locator('#observe').boundingBox();
      expect(next!.y).toBeGreaterThanOrEqual(viewport.height);
      await page.screenshot({path:testInfo.outputPath('before-modules.png')});
      release();
      await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-render-state','ready',{timeout:20000});
      await expect(intro).toHaveCSS('position','fixed');
      const after=await intro.boundingBox();
      for(const key of ['x','y','width'] as const) expect(Math.abs(after![key]-before![key])).toBeLessThan(1);
      // Repeated lifecycle notifications must not reset a live composition.
      await page.evaluate(()=>{
        const root=document.querySelector('[data-observatory-root]')!;
        const mutations: string[]=[];
        new MutationObserver(rows=>rows.forEach(row=>mutations.push(row.oldValue??''))).observe(root,{attributes:true,attributeFilter:['data-dom-motion'],attributeOldValue:true});
        Reflect.set(window,'motionMutations',mutations);
        document.dispatchEvent(new Event('astro:page-load'));
        window.dispatchEvent(new Event('pageshow'));
      });
      await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-dom-motion','active');
      expect(await page.evaluate(()=>Reflect.get(window,'motionMutations'))).not.toContain('');
      await page.screenshot({path:testInfo.outputPath('ready.png')});
    } finally { release(); }
  });
}

test('new user-authored research directories and their illustration are published together', async ({page})=>{
  await page.goto('/research/topics/'+['具身智能','数据飞轮','视频数据'].map(encodeURIComponent).join('/')+'/');
  await expect(page.locator('h1')).toHaveText('视频数据');
  const illustration=page.locator('.content img').first();
  await illustration.scrollIntoViewIfNeeded();
  await expect.poll(()=>illustration.evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
});
