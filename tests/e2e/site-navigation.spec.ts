import { test, expect } from '@playwright/test';
const article = '/research/notes/video2task_goal_reward/';
const topic = (section: string, path: string[]) => `/${section}/topics/${path.map(encodeURIComponent).join('/')}/`;
const parents: [string,string][] = [
  [article, topic('research',['具身智能','数据飞轮','视频数据'])],
  ['/blog/2026-08-14-agent-orchestration/',topic('blog',['agent','编排与运行时'])],
  ['/reading/reviews/random-graphs/',topic('reading',['数学','网络科学','网络科学引论','随机图'])],
  ['/musings/after-the-answer/',topic('musings',['教育','评价与成长'])],
  ['/reading/books/'+encodeURIComponent('网络科学引论')+'/',topic('reading',['数学','网络科学'])],
  [topic('reading',['数学','网络科学','网络科学引论','随机图']),'/reading/books/'+encodeURIComponent('网络科学引论')+'/'],
  ['/artifacts/campus-market-intel/','/artifacts/'],
  ['/roadmap/graph-reasoning-bench/','/roadmap/graph-ontology-schema/'],
];
for (const width of [320,768,1280]) for (const theme of ['dark','light']) {
  test(`header and display equations at ${width}px in ${theme}`, async ({page},info) => {
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.addInitScript(t=>localStorage.setItem('lunar-observatory-theme',t),theme);
    await page.goto(article);
    await expect(page.locator('#drawer-toggle,#site-sidebar,.mobile-mask')).toHaveCount(0);
    const header=page.locator('.site-nav');
    await expect(header.locator('.site-avatar')).toBeVisible();
    await expect(header.locator('.home-site-nav a')).toHaveText(['博客','研究','阅读','杂谈','作品','计划','关于']);
    const bounds=await header.locator('a,button').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,height:b.height}}));
    expect(bounds.every(b=>b.left>=0 && b.right<=width && b.height>=44)).toBe(true);
    await page.evaluate(()=>document.fonts.ready);
    const formulas=await page.locator('.content .katex-display').evaluateAll(els=>els.map(el=>{
      const outer=el.getBoundingClientRect();
      const bases=[...el.querySelectorAll(':scope > .katex > .katex-html > .base')].map(b=>b.getBoundingClientRect());
      const left=Math.min(...bases.map(b=>b.left)),right=Math.max(...bases.map(b=>b.right));
      return {align:getComputedStyle(el).textAlign,overflow:el.scrollWidth>el.clientWidth+1,delta:Math.abs((left+right)/2-(outer.left+outer.right)/2)};
    }));
    expect(formulas).toHaveLength(19);
    for (const formula of formulas) { expect(formula.align).toBe('center'); if(!formula.overflow)expect(formula.delta).toBeLessThan(2); }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    const formula=page.locator('.content .katex-display').filter({hasText:'GAN'}).first();
    await formula.scrollIntoViewIfNeeded();
    await page.screenshot({path:info.outputPath(`formulas-${width}-${theme}.png`)});
    await header.getByRole('link',{name:'搜索文章'}).click();
    await expect(page.locator('#command-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(header.getByRole('link',{name:'搜索文章'})).toBeFocused();
    await header.getByRole('link',{name:'博客',exact:true}).click();
    await expect(page).toHaveURL('/blog/');
    await page.goBack();
    await expect(page).toHaveURL(article);
    await expect(page.locator('.content-back').first()).toHaveAttribute('href',parents[0][1]);
  });
}

test('direct article loads and directory levels return to their actual parents',async({page})=>{
  test.setTimeout(90000);
  for (const [route,parent] of parents) {
    const response=await page.goto(route);expect(response?.ok(),route).toBe(true);
    const back=page.locator('.content-back').first();
    await expect(back).toBeVisible();await expect(back).toHaveAttribute('href',parent);
    await back.click();await expect(page).toHaveURL(parent);await expect(page.locator('h1')).toBeVisible();
  }
});

test('navigation and return links work without JavaScript at phone width',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
  const page=await context.newPage();await page.goto(article);
  await expect(page.locator('.home-site-nav')).toBeVisible();
  await page.locator('.content-back').first().click();await expect(page).toHaveURL(parents[0][1]);
  await page.locator('.site-nav').getByRole('link',{name:'关于',exact:true}).click();await expect(page).toHaveURL('/about/');
  await context.close();
});
