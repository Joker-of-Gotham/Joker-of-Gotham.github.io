import { OBSERVATORY_AVATAR_POSES } from "./types";
import type { ObservatoryAvatarPose, ObservatoryQualityTier } from "./types";

export type ObservatoryScrollDirection = -1 | 0 | 1;

export interface ObservatoryAtlasFrame {
  readonly index: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

export const OBSERVATORY_POSE_CUES: readonly { progress: number; pose: ObservatoryAvatarPose }[] = [
  { progress: 0, pose: "idle" },
  { progress: 0.62, pose: "quarter-turn" },
  { progress: 1.62, pose: "point-up" },
  { progress: 2.62, pose: "present" },
  { progress: 3.52, pose: "walk-profile" },
  { progress: 3.84, pose: "quick-turn" },
  { progress: 4.2, pose: "back-look" },
  { progress: 4.68, pose: "settle" }
] as const;

const poseIndex = new Map<ObservatoryAvatarPose, number>(
  OBSERVATORY_AVATAR_POSES.map((pose, index) => [pose, index])
);

export function getObservatoryPoseAtlasFrame(pose: ObservatoryAvatarPose): ObservatoryAtlasFrame {
  const index = poseIndex.get(pose) ?? 0;
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    index,
    offsetX: column * 0.25,
    offsetY: row === 0 ? 0.5 : 0,
    scaleX: 0.25,
    scaleY: 0.5
  };
}

export function simplifyObservatoryPose(
  pose: ObservatoryAvatarPose,
  tier: ObservatoryQualityTier
): ObservatoryAvatarPose {
  if (tier !== "low") return pose;
  if (pose === "walk-profile") return "quarter-turn";
  if (pose === "quick-turn") return "back-look";
  return pose;
}

/**
 * Chooses a real atlas view with directional hysteresis. Forward scroll must
 * cross a cue by 0.055; reverse scroll must recede by the same distance.
 */
export function resolveObservatoryAvatarPose(
  absoluteProgress: number,
  previousPose: ObservatoryAvatarPose,
  direction: ObservatoryScrollDirection,
  tier: ObservatoryQualityTier = "enhanced"
): ObservatoryAvatarPose {
  const hysteresis = 0.055;
  const adjustedProgress = absoluteProgress - (direction >= 0 ? hysteresis : -hysteresis);
  let resolved = OBSERVATORY_POSE_CUES[0].pose;
  for (const cue of OBSERVATORY_POSE_CUES) {
    if (adjustedProgress < cue.progress) break;
    resolved = cue.pose;
  }

  if (direction === 0) {
    const previousCue = OBSERVATORY_POSE_CUES.find((cue) => cue.pose === previousPose);
    if (previousCue && Math.abs(absoluteProgress - previousCue.progress) < hysteresis) resolved = previousPose;
  }
  return simplifyObservatoryPose(resolved, tier);
}

export function getObservatoryPoseTransitionDuration(
  from: ObservatoryAvatarPose,
  to: ObservatoryAvatarPose,
  tier: ObservatoryQualityTier
): number {
  if (tier === "low") return 0.34;
  if (from === "quick-turn" || to === "quick-turn") return 0.22;
  if (from === "walk-profile" || to === "walk-profile") return 0.3;
  return 0.46;
}
