import { describe, expect, it } from "vitest";
import {
  classifyRendererResize,
  createLayoutMeasureState,
  consumePendingPointerSample,
  createRendererResizeState,
  queuePointerSample,
  resolveRuntimeActivity,
  resolveRendererViewport,
  shouldApplyDeferredQuality,
  shouldMeasureLayout,
  shouldResizeRenderer,
  shouldUpdateProjection,
  summarizeFrameDurations,
} from "../../src/lib/observatory/render-scheduler";

describe("observatory render scheduler", () => {
  it("treats subpixel viewport jitter as bounds-only work after the backing buffer is current", () => {
    const state = createRendererResizeState();
    const viewport = resolveRendererViewport({
      canvasWidth: 1440,
      canvasHeight: 900,
      windowWidth: 1440,
      windowHeight: 900,
      devicePixelRatio: 2,
      pixelRatioCap: 1.5,
    });

    expect(classifyRendererResize(state, viewport)).toBe("resize-buffer");
    expect(classifyRendererResize(state, { ...viewport, height: 900.4 })).toBe("bounds-only");
    expect(classifyRendererResize(state, { ...viewport, height: 904 })).toBe("resize-buffer");
  });

  it("skips renderer resize work when logical size and DPR are unchanged", () => {
    const state = createRendererResizeState();
    const viewport = resolveRendererViewport({
      canvasWidth: 1440,
      canvasHeight: 900,
      windowWidth: 1440,
      windowHeight: 900,
      devicePixelRatio: 2,
      pixelRatioCap: 1.5,
    });

    expect(shouldResizeRenderer(state, viewport)).toBe(true);
    expect(shouldResizeRenderer(state, viewport)).toBe(false);
    expect(shouldResizeRenderer(state, { ...viewport, height: 901 })).toBe(true);
  });

  it("keeps only the latest pointer sample before the render loop consumes it", () => {
    const first = queuePointerSample(null, { x: -0.25, y: 0.1, strength: 0.68 });
    const latest = queuePointerSample(first, { x: 0.35, y: -0.15, strength: 0.68 });

    expect(consumePendingPointerSample(latest)).toEqual({ x: 0.35, y: -0.15, strength: 0.68 });
    expect(consumePendingPointerSample(null)).toBeNull();
  });

  it("ignores resize observer callbacks that do not change the rounded layout signature", () => {
    const state = createLayoutMeasureState();
    const first = {
      rootWidth: 1280,
      rootHeight: 5120,
      canvasWidth: 1280,
      canvasHeight: 800,
      windowWidth: 1280,
      windowHeight: 800,
      devicePixelRatio: 1.25,
    };

    expect(shouldMeasureLayout(state, first)).toBe(true);
    expect(shouldMeasureLayout(state, { ...first, rootHeight: 5120.34 })).toBe(false);
    expect(shouldMeasureLayout(state, { ...first, windowHeight: 801 })).toBe(true);
  });

  it("runs only while the document, root, and WebGL context are available", () => {
    const visible = {
      disposed: false,
      documentVisible: true,
      rootVisible: true,
      contextAvailable: true,
      manualPauseRequested: false,
    };

    expect(resolveRuntimeActivity(visible)).toEqual({ shouldRun: true, visibility: "visible" });
    expect(resolveRuntimeActivity({ ...visible, rootVisible: false })).toEqual({
      shouldRun: false,
      visibility: "root-offscreen",
    });
    expect(resolveRuntimeActivity({ ...visible, documentVisible: false, rootVisible: false }).visibility).toBe(
      "document-hidden",
    );
    expect(resolveRuntimeActivity({ ...visible, contextAvailable: false }).visibility).toBe("context-lost");
    expect(resolveRuntimeActivity({ ...visible, disposed: true }).visibility).toBe("disposed");
  });

  it("defers adaptive quality work until scrolling settles or the world is offscreen", () => {
    const input = {
      hasPendingProfile: true,
      scrollDirty: false,
      documentVisible: true,
      rootVisible: true,
      timestamp: 1_000,
      lastScrollEventAt: 900,
      settleDurationMs: 240,
    };

    expect(shouldApplyDeferredQuality(input)).toBe(false);
    expect(shouldApplyDeferredQuality({ ...input, timestamp: 1_141 })).toBe(true);
    expect(shouldApplyDeferredQuality({ ...input, timestamp: 2_000, scrollDirty: true })).toBe(false);
    expect(shouldApplyDeferredQuality({ ...input, rootVisible: false, scrollDirty: true })).toBe(true);
    expect(shouldApplyDeferredQuality({ ...input, hasPendingProfile: false, rootVisible: false })).toBe(false);
  });

  it("avoids projection-matrix work for imperceptible FOV changes", () => {
    expect(shouldUpdateProjection(42, 42.005)).toBe(false);
    expect(shouldUpdateProjection(42, 42.02)).toBe(true);
  });

  it("summarizes a bounded frame sample without mutating it", () => {
    const samples = [17, 8, 33, 16, 20];
    expect(summarizeFrameDurations(samples)).toEqual({ median: 17, p95: 33 });
    expect(samples).toEqual([17, 8, 33, 16, 20]);
    expect(summarizeFrameDurations([])).toBeNull();
  });
});
