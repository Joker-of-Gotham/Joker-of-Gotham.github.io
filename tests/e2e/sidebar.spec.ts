import { test, expect } from '@playwright/test';

const topic = '/research/topics/' + ['知识图谱','数据质量','质量评估'].map(encodeURIComponent).join('/') + '/';
const routes = ['/', '/blog/', '/research/', '/reading/', '/musings/', '/artifacts/', '/about/', '/roadmap/', '/search/', '/research/library/', topic,
  '/reading/books/'+encodeURIComponent('Google 软件工程')+'/', '/research/notes/knowledge-graph-quality-survey/', '/reading/reviews/random-graphs/', '/musings/after-the-answer/', '/blog/2026-08-14-agent-orchestration/'];

async function expectOpenAndClickable(page: import('@playwright/test').Page) {
  const sidebar = page.locator('#site-sidebar');
  await expect(sidebar).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('.mobile-mask')).toHaveCount(1);
  // Visibility/ARIA alone missed the old bug: the backdrop painted above the drawer.
  await expect.poll(() => page.locator('[data-sidebar-close]').evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  })).toBe(true);
  await expect(page.locator('.main-area')).toHaveAttribute('inert','');
}

for (const width of [390,1280]) for (const theme of ['dark','light']) {
  test(`sidebar controls receive clicks on every page type — ${width} ${theme}`, async ({page}) => {
    test.setTimeout(120_000);
    await page.setViewportSize({width,height:844});
    await page.addInitScript(t=>localStorage.setItem('lunar-observatory-theme',t),theme);
    for (const route of routes) {
      await page.goto(route);
      await page.locator('#drawer-toggle').click();
      await expectOpenAndClickable(page);
      await page.locator('[data-sidebar-close]').click();
      await expect(page.locator('#site-sidebar')).toHaveAttribute('aria-hidden','true');
      await expect(page.locator('.mobile-mask')).toHaveCount(0);
      await expect(page.locator('#drawer-toggle')).toBeFocused();
      await expect(page.locator('.main-area')).not.toHaveAttribute('inert');
    }
  });
}

test('sidebar navigation, history and backdrop reset between page shells', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/research/library/');
  for (const route of ['/research/', '/', '/blog/', '/reading/', '/musings/', '/artifacts/', '/about/', '/roadmap/']) {
    await page.locator('#drawer-toggle').click();
    await expectOpenAndClickable(page);
    await page.locator(`#site-sidebar .sidebar-nav a[href="${route}"]`).click();
    await expect(page).toHaveURL(url => url.pathname === route);
    await expect(page.locator('.mobile-mask')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveAttribute('data-drawer-open');
    await expect(page.locator('.main-area')).not.toHaveAttribute('inert');
  }
  await page.goBack();
  await page.locator('#drawer-toggle').click();
  await expectOpenAndClickable(page);
  await page.locator('.mobile-mask').click({position:{x:380,y:400}});
  await expect(page.locator('.mobile-mask')).toHaveCount(0);
  await page.goForward();
  await page.locator('#drawer-toggle').click();
  await expectOpenAndClickable(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer-toggle')).toBeFocused();
});

test('drawer scroll, keyboard focus and search handoff stay usable', async ({page}) => {
  await page.setViewportSize({width:390,height:600});
  await page.goto('/research/');
  await page.evaluate(()=>scrollTo({top:400,behavior:'instant'}));
  const readingPosition = await page.evaluate(()=>scrollY);
  await page.locator('#drawer-toggle').click();
  await expectOpenAndClickable(page);
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.sidebar-search-button')).toBeFocused();
  await expect.poll(()=>page.locator('#site-sidebar').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-sidebar-close]')).toBeFocused();
  await page.locator('.sidebar-search-button').click();
  await expect(page.locator('#command-input')).toBeFocused();
  await expect(page.locator('.mobile-mask')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer-toggle')).toBeFocused();
  await page.locator('#drawer-toggle').click();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#command-input')).toBeFocused();
  await expect(page.locator('.mobile-mask')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer-toggle')).toBeFocused();
  await expect(page.locator('.main-area')).not.toHaveAttribute('inert');
  await page.locator('#drawer-toggle').click();
  await expectOpenAndClickable(page);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>scrollY)).toBe(readingPosition);
});
