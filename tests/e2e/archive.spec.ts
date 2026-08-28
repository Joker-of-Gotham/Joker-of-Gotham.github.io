import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/blog/", "/artifacts/", "/roadmap/", "/search/", "/about/"];

for (const route of routes) {
  test(`${route} renders its archive surface without uncaught errors`, async ({ page }) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && new URL(response.url()).origin === "http://127.0.0.1:4321") {
        failures.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) {
        failures.push(message.text());
      }
    });

    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(failures).toEqual([]);
  });

  test(`${route} has no WCAG A/AA automated violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("archive surfaces reflow at 320 CSS pixels", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const page = await context.newPage();

  for (const route of routes) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  }

  await context.close();
});

test("command palette opens from the standard archive shell", async ({ page }) => {
  await page.goto("/blog/");
  await page.locator(".topbar [data-command-palette-trigger]").click();
  await expect(page.locator("#command-root")).toBeVisible();
  await expect(page.locator("#command-input")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#command-root")).toBeHidden();
});

test("rich article content stays readable and scrolls locally at 320px in both themes", async ({ browser }) => {
  for (const theme of ["dark", "light"] as const) {
    const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
    await context.addInitScript((preference) => {
      localStorage.setItem("lunar-observatory-theme", preference);
    }, theme);
    const page = await context.newPage();
    await page.goto("/blog/2026-08-14-agent-orchestration/");
    await page.locator(".archive-prose").waitFor();
    await page.locator(".table-wrap").first().waitFor();

    expect(await page.locator("h1").count(), `${theme} document H1 count`).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

    const code = page.locator("pre.astro-code:not([data-language='mermaid'])").first();
    await expect(code).toBeVisible();
    const codeStyle = await code.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor, overflowX: style.overflowX };
    });
    expect(codeStyle.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(codeStyle.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(["auto", "scroll"]).toContain(codeStyle.overflowX);

    const overflowOffenders = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".archive-prose img, .archive-prose .image-grid, .archive-prose .table-wrap, .archive-prose pre"))
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.left < -1 || rect.right > window.innerWidth + 1)
        .map(({ element, rect }) => `${element.tagName}.${element.className}:${rect.left.toFixed(1)}..${rect.right.toFixed(1)}`)
    );
    expect(overflowOffenders).toEqual([]);

    await context.close();
  }
});

test("detail pages keep document overflow contained across representative widths", async ({ browser }) => {
  const detailRoutes = [
    "/blog/2026-08-14-agent-orchestration/",
    "/blog/2026-07-20-ontology-02/",
    "/blog/2025-07-08-图论导论-定义与案例/"
  ];

  for (const width of [320, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of detailRoutes) {
      await page.goto(route);
      await page.locator(".archive-prose").waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
    await context.close();
  }
});

test("Markdown overflow regions and task lists remain keyboard-accessible", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
  const page = await context.newPage();

  await page.goto("/blog/2025-07-18-reinforcement-learning/");
  const formula = page.locator(".content .katex-display").first();
  await expect(formula).toHaveAttribute("tabindex", "0");
  await expect(formula).toHaveAttribute("role", "region");
  await expect(formula).toHaveAttribute("aria-label", "数学公式，可横向滚动");
  await formula.focus();
  await expect(formula).toBeFocused();

  await page.goto("/blog/2025-07-24-%E8%B5%9E%E5%93%A6%E6%A0%A1%E5%9B%AD%E9%9B%86%E5%B8%82%E4%BF%A1%E6%81%AF%E6%8F%90%E5%8F%96/");
  const task = page.locator(".content input[type='checkbox']").first();
  await expect(task).toHaveAttribute("aria-label", /^未完成任务：.+/);

  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((preference) => {
      localStorage.setItem("lunar-observatory-theme", preference);
      document.documentElement.dataset.theme = preference;
    }, theme);
    const bashComment = page.locator("pre.astro-code[data-lang='BASH'] span[style*='#6A737D']").first();
    await expect(bashComment).toBeVisible();
    await expect(bashComment).toHaveCSS("color", "rgb(184, 199, 217)");
  }

  await page.evaluate(() => {
    localStorage.setItem("lunar-observatory-theme", "light");
    document.documentElement.dataset.theme = "light";
  });
  const inlineCode = page.locator(".content :not(pre) > code").first();
  const inlineCodeStyle = await inlineCode.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(inlineCodeStyle.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(inlineCodeStyle.backgroundColor).not.toContain("/");

  await context.close();
});

test("representative article details have no automated WCAG A/AA violations", async ({ browser }) => {
  test.setTimeout(90_000);
  const routes = [
    "/blog/2026-08-14-agent-orchestration/",
    "/blog/2025-07-08-%E5%9B%BE%E8%AE%BA%E5%AF%BC%E8%AE%BA-%E5%AE%9A%E4%B9%89%E4%B8%8E%E6%A1%88%E4%BE%8B/",
    "/blog/2025-07-24-%E8%B5%9E%E5%93%A6%E6%A0%A1%E5%9B%AD%E9%9B%86%E5%B8%82%E4%BF%A1%E6%81%AF%E6%8F%90%E5%8F%96/",
  ];

  for (const theme of ["dark", "light"] as const) {
    const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
    await context.addInitScript((preference) => {
      localStorage.setItem("lunar-observatory-theme", preference);
    }, theme);
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(route);
      await page.locator(".archive-prose").waitFor();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, `${theme} ${route}`).toEqual([]);
    }
    await context.close();
  }
});
