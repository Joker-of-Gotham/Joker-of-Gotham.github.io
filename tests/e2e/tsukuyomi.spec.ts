import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("artifacts/tsukuyomi-v12-2026-09-08");
const chapters = ["signal-gate", "observe", "structure", "orchestrate", "embodiment", "archive-afterlight"];

for (const viewport of [
  { name: "desktop", width: 1440, height: 900, theme: "dark" },
  { name: "tablet", width: 768, height: 1024, theme: "dark" },
  { name: "phone", width: 390, height: 844, theme: "dark" },
  { name: "day", width: 1440, height: 900, theme: "light" },
  { name: "phone-day", width: 390, height: 844, theme: "light" },
] as const) {
  test(`tsukuyomi ${viewport.name}: six live compositions without asset requests or context rebuilds`, async ({ page }) => {
    test.setTimeout(75_000);
    await mkdir(output, { recursive: true });
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: viewport.theme });
    await page.addInitScript(theme => localStorage.setItem("lunar-observatory-theme", theme), viewport.theme);
    const errors: string[] = [], thirdPartyErrors: string[] = [], sceneRequests: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", message => {
      if (message.type() !== "error") return;
      const source = message.location().url;
      if (/^https:\/\/(fonts\.(googleapis|gstatic)\.com|github-contributions-api\.jogruber\.de)\//.test(source)) {
        thirdPartyErrors.push(`${source}: ${message.text()}`);
      } else errors.push(`${source}: ${message.text()}`);
    });
    page.on("request", request => { if (/\/assets\/three\//.test(request.url())) sceneRequests.push(request.url()); });
    await page.goto("/");
    const root = page.locator("[data-observatory-root]");
    await expect(root).toHaveAttribute("data-render-state", "ready", { timeout: 20_000 });
    await expect(root).toHaveAttribute("data-world-version", "12");
    await expect(root).toHaveAttribute("data-environment-status", "ready");
    const samples = [];
    for (const chapter of chapters) {
      await page.locator(`[data-observatory-chapter="${chapter}"]`).evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const top = bounds.top + scrollY;
        scrollTo({ top: Math.max(0, top), behavior: "instant" });
      });
      await expect(root).toHaveAttribute("data-active-chapter", chapter);
      await page.waitForTimeout(1800);
      const data = await root.evaluate(el => ({ ...el.dataset }));
      if (chapter === "structure") expect(Number(data.weatherRain)).toBeGreaterThan(.35);
      if (chapter === "archive-afterlight") expect(Number(data.weatherFestival)).toBeGreaterThan(.95);
      samples.push({ chapter, ...data });
      expect(Number(data.rendererCalls)).toBeLessThan(160);
      expect(data.sceneGeneration).toBe("1");
      expect(data.canvasGeneration).toBe("1");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: resolve(output, `${viewport.name}-${chapter}.png`) });
    }
    // Return to entry to check reverse travel and capture the actual rendered fallback.
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await expect(root).toHaveAttribute("data-active-chapter", chapters[0]);
    await page.waitForTimeout(1600);
    await page.addStyleTag({ content: `
      .observatory > :not(.observatory-visual), .observatory > :not(.observatory-visual) *, .site-nav, .site-nav *, .observatory-character-layer,
      .observatory-poster-avatar, .observatory-poster-field, .observatory-visual-scrim,
      .observatory-visual-vignette, astro-dev-toolbar { visibility: hidden !important; }
    ` });
    await page.screenshot({ path: resolve(output, `${viewport.name}-world.png`) });
    await writeFile(resolve(output, `${viewport.name}-metrics.json`), JSON.stringify({ viewport, samples, errors, thirdPartyErrors, sceneRequests }, null, 2));
    expect(errors).toEqual([]);
    expect(sceneRequests).toEqual([]);
  });
}

test("tsukuyomi fallback keeps content and poster available when WebGL fails", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === "webgl2") return null;
      return original.call(this, type, ...args as []) as RenderingContext | null;
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator("[data-observatory-root]")).toHaveAttribute("data-render-state", "static");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "阅读文章", exact: false })).toBeVisible();
  await expect.poll(() => page.locator("[data-observatory-world-plate]").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 1)).toBe(true);
});

test("portrait fallback follows the selected theme with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");
  const root = page.locator("[data-observatory-root]"), poster = page.locator("[data-observatory-world-plate]");
  await expect(root).toHaveAttribute("data-render-state", "static");
  await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.currentSrc.endsWith("tsukuyomi-world-v14-dark-portrait.webp"))).toBe(true);
  await page.locator("[data-observatory-theme-toggle]").click();
  await expect(root).toHaveAttribute("data-resolved-theme", "light");
  await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.currentSrc.endsWith("tsukuyomi-world-v14-light-portrait.webp"))).toBe(true);
  await page.screenshot({ path: resolve(output, "phone-static-light.png") });
});

test("portrait scene is a real decoded image even without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await page.goto("/");
    const poster = page.locator("[data-observatory-world-plate]");
    await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 390)).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: resolve(output, "phone-no-javascript.png") });
  } finally { await context.close(); }
});
