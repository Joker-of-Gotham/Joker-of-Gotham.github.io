import { OBSERVATORY_CHAPTERS } from "./types";
import type {
  ObservatoryChapterId,
  ObservatoryTimelineKeyframe,
  ObservatoryTimelineState,
  Vec3Tuple
} from "./types";

/**
 * Chapter cues live on one approximately 459-unit route. The world never moves: this table
 * only changes the director, atmosphere, guide framing, and landmark emphasis.
 */
export const OBSERVATORY_TIMELINE: readonly ObservatoryTimelineKeyframe[] = [
  {
    chapter: "signal-gate",
    routeProgress: 0.015,
    fieldOfView: 34,
    cameraRoll: -0.012,
    avatarOffset: [2.05, -0.72, -7.4],
    avatarScale: 0.92,
    avatarPresence: 1,
    avatarYaw: -0.025,
    avatarLean: -0.014,
    avatarEnergy: 0.42,
    fogDensity: 0.0068,
    signalIntensity: 1,
    afterlightIntensity: 0.08,
    moonIntensity: 1,
    cityIntensity: 0.18,
    ringIntensity: 0.3,
    canyonIntensity: 0.12
  },
  {
    chapter: "observe",
    routeProgress: 0.19,
    fieldOfView: 39,
    cameraRoll: 0.018,
    avatarOffset: [2.35, -0.78, -8.1],
    avatarScale: 0.82,
    avatarPresence: 1,
    avatarYaw: 0.03,
    avatarLean: 0.016,
    avatarEnergy: 0.32,
    fogDensity: 0.0084,
    signalIntensity: 0.78,
    afterlightIntensity: 0.12,
    moonIntensity: 0.9,
    cityIntensity: 0.4,
    ringIntensity: 0.58,
    canyonIntensity: 0.2
  },
  {
    chapter: "structure",
    routeProgress: 0.385,
    fieldOfView: 45,
    cameraRoll: -0.026,
    avatarOffset: [2.65, -0.95, -8.9],
    avatarScale: 0.72,
    avatarPresence: 0.96,
    avatarYaw: -0.045,
    avatarLean: -0.026,
    avatarEnergy: 0.28,
    fogDensity: 0.0098,
    signalIntensity: 0.68,
    afterlightIntensity: 0.18,
    moonIntensity: 0.62,
    cityIntensity: 0.72,
    ringIntensity: 1,
    canyonIntensity: 0.35
  },
  {
    chapter: "orchestrate",
    routeProgress: 0.585,
    fieldOfView: 41,
    cameraRoll: 0.022,
    avatarOffset: [3.18, -0.78, -7.9],
    avatarScale: 0.74,
    avatarPresence: 0.98,
    avatarYaw: 0.052,
    avatarLean: 0.025,
    avatarEnergy: 0.68,
    fogDensity: 0.0088,
    signalIntensity: 0.9,
    afterlightIntensity: 0.24,
    moonIntensity: 0.48,
    cityIntensity: 1,
    ringIntensity: 0.8,
    canyonIntensity: 0.64
  },
  {
    chapter: "embodiment",
    routeProgress: 0.79,
    fieldOfView: 37,
    cameraRoll: -0.016,
    avatarOffset: [-3.45, -0.82, -9.25],
    avatarScale: 0.68,
    avatarPresence: 1,
    avatarYaw: -0.012,
    avatarLean: -0.01,
    avatarEnergy: 0.92,
    fogDensity: 0.0072,
    signalIntensity: 1,
    afterlightIntensity: 0.38,
    moonIntensity: 0.58,
    cityIntensity: 0.66,
    ringIntensity: 0.54,
    canyonIntensity: 1
  },
  {
    chapter: "archive-afterlight",
    routeProgress: 0.985,
    fieldOfView: 50,
    cameraRoll: 0.008,
    avatarOffset: [3.38, -1.12, -10.2],
    avatarScale: 0.52,
    avatarPresence: 0.92,
    avatarYaw: 0.035,
    avatarLean: 0.018,
    avatarEnergy: 0.26,
    fogDensity: 0.0106,
    signalIntensity: 0.58,
    afterlightIntensity: 1,
    moonIntensity: 0.88,
    cityIntensity: 0.5,
    ringIntensity: 0.68,
    canyonIntensity: 0.82
  }
] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpVec3 = (a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t)
];

export function interpolateObservatoryTimeline(absoluteProgress: number): ObservatoryTimelineState {
  const maximum = OBSERVATORY_TIMELINE.length - 1;
  const bounded = Math.min(maximum, Math.max(0, absoluteProgress));
  const index = Math.min(maximum, Math.floor(bounded));
  const nextIndex = Math.min(maximum, index + 1);
  const chapterProgress = index === maximum ? 1 : bounded - index;
  const eased = smoothstep(chapterProgress);
  const current = OBSERVATORY_TIMELINE[index];
  const next = OBSERVATORY_TIMELINE[nextIndex];

  return {
    chapter: current.chapter,
    chapterIndex: index,
    chapterProgress,
    absoluteProgress: bounded,
    routeProgress: lerp(current.routeProgress, next.routeProgress, eased),
    fieldOfView: lerp(current.fieldOfView, next.fieldOfView, eased),
    cameraRoll: lerp(current.cameraRoll, next.cameraRoll, eased),
    avatarOffset: lerpVec3(current.avatarOffset, next.avatarOffset, eased),
    avatarScale: lerp(current.avatarScale, next.avatarScale, eased),
    avatarPresence: lerp(current.avatarPresence, next.avatarPresence, eased),
    avatarYaw: lerp(current.avatarYaw, next.avatarYaw, eased),
    avatarLean: lerp(current.avatarLean, next.avatarLean, eased),
    avatarEnergy: lerp(current.avatarEnergy, next.avatarEnergy, eased),
    fogDensity: lerp(current.fogDensity, next.fogDensity, eased),
    signalIntensity: lerp(current.signalIntensity, next.signalIntensity, eased),
    afterlightIntensity: lerp(current.afterlightIntensity, next.afterlightIntensity, eased),
    moonIntensity: lerp(current.moonIntensity, next.moonIntensity, eased),
    cityIntensity: lerp(current.cityIntensity, next.cityIntensity, eased),
    ringIntensity: lerp(current.ringIntensity, next.ringIntensity, eased),
    canyonIntensity: lerp(current.canyonIntensity, next.canyonIntensity, eased)
  };
}

export function getChapterId(index: number): ObservatoryChapterId {
  const bounded = Math.min(OBSERVATORY_CHAPTERS.length - 1, Math.max(0, Math.round(index)));
  return OBSERVATORY_CHAPTERS[bounded];
}

export function calculateAbsoluteScrollProgress(sectionCenters: readonly number[], viewportCenter: number): number {
  if (sectionCenters.length <= 1) return 0;
  if (viewportCenter <= sectionCenters[0]) return 0;

  for (let index = 0; index < sectionCenters.length - 1; index += 1) {
    const start = sectionCenters[index];
    const end = sectionCenters[index + 1];
    if (viewportCenter <= end) {
      const distance = Math.max(1, end - start);
      return index + clamp01((viewportCenter - start) / distance);
    }
  }

  return sectionCenters.length - 1;
}
