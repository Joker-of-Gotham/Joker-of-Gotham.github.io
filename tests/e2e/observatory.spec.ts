import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const chapterIds = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
] as const;

test("homepage exposes the complete six-chapter observatory", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Chika Komari");
  await expect(page.locator("[data-observatory-canvas]")).toHaveCount(1);

  for (const chapterId of chapterIds) {
    await expect(page.locator(`[data-observatory-chapter="${chapterId}"]`)).toHaveCount(1);
  }

  const audioToggle = page.locator("[data-audio-toggle]");
  await expect(audioToggle).toHaveAttribute("aria-pressed", "false");
  await expect(audioToggle).toHaveAttribute("aria-label", "开启环境音");
});

test("ambient audio starts only after an explicit gesture and can be muted again", async ({ page }) => {
  await page.goto("/");
  const audioToggle = page.locator("[data-audio-toggle]");
  const audioRoot = page.locator("[data-observatory-audio]");

  await expect(audioRoot).toHaveAttribute("data-audio-state", "muted");
  await audioToggle.click();
  await expect(audioRoot).toHaveAttribute("data-audio-state", "playing");
  await expect(audioToggle).toHaveAttribute("aria-pressed", "true");
  await audioToggle.click();
  await expect(audioRoot).toHaveAttribute("data-audio-state", "muted");
});

test("homepage remains complete without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-observatory-poster]")).toBeVisible();
  await expect(page.locator("[data-observatory-chapter]")).toHaveCount(6);
  await context.close();
});

test("reduced motion selects the static poster tier", async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-quality-tier", "poster");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-render-state", /static|ready/);
  await expect(page.locator("[data-observatory-world-plate]")).toHaveAttribute("src", /-compact\.webp$/);
  await expect(page.locator("[data-observatory-poster]")).toHaveCSS("display", "none");
  await expect(page.locator("[data-observatory-chapter='signal-gate'] [data-pose='present']")).toBeVisible();
  const reducedStageImage = await page.locator("[data-pose='present'] .observatory-mobile-actor-figure").evaluate(
    (element) => getComputedStyle(element).backgroundImage
  );
  expect(reducedStageImage).toMatch(/signal-guide-(?:dark|light)-poster\.webp/);
  await context.close();
});

test("chapter navigation stays synchronized in the static fallback", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");

  const afterlightLink = page.locator('[data-observatory-nav-link][href="#archive-afterlight"]');
  await afterlightLink.click();
  await expect(page).toHaveURL(/#archive-afterlight$/);
  await expect(afterlightLink).toHaveAttribute("aria-current", "location");
  await expect(page.locator('[data-observatory-chapter="archive-afterlight"]')).toHaveClass(/is-active/);
  await context.close();
});

test("Save-Data keeps the poster fallback and never requests the Three controller", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "3g" },
    });
  });
  const page = await context.newPage();
  const scripts: string[] = [];
  const resources: string[] = [];
  page.on("request", (request) => {
    resources.push(request.url());
    if (request.resourceType() === "script") scripts.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-quality-tier", "poster");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-render-reason", "save-data");
  await expect(page.locator("[data-observatory-world-plate]")).toHaveAttribute("src", /-compact\.webp$/);
  expect(scripts.some((url) => /controller\.[^/]+\.js$/.test(url))).toBe(false);
  expect(resources.some((url) => /poses-runtime\.webp$/.test(url))).toBe(false);
  await context.close();
});

test("mobile layout has no horizontal overflow and keeps primary controls reachable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto("/");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator("[data-observatory-theme-toggle]")).toBeVisible();
  await expect(page.locator("[data-audio-toggle]")).toBeVisible();
  await expect(page.locator("[data-observatory-world-plate]")).toHaveAttribute("src", /-compact\.webp$/);
  const stages = page.locator("[data-observatory-chapter] .observatory-mobile-actor-stage");
  await expect(stages).toHaveCount(6);
  await expect(stages.first()).toBeVisible();
  expect(await stages.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-pose")))).toEqual([
    "present",
    "point-up",
    "walk-profile",
    "quick-turn",
    "back-look",
    "settle",
  ]);
  const stageImage = await stages.first().locator(".observatory-mobile-actor-figure").evaluate(
    (element) => getComputedStyle(element).backgroundImage
  );
  expect(stageImage).toContain("poses-runtime.webp");
  await context.close();
});

for (const viewport of [
  { width: 320, height: 800, label: "mobile-small" },
  { width: 768, height: 1_024, label: "tablet-portrait" },
  { width: 1_280, height: 800, label: "desktop" },
  { width: 1_920, height: 1_080, label: "wide-desktop" },
  { width: 844, height: 390, label: "mobile-landscape" },
]) {
  test(`observatory reflows without horizontal scroll at ${viewport.label}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.close();
  });
}

test("theme choice is explicit, persistent, and reflected by the document", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator("[data-observatory-theme-toggle]");
  await toggle.click();

  const storedTheme = await page.evaluate(() => localStorage.getItem("lunar-observatory-theme"));
  expect(storedTheme).toMatch(/^(dark|light)$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", storedTheme!);
  await expect(toggle).toHaveAttribute("aria-pressed", storedTheme === "light" ? "true" : "false");
});

test("homepage has no WCAG A/AA automated violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});
