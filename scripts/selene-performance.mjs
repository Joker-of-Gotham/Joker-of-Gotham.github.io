import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(
  repositoryRoot,
  process.argv[2] ?? "artifacts/selene-meridian-performance-2026-08-29",
);
const baseUrl = process.env.SELENE_BASE_URL ?? "http://127.0.0.1:4321/";
const sampleDownMs = Number(process.env.SELENE_PERF_DOWN_MS ?? 9_000);
const sampleHoldMs = Number(process.env.SELENE_PERF_HOLD_MS ?? 500);
const sampleUpMs = Number(process.env.SELENE_PERF_UP_MS ?? 5_500);

const viewports = [
  {
    name: "desktop-1440x900",
    width: 1440,
    height: 900,
    mobile: false,
    budget: {
      idealFps: 60,
      fallbackFps: 60,
      medianFrameMs: 16.7,
      p95FrameMs: 22,
      drawCalls: 135,
      triangles: 900_000,
      points: 35_000,
      dpr: 1.75,
    },
  },
  {
    name: "tablet-1024x1366",
    width: 1024,
    height: 1366,
    mobile: false,
    budget: {
      idealFps: 60,
      fallbackFps: 45,
      medianFrameMs: 20,
      p95FrameMs: 28,
      drawCalls: 100,
      triangles: 500_000,
      points: 18_000,
      dpr: 1.35,
    },
  },
  {
    name: "phone-390x844",
    width: 390,
    height: 844,
    mobile: true,
    budget: {
      idealFps: 60,
      fallbackFps: 30,
      medianFrameMs: 25,
      p95FrameMs: 33.3,
      drawCalls: 75,
      triangles: 250_000,
      points: 8_000,
      dpr: 1.25,
    },
  },
];

const chapters = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
];

function quantile(values, percentile) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentile) - 1));
  return sorted[index];
}

function summarizeIntervals(timestamps) {
  const intervals = [];
  for (let index = 1; index < timestamps.length; index += 1) {
    const interval = timestamps[index] - timestamps[index - 1];
    if (interval > 0 && Number.isFinite(interval)) intervals.push(interval);
  }
  const medianMs = quantile(intervals, 0.5);
  const p95Ms = quantile(intervals, 0.95);
  return {
    samples: intervals.length,
    medianMs,
    p95Ms,
    medianFps: medianMs ? 1_000 / medianMs : null,
    p95Fps: p95Ms ? 1_000 / p95Ms : null,
    over22Ms: intervals.filter((value) => value > 22).length,
    over33_3Ms: intervals.filter((value) => value > 33.3).length,
    over50Ms: intervals.filter((value) => value > 50).length,
    maximumMs: intervals.length > 0 ? Math.max(...intervals) : null,
  };
}

function numericValues(samples, property) {
  return samples
    .map((sample) => Number(sample.runtime[property]))
    .filter((value) => Number.isFinite(value));
}

function maximum(samples, property) {
  const values = numericValues(samples, property);
  return values.length > 0 ? Math.max(...values) : null;
}

function uniqueValues(samples, property) {
  return [...new Set(samples.map((sample) => sample.runtime[property]).filter(Boolean))];
}

