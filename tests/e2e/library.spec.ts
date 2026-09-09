import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const topic = '/research/topics/' + ['知识图谱','数据质量','质量评估'].map(encodeURIComponent).join('/') + '/';
const book = '/reading/books/' + encodeURIComponent('Google 软件工程') + '/';
const routes = ['/research/', topic, '/research/library/', '/research/notes/knowledge-graph-quality-survey/', '/reading/', book, '/reading/reviews/random-graphs/', '/musings/', '/musings/after-the-answer/'];

test('research hierarchy integrates paper readings and reflections, and deduplicates references', async ({page}) => {
  await page.goto('/research/');
  await expect(page.locator('.research-direction')).toHaveCount(3);
  await page.locator('.direction-title').filter({hasText:'知识图谱'}).click();
  await page.locator('.topic-children a').filter({hasText:'数据质量'}).click();
  await page.locator('.topic-children a').filter({hasText:'质量评估'}).click();
  await expect(page.locator('.folio-breadcrumb')).toContainText('知识图谱');
  await expect(page.locator('.folio-entry')).toHaveCount(3);
  await page.locator('.blog-filter-options > summary').click();
  await page.getByRole('button', {name:/^内容类型：/}).click();
  await page.getByRole('option', {name:'思考',exact:true}).click();
  await expect(page.locator('[data-catalogue-item]:visible')).toHaveCount(1);
  await expect(page.locator('[data-catalogue-item]:visible')).toContainText('先写下任务');
  await page.goto('/research/library/');
  await expect(page.locator('.paper-card')).toHaveCount(5);
  await expect(page.locator('.paper-card').filter({hasText:'Knowledge Graph Quality Management'}).locator('.paper-discussions a')).toHaveCount(2);
});

