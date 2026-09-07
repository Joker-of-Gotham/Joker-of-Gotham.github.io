import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(
  repositoryRoot,
  process.argv[2] ?? "artifacts/selene-meridian-final-2026-08-29",
);
const baseUrl = process.env.SELENE_BASE_URL ?? "http://127.0.0.1:4321/";
const requestedTheme = process.env.SELENE_THEME === "light" ? "light" : "dark";
const shouldStitch = process.env.SELENE_STITCH !== "false";
const chapters = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
];
const allViewports = [
  { name: "desktop-1440x900", width: 1440, height: 900, mobile: false },
  { name: "tablet-1024x1366", width: 1024, height: 1366, mobile: false },
  { name: "phone-390x844", width: 390, height: 844, mobile: true },
];
const viewportFilter = new Set(
  (process.env.SELENE_VIEWPORTS ?? "").split(",").map((value) => value.trim()).filter(Boolean),
);
const viewports = viewportFilter.size > 0
  ? allViewports.filter((viewport) => viewportFilter.has(viewport.name))
  : allViewports;

const sleepInPage = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));

async function waitForLiveWorld(page) {
  await page.waitForSelector("[data-observatory-root]");
  await page.waitForFunction(() => {
    const root = document.querySelector("[data-observatory-root]");
    return root && ["ready", "static", "failed"].includes(root.dataset.renderState ?? "");
  }, undefined, { timeout: 20_000 });
  const renderState = await page.locator("[data-observatory-root]").getAttribute("data-render-state");
  if (renderState !== "ready") {
    const reason = await page.locator("[data-observatory-root]").getAttribute("data-render-reason");
    throw new Error(`Selene capture requires the live Three.js world; received ${renderState ?? "missing"} (${reason ?? "no reason"}).`);
  }
  await page.waitForFunction(() => {
    const state = document.querySelector("[data-observatory-root]")?.dataset.environmentStatus;
    return state === "ready";
  }, undefined, { timeout: 20_000 });
  return renderState;
}

async function assertResidentWorld(page, expectedChapter) {
  const runtime = await page.locator("[data-observatory-root]").evaluate((root) => ({ ...root.dataset }));
  if (!["ready", "suspended", "degraded"].includes(runtime.renderState ?? "")) {
    throw new Error(`Selene world left the live state during capture: ${runtime.renderState ?? "missing"} (${runtime.renderReason ?? "no reason"}).`);
  }
  if (runtime.environmentStatus !== "ready") {
    throw new Error(`Selene PBR/HDR environment is not ready: ${runtime.environmentStatus ?? "missing"}.`);
  }
  if (expectedChapter && runtime.activeChapter !== expectedChapter) {
    throw new Error(`Chapter did not settle: expected ${expectedChapter}, received ${runtime.activeChapter ?? "missing"}.`);
  }
  if (runtime.sceneGeneration !== "1" || runtime.canvasGeneration !== "1" || !runtime.sceneId) {
    throw new Error(`Resident scene identity is invalid: scene=${runtime.sceneGeneration}, canvas=${runtime.canvasGeneration}, id=${runtime.sceneId}.`);
  }
  return runtime;
}

async function warmScroll(page) {
  const maximum = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
  for (let y = 0; y <= maximum; y += Math.max(480, Math.round((await page.viewportSize()).height * 0.8))) {
    await page.evaluate((nextY) => scrollTo(0, nextY), y);
    await page.waitForTimeout(100);
  }
  await page.evaluate((nextY) => scrollTo(0, nextY), maximum);
  await page.waitForTimeout(350);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(900);
}