function evaluateBudgets(viewport, report) {
  const observed = report.observed;
  const budget = viewport.budget;
  const rendererTiming = observed.rendererFrameIntervals;
  const finalTier = observed.qualityTiers.at(-1) ?? "unknown";
  const tierCadence = finalTier === "low"
    ? 30
    : finalTier === "standard" || finalTier === "enhanced"
        ? 60
        : 0;
  const tierMedianLimit = tierCadence > 0 ? 1_000 / tierCadence + 0.5 : null;
  const tierP95Limit = finalTier === "low"
    ? 50
    : finalTier === "standard"
      ? 22
      : finalTier === "enhanced"
        ? 22
        : null;
  const cadencePass =
    tierCadence > 0 &&
    rendererTiming.medianFps !== null &&
    rendererTiming.medianFps + 0.25 >= tierCadence;
  return {
    rendererCadenceAtTier: {
      pass: cadencePass,
      limit: `>= ${tierCadence} fps for final ${finalTier} tier`,
      observed: rendererTiming.medianFps,
    },
    rendererMedianTierAware: {
      pass: tierMedianLimit !== null && rendererTiming.medianMs !== null && rendererTiming.medianMs <= tierMedianLimit,
      limit: `<= ${tierMedianLimit?.toFixed(1) ?? "n/a"} ms for final ${finalTier} tier`,
      observed: rendererTiming.medianMs,
    },
    rendererP95TierAware: {
      pass: tierP95Limit !== null && rendererTiming.p95Ms !== null && rendererTiming.p95Ms <= tierP95Limit,
      limit: `<= ${tierP95Limit?.toFixed(1) ?? "n/a"} ms for final ${finalTier} tier`,
      observed: rendererTiming.p95Ms,
    },
    viewportIdealFpsGap: {
      pass: null,
      limit: `${budget.idealFps} fps viewport ideal (informational, independent of adaptive tier cap)`,
      observed: rendererTiming.medianFps === null
        ? null
        : Math.max(0, budget.idealFps - rendererTiming.medianFps),
    },
    viewportDesignFrameTargets: {
      pass: null,
      limit: `median <= ${budget.medianFrameMs} ms; p95 <= ${budget.p95FrameMs} ms (informational ideal)`,
      observed: {
        medianMs: rendererTiming.medianMs,
        p95Ms: rendererTiming.p95Ms,
      },
    },
    drawCalls: {
      pass: observed.maximumRendererCalls !== null && observed.maximumRendererCalls <= budget.drawCalls,
      limit: `<= ${budget.drawCalls}`,
      observed: observed.maximumRendererCalls,
    },
    triangles: {
      pass: observed.maximumRendererTriangles !== null && observed.maximumRendererTriangles <= budget.triangles,
      limit: `<= ${budget.triangles}`,
      observed: observed.maximumRendererTriangles,
    },
    points: {
      pass: observed.maximumRendererPoints !== null && observed.maximumRendererPoints <= budget.points,
      limit: `<= ${budget.points}`,
      observed: observed.maximumRendererPoints,
    },
    dpr: {
      pass: observed.maximumRendererDpr !== null && observed.maximumRendererDpr <= budget.dpr,
      limit: `<= ${budget.dpr}`,
      observed: observed.maximumRendererDpr,
    },
    sceneIdentity: {
      pass:
        observed.sceneGenerations.length === 1 &&
        observed.canvasGenerations.length === 1 &&
        observed.sceneIds.length === 1,
      limit: "exactly one scene generation, canvas generation, and scene id",
      observed: {
        sceneGenerations: observed.sceneGenerations,
        canvasGenerations: observed.canvasGenerations,
        sceneIds: observed.sceneIds,
      },
    },
    canvasBufferStable: {
      pass: observed.canvasBuffers.length === 1,
      limit: "one drawing-buffer size during scroll",
      observed: observed.canvasBuffers,
    },
    measuredAssetRequests: {
      pass: report.measuredNetworkMisses.length === 0,
      limit: "zero network/cache misses after warm-up",
      observed: report.measuredNetworkMisses.length,
    },
    contextAndPageErrors: {
      pass: report.pageErrors.length === 0 && report.requestFailures.length === 0,
      limit: "zero page errors and failed requests",
      observed: {
        pageErrors: report.pageErrors.length,
        requestFailures: report.requestFailures.length,
      },
    },
  };
}

function formatNumber(value, digits = 1) {
  return value === null || value === undefined ? "n/a" : Number(value).toFixed(digits);
}

function byteTotal(entries, property = "encodedBodySize") {
  return entries.reduce((total, entry) => total + (Number(entry[property]) || 0), 0);
}

function formatMegabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function markdownReport(reports, browserVersion) {
  const lines = [
    "# Selene Meridian production performance evidence",
    "",
    `- Captured: ${new Date().toISOString()}`,
    `- URL: \`${baseUrl}\` (Astro production preview)` ,
    `- Browser: ${browserVersion}`,
    "- Method: fresh browser context per viewport; all chapters warmed first; then one continuous top → bottom → top native scroll driven inside requestAnimationFrame; no screenshots, canvas readback, video, CPU throttling, or network throttling during the sample window.",
    "- Timing: main-thread RAF intervals and WebGL draw-frame intervals were measured separately. WebGL draw frames are detected by instrumenting draw calls before Three.js initializes; this preserves the intentional 30fps phone render cap while the browser may still deliver 60fps scroll RAF.",
    "",
    "## Results",
    "",
    "| Viewport | Tier(s) | WebGL median / p95 | WebGL median FPS | Scroll RAF median / p95 | Long tasks | Max calls / tris / points | DPR | Scene / canvas generations | Network misses / cache hits |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const report of reports) {
    const observed = report.observed;
    lines.push(
      `| ${report.viewport.name} | ${observed.qualityTiers.join(" → ") || "n/a"} | ${formatNumber(observed.rendererFrameIntervals.medianMs)} / ${formatNumber(observed.rendererFrameIntervals.p95Ms)} ms | ${formatNumber(observed.rendererFrameIntervals.medianFps)} | ${formatNumber(observed.scrollRafIntervals.medianMs)} / ${formatNumber(observed.scrollRafIntervals.p95Ms)} ms | ${report.measurement.longTasks.length} (${formatNumber(report.measurement.longTaskDurationMs)} ms) | ${observed.maximumRendererCalls ?? "n/a"} / ${observed.maximumRendererTriangles ?? "n/a"} / ${observed.maximumRendererPoints ?? "n/a"} | ${formatNumber(observed.maximumRendererDpr, 2)} | ${observed.sceneGenerations.join(",")} / ${observed.canvasGenerations.join(",")} | ${report.measuredNetworkMisses.length} / ${report.measuredCacheHits.length} |`,
    );
  }
  lines.push("", "## Adaptive-quality warm-up probe", "");
  for (const report of reports) {
    const warmTiers = [
      report.initialRuntime.qualityTier,
      ...report.warmupRuntime.map((sample) => sample.runtime.qualityTier),
    ].filter(Boolean);
    const compactTiers = warmTiers.filter((tier, index) => tier !== warmTiers[index - 1]);
    const longestTask = report.warmupMeasurement.longTasks.length > 0
      ? Math.max(...report.warmupMeasurement.longTasks.map((task) => task.duration))
      : 0;
    lines.push(
      `- ${report.viewport.name}: ${compactTiers.join(" → ")}; ${report.warmupMeasurement.longTasks.length} long tasks / ${formatNumber(report.warmupMeasurement.longTaskDurationMs)}ms total / ${formatNumber(longestTask)}ms longest. This probe includes initial PBR/HDR/pose decoding as well as any quality change, so it is a transition-safety signal rather than a steady-state FPS score.`,
    );
  }
  lines.push("", "## Budget assessment", "");
  for (const report of reports) {
    lines.push(`### ${report.viewport.name}`, "");
    for (const [name, result] of Object.entries(report.budgetAssessment)) {
      const observed = typeof result.observed === "object" ? JSON.stringify(result.observed) : formatNumber(result.observed, 2);
      const verdict = result.pass === null ? "INFO" : result.pass ? "PASS" : "MISS";
      lines.push(`- ${verdict} — ${name}: ${observed}; budget ${result.limit}.`);
    }
    lines.push("");
  }
  lines.push(
    "## Asset and lifecycle stability",
    "",
  );
  for (const report of reports) {
    const pbrDuringMeasurement = report.measuredNetworkMisses.filter((request) =>
      /\/assets\/three\/selene-meridian\//.test(request.url),
    );
    const uniqueWarmResources = [...new Map(
      report.resourceInventory.beforeMeasurement.map((entry) => [entry.name, entry]),
    ).values()];
    const seleneResources = uniqueWarmResources.filter((entry) =>
      /\/assets\/three\/selene-meridian\//.test(entry.name),
    );
    lines.push(
      `- ${report.viewport.name}: ${uniqueWarmResources.length} unique resources / ${formatMegabytes(byteTotal(uniqueWarmResources))} encoded after warm-up; Selene PBR/HDR ${seleneResources.length} resources / ${formatMegabytes(byteTotal(seleneResources))}; ${report.measuredNetworkMisses.length} measured-window cache misses, ${report.measuredCacheHits.length} cache-served requests, including ${pbrDuringMeasurement.length} Selene PBR/HDR misses. Scene ids: ${report.observed.sceneIds.join(", ")}; canvas buffers: ${report.observed.canvasBuffers.join(", ")}.`,
    );
  }
  lines.push(
    "",
    "## Interpretation and limitations",
    "",
    "- This is a deterministic local regression trace, not field telemetry or a Lighthouse score. Headless Chrome may expose ANGLE/SwiftShader rather than the user's physical GPU; the exact renderer is recorded per viewport in `performance-evidence.json`.",
    "- FPS is cadence, not GPU execution time. The WebGL wrapper records which RAF ticks submitted draw calls but does not call `gl.finish()`, read pixels, or use disjoint timer queries; asynchronous GPU completion time is therefore not measured.",
    "- Resource Timing can report 300 bytes of protocol overhead for memory reuse while CDP reports a 200 response without a disk-cache flag. The report classifies explicit CDP cache flags, plus protocol-only reuse when CDP transfers at most 1KiB while Resource Timing exposes an already-decoded body over 1KiB and at most 300 transferred bytes. Raw events remain in the JSON for audit.",
    "- A long task is browser-defined main-thread work of at least 50ms. Shorter jank is represented by frame-interval percentiles and over-budget counts.",
    "- Every context uses deviceScaleFactor 1 so DPR-cap behavior is auditable without conflating high-DPI fill-rate cost. The reported DPR result therefore validates the configured cap, not DPR 2/3 physical-device throughput.",
    "- Each viewport is one continuous 15-second trace, not a statistical field sample. Repeated CI runs should be compared as regression evidence rather than averaged into a hardware benchmark.",
    "- Viewport emulation does not reproduce thermal throttling, mobile GPU bandwidth, battery mode, browser UI, or physical touch input. A representative integrated-GPU laptop and mid-tier physical phone remain the release-grade validation targets.",
  );
  return `${lines.join("\n")}\n`;
}