test('paper cards expose abstracts and original links across the research journey', async ({page, request}) => {
  await page.goto('/research/');
  await expect(page.locator('.research-papers .paper-card')).toHaveCount(3);
  await expect(page.locator('.research-papers .paper-abstract')).toHaveCount(3);
  await page.goto(topic);
  await expect(page.locator('.paper-card')).toHaveCount(2);
  await expect(page.locator('.paper-abstract').first()).toBeVisible();
  await page.goto('/research/library/');
  for (const card of await page.locator('.paper-card').all()) {
    await expect(card.locator('.paper-abstract')).toContainText('中文整理');
    expect((await card.locator('.paper-abstract > p').last().innerText()).length).toBeGreaterThan(80);
    await expect(card.getByRole('link', {name:/^论文原文：/})).toHaveAttribute('href',/^https:\/\//);
  }
  await page.getByRole('searchbox').fill('Reflexion');
  await expect(page.locator('.paper-card:visible')).toHaveCount(1);
  await expect(page.locator('.paper-card:visible .paper-discussions')).toHaveCount(0);
  await page.getByRole('searchbox').fill('Zaveri');
  await expect(page.locator('.paper-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('巨型连通分量');
  await expect(page.locator('.paper-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('未收录的论文');
  await expect(page.locator('[data-catalogue-status]')).toContainText('没有找到');
  const index = await (await request.get('/search-index.json')).json();
  const papers = index.filter((e:any) => e.kind === 'literature');
  expect(papers).toHaveLength(5);
  await page.goto('/search/?q=ReAct&kind=literature');
  await page.locator('.archive-search-result').click();
  await expect(page.locator('.paper-card:target')).toContainText('ReAct');
});

test('article thumbnails and full reading covers share the same responsive image', async ({page,request}) => {
  const index = await (await request.get('/search-index.json')).json();
  for (const entry of index.filter((e:any) => ['research','reading','musings'].includes(e.kind))) {
    const listing = entry.kind === 'musings' ? '/musings/' : entry.kind === 'reading' ? '/reading/books/'+encodeURIComponent('网络科学引论')+'/' : topic;
    // Agent notes are grouped in their own research topic.
    const path = entry.tags.find((tag:string)=>tag.includes('/'));
    await page.goto(entry.kind === 'research' && path ? '/research/topics/'+path.split('/').map(encodeURIComponent).join('/')+'/' : listing);
    const link = page.locator('.folio-entry').filter({has:page.locator(`img[data-full-src="${entry.cover}"]`)}).first();
    const thumb = link.locator('img');
    await thumb.scrollIntoViewIfNeeded();
    await expect(thumb).toHaveAttribute('data-responsive-cover','optimized');
    await expect.poll(()=>thumb.evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
    await page.goto(entry.url);
    const hero = page.locator('.archive-document-cover--image > img');
    await expect(hero).toHaveAttribute('data-full-src',entry.cover);
    await expect.poll(()=>hero.evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
    await expect(page.locator('h1')).toHaveText(entry.title);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('/musings/after-the-answer/');
  await page.getByRole('button',{name:'查看图片'}).click();
  const viewer = page.getByRole('dialog',{name:'媒体放大查看'});
  await expect(viewer.locator('img')).toBeVisible();
  await expect.poll(()=>viewer.locator('img').evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
});

test('books group canonical blog articles and support independent reviews and empty books', async ({page,request}) => {
  await page.goto('/reading/');
  await expect(page.locator('.book-card')).toHaveCount(5);
  await expect(page.locator('.folio-entry')).toHaveCount(0);
  await page.locator('.book-card').filter({hasText:'Google 软件工程'}).click();
  await expect(page.locator('.folio-entry')).toHaveCount(4);
  const original = await page.locator('.folio-entry').first().getAttribute('href');
  expect(original).toMatch(/^\/blog\//);
  await page.locator('.folio-entry').first().click();
  await expect(page.locator('.writing-links a')).toHaveAttribute('href', book);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://joker-of-gotham.github.io'+original);
  const index = await (await request.get('/search-index.json')).json();
  expect(index.filter((e:any) => e.url === original)).toHaveLength(1);
  await page.goto('/reading/books/'+encodeURIComponent('网络科学引论')+'/');
  await page.locator('.folio-entry').click();
  await expect(page).toHaveURL(/\/reading\/reviews\/random-graphs\//);
  await expect(page.locator('.writing-links a')).toHaveCount(2);
  await expect(page.locator('.katex-display')).toHaveCount(2);
  await page.goto('/reading/books/'+encodeURIComponent('人生的意义')+'/');
  await expect(page.locator('.folio-empty')).toContainText('尚未写下书评');
});

test('filters restore after navigation and selecting all; global search finds new content', async ({page}) => {
  await page.goto('/reading/');
  await page.locator('.blog-filter-options > summary').click();
  await page.getByRole('button', {name:/^书籍题材：/}).click();
  await page.getByRole('option', {name:'哲学',exact:true}).click();
  await page.locator('.blog-filter-options > summary').click();
  await expect(page.locator('.book-card:visible')).toHaveCount(2);
  await page.locator('.book-card:visible').first().click();
  await expect(page).toHaveURL(/\/reading\/books\//);
  await page.goBack();
  await expect(page).toHaveURL(/\/reading\/\?category=/);
  await expect(page.locator('.book-card:visible')).toHaveCount(2);
  await page.locator('.blog-filter-options > summary').click();
  await page.getByRole('button',{name:'书籍题材：哲学',exact:true}).click();
  await page.getByRole('option',{name:'全部题材',exact:true}).click();
  await page.locator('.blog-filter-options > summary').click();
  await expect(page.locator('.book-card:visible')).toHaveCount(5);
  await page.getByRole('searchbox',{name:'搜索书名、作者或题材'}).fill('不存在的书');
  await expect(page.locator('[data-catalogue-status]')).toContainText('没有找到');
  await page.goto('/search/?q='+encodeURIComponent('标准答案')+'&kind=musings');
  await expect(page.locator('.archive-search-result')).toHaveCount(1);
  await page.locator('.site-nav [data-command-palette-trigger]').click();
  await page.locator('#command-input').fill('人生的意义');
  await expect(page.locator('#command-results a')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.goto('/search/?q=Google&kind=reading');
  await expect(page.locator('.archive-search-result')).toHaveCount(4);
});

for (const theme of ['dark','light'] as const) {
  test(`new content reflows and stays accessible in ${theme}`, async ({browser}) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({reducedMotion:'reduce'});
    await context.addInitScript(t => localStorage.setItem('lunar-observatory-theme', t), theme);
    const page = await context.newPage();
    const errors:string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [320,768,1280]) {
      await page.setViewportSize({width,height:900});
      for (const route of routes) {
        const response = await page.goto(route);
        expect(response?.ok(),route).toBe(true);
        await expect(page.locator('h1')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth),route).toBeLessThanOrEqual(1);
        if (width === 320 && ['/research/', '/musings/after-the-answer/'].includes(route)) {
          await page.screenshot({path:`.playwright-results/library-${theme}-${route.startsWith('/research') ? 'papers' : 'cover'}-320.png`,fullPage:true});
        }
        if (width === 1280) {
          const audit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
          expect(audit.violations,route).toEqual([]);
        }
      }
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('without JavaScript all new content stays navigable', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled:false, viewport:{width:390,height:844}});
  const page = await context.newPage();
  await page.goto('/research/');
  await expect(page.locator('[data-catalogue-controls]')).toBeHidden();
  await page.locator('.direction-title').filter({hasText:'知识图谱'}).click();
  await expect(page.locator('h1')).toHaveText('知识图谱');
  await page.goto(book);
  await page.locator('.folio-entry').first().click();
  await expect(page.locator('.writing-links')).toBeVisible();
  await context.close();
});
