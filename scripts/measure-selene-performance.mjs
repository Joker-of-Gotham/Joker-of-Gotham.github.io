import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(
  repositoryRoot,
  process.argv[2] ?? "artifacts/selene-meridian-performance-2026-08-29.json",
);
const baseUrl = process.env.SELENE_BASE_URL ?? "http://127.0.0.1:4321/";
const chapters = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
];
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900, mobile: false, theme: "dark" },
  { name: "tablet-1024x1366", width: 1024, height: 1366, mobile: false, theme: "dark" },
  { name: "phone-390x844", width: 390, height: 844, mobile: true, theme: "dark" },
  { name: "desktop-light-1440x900", width: 1440, height: 900, mobile: false, theme: "light" },
];

function parseNumber(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function waitForLiveWorld(page) {
  await page.waitForSelector("[data-observatory-root]");
  await page.waitForFunction(() => {
    const root = document.querySelector("[data-observatory-root]");
    return root?.dataset.renderState === "ready" && root.dataset.environmentStatus === "ready";
  }, undefined, { timeout: 25_000 });
}

async function scrollToChapter(page, chapter, mobile) {
  await page.evaluate(({ chapter, mobile }) => {
    const element = document.querySelector(`[data-observatory-chapter="${chapter}"]`);
    if (!(element instanceof HTMLElement)) return;
    const bounds = element.getBoundingClientRect();
    const top = bounds.top + scrollY;
    const y = mobile
      ? top - Math.max(84, innerHeight * 0.1)
      : top + bounds.height * 0.5 - innerHeight * 0.5;
    scrollTo(0, Math.max(0, y));
  }, { chapter, mobile });
  await page.waitForFunction((expected) => {
    const root = document.querySelector("[data-observatory-root]");
    return root?.dataset.activeChapter === expected && root.dataset.scrollScheduler === "clean";
  }, chapter, { timeout: 12_000 });
  await page.waitForTimeout(3_200);
}

async function measureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    colorScheme: viewport.theme,
    reducedMotion: "no-preference",
  });
  await context.addInitScript((theme) => {
    localStorage.setItem("lunar-observatory-theme", theme);
  }, viewport.theme);
  const page = await context.newPage();
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleWarnings.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? "" });
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await waitForLiveWorld(page);
  const samples = [];
  for (const chapter of chapters) {
    await scrollToChapter(page, chapter, viewport.mobile);
    const runtime = await page.locator("[data-observatory-root]").evaluate((root) => ({ ...root.dataset }));
    samples.push({
      chapter,
      qualityTier: runtime.qualityTier,
      renderState: runtime.renderState,
      sceneGeneration: runtime.sceneGeneration,
      canvasGeneration: runtime.canvasGeneration,
      medianMs: parseNumber(runtime.frameMedianMs),
      p95Ms: parseNumber(runtime.frameP95Ms),
      sampleCount: parseNumber(runtime.frameSampleCount),
      calls: parseNumber(runtime.rendererCalls),
      triangles: parseNumber(runtime.rendererTriangles),
      points: parseNumber(runtime.rendererPoints),
      textures: parseNumber(runtime.rendererTextures),
      dpr: parseNumber(runtime.rendererDpr),
      scrollScheduler: runtime.scrollScheduler,
      qualityTransition: runtime.qualityTransition,
    });
  }
  await context.close();
  return { viewport, samples, consoleWarnings, pageErrors, failedRequests };
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist"],
});
const reports = [];
try {
  for (const viewport of viewports) {
    reports.push(await measureViewport(browser, viewport));
  }
} finally {
  await browser.close();
}

const summary = {
  baseUrl,
  collectedAt: new Date().toISOString(),
  reports,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(summary, null, 2));

const fatalCount = reports.reduce(
  (sum, report) => sum + report.pageErrors.length + report.failedRequests.length,
  0,
);
if (fatalCount > 0) process.exitCode = 1;
