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
