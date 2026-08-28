import type {
  ObservatoryQualityDecision,
  ObservatoryQualityProfile,
  ObservatoryQualityTier
} from "./types";

const PROFILES: Record<ObservatoryQualityTier, ObservatoryQualityProfile> = {
  poster: {
    tier: "poster",
    pixelRatioCap: 1,
    avatarSegments: 0,
    worldDetail: 0,
    terrainSegments: 0,
    cityInstanceCount: 0,
    dishInstanceCount: 0,
    trussInstanceCount: 0,
    starCount: 0,
    orbitSegments: 0,
    frameRateCap: 0,
    pointerInteraction: false,
    postProcessing: false
  },
  low: {
    tier: "low",
    pixelRatioCap: 1,
    avatarSegments: 20,
    worldDetail: 1,
    terrainSegments: 56,
    cityInstanceCount: 42,
    dishInstanceCount: 10,
    trussInstanceCount: 48,
    starCount: 220,
    orbitSegments: 56,
    frameRateCap: 30,
    pointerInteraction: false,
    postProcessing: false
  },
  standard: {
    tier: "standard",
    pixelRatioCap: 1.5,
    avatarSegments: 44,
    worldDetail: 2,
    terrainSegments: 88,
    cityInstanceCount: 82,
    dishInstanceCount: 18,
    trussInstanceCount: 88,
    starCount: 520,
    orbitSegments: 96,
    frameRateCap: 60,
    pointerInteraction: true,
    postProcessing: false
  },
  enhanced: {
    tier: "enhanced",
    pixelRatioCap: 1.6,
    avatarSegments: 64,
    worldDetail: 3,
    terrainSegments: 120,
    cityInstanceCount: 132,
    dishInstanceCount: 26,
    trussInstanceCount: 144,
    starCount: 820,
    orbitSegments: 144,
    frameRateCap: 60,
    pointerInteraction: true,
    postProcessing: true
  }
};

interface NavigatorWithHints extends Navigator {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
}

const cloneProfile = (tier: ObservatoryQualityTier): ObservatoryQualityProfile => ({ ...PROFILES[tier] });

export function getQualityProfile(tier: ObservatoryQualityTier): ObservatoryQualityProfile {
  return cloneProfile(tier);
}

export function getLowerQualityProfile(current: ObservatoryQualityTier): ObservatoryQualityProfile {
  if (current === "enhanced") return cloneProfile("standard");
  if (current === "standard") return cloneProfile("low");
  return cloneProfile(current);
}

export function resolveContinuousMotion(root: HTMLElement): boolean {
  const value = getComputedStyle(root).getPropertyValue("--motion-continuous-enabled").trim();
  return value !== "0";
}

function createWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  try {
    return canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: true,
      desynchronized: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: false
    });
  } catch {
    return null;
  }
}

export function decideObservatoryQuality(root: HTMLElement, canvas: HTMLCanvasElement): ObservatoryQualityDecision {
  const navigatorHints = navigator as NavigatorWithHints;
  const reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "reduced" ||
    !resolveContinuousMotion(root);
  const saveData = navigatorHints.connection?.saveData === true;

  if (reducedMotion) {
    return { profile: cloneProfile("poster"), reason: "reduced-motion", context: null, reducedMotion, saveData };
  }

  if (saveData) {
    return { profile: cloneProfile("poster"), reason: "save-data", context: null, reducedMotion, saveData };
  }

  if (!("WebGL2RenderingContext" in window)) {
    return { profile: cloneProfile("poster"), reason: "webgl2-unavailable", context: null, reducedMotion, saveData };
  }

  const context = createWebGL2Context(canvas);
  if (!context) {
    return { profile: cloneProfile("poster"), reason: "webgl2-context-failed", context: null, reducedMotion, saveData };
  }

  const memory = navigatorHints.deviceMemory ?? 0;
  const concurrency = navigator.hardwareConcurrency ?? 0;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const compactViewport = window.innerWidth < 768;
  const constrained = (memory > 0 && memory <= 4) || (concurrency > 0 && concurrency <= 4);

  if (compactViewport || constrained || coarsePointer) {
    return { profile: cloneProfile("low"), reason: "constrained-device", context, reducedMotion, saveData };
  }

  const enhancedEvidence =
    window.innerWidth >= 1440 &&
    (memory === 0 || memory >= 8) &&
    (concurrency === 0 || concurrency >= 8);

  return {
    profile: cloneProfile(enhancedEvidence ? "enhanced" : "standard"),
    reason: enhancedEvidence ? "enhanced-capability" : "standard-capability",
    context,
    reducedMotion,
    saveData
  };
}
