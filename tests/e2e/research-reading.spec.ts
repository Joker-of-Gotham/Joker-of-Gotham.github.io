import { test, expect } from '@playwright/test';
const topic = '/research/topics/' + ['具身智能','数据飞轮','视频数据'].map(encodeURIComponent).join('/') + '/';
const blog = '/blog/2025-08-11-前端开发-四/';
const note = '/research/notes/knowledge-graph-quality-survey/';

for (const theme of ['dark','light']) for (const width of [1440,390]) {
  test(`research body shares blog typography and reading controls — ${theme} ${width}`, async ({page}, info) => {
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.addInitScript(t => localStorage.setItem('lunar-observatory-theme',t),theme);
    const typography = () => page.locator('.archive-prose').evaluate(el => {
      const styles = (node: Element) => {
        const s = getComputedStyle(node);
        return [s.fontSize,s.lineHeight,s.fontWeight,s.marginTop,s.marginBottom,s.color];
      };
      return {p:styles(el.querySelector(':scope > p')!), h2:styles(el.querySelector('h2')!)};
    });
    await page.goto(blog);
    const reference = await typography();
    for (const route of [topic,note]) {
      await page.goto(route);
      expect(await typography()).toEqual(reference);
      await expect(page.locator('.article-reading')).toHaveCount(1);
      const count=await page.locator('.archive-prose :is(h2,h3,h4,h5,h6)[id]').count();
      await expect(page.locator('[data-toc-link]')).toHaveCount(count);
      await page.locator('.reading-outline summary').click();
      await expect(page.locator('.outline-scroll')).toBeVisible();
      await page.locator('[data-toc-link]').first().click();
      expect(new URL(page.url()).hash).not.toBe('');
      await page.keyboard.press('Escape');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.goto(topic);
    await expect(page.locator('.katex-error')).toHaveCount(0);
    expect(await page.locator('.katex-display').count()).toBeGreaterThan(1);
    await page.locator('.katex-display').first().scrollIntoViewIfNeeded();
    await expect(page.locator('.katex-display').first()).toHaveAttribute('role','region');
    const image=page.locator('.content img').first();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
    await image.click();
    await expect(page.getByRole('dialog',{name:'媒体放大查看'})).toBeVisible();
    await page.keyboard.press('Escape');
    const table=page.locator('.table-wrap').first();
    await table.scrollIntoViewIfNeeded();
    await table.getByRole('button',{name:'放大查看'}).click();
    await expect(page.getByRole('dialog',{name:'媒体放大查看'}).locator('table')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('.archive-prose h2').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:info.outputPath('research-body.png')});
    await page.locator('.topic-navigation summary').scrollIntoViewIfNeeded();
    await page.locator('.topic-navigation summary').click();
    await expect(page.getByRole('navigation',{name:'研究专题'})).toBeVisible();
  });
}

test('research outline and body remain readable without client scripts', async ({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto(topic);
  await expect(page.locator('.archive-prose')).toBeVisible();
  await page.locator('.reading-outline summary').click();
  await page.locator('[data-toc-link]').first().click();
  expect(new URL(page.url()).hash).not.toBe('');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await context.close();
});
