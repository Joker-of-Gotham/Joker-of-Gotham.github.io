import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import { renderPreview } from '../../src/lib/markdown/preview';

test('every published writing preview comes from its own YAML summary', async ({ request }) => {
  const response = await request.get('/search-index.json');
  const index = await response.json();
  const rows = Array.isArray(index) ? index : index.items;
  let checked = 0;
  async function audit(directory: string, section: string) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, item.name);
      if (item.isDirectory()) { await audit(path, section); continue; }
      if (!/\.mdx?$/.test(item.name) || /^index\.mdx?$/.test(item.name)) continue;
      const { data } = matter(await readFile(path, 'utf8'));
      if (data.draft || data.published === false || ['overview','book','reference'].includes(data.kind)) continue;
      const row = rows.find((r: any) => r.kind === section && r.title === data.title);
      if (!row) continue; // Directory introductions and bibliographic records are not articles.
      const preview = await renderPreview(data.summary ?? '');
      expect(row.summaryHtml, path).toBe(preview.html);
      expect(row.summary, path).toBe(preview.text);
      checked++;
    }
  }
  for (const section of ['blog','research','reading','musings']) await audit(`src/content/${section}`, section);
  expect(checked).toBe(rows.filter((r: any) => ['blog','research','reading','musings'].includes(r.kind)).length);
  expect(checked).toBeGreaterThan(40);
});

for (const theme of ['dark', 'light']) {
  test(`navigation, history and icon preserve ${theme} theme without separate world snapshots`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1000, height: 850 });
    await page.addInitScript(theme => {
      localStorage.setItem('lunar-observatory-theme', theme);
      Reflect.set(window, 'transitionSamples', []);
      document.addEventListener('astro:before-swap', (event: any) => {
        const started = performance.now();
        event.viewTransition.ready.then(() => {
          const world = document.querySelector('[data-observatory-visual]')!;
          const sample = {
            path: location.pathname,
            theme: document.documentElement.dataset.theme,
            world: getComputedStyle(world).viewTransitionName,
            background: getComputedStyle(world).backgroundColor,
            animations: document.getAnimations().map(a => (a.effect as KeyframeEffect | null)?.pseudoElement).filter(Boolean),
            completedMs: 0,
          };
          Reflect.get(window, 'transitionSamples').push(sample);
          event.viewTransition.finished.then(() => { sample.completedMs = performance.now() - started; });
        });
      });
    }, theme);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/blog/');
    const root = page.locator('[data-observatory-root]');
    await expect(root).toHaveAttribute('data-render-state', /ready|static|degraded/);
    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toHaveText('');
    await expect(toggle).toHaveAccessibleName(/切换至/);
    await expect(toggle.locator(theme === 'dark' ? '.theme-icon-sun' : '.theme-icon-moon')).toHaveCSS('opacity', '1');
    const article = page.locator('a.journal-lead');
    const href = await article.getAttribute('href');
    await article.click();
    await expect(page).toHaveURL(href!);
    await expect(root).toHaveAttribute('data-scene-dormant','true');
    await page.goBack();
    await expect(page).toHaveURL('/blog/');
    await page.goForward();
    await expect(page).toHaveURL(href!);
    await page.locator('.site-nav a[href="/research/"]').click();
    await expect(page).toHaveURL('/research/');
    await page.locator('.site-nav a[href="/reading/"]').click();
    await expect(page).toHaveURL('/reading/');
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'transitionSamples').filter((s: any) => s.completedMs > 0).length)).toBe(5);
    const samples = await page.evaluate(() => Reflect.get(window, 'transitionSamples'));
    for (const sample of samples) {
      expect(sample.theme).toBe(theme);
      expect(sample.world).toBe('none');
      expect(sample.background).toBe(theme === 'dark' ? 'rgb(14, 12, 19)' : 'rgb(248, 243, 235)');
      expect(sample.animations.some((name: string) => /tsukuyomi-world|page-content|scene-shade/.test(name))).toBe(false);
    }
    await testInfo.attach('navigation-timing', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
    await page.setViewportSize({ width: 390, height: 844 });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
    await expect(toggle.locator(theme === 'dark' ? '.theme-icon-moon' : '.theme-icon-sun')).toHaveCSS('opacity', '1');
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath('theme-icon-mobile.png') });
    expect(errors).toEqual([]);
  });
}
