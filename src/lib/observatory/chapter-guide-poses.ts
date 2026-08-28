import type { ObservatoryChapterId } from "./types";

export const OBSERVATORY_GUIDE_POSE_IDS = [
  "present",
  "point-up",
  "walk-profile",
  "quick-turn",
  "back-look",
  "settle",
] as const;

export type ObservatoryGuidePoseId = (typeof OBSERVATORY_GUIDE_POSE_IDS)[number];

export interface ObservatoryChapterGuidePose {
  pose: ObservatoryGuidePoseId;
  dark: string;
  light: string;
  width: number;
  height: number;
}

const pose = (
  name: ObservatoryGuidePoseId,
  assetName: string = name,
): ObservatoryChapterGuidePose => ({
  pose: name,
  dark: `/assets/img/observatory/guide-pose-dark-${assetName}.webp`,
  light: `/assets/img/observatory/guide-pose-light-${assetName}.webp`,
  width: 900,
  height: 1800,
});

export const OBSERVATORY_CHAPTER_GUIDE_POSES: Record<ObservatoryChapterId, ObservatoryChapterGuidePose> = {
  "signal-gate": pose("present"),
  observe: pose("point-up"),
  structure: pose("walk-profile"),
  orchestrate: pose("quick-turn"),
  embodiment: pose("back-look"),
  "archive-afterlight": pose("settle"),
};

export const OBSERVATORY_DEFAULT_GUIDE_POSE = OBSERVATORY_CHAPTER_GUIDE_POSES["signal-gate"];

export function resolveObservatoryChapterGuidePose(
  chapter: string | undefined,
): ObservatoryChapterGuidePose {
  if (chapter && Object.hasOwn(OBSERVATORY_CHAPTER_GUIDE_POSES, chapter)) {
    return OBSERVATORY_CHAPTER_GUIDE_POSES[chapter as ObservatoryChapterId];
  }
  return OBSERVATORY_DEFAULT_GUIDE_POSE;
}

export function listObservatoryGuidePoseSources(): string[] {
  return Object.values(OBSERVATORY_CHAPTER_GUIDE_POSES).flatMap(({ dark, light }) => [dark, light]);
}
