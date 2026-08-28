import {
  listObservatoryGuidePoseSources,
  resolveObservatoryChapterGuidePose,
} from "./chapter-guide-poses";
import { getResolvedObservatoryTheme } from "./theme";
import type { ObservatoryTheme } from "./types";

const LEAVE_DURATION_MS = 220;
const ENTER_DURATION_MS = 360;

interface GuideSelection {
  chapter: string;
  pose: string;
  source: string;
}

function resolveSelection(chapter: string | undefined, theme: ObservatoryTheme): GuideSelection {
  const resolved = resolveObservatoryChapterGuidePose(chapter);
  return {
    chapter: chapter ?? "signal-gate",
    pose: resolved.pose,
    source: theme === "light" ? resolved.light : resolved.dark,
  };
}

function sourceMatches(image: HTMLImageElement, source: string): boolean {
  return image.getAttribute("src") === source || image.src.endsWith(source);
}

/**
 * Installs the fixed, two-slot chapter guide. The old pose finishes its
 * shrink-out before the new pose begins its grow-in, so image replacement
 * never flashes and never changes the canvas or document geometry.
 */
export function installObservatoryChapterGuide(root: HTMLElement, signal: AbortSignal): void {
  const layer = root.querySelector<HTMLElement>("[data-observatory-character-layer]");
  const slots = Array.from(layer?.querySelectorAll<HTMLImageElement>("[data-character-slot]") ?? []);
  if (!layer || slots.length !== 2) return;

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themePreference = window.matchMedia("(prefers-color-scheme: light)");
  const preloaders = listObservatoryGuidePoseSources().map((source) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    return image;
  });

  let activeSlot = slots.find((slot) => slot.dataset.characterSlot === "active") ?? slots[0];
  let standbySlot = slots.find((slot) => slot !== activeSlot) ?? slots[1];
  let activeSelection = resolveSelection(root.dataset.activeChapter, getResolvedObservatoryTheme());
  let requestedSelection = activeSelection;
  let phase: "settled" | "leaving" | "entering" = "settled";
  let leaveHandle = 0;
  let enterHandle = 0;
  let enterFrameHandle = 0;

  const clearSchedule = () => {
    window.clearTimeout(leaveHandle);
    window.clearTimeout(enterHandle);
    window.cancelAnimationFrame(enterFrameHandle);
    leaveHandle = 0;
    enterHandle = 0;
    enterFrameHandle = 0;
  };

  const publishState = (selection: GuideSelection, state: string) => {
    root.dataset.avatarRepresentation = "chapter-pose-raster";
    root.dataset.avatarState = "ready";
    root.dataset.avatarPose = selection.pose;
    layer.dataset.guideState = state;
  };

  const setRoles = (nextActive: HTMLImageElement, nextStandby: HTMLImageElement) => {
    nextActive.dataset.characterSlot = "active";
    nextStandby.dataset.characterSlot = "standby";
    activeSlot = nextActive;
    standbySlot = nextStandby;
  };

  const settle = (selection: GuideSelection) => {
    phase = "settled";
    activeSelection = selection;
    activeSlot.dataset.poseState = "settled";
    activeSlot.dataset.guidePose = selection.pose;
    activeSlot.classList.add("is-active");
    standbySlot.dataset.poseState = "idle";
    standbySlot.classList.remove("is-active");
    publishState(selection, "settled");

    if (requestedSelection.source !== activeSelection.source) beginTransition();
  };

  const showImmediately = (selection: GuideSelection) => {
    clearSchedule();
    activeSlot.src = selection.source;
    activeSlot.dataset.guidePose = selection.pose;
    standbySlot.src = selection.source;
    standbySlot.dataset.guidePose = selection.pose;
    settle(selection);
  };

  const beginEnter = () => {
    const nextSelection = requestedSelection;
    const oldActive = activeSlot;
    const nextActive = standbySlot;

    oldActive.dataset.poseState = "idle";
    oldActive.classList.remove("is-active");
    nextActive.src = nextSelection.source;
    nextActive.dataset.guidePose = nextSelection.pose;
    nextActive.dataset.poseState = "entering";
    nextActive.classList.remove("is-active");
    setRoles(nextActive, oldActive);
    phase = "entering";
    publishState(nextSelection, "entering");

    // A frame at the 0.82-scale entry pose makes the following transform a
    // genuine grow-in rather than a source swap at full size.
    enterFrameHandle = window.requestAnimationFrame(() => {
      enterFrameHandle = 0;
      if (signal.aborted || phase !== "entering") return;
      activeSlot.dataset.poseState = "arriving";
      activeSlot.classList.add("is-active");
      enterHandle = window.setTimeout(() => {
        enterHandle = 0;
        if (signal.aborted || phase !== "entering") return;
        settle(nextSelection);
      }, ENTER_DURATION_MS);
    });
  };

  function beginTransition() {
    if (phase !== "settled") return;
    if (requestedSelection.source === activeSelection.source) {
      publishState(activeSelection, "settled");
      return;
    }

    phase = "leaving";
    layer.dataset.guideState = "leaving";
    activeSlot.dataset.poseState = "leaving";
    activeSlot.classList.remove("is-active");
    standbySlot.src = requestedSelection.source;
    standbySlot.dataset.guidePose = requestedSelection.pose;
    standbySlot.dataset.poseState = "idle";
    leaveHandle = window.setTimeout(() => {
      leaveHandle = 0;
      if (signal.aborted || phase !== "leaving") return;
      beginEnter();
    }, LEAVE_DURATION_MS);
  }

  const requestUpdate = (immediate = false) => {
    requestedSelection = resolveSelection(root.dataset.activeChapter, getResolvedObservatoryTheme());
    if (immediate || motionPreference.matches) {
      showImmediately(requestedSelection);
      return;
    }
    if (requestedSelection.source === activeSelection.source && phase === "settled") return;

    // During shrink-out the hidden standby slot can be safely retargeted to
    // the newest chapter. During grow-in the latest request is queued and runs
    // as soon as the current entrance settles.
    if (phase === "leaving") {
      standbySlot.src = requestedSelection.source;
      standbySlot.dataset.guidePose = requestedSelection.pose;
      return;
    }
    beginTransition();
  };

  const onChapterChange = (event: Event) => {
    const detail = (event as CustomEvent<{ chapter?: string }>).detail;
    if (detail?.chapter) root.dataset.activeChapter = detail.chapter;
    requestUpdate(false);
  };
  const onMotionPreferenceChange = () => requestUpdate(true);
  const onThemeChange = () => requestUpdate(false);
  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  root.addEventListener("observatory:chapterchange", onChapterChange, { signal });
  window.addEventListener("observatory:theme-change", onThemeChange, { signal });
  motionPreference.addEventListener("change", onMotionPreferenceChange, { signal });
  themePreference.addEventListener("change", onThemeChange, { signal });
  signal.addEventListener("abort", () => {
    clearSchedule();
    themeObserver.disconnect();
    preloaders.length = 0;
  }, { once: true });

  setRoles(activeSlot, standbySlot);
  if (!sourceMatches(activeSlot, activeSelection.source)) activeSlot.src = activeSelection.source;
  activeSlot.dataset.guidePose = activeSelection.pose;
  standbySlot.src = activeSelection.source;
  standbySlot.dataset.guidePose = activeSelection.pose;
  settle(activeSelection);
}