async function stitchedCapture(page, directory, viewport, report) {
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const maximum = Math.max(0, documentHeight - viewport.height);
  const step = Math.max(520, viewport.height - 160);
  const positions = [];
  for (let y = 0; y < maximum; y += step) positions.push(y);
  if (positions.at(-1) !== maximum) positions.push(maximum);

  const slices = [];
  for (let index = 0; index < positions.length; index += 1) {
    const y = positions[index];
    await page.evaluate((nextY) => scrollTo(0, nextY), y);
    await page.waitForTimeout(900);
    await assertResidentWorld(page);
    const path = join(directory, "settled-slices", `slice-${String(index).padStart(2, "0")}-y${y}.png`);
    await mkdir(dirname(path), { recursive: true });
    const buffer = await page.screenshot({ path, type: "png", animations: "allow" });
    slices.push({ buffer, y, path });
  }

  const image = sharp({
    create: {
      width: viewport.width,
      height: documentHeight,
      channels: 4,
      background: { r: 5, g: 7, b: 13, alpha: 1 },
    },
  });
  const composites = [];
  for (let index = 0; index < slices.length; index += 1) {
    const current = slices[index];
    const nextY = slices[index + 1]?.y ?? documentHeight;
    const visibleHeight = Math.min(viewport.height, documentHeight - current.y, nextY - current.y);
    composites.push({
      input: await sharp(current.buffer).extract({ left: 0, top: 0, width: viewport.width, height: visibleHeight }).png().toBuffer(),
      left: 0,
      top: current.y,
    });
  }
  const stitchedPath = join(directory, "stitched-full-page.png");
  await image.composite(composites).png().toFile(stitchedPath);
  report.stitched = { path: stitchedPath, documentHeight, step, positions };
}

async function captureViewport(browser, viewport) {
  const directory = join(outputRoot, viewport.name);
  await mkdir(directory, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    colorScheme: requestedTheme,
    reducedMotion: "no-preference",
  });
  await context.addInitScript((theme) => localStorage.setItem("lunar-observatory-theme", theme), requestedTheme);
  const page = await context.newPage();
  const report = { viewport, consoleErrors: [], pageErrors: [], failedRequests: [], chapters: [] };
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      report.consoleErrors.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("requestfailed", (request) => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  report.renderState = await waitForLiveWorld(page);
  await warmScroll(page);

  for (const chapter of chapters) {
    const locator = page.locator(`[data-observatory-chapter="${chapter}"]`);
    await locator.scrollIntoViewIfNeeded();
    await page.evaluate(({ id, mobile }) => {
      const element = document.querySelector(`[data-observatory-chapter="${id}"]`);
      if (!element) return;
      const top = element.getBoundingClientRect().top + scrollY;
      // Desktop/tablet chapters are composed around their visual centre. Phone
      // chapters intentionally exceed one viewport; centring those sections
      // crops the heading and falsely reports a layout failure, so capture the
      // authored heading-safe anchor beneath the fixed navigation instead.
      const y = mobile
        ? top - Math.max(84, innerHeight * 0.1)
        : top + element.getBoundingClientRect().height * 0.5 - innerHeight * 0.5;
      scrollTo(0, Math.max(0, y));
    }, { id: chapter, mobile: viewport.mobile });
    await page.waitForTimeout(1_200);
    const runtime = await assertResidentWorld(page, chapter);
    const path = join(directory, `${chapter}.png`);
    await page.screenshot({ path, type: "png", animations: "allow" });
    report.chapters.push({ chapter, path, scrollY: await page.evaluate(() => scrollY), runtime });
  }

  if (shouldStitch) await stitchedCapture(page, directory, viewport, report);
  report.finalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  report.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await writeFile(join(directory, "capture-report.json"), JSON.stringify(report, null, 2));
  await context.close();
  return report;
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  // Chrome's Windows headless default may fall back to SwiftShader for this
  // shader-heavy page and spend tens of seconds compiling the triplanar PBR
  // variants. Capture through the same D3D11 ANGLE backend used by the local
  // desktop browser so evidence reflects the production GPU path.
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=d3d11"],
});
const reports = [];
try {
  for (const viewport of viewports) reports.push(await captureViewport(browser, viewport));
} finally {
  await browser.close();
}
await writeFile(
  join(outputRoot, "capture-summary.json"),
  JSON.stringify({ baseUrl, theme: requestedTheme, reports }, null, 2),
);

// Keep the process honest when capture failures were recorded.
const fatalCount = reports.reduce(
  (sum, report) => sum + report.pageErrors.length + report.failedRequests.length +
    report.consoleErrors.filter((entry) => /\[Lunar Observatory\]|WebGL.*(?:error|failed)|ReferenceError|TypeError/u.test(entry.text)).length,
  0,
);
if (fatalCount > 0) process.exitCode = 1;