async function installInstrumentation(context) {
  await context.addInitScript(() => {
    const metrics = {
      recording: false,
      currentRafTimestamp: 0,
      lastRafTimestamp: -1,
      lastDrawTimestamp: -1,
      rafTimestamps: [],
      rendererFrameTimestamps: [],
      longTasks: [],
      scrollEvents: 0,
      patchedDrawMethods: [],
    };
    window.__selenePerformance = metrics;

    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => nativeRequestAnimationFrame((timestamp) => {
      metrics.currentRafTimestamp = timestamp;
      if (metrics.recording && timestamp !== metrics.lastRafTimestamp) {
        metrics.lastRafTimestamp = timestamp;
        metrics.rafTimestamps.push(timestamp);
      }
      return callback(timestamp);
    });

    const recordDrawFrame = () => {
      if (!metrics.recording) return;
      const timestamp = metrics.currentRafTimestamp || performance.now();
      if (timestamp === metrics.lastDrawTimestamp) return;
      metrics.lastDrawTimestamp = timestamp;
      metrics.rendererFrameTimestamps.push(timestamp);
    };
    const patchPrototype = (prototype) => {
      if (!prototype) return;
      for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const original = prototype[name];
        if (typeof original !== "function") continue;
        try {
          prototype[name] = function patchedDrawMethod(...args) {
            recordDrawFrame();
            return original.apply(this, args);
          };
          metrics.patchedDrawMethods.push(name);
        } catch {
          // Some browser builds expose non-writable WebGL prototypes. The
          // runtime diagnostic datasets remain a truthful fallback in that case.
        }
      }
    };
    patchPrototype(window.WebGL2RenderingContext?.prototype);
    patchPrototype(window.WebGLRenderingContext?.prototype);

    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          if (!metrics.recording) return;
          for (const entry of list.getEntries()) {
            metrics.longTasks.push({
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
            });
          }
        });
        observer.observe({ type: "longtask", buffered: false });
      } catch {
        // Long Tasks are not available in every browser context.
      }
    }

    addEventListener("scroll", () => {
      if (metrics.recording) metrics.scrollEvents += 1;
    }, { passive: true });
  });
}

async function waitForLiveWorld(page) {
  await page.waitForSelector("[data-observatory-root]", { timeout: 20_000 });
  await page.waitForFunction(() => {
    const state = document.querySelector("[data-observatory-root]")?.dataset.renderState;
    return state === "ready" || state === "static" || state === "failed";
  }, undefined, { timeout: 20_000 });
  const state = await page.locator("[data-observatory-root]").getAttribute("data-render-state");
  if (state === "ready") {
    await page.waitForFunction(() => {
      const status = document.querySelector("[data-observatory-root]")?.dataset.environmentStatus;
      return status === "ready" || status === "partial";
    }, undefined, { timeout: 20_000 }).catch(() => {});
  }
  return state;
}

