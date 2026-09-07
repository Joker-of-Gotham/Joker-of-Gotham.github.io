import { expect, test } from "@playwright/test";

const homeUrl = "http://127.0.0.1:4321/";

test.describe.configure({ mode: "serial" });

test("chapter guide uses a decoded two-slot shrink-gap-grow handoff", async ({ page }) => {
  await page.goto(homeUrl);
  const root = page.locator("[data-observatory-root]");
  const layer = page.locator("[data-observatory-character-layer]");
  await expect(root).toHaveAttribute("data-render-state", /ready|static|failed/, { timeout: 18_000 });
  await page.waitForLoadState("networkidle");
  await expect(root).toHaveAttribute("data-avatar-state", "ready");
  await expect(root).toHaveAttribute("data-active-chapter", "signal-gate");
  await expect(layer).toHaveAttribute("data-guide-state", "settled");

  const transitionTrace = await page.evaluate(() => new Promise<{
    states: string[];
    gapOpacity: number[];
  }>((resolve) => {
    const observatory = document.querySelector<HTMLElement>("[data-observatory-root]");
    const guide = document.querySelector<HTMLElement>("[data-observatory-character-layer]");
    if (!observatory || !guide) {
      resolve({ states: [], gapOpacity: [] });
      return;
    }

    const states: string[] = [];
    const finish = (gapOpacity: number[] = []) => {
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve({ states, gapOpacity });
    };
    const observer = new MutationObserver(() => {
      const state = guide.dataset.guideState ?? "";
      if (state && states.at(-1) !== state) states.push(state);
      if (state !== "gap") return;
      const opacity = Array.from(guide.querySelectorAll<HTMLElement>("[data-character-slot]"))
        .map((slot) => Number.parseFloat(getComputedStyle(slot).opacity));
      finish(opacity);
    });
    observer.observe(guide, { attributes: true, subtree: true, attributeFilter: ["data-guide-state", "data-pose-state"] });
    const timeout = window.setTimeout(() => finish(), 2_500);
    const observe = document.querySelector<HTMLElement>('[data-observatory-chapter="observe"]');
    if (!observe) {
      finish();
      return;
    }
    const bounds = observe.getBoundingClientRect();
    scrollTo(0, Math.max(0, bounds.top + scrollY + bounds.height * 0.5 - innerHeight * 0.5));
  }));

  expect(transitionTrace.states).toContain("leaving");
  expect(transitionTrace.states).toContain("gap");
  expect(transitionTrace.gapOpacity).toHaveLength(2);
  expect(transitionTrace.gapOpacity.every((opacity) => opacity === 0)).toBe(true);
  await expect(root).toHaveAttribute("data-active-chapter", "observe", { timeout: 12_000 });
  await expect(layer).toHaveAttribute("data-guide-state", "settled", { timeout: 15_000 });
  await expect(root).toHaveAttribute("data-avatar-pose", "point-up");

  const filters = await layer.locator("[data-character-slot]").evaluateAll((slots) => (
    slots.map((slot) => getComputedStyle(slot).filter)
  ));
  expect(filters.every((filter) => !filter.includes("blur("))).toBe(true);
});

test("chapter guide cancels stale entrances during rapid reverse navigation", async ({ page }) => {
  await page.goto(homeUrl);
  const root = page.locator("[data-observatory-root]");
  const layer = page.locator("[data-observatory-character-layer]");
  await expect(root).toHaveAttribute("data-avatar-state", "ready");
  await expect(root).toHaveAttribute("data-active-chapter", "signal-gate");
  await expect(layer).toHaveAttribute("data-guide-state", "settled");

  await page.evaluate(() => {
    const observe = document.querySelector<HTMLElement>('[data-observatory-chapter="observe"]');
    if (!observe) return;
    const bounds = observe.getBoundingClientRect();
    scrollTo(0, Math.max(0, bounds.top + scrollY + bounds.height * 0.5 - innerHeight * 0.5));
  });
  await expect(layer).toHaveAttribute("data-guide-state", /leaving|gap|entering/);

  await page.evaluate(() => {
    scrollTo(0, 0);
  });

  await expect(layer).toHaveAttribute("data-guide-state", "settled");
  await expect(root).toHaveAttribute("data-avatar-pose", "present");
  await expect(layer.locator("[data-character-slot='active']")).toHaveAttribute(
    "src",
    /guide-pose-(?:dark|light)-present\.webp$/,
  );
});

test("reduced motion leaves DOM choreography in its final readable state", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(homeUrl);

  const root = page.locator("[data-observatory-root]");
  await expect(root).toHaveAttribute("data-render-reason", "reduced-motion");
  const frames = page.locator(".observatory-chapter-frame");
  await expect(frames).toHaveCount(6);
  const styles = await frames.evaluateAll((items) => items.map((item) => {
    const style = getComputedStyle(item);
    return { opacity: style.opacity, visibility: style.visibility, transform: style.transform };
  }));
  expect(styles.every((style) => style.opacity === "1" && style.visibility === "visible" && style.transform === "none")).toBe(true);
  await context.close();
});
