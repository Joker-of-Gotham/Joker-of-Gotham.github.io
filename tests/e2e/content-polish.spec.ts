import AxeBuilder from '@axe-core/playwright';
import {test, expect} from '@playwright/test';

test('research sequence and plan navigation use the requested labels', async ({page}) => {
  await page.goto('/research/');
  await expect(page.locator('.folio-page > .folio-section > .folio-section-head > h2')).toHaveText(['研究方向','研读札记','论文收藏']);
  const links = await page.locator('.sidebar-nav').first().locator('a').allTextContents();
  expect(links.map(s=>s.trim()).slice(-2)).toEqual(['计划','关于']);
  await page.goto('/roadmap/');
  await expect(page.locator('h1')).toHaveText('计划');
  await expect(page).toHaveTitle(/^计划/);
  for (const route of ['/research/','/research/library/','/reading/','/musings/','/blog/','/search/']) {
    await page.goto(route);
    await expect(page.getByRole('button',{name:/重置|reset/i,includeHidden:true})).toHaveCount(0);
  }
});

test('the same real article renders Markdown consistently in book, blog and search lists', async ({page}) => {
  await page.goto('/reading/books/'+encodeURIComponent('图论导论')+'/');
  const entry = page.locator('.folio-entry').filter({hasText:'路径和环'});
  await expect(entry.locator('strong')).not.toHaveCount(0);
  await expect(entry.locator('.katex')).not.toHaveCount(0);
  await expect(entry.locator('.katex-error')).toHaveCount(0);
  await expect(entry.locator('.markdown-preview :is(a,button,input,[tabindex])')).toHaveCount(0);
  const html = await entry.locator('.markdown-preview').innerHTML();
  await page.goto('/blog/');
  const blog = page.locator('[data-blog-item]').filter({hasText:'路径和环'});
  expect(await blog.locator('.markdown-preview').innerHTML()).toBe(html);
  await page.goto('/search/?q='+encodeURIComponent('路径和环'));
  await expect(page.locator('.archive-search-result')).toHaveCount(1);
  expect(await page.locator('.archive-search-result .markdown-preview').innerHTML()).toBe(html);
});

for (const theme of ['light','dark']) {
  test(`expanded filters support keyboard selection and fit narrow layouts in ${theme}`, async ({browser}) => {
    const context = await browser.newContext({reducedMotion:'reduce'});
    await context.addInitScript(t=>localStorage.setItem('lunar-observatory-theme',t),theme);
    const page = await context.newPage();
    for (const width of [320,1280]) {
      await page.setViewportSize({width,height:900});
      await page.goto('/reading/');
      await page.locator('.blog-filter-options > summary').click();
      const trigger = page.getByRole('button',{name:/^阅读状态：/});
      await trigger.focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('option',{name:'全部状态',exact:true})).toBeFocused();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
      const audit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({path:`.playwright-results/filters-${theme}-${width}.png`,fullPage:true});
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded','false');
      await expect(page).toHaveURL(/status=/);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Home');
      await page.keyboard.press('Enter');
      await expect(page.locator('.book-card:visible')).toHaveCount(5);
      await expect(page).not.toHaveURL(/status=/);
      await trigger.click();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded','false');
    }
    await context.close();
  });
}