async function warmAllChapters(page) {
  const snapshots = [];
  for (const chapter of chapters) {
    await page.evaluate((id) => {
      const element = document.querySelector(`[data-observatory-chapter="${id}"]`);
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      scrollTo(0, Math.max(0, bounds.top + scrollY + bounds.height * 0.5 - innerHeight * 0.5));
    }, chapter);
    // The guide transition is 220ms out + 72ms gap + 360ms in. Waiting
    // beyond that full envelope guarantees every chapter pose has fetched and
    // decoded before the measured network-stability window begins.
    await page.waitForTimeout(900);
    snapshots.push(await page.locator("[data-observatory-root]").evaluate((root, chapterId) => ({
      chapter: chapterId,
      runtime: { ...root.dataset },
    }), chapter));
  }
  await page.evaluate(() => scrollTo(0, 0));
  // Allow the adaptive governor to finish any deferred quality transition
  // before the continuous-scroll trace. Transition cost is kept in the warmup
  // snapshots instead of contaminating stable-state cadence.
  await page.waitForTimeout(3_500);
  snapshots.push(await page.locator("[data-observatory-root]").evaluate((root) => ({
    chapter: "settled-top",
    runtime: { ...root.dataset },
  })));
  return snapshots;
}

async function resourceInventory(page) {
  return page.evaluate(() => performance.getEntriesByType("resource").map((entry) => ({
    name: entry.name,
    initiatorType: entry.initiatorType,
    startTime: entry.startTime,
    duration: entry.duration,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
  })));
}

async function startInstrumentationProbe(page) {
  await page.evaluate(() => {
    const metrics = window.__selenePerformance;
    if (!metrics) throw new Error("Selene performance instrumentation is unavailable");
    metrics.rafTimestamps.length = 0;
    metrics.rendererFrameTimestamps.length = 0;
    metrics.longTasks.length = 0;
    metrics.scrollEvents = 0;
    metrics.lastRafTimestamp = -1;
    metrics.lastDrawTimestamp = -1;
    metrics.recording = true;
  });
}

async function finishInstrumentationProbe(page) {
  return page.evaluate(() => {
    const metrics = window.__selenePerformance;
    if (!metrics) throw new Error("Selene performance instrumentation is unavailable");
    metrics.recording = false;
    return {
      scrollEvents: metrics.scrollEvents,
      rafTimestamps: [...metrics.rafTimestamps],
      rendererFrameTimestamps: [...metrics.rendererFrameTimestamps],
      longTasks: [...metrics.longTasks],
    };
  });
}

async function sampleContinuousScroll(page) {
  return page.evaluate(async ({ downMs, holdMs, upMs }) => {
    const root = document.querySelector("[data-observatory-root]");
    const metrics = window.__selenePerformance;
    if (!root || !metrics) throw new Error("Selene performance instrumentation is unavailable");

    metrics.rafTimestamps.length = 0;
    metrics.rendererFrameTimestamps.length = 0;
    metrics.longTasks.length = 0;
    metrics.scrollEvents = 0;
    metrics.lastRafTimestamp = -1;
    metrics.lastDrawTimestamp = -1;
    const sampleStartTime = performance.now();
    metrics.recording = true;

    const samples = [];
    let lastRuntimeSampleAt = -Infinity;
    const snapshot = (timestamp) => {
      if (timestamp - lastRuntimeSampleAt < 200) return;
      lastRuntimeSampleAt = timestamp;
      samples.push({
        timestamp,
        scrollY,
        progress: Math.max(0, Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))),
        runtime: { ...root.dataset },
      });
    };
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const totalDuration = downMs + holdMs + upMs;
    await new Promise((resolveSample) => {
      const startedAt = performance.now();
      const tick = (timestamp) => {
        const elapsed = timestamp - startedAt;
        let nextY;
        if (elapsed <= downMs) {
          nextY = maximum * Math.min(1, elapsed / downMs);
        } else if (elapsed <= downMs + holdMs) {
          nextY = maximum;
        } else {
          const reverseProgress = Math.min(1, (elapsed - downMs - holdMs) / upMs);
          nextY = maximum * (1 - reverseProgress);
        }
        scrollTo(0, nextY);
        snapshot(timestamp);
        if (elapsed < totalDuration) requestAnimationFrame(tick);
        else resolveSample();
      };
      requestAnimationFrame(tick);
    });

    await new Promise((resolveSettle) => requestAnimationFrame(() => requestAnimationFrame(resolveSettle)));
    snapshot(performance.now());
    metrics.recording = false;
    const sampleEndTime = performance.now();
    const newResources = performance.getEntriesByType("resource")
      .filter((entry) => entry.startTime >= sampleStartTime)
      .map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        startTime: entry.startTime,
        duration: entry.duration,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      }));
    return {
      sampleStartTime,
      sampleEndTime,
      durationMs: sampleEndTime - sampleStartTime,
      maximumScrollY: maximum,
      finalScrollY: scrollY,
      scrollEvents: metrics.scrollEvents,
      patchedDrawMethods: [...metrics.patchedDrawMethods],
      rafTimestamps: [...metrics.rafTimestamps],
      rendererFrameTimestamps: [...metrics.rendererFrameTimestamps],
      longTasks: [...metrics.longTasks],
      runtimeSamples: samples,
      newResources,
    };
  }, { downMs: sampleDownMs, holdMs: sampleHoldMs, upMs: sampleUpMs });
}

