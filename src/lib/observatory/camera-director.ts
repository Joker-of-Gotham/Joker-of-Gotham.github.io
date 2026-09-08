import * as THREE from "three";
import { OBSERVATORY_TIMELINE } from "./timeline";
import type { Vec3Tuple } from "./types";

export const OBSERVATORY_WORLD_SPAN = 459;

/**
 * Six composed chapter endpoints. The lateral alternation is intentional: it
 * reveals a new relationship at every stop instead of repeating a centre-line
 * dolly along the meridian deck.
 */
export const OBSERVATORY_CAMERA_CONTROL_POINTS: readonly Vec3Tuple[] = [
  [0, 12, 46],
  [-3, 8.5, -36],
  [2, 10, -115],
  [3, 8.5, -204],
  [0, 10, -290],
  [0, 12, -354]
] as const;

export const OBSERVATORY_LOOK_CONTROL_POINTS: readonly Vec3Tuple[] = [
  [0, 9, -14],
  [17, 6, -78],
  [-3, 7, -167.5],
  [-17, 6, -246],
  [0, 7, -343],
  [0, 9, -408]
] as const;

export interface ObservatoryCameraRouteSample {
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  tangent: Vec3Tuple;
}

export interface ObservatoryAspectFraming {
  lateralScale: number;
  verticalOffset: number;
  avatarScale: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const vectors = (points: readonly Vec3Tuple[]) => points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
const cameraCurve = new THREE.CatmullRomCurve3(vectors(OBSERVATORY_CAMERA_CONTROL_POINTS), false, "centripetal");
const lookCurve = new THREE.CatmullRomCurve3(vectors(OBSERVATORY_LOOK_CONTROL_POINTS), false, "centripetal");
const routeStops = OBSERVATORY_TIMELINE.map((keyframe) => keyframe.routeProgress);

/** Maps the non-uniform story route values onto the six exact spline knots. */
function routeProgressToSplineProgress(progress: number): number {
  const bounded = clamp01(progress);
  if (bounded <= routeStops[0]) return 0;
  if (bounded >= routeStops[routeStops.length - 1]) return 1;

  for (let index = 0; index < routeStops.length - 1; index += 1) {
    const start = routeStops[index];
    const end = routeStops[index + 1];
    if (bounded <= end) {
      const localProgress = (bounded - start) / Math.max(Number.EPSILON, end - start);
      return (index + localProgress) / (routeStops.length - 1);
    }
  }

  return 1;
}

/** Keeps authored widescreen composition legible on portrait and ultrawide viewports. */
export function calculateObservatoryAspectFraming(aspect: number): ObservatoryAspectFraming {
  const safeAspect = Math.max(0.42, Math.min(2.6, aspect));
  if (safeAspect < 0.8) {
    const portraitProgress = (safeAspect - 0.42) / 0.38;
    return {
      // Authored offsets are camera-space world units. Portrait horizontal FOV
      // is narrow, so multiplying those offsets pushes the guide completely
      // off-screen. Collapse the offset and footprint together instead.
      lateralScale: THREE.MathUtils.lerp(0.26, 0.38, portraitProgress),
      verticalOffset: THREE.MathUtils.lerp(-0.1, 0.02, portraitProgress),
      avatarScale: THREE.MathUtils.lerp(0.25, 0.34, portraitProgress)
    };
  }
  if (safeAspect < 1.1) {
    const transition = (safeAspect - 0.8) / 0.3;
    return {
      lateralScale: THREE.MathUtils.lerp(0.38, 1, transition),
      verticalOffset: THREE.MathUtils.lerp(0.02, 0, transition),
      avatarScale: THREE.MathUtils.lerp(0.34, 1, transition)
    };
  }
  if (safeAspect > 1.9) {
    return {
      lateralScale: 1 + (safeAspect - 1.9) * 0.12,
      verticalOffset: 0,
      avatarScale: 1
    };
  }
  return { lateralScale: 1, verticalOffset: 0, avatarScale: 1 };
}

/**
 * Samples independent position and look splines while pinning every authored
 * chapter route value to its exact composition. Inter-chapter motion remains a
 * single continuous Catmull-Rom journey.
 */
export function sampleObservatoryCameraRoute(progress: number): ObservatoryCameraRouteSample {
  const t = routeProgressToSplineProgress(progress);
  const position = cameraCurve.getPoint(t);
  const lookAt = lookCurve.getPoint(t);
  const tangent = cameraCurve.getTangent(t).normalize();
  return {
    position: [position.x, position.y, position.z],
    lookAt: [lookAt.x, lookAt.y, lookAt.z],
    tangent: [tangent.x, tangent.y, tangent.z]
  };
}

export function getObservatoryCameraRouteLength(): number {
  return cameraCurve.getLength();
}
