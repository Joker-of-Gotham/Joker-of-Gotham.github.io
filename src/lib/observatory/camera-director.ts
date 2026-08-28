import * as THREE from "three";
import type { Vec3Tuple } from "./types";

export const OBSERVATORY_WORLD_SPAN = 459;

export const OBSERVATORY_CAMERA_CONTROL_POINTS: readonly Vec3Tuple[] = [
  [0, 10, 28],
  [-18, 15, -30],
  [20, 20, -88],
  [42, 12, -145],
  [3, 9, -208],
  [-34, 17, -268],
  [-12, 29, -326],
  [20, 45, -366]
] as const;

export const OBSERVATORY_LOOK_CONTROL_POINTS: readonly Vec3Tuple[] = [
  [0, 7, -12],
  [-10, 7, -60],
  [12, 12, -116],
  [34, 8, -172],
  [-5, 7, -236],
  [-28, 11, -296],
  [0, 20, -350],
  [30, 32, -405]
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

/** Samples the independent camera and look curves by arc length. */
export function sampleObservatoryCameraRoute(progress: number): ObservatoryCameraRouteSample {
  const t = clamp01(progress);
  const position = cameraCurve.getPointAt(t);
  const lookAt = lookCurve.getPointAt(t);
  const tangent = cameraCurve.getTangentAt(t).normalize();
  return {
    position: [position.x, position.y, position.z],
    lookAt: [lookAt.x, lookAt.y, lookAt.z],
    tangent: [tangent.x, tangent.y, tangent.z]
  };
}

export function getObservatoryCameraRouteLength(): number {
  return cameraCurve.getLength();
}
