export interface RendererViewport {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface RendererViewportInput {
  canvasWidth: number;
  canvasHeight: number;
  windowWidth: number;
  windowHeight: number;
  devicePixelRatio: number;
  pixelRatioCap: number;
}

export interface RendererResizeState {
  width: number;
  height: number;
  pixelRatio: number;
}

export type RendererResizeWork = "resize-buffer" | "bounds-only";

export interface LayoutMeasureInput {
  rootWidth: number;
  rootHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  windowWidth: number;
  windowHeight: number;
  devicePixelRatio: number;
}

export interface LayoutMeasureState {
  signature: string;
}

export interface PointerSample {
  x: number;
  y: number;
  strength: number;
}

export type RuntimeVisibilityState =
  | "visible"
  | "document-hidden"
  | "root-offscreen"
  | "context-lost"
  | "manually-paused"
  | "disposed";

export interface RuntimeActivityInput {
  disposed: boolean;
  documentVisible: boolean;
  rootVisible: boolean;
  contextAvailable: boolean;
  manualPauseRequested: boolean;
}

export interface RuntimeActivity {
  shouldRun: boolean;
  visibility: RuntimeVisibilityState;
}

export interface DeferredQualityInput {
  hasPendingProfile: boolean;
  scrollDirty: boolean;
  documentVisible: boolean;
  rootVisible: boolean;
  timestamp: number;
  lastScrollEventAt: number;
  settleDurationMs: number;
}

export interface FrameDurationSummary {
  median: number;
  p95: number;
}

export function createRendererResizeState(): RendererResizeState {
  return { width: 0, height: 0, pixelRatio: 0 };
}

export function createLayoutMeasureState(): LayoutMeasureState {
  return { signature: "" };
}

export function resolveRendererViewport(input: RendererViewportInput): RendererViewport {
  return {
    width: Math.max(1, input.canvasWidth || input.windowWidth),
    height: Math.max(1, input.canvasHeight || input.windowHeight),
    pixelRatio: Math.min(input.devicePixelRatio || 1, input.pixelRatioCap),
  };
}

export function shouldResizeRenderer(state: RendererResizeState, viewport: RendererViewport): boolean {
  return classifyRendererResize(state, viewport) === "resize-buffer";
}

export function classifyRendererResize(state: RendererResizeState, viewport: RendererViewport): RendererResizeWork {
  const nextWidth = Math.round(viewport.width);
  const nextHeight = Math.round(viewport.height);
  const samePixelRatio = state.pixelRatio === viewport.pixelRatio;
  const sameBuffer = state.width === nextWidth && state.height === nextHeight && samePixelRatio;
  if (sameBuffer) return "bounds-only";
  const jitterOnly =
    samePixelRatio &&
    state.width > 0 &&
    state.height > 0 &&
    Math.abs(state.width - viewport.width) < 1 &&
    Math.abs(state.height - viewport.height) < 1;
  if (jitterOnly) return "bounds-only";
  state.width = nextWidth;
  state.height = nextHeight;
  state.pixelRatio = viewport.pixelRatio;
  return "resize-buffer";
}

function layoutSignature(input: LayoutMeasureInput): string {
  return [
    input.rootWidth,
    input.rootHeight,
    input.canvasWidth,
    input.canvasHeight,
    input.windowWidth,
    input.windowHeight,
    input.devicePixelRatio,
  ]
    .map((value) => String(Math.round(Math.max(0, Number.isFinite(value) ? value : 0))))
    .join(":");
}

export function shouldMeasureLayout(state: LayoutMeasureState, input: LayoutMeasureInput): boolean {
  const signature = layoutSignature(input);
  if (state.signature === signature) return false;
  state.signature = signature;
  return true;
}

export function queuePointerSample(_: PointerSample | null, sample: PointerSample): PointerSample {
  return sample;
}

export function consumePendingPointerSample(sample: PointerSample | null): PointerSample | null {
  return sample;
}

export function resolveRuntimeActivity(input: RuntimeActivityInput): RuntimeActivity {
  if (input.disposed) return { shouldRun: false, visibility: "disposed" };
  if (!input.contextAvailable) return { shouldRun: false, visibility: "context-lost" };
  if (!input.documentVisible) return { shouldRun: false, visibility: "document-hidden" };
  if (!input.rootVisible) return { shouldRun: false, visibility: "root-offscreen" };
  if (input.manualPauseRequested) return { shouldRun: false, visibility: "manually-paused" };
  return { shouldRun: true, visibility: "visible" };
}

export function shouldApplyDeferredQuality(input: DeferredQualityInput): boolean {
  if (!input.hasPendingProfile) return false;
  if (!input.documentVisible || !input.rootVisible) return true;
  if (input.scrollDirty) return false;
  return input.timestamp - input.lastScrollEventAt >= input.settleDurationMs;
}

export function shouldUpdateProjection(currentFov: number, nextFov: number, epsilon = 0.01): boolean {
  return Math.abs(currentFov - nextFov) >= epsilon;
}

export function summarizeFrameDurations(samples: readonly number[]): FrameDurationSummary | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return { median, p95: sorted[p95Index] ?? median };
}
