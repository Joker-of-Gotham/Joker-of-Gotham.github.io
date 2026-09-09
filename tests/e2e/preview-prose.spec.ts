import { test, expect } from '@playwright/test';

const forbidden = 'pre,table,ul,ol,li,blockquote,h1,h2,h3,h4,h5,h6,img,picture,iframe,script,.katex-display,.katex-error,a,button,input';

test('all published previews contain prose and inline Markdown only', async ({ page, request }) => {
  const rows = await (await request.get('/search-index.json')).json();
  const previews = rows.filter((row: any) => typeof row.summaryHtml === 'string');
  expect(previews.length).toBeGreaterThan(40);
  await page.goto('/blog/');
  const issues = await page.evaluate(({ previews, forbidden }) => {
    return previews.flatMap((row: any) => {
      const host = document.createElement('div');
      host.innerHTML = row.summaryHtml;
      const blocks = [...host.querySelectorAll(forbidden)].map(el => el.tagName);
      const paragraphs = host.querySelectorAll('p').length;
      host.querySelectorAll('code,.katex').forEach(el => el.remove());
      const raw = host.textContent?.match(/<\/?(?:img|iframe|table)\b|\*\*|\$\$|```|!\[/);
      return blocks.length || paragraphs > 1 || raw ? [{ title: row.title, blocks, paragraphs, raw: raw?.[0] }] : [];
    });
  }, { previews, forbidden });
  expect(issues).toEqual([]);
});

test('real image and emphasis truncations are clean in blog, book and search lists', async ({ page }, testInfo) => {
  for (const route of ['/blog/', '/reading/books/'+encodeURIComponent('图论导论')+'/', '/research/', '/musings/']) {
    await page.goto(route);
    await expect(page.locator('.markdown-preview').locator(forbidden)).toHaveCount(0);
  }
  await page.goto('/blog/');
  await page.locator('#blog-query').fill('平面图');
  const planar = page.locator('[data-blog-item]:visible');
  await expect(planar).toHaveCount(1);
  await expect(planar.locator('.markdown-preview')).toContainText('瓦格勒');
  await expect(planar.locator('.markdown-preview')).not.toContainText('**');
  await page.screenshot({ path: testInfo.outputPath('planar-preview.png') });
  await page.locator('#blog-query').fill('deepseek');
  const deepseek = page.locator('[data-blog-item]:visible').first();
  await expect(deepseek).toBeVisible();
  await expect(deepseek.locator('.markdown-preview')).not.toContainText('<img');
  await page.screenshot({ path: testInfo.outputPath('deepseek-preview.png') });
  await page.goto('/search/?q='+encodeURIComponent('平面图'));
  const result = page.locator('.archive-search-result').filter({has: page.getByRole('heading', {name:'《图论导论》平面图', exact:true})});
  await expect(result).toHaveCount(1);
  await expect(result.locator('.markdown-preview')).not.toContainText('**');
  await expect(page.locator('.archive-search-result .markdown-preview').locator(forbidden)).toHaveCount(0);
});
