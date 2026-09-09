import AxeBuilder from '@axe-core/playwright';
import {test,expect} from '@playwright/test';
const blog='/blog/topics/graph_theory/'+encodeURIComponent('图论导论')+'/';
const reading='/reading/topics/'+['数学','网络科学','网络科学引论','随机图'].map(encodeURIComponent).join('/')+'/';
const musings='/musings/topics/'+['教育','评价与成长'].map(encodeURIComponent).join('/')+'/';
test('directory introductions precede existing article components and link through their parents',async({page})=>{
  await page.goto(blog);
  await expect(page.locator('h1')).toHaveText('图论导论');
  await expect(page.locator('.topic-overview')).toContainText('阅读顺序');
  await expect(page.locator('[data-blog-item]')).toHaveCount(5);
  await page.locator('[data-blog-item]').filter({hasText:'定义与案例'}).click();
  await expect(page).toHaveURL(/\/blog\/2025-07-08-/);
  await page.getByRole('navigation',{name:'所属目录'}).getByRole('link',{name:'图论导论',exact:true}).click();
  await expect(page).toHaveURL(blog);
  await page.goto(reading);
  await expect(page.locator('.topic-overview strong')).toContainText('随机图模型');
  await expect(page.locator('.folio-entry')).toHaveCount(1);
  await page.locator('.folio-breadcrumb').getByRole('link',{name:'网络科学引论',exact:true}).click();
  await expect(page.locator('h1')).toHaveText('网络科学引论');
  await page.getByRole('navigation',{name:'书内目录'}).getByRole('link',{name:/随机图/}).click();
  await expect(page).toHaveURL(reading);
  await page.goto(musings);
  await expect(page.locator('.topic-overview')).toContainText('外部评判');
  await page.locator('.folio-entry').click();
  await expect(page).toHaveURL('/musings/after-the-answer/');
});

test('introductions never become articles and every new directory is indexed once',async({request})=>{
  const index=await(await request.get('/search-index.json')).json();
  const articles=index.filter((e:any)=>['blog','reading','research','musings'].includes(e.kind));
  expect(articles.length).toBeGreaterThan(0);
  expect(articles.some((e:any)=>e.url.includes('/topics/'))).toBe(false);
  expect(articles.some((e:any)=>/\/index\/$/.test(e.url))).toBe(false);
  const directories=index.filter((e:any)=>e.kind==='directory');
  expect(directories.length).toBeGreaterThan(20);
  expect(new Set(index.map((e:any)=>e.url)).size).toBe(index.length);
  for(const d of directories)expect((await request.get(d.url)).ok(),d.url).toBe(true);
});

test('deep directory pages work at narrow widths in both themes without accessibility violations',async({browser})=>{
  for(const theme of ['dark','light']){
    const context=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce'});
    await context.addInitScript(t=>localStorage.setItem('lunar-observatory-theme',t),theme);
    const page=await context.newPage();
    for(const route of [blog,reading,musings]){
      await page.goto(route);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
      expect(audit.violations,`${theme} ${route}`).toEqual([]);
    }
    await page.goto(reading);
    await page.screenshot({path:`.playwright-results/directories-${theme}-320.png`,fullPage:true});
    await context.close();
  }
});

test('directory navigation remains usable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto('/reading/books/'+encodeURIComponent('网络科学引论')+'/');
  await page.getByRole('navigation',{name:'书内目录'}).getByRole('link',{name:/随机图/}).click();
  await expect(page.locator('.topic-overview')).toBeVisible();
  await page.locator('.folio-entry').click();
  await expect(page).toHaveURL('/reading/reviews/random-graphs/');
  await context.close();
});
