import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const homeUrl = "http://127.0.0.1:4321/";

test.describe.configure({ mode: "serial" });

const chapterIds = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
] as const;

test("homepage exposes the complete six-chapter observatory", async ({ page }) => {
  await page.goto(homeUrl);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Chika Komari");
  await expect(page.locator("[data-observatory-canvas]")).toHaveCount(1);
  await expect(page.locator("#site-sidebar")).toHaveCount(1);
  const drawerToggle = page.locator("#drawer-toggle");
  await expect(drawerToggle).toBeVisible();
  await expect(drawerToggle).toHaveAttribute("aria-expanded", "false");
  await drawerToggle.click();
  await expect(page.locator("#site-sidebar")).toHaveClass(/open/);
  await expect(drawerToggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#site-sidebar")).not.toHaveClass(/open/);

  for (const chapterId of chapterIds) {
    await expect(page.locator(`[data-observatory-chapter="${chapterId}"]`)).toHaveCount(1);
  }

  const audioToggle = page.locator("[data-audio-toggle]");
  await expect(audioToggle).toHaveAttribute("aria-pressed", "false");
  await expect(audioToggle).toHaveAttribute("aria-label", "开启环境音");
});

test("live observatory canvas uses a resident procedural runtime without reloads through motion", async ({ page }) => {
  const requestedUrls: string[] = [];
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const widthDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width");
    const heightDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "height");
    const probe = {
      contextLost: 0,
      webglContexts: 0,
      widthWrites: 0,
      heightWrites: 0,
      canvasAdded: 0,
      canvasRemoved: 0,
      canvas: null as HTMLCanvasElement | null,
      observer: null as MutationObserver | null,
    };
    Object.defineProperty(window, "__observatoryMotionProbe", {
      configurable: true,
      value: probe,
    });
    HTMLCanvasElement.prototype.getContext = function patchedGetContext(
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (this.matches?.("[data-observatory-canvas]") && /^webgl2?$/u.test(contextId)) {
        probe.webglContexts += 1;
      }
      return originalGetContext.call(this, contextId, ...args as []) as RenderingContext | null;
    } as typeof HTMLCanvasElement.prototype.getContext;
    if (widthDescriptor?.get && widthDescriptor.set) {
      Object.defineProperty(HTMLCanvasElement.prototype, "width", {
        configurable: true,
        get: widthDescriptor.get,
        set(this: HTMLCanvasElement, value: number) {
          if (this.matches?.("[data-observatory-canvas]") && this.width !== value) probe.widthWrites += 1;
          widthDescriptor.set?.call(this, value);
        },
      });
    }
    if (heightDescriptor?.get && heightDescriptor.set) {
      Object.defineProperty(HTMLCanvasElement.prototype, "height", {
        configurable: true,
        get: heightDescriptor.get,
        set(this: HTMLCanvasElement, value: number) {
          if (this.matches?.("[data-observatory-canvas]") && this.height !== value) probe.heightWrites += 1;
          heightDescriptor.set?.call(this, value);
        },
      });
    }
    window.addEventListener("webglcontextlost", () => {
      probe.contextLost += 1;
    });
  });
  page.on("request", (request) => requestedUrls.push(request.url()));
  await page.goto(homeUrl);
  const root = page.locator("[data-observatory-root]");
  await expect(root).toHaveAttribute("data-render-state", /ready|static|failed/, { timeout: 12_000 });

  const renderState = await root.getAttribute("data-render-state");
  test.skip(renderState !== "ready", `Realtime WebGL unavailable in this browser: ${renderState ?? "unknown"}`);

  await page.locator("[data-observatory-canvas]").evaluate((canvas: HTMLCanvasElement) => {
    const probe = window.__observatoryMotionProbe as {
      canvas: HTMLCanvasElement | null;
      observer: MutationObserver | null;
      canvasAdded: number;
      canvasRemoved: number;
    };
    probe.canvas = canvas;
    probe.observer?.disconnect();
    probe.observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLCanvasElement && node.matches("[data-observatory-canvas]")) probe.canvasAdded += 1;
        }
        for (const node of record.removedNodes) {
          if (node instanceof HTMLCanvasElement && node.matches("[data-observatory-canvas]")) probe.canvasRemoved += 1;
        }
      }
    });
    probe.observer.observe(canvas.parentElement ?? document.body, { childList: true, subtree: true });
  });

  const canvasPixels = await page.locator("[data-observatory-canvas]").evaluate((canvas: HTMLCanvasElement) => {
    const probe = document.createElement("canvas");
    probe.width = 64;
    probe.height = 64;
    const context = probe.getContext("2d");
    if (!context) return 0;
    context.drawImage(canvas, 0, 0, probe.width, probe.height);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    let visible = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] > 4 && pixels[index] + pixels[index + 1] + pixels[index + 2] > 12) visible += 1;
    }
    return visible;
  });
  expect(canvasPixels).toBeGreaterThan(96);
  const requestCountBeforeMotion = requestedUrls.length;
  const beforeMotionProbe = await page.evaluate(() => {
    const probe = window.__observatoryMotionProbe as {
      webglContexts: number;
      widthWrites: number;
      heightWrites: number;
      contextLost: number;
    };
    const canvas = document.querySelector("[data-observatory-canvas]") as HTMLCanvasElement;
    return {
      webglContexts: probe.webglContexts,
      widthWrites: probe.widthWrites,
      heightWrites: probe.heightWrites,
      contextLost: probe.contextLost,
      backingWidth: canvas.width,
      backingHeight: canvas.height,
    };
  });

  for (let index = 0; index < 16; index += 1) {
    await page.mouse.move(90 + index * 28, 140 + (index % 5) * 42);
  }
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(250);

  await expect(root).toHaveAttribute("data-render-state", /ready|suspended|degraded/);
  await expect(page.locator("[data-observatory-canvas]")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-world-version", "5");
  await expect(root).toHaveAttribute("data-avatar-representation", "chapter-pose-raster", {
    timeout: 12_000,
  });
  await expect(root).toHaveAttribute("data-avatar-state", "ready");
  await expect(page.locator("[data-observatory-character-layer] [data-character-slot]")).toHaveCount(2);
  await expect(page.locator("[data-observatory-world-plate]")).toHaveCSS("opacity", "0");
  const afterMotionProbe = await page.evaluate(() => {
    const probe = window.__observatoryMotionProbe as {
      canvas: HTMLCanvasElement | null;
      canvasAdded: number;
      canvasRemoved: number;
      contextLost: number;
      webglContexts: number;
      widthWrites: number;
      heightWrites: number;
    };
    const canvas = document.querySelector("[data-observatory-canvas]") as HTMLCanvasElement;
    return {
      sameCanvas: probe.canvas === canvas,
      canvasAdded: probe.canvasAdded,
      canvasRemoved: probe.canvasRemoved,
      contextLost: probe.contextLost,
      webglContexts: probe.webglContexts,
      widthWrites: probe.widthWrites,
      heightWrites: probe.heightWrites,
      backingWidth: canvas.width,
      backingHeight: canvas.height,
    };
  });
  const requestsDuringMotion = requestedUrls.slice(requestCountBeforeMotion);

  expect(afterMotionProbe).toMatchObject({
    sameCanvas: true,
    canvasAdded: 0,
    canvasRemoved: 0,
    contextLost: 0,
    backingWidth: beforeMotionProbe.backingWidth,
    backingHeight: beforeMotionProbe.backingHeight,
  });
  expect(afterMotionProbe.webglContexts).toBe(beforeMotionProbe.webglContexts);
  expect(afterMotionProbe.widthWrites).toBe(beforeMotionProbe.widthWrites);
  expect(afterMotionProbe.heightWrites).toBe(beforeMotionProbe.heightWrites);
  expect(requestedUrls.some((url) => /\/assets\/observatory\//iu.test(url))).toBe(false);
  expect(requestsDuringMotion.some((url) => /controller\.[^/]+\.js$/.test(url))).toBe(false);
  expect(requestsDuringMotion.some((url) => /\/assets\/img\/observatory\/.*\.(?:webp|png)(?:[?#]|$)/iu.test(url))).toBe(false);
});

test("desktop chapter guide crossfades between authored raster poses", async ({ page }) => {
  await page.goto(homeUrl);
  const root = page.locator("[data-observatory-root]");
  await expect(root).toHaveAttribute("data-render-state", /ready|static|failed/, { timeout: 12_000 });
  test.skip(await root.getAttribute("data-render-state") !== "ready", "Realtime WebGL unavailable");

  const activeSlot = page.locator("[data-observatory-character-layer] [data-character-slot='active']");
  await expect(root).toHaveAttribute("data-avatar-representation", "chapter-pose-raster");
  await expect(activeSlot).toHaveAttribute("src", /guide-pose-dark-present\.webp|guide-pose-light-present\.webp/);

  await page.locator("#observe").scrollIntoViewIfNeeded();
  await expect(activeSlot).toHaveAttribute("src", /guide-pose-dark-point-up\.webp|guide-pose-light-point-up\.webp/);
  await expect(activeSlot).toHaveAttribute("data-pose-state", "settled");
});

test("rapid viewport churn coalesces to one canvas backing-store resize", async ({ page }) => {
  await page.addInitScript(() => {
    const widthDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width");
    const heightDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "height");
    const probe = {
      widthWrites: 0,
      heightWrites: 0,
      contexts: 0,
      canvas: null as HTMLCanvasElement | null,
    };
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(window, "__observatoryResizeProbe", { configurable: true, value: probe });
    HTMLCanvasElement.prototype.getContext = function patchedGetContext(
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (this.matches?.("[data-observatory-canvas]") && /^webgl2?$/u.test(contextId)) probe.contexts += 1;
      return originalGetContext.call(this, contextId, ...args as []) as RenderingContext | null;
    } as typeof HTMLCanvasElement.prototype.getContext;
    if (widthDescriptor?.get && widthDescriptor.set) {
      Object.defineProperty(HTMLCanvasElement.prototype, "width", {
        configurable: true,
        get: widthDescriptor.get,
        set(this: HTMLCanvasElement, value: number) {
          if (this.matches?.("[data-observatory-canvas]") && this.width !== value) probe.widthWrites += 1;
          widthDescriptor.set?.call(this, value);
        },
      });
    }
    if (heightDescriptor?.get && heightDescriptor.set) {
      Object.defineProperty(HTMLCanvasElement.prototype, "height", {
        configurable: true,
        get: heightDescriptor.get,
        set(this: HTMLCanvasElement, value: number) {
          if (this.matches?.("[data-observatory-canvas]") && this.height !== value) probe.heightWrites += 1;
          heightDescriptor.set?.call(this, value);
        },
      });
    }
  });

  await page.goto(homeUrl);
  const root = page.locator("[data-observatory-root]");
  await expect(root).toHaveAttribute("data-render-state", /ready|static|failed/, { timeout: 12_000 });
  test.skip(await root.getAttribute("data-render-state") !== "ready", "Realtime WebGL unavailable");

  const canvas = page.locator("[data-observatory-canvas]");
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const probe = window.__observatoryResizeProbe as { canvas: HTMLCanvasElement | null };
    probe.canvas = element;
  });
  const before = await page.evaluate(() => {
    const probe = window.__observatoryResizeProbe as {
      widthWrites: number;
      heightWrites: number;
      contexts: number;
    };
    return { widthWrites: probe.widthWrites, heightWrites: probe.heightWrites, contexts: probe.contexts };
  });

  for (const height of [896, 872, 848, 824, 800, 824, 848, 872, 896]) {
    await page.setViewportSize({ width: 1280, height });
  }
  await page.waitForTimeout(350);

  const after = await page.evaluate(() => {
    const probe = window.__observatoryResizeProbe as {
      widthWrites: number;
      heightWrites: number;
      contexts: number;
      canvas: HTMLCanvasElement | null;
    };
    return {
      widthWrites: probe.widthWrites,
      heightWrites: probe.heightWrites,
      contexts: probe.contexts,
      sameCanvas: probe.canvas === document.querySelector("[data-observatory-canvas]"),
    };
  });
  await expect(canvas).toHaveCount(1);
  expect(after.sameCanvas).toBe(true);
  expect(after.contexts).toBe(before.contexts);
  expect(after.widthWrites - before.widthWrites).toBeLessThanOrEqual(1);
  expect(after.heightWrites - before.heightWrites).toBeLessThanOrEqual(1);
});

test("canvas-ui magnify is lazy and scoped to the primary signal window", async ({ page }) => {
  await page.goto(homeUrl);
  const lens = page.locator("canvas-signal-lens");
  await expect(lens).toHaveCount(1);
  await lens.scrollIntoViewIfNeeded();
  await lens.hover();
  await expect(lens).toHaveAttribute("data-lens-policy", /interactive-fine-pointer|no-webgl2/, { timeout: 8_000 });
  const policy = await lens.getAttribute("data-lens-policy");
  test.skip(policy !== "interactive-fine-pointer", `Canvas UI lens unavailable in this browser: ${policy ?? "unknown"}`);
  await expect(lens).toHaveAttribute("data-lens-state", "ready", { timeout: 8_000 });
  await expect(lens.locator("[data-signal-lens-output]")).toBeVisible();
});

test("ambient audio starts only after an explicit gesture and can be muted again", async ({ page }) => {
  await page.goto(homeUrl);
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
  await page.goto(homeUrl);

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
  await page.goto(homeUrl);

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
  await page.goto(homeUrl);

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
  await page.goto(homeUrl);
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
  await page.goto(homeUrl);

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
  expect(stageImage).toContain("guide-pose-");
  await context.close();
});

test("artifact cover title uses a transparent image scrim instead of an opaque card", async ({ page }) => {
  await page.goto("http://127.0.0.1:4321/artifacts/alignment-between-the-minds-icml-2026/");
  const copy = page.locator(".archive-document-cover--image .archive-document-cover-copy");
  await expect(copy).toBeVisible();
  await expect(copy).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(copy).toHaveCSS("box-shadow", "none");
  await expect(copy).toHaveCSS("backdrop-filter", "none");
  const coverPixels = await page.locator(".archive-document-cover--image img").evaluate((image: HTMLImageElement) => {
    const rect = image.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height), opacity: getComputedStyle(image).opacity };
  });
  expect(coverPixels.width).toBeGreaterThan(1000);
  expect(coverPixels.height).toBeGreaterThan(280);
  expect(coverPixels.opacity).toBe("1");
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
    await page.goto(homeUrl);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.close();
  });
}

test("theme choice is explicit, persistent, and reflected by the document", async ({ page }) => {
  await page.goto(homeUrl);
  const toggle = page.locator("[data-observatory-theme-toggle]");
  await toggle.click();

  const storedTheme = await page.evaluate(() => localStorage.getItem("lunar-observatory-theme"));
  expect(storedTheme).toMatch(/^(dark|light)$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", storedTheme!);
  await expect(toggle).toHaveAttribute("aria-pressed", storedTheme === "light" ? "true" : "false");
});

test("homepage has no WCAG A/AA automated violations", async ({ page }) => {
  await page.goto(homeUrl);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});