async function captureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => localStorage.setItem("lunar-observatory-theme", "dark"));
  await installInstrumentation(context);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  const report = {
    viewport: { name: viewport.name, width: viewport.width, height: viewport.height, mobile: viewport.mobile },
    budget: viewport.budget,
    consoleMessages: [],
    pageErrors: [],
    requestFailures: [],
    requestsDuringMeasurement: [],
    measuredNetworkMisses: [],
    measuredCacheHits: [],
  };
  let measurementActive = false;
  const measuredRequestsById = new Map();
  cdp.on("Network.requestWillBeSent", (event) => {
    if (!measurementActive) return;
    measuredRequestsById.set(event.requestId, {
      requestId: event.requestId,
      url: event.request.url,
      method: event.request.method,
      resourceType: event.type,
      fromDiskCache: false,
      fromPrefetchCache: false,
      fromServiceWorker: false,
      responseSeen: false,
      status: null,
      encodedDataLength: null,
    });
  });
  cdp.on("Network.responseReceived", (event) => {
    const request = measuredRequestsById.get(event.requestId);
    if (!request) return;
    request.responseSeen = true;
    request.status = event.response.status;
    request.fromDiskCache = event.response.fromDiskCache === true;
    request.fromPrefetchCache = event.response.fromPrefetchCache === true;
    request.fromServiceWorker = event.response.fromServiceWorker === true;
  });
  cdp.on("Network.requestServedFromCache", (event) => {
    const request = measuredRequestsById.get(event.requestId);
    if (request) request.fromDiskCache = true;
  });
  cdp.on("Network.loadingFinished", (event) => {
    const request = measuredRequestsById.get(event.requestId);
    if (request) request.encodedDataLength = event.encodedDataLength;
  });
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      report.consoleMessages.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    report.requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? "unknown" });
  });
  page.on("request", (request) => {
    if (measurementActive) {
      report.requestsDuringMeasurement.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      });
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  report.initialRenderState = await waitForLiveWorld(page);
  report.initialRuntime = await page.locator("[data-observatory-root]").evaluate((root) => ({ ...root.dataset }));
  await startInstrumentationProbe(page);
  report.warmupRuntime = await warmAllChapters(page);
  report.warmupMeasurement = await finishInstrumentationProbe(page);
  report.warmupMeasurement.scrollRafIntervals = summarizeIntervals(report.warmupMeasurement.rafTimestamps);
  report.warmupMeasurement.rendererFrameIntervals = summarizeIntervals(report.warmupMeasurement.rendererFrameTimestamps);
  report.warmupMeasurement.longTaskDurationMs = report.warmupMeasurement.longTasks.reduce(
    (total, task) => total + task.duration,
    0,
  );
  const beforeMeasurement = await resourceInventory(page);
  measurementActive = true;
  report.measurement = await sampleContinuousScroll(page);
  await page.waitForTimeout(100);
  measurementActive = false;
  const measuredRequests = [...measuredRequestsById.values()];
  const afterMeasurement = await resourceInventory(page);
  const measuredResourceEntries = report.measurement.newResources;
  for (const request of measuredRequests) {
    const resourceEntry = measuredResourceEntries.find((entry) => entry.name === request.url);
    const protocolOnlyReuse =
      request.status === 200 &&
      (request.encodedDataLength ?? Number.POSITIVE_INFINITY) <= 1_024 &&
      (resourceEntry?.transferSize ?? Number.POSITIVE_INFINITY) <= 300 &&
      (resourceEntry?.encodedBodySize ?? 0) > 1_024;
    request.cacheEvidence = protocolOnlyReuse ? "protocol-only-memory-reuse" : null;
  }
  report.measuredCacheHits = measuredRequests.filter((request) =>
    request.fromDiskCache ||
    request.fromPrefetchCache ||
    request.fromServiceWorker ||
    request.cacheEvidence === "protocol-only-memory-reuse",
  );
  report.measuredNetworkMisses = measuredRequests.filter((request) =>
    !request.fromDiskCache &&
    !request.fromPrefetchCache &&
    !request.fromServiceWorker &&
    request.cacheEvidence !== "protocol-only-memory-reuse",
  );

  report.resourceInventory = { beforeMeasurement, afterMeasurement };
  report.environment = await page.evaluate(() => {
    const canvas = document.querySelector("[data-observatory-canvas]");
    const gl = canvas?.getContext("webgl2");
    const debug = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory ?? null,
      devicePixelRatio,
      colorDepth: screen.colorDepth,
      webglVersion: gl?.getParameter(gl.VERSION) ?? null,
      webglVendor: debug ? gl?.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl?.getParameter(gl.VENDOR) ?? null,
      webglRenderer: debug ? gl?.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? null,
      glError: gl?.getError() ?? null,
    };
  });

  const samples = report.measurement.runtimeSamples;
  report.measurement.longTaskDurationMs = report.measurement.longTasks.reduce(
    (total, task) => total + task.duration,
    0,
  );
  report.observed = {
    scrollRafIntervals: summarizeIntervals(report.measurement.rafTimestamps),
    rendererFrameIntervals: summarizeIntervals(report.measurement.rendererFrameTimestamps),
    maximumRendererCalls: maximum(samples, "rendererCalls"),
    maximumRendererTriangles: maximum(samples, "rendererTriangles"),
    maximumRendererPoints: maximum(samples, "rendererPoints"),
    maximumRendererLines: maximum(samples, "rendererLines"),
    maximumRendererGeometries: maximum(samples, "rendererGeometries"),
    maximumRendererTextures: maximum(samples, "rendererTextures"),
    maximumRendererDpr: maximum(samples, "rendererDpr"),
    qualityTiers: uniqueValues(samples, "qualityTier"),
    renderStates: uniqueValues(samples, "renderState"),
    visibilityStates: uniqueValues(samples, "visibilityState"),
    sceneGenerations: uniqueValues(samples, "sceneGeneration"),
    canvasGenerations: uniqueValues(samples, "canvasGeneration"),
    sceneIds: uniqueValues(samples, "sceneId"),
    canvasBuffers: uniqueValues(samples, "canvasBuffer"),
    environmentStatuses: uniqueValues(samples, "environmentStatus"),
    activeChapters: uniqueValues(samples, "activeChapter"),
  };
  report.budgetAssessment = evaluateBudgets(viewport, report);
  await context.close();
  return report;
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=d3d11"],
});
const reports = [];
const browserVersion = await browser.version();
try {
  for (const viewport of viewports) reports.push(await captureViewport(browser, viewport));
} finally {
  await browser.close();
}

const evidence = {
  capturedAt: new Date().toISOString(),
  baseUrl,
  browserVersion,
  sampleConfiguration: { sampleDownMs, sampleHoldMs, sampleUpMs },
  reports,
};
await writeFile(join(outputRoot, "performance-evidence.json"), JSON.stringify(evidence, null, 2));
await writeFile(join(outputRoot, "performance-report.md"), markdownReport(reports, browserVersion));

const fatalCount = reports.reduce(
  (total, report) => total + report.pageErrors.length + report.requestFailures.length,
  0,
);
if (fatalCount > 0) process.exitCode = 1;
