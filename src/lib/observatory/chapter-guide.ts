import { resolveObservatoryChapterGuidePose } from "./chapter-guide-poses";
import { getResolvedObservatoryTheme } from "./theme";
import type { ObservatoryTheme } from "./types";

const LEAVE_DURATION_MS = 220;
const HIDDEN_GAP_MS = 140;
const ENTER_FRAME_SETTLE_MS = 34;
const ENTER_DURATION_MS = 360;
const CHAPTER_ORDER = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
] as const;

interface GuideSelection {
  chapter: string;
  pose: string;
  source: string;
}

interface PendingWait {
  id: number;
  resolve: (completed: boolean) => void;
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
 * Installs the fixed, two-slot chapter guide. The next raster pose is decoded
 * while hidden, the old pose shrinks away, both slots stay hidden for one
 * authored beat, and the new pose grows in. Every request cancels the previous
 * schedule, so rapid forward/backward scrolling always resolves to the newest
 * chapter without replaying a stale queued pose.
 */
export function installObservatoryChapterGuide(root: HTMLElement, signal: AbortSignal): void {
  const layer = root.querySelector<HTMLElement>("[data-observatory-character-layer]");
  const slots = Array.from(layer?.querySelectorAll<HTMLImageElement>("[data-character-slot]") ?? []);
  if (!layer || slots.length !== 2) return;

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themePreference = window.matchMedia("(prefers-color-scheme: light)");
  const decodedSources = new Map<string, Promise<void>>();

  let activeSlot = slots.find((slot) => slot.dataset.characterSlot === "active") ?? slots[0];
  let standbySlot = slots.find((slot) => slot !== activeSlot) ?? slots[1];
  let activeSelection = resolveSelection(root.dataset.activeChapter, getResolvedObservatoryTheme());
  let requestedSelection = activeSelection;
  let phase: "settled" | "leaving" | "gap" | "entering" = "settled";
  let transitionGeneration = 0;
  let leaveStartedAt = 0;
  const pendingTimeouts = new Set<PendingWait>();

  const isCurrent = (generation: number) => !signal.aborted && transitionGeneration === generation;

  const cancelSchedule = () => {
    transitionGeneration += 1;
    pendingTimeouts.forEach((pending) => {
      window.clearTimeout(pending.id);
      pending.resolve(false);
    });
    pendingTimeouts.clear();
    return transitionGeneration;
  };

  const wait = (duration: number, generation: number) => new Promise<boolean>((resolve) => {
    if (!isCurrent(generation)) {
      resolve(false);
      return;
    }
    const pending: PendingWait = { id: 0, resolve };
    pending.id = window.setTimeout(() => {
      pendingTimeouts.delete(pending);
      resolve(isCurrent(generation));
    }, duration);
    pendingTimeouts.add(pending);
  });

  const predecodeSource = (source: string): Promise<void> => {
    const cached = decodedSources.get(source);
    if (cached) return cached;

    const image = new Image();
    image.decoding = "async";
    image.src = source;
    const decoded = typeof image.decode === "function"
      ? image.decode().catch(() => undefined)
      : Promise.resolve();
    decodedSources.set(source, decoded);
    return decoded;
  };

  const warmAdjacentPoses = (selection: GuideSelection) => {
    const index = CHAPTER_ORDER.indexOf(selection.chapter as (typeof CHAPTER_ORDER)[number]);
    if (index < 0) return;
    const theme = getResolvedObservatoryTheme();
    [CHAPTER_ORDER[index - 1], CHAPTER_ORDER[index + 1]].forEach((chapter) => {
      if (chapter) void predecodeSource(resolveSelection(chapter, theme).source);
    });
  };

  const publishState = (selection: GuideSelection, state: string) => {
    root.dataset.avatarRepresentation = "chapter-pose-raster";
    root.dataset.avatarState = "ready";
    root.dataset.avatarPose = selection.pose;
    layer.dataset.guideState = state;
    layer.dataset.guideChapter = selection.chapter;
  };

  const setRoles = (nextActive: HTMLImageElement, nextStandby: HTMLImageElement) => {
    nextActive.dataset.characterSlot = "active";
    nextStandby.dataset.characterSlot = "standby";
    activeSlot = nextActive;
    standbySlot = nextStandby;
  };

  const settle = (selection: GuideSelection) => {
    phase = "settled";
    leaveStartedAt = 0;
    activeSelection = selection;
    activeSlot.dataset.poseState = "settled";
    activeSlot.dataset.guidePose = selection.pose;
    activeSlot.classList.add("is-active");
    standbySlot.dataset.poseState = "idle";
    standbySlot.classList.remove("is-active");
    publishState(selection, "settled");
    warmAdjacentPoses(selection);
  };

  const scheduleEnteringSettleFallback = (selection: GuideSelection) => {
    window.setTimeout(() => {
      if (signal.aborted) return;
      if (phase !== "entering" || requestedSelection.source !== selection.source) return;
      settle(selection);
    }, ENTER_FRAME_SETTLE_MS + ENTER_DURATION_MS + 80);
  };

  const showImmediately = (selection: GuideSelection) => {
    cancelSchedule();
    activeSlot.src = selection.source;
    activeSlot.dataset.guidePose = selection.pose;
    standbySlot.src = selection.source;
    standbySlot.dataset.guidePose = selection.pose;
    settle(selection);
  };

  const prepareStandby = async (selection: GuideSelection, generation: number): Promise<boolean> => {
    standbySlot.src = selection.source;
    standbySlot.dataset.guidePose = selection.pose;
    standbySlot.dataset.poseState = "idle";
    standbySlot.classList.remove("is-active");
    await predecodeSource(selection.source);
    if (!isCurrent(generation)) return false;
    try {
      await standbySlot.decode();
    } catch {
      // The warmed cache is still safe when decode() rejects transiently; the
      // standby slot never becomes visible until the next animation frame.
    }
    return isCurrent(generation);
  };

  const transitionTo = async (selection: GuideSelection, generation: number) => {
    if (sourceMatches(activeSlot, selection.source)) {
      activeSelection = selection;
      phase = "entering";
      leaveStartedAt = 0;
      standbySlot.dataset.poseState = "idle";
      standbySlot.classList.remove("is-active");
      activeSlot.dataset.guidePose = selection.pose;
      activeSlot.dataset.poseState = "arriving";
      activeSlot.classList.add("is-active");
      publishState(selection, "entering");
      scheduleEnteringSettleFallback(selection);
      if (await wait(ENTER_DURATION_MS, generation)) settle(selection);
      return;
    }

    if (!(await prepareStandby(selection, generation))) return;
    const oldActive = activeSlot;
    const nextActive = standbySlot;
    const alreadyLeaving = oldActive.dataset.poseState === "leaving" && leaveStartedAt > 0;

    phase = "leaving";
    layer.dataset.guideState = "leaving";
    oldActive.dataset.poseState = "leaving";
    oldActive.classList.remove("is-active");
    if (!alreadyLeaving) leaveStartedAt = performance.now();

    const elapsedLeave = alreadyLeaving ? performance.now() - leaveStartedAt : 0;
    const remainingLeave = Math.max(0, LEAVE_DURATION_MS - elapsedLeave);
    if (!(await wait(remainingLeave, generation))) return;

    oldActive.dataset.poseState = "idle";
    phase = "gap";
    layer.dataset.guideState = "gap";
    if (!(await wait(HIDDEN_GAP_MS, generation))) return;

    nextActive.dataset.poseState = "entering";
    nextActive.classList.remove("is-active");
    setRoles(nextActive, oldActive);
    activeSelection = selection;
    phase = "entering";
    leaveStartedAt = 0;
    publishState(selection, "entering");
    scheduleEnteringSettleFallback(selection);

    if (!(await wait(ENTER_FRAME_SETTLE_MS, generation))) return;
    activeSlot.dataset.poseState = "arriving";
    activeSlot.classList.add("is-active");
    if (await wait(ENTER_DURATION_MS, generation)) settle(selection);
  };

  const requestUpdate = (immediate = false) => {
    const nextSelection = resolveSelection(root.dataset.activeChapter, getResolvedObservatoryTheme());
    if (!immediate && nextSelection.source === requestedSelection.source && phase !== "settled") return;
    requestedSelection = nextSelection;

    if (immediate || motionPreference.matches) {
      showImmediately(requestedSelection);
      return;
    }
    if (requestedSelection.source === activeSelection.source && phase === "settled") return;

    const generation = cancelSchedule();
    void transitionTo(requestedSelection, generation);
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
    cancelSchedule();
    themeObserver.disconnect();
    decodedSources.clear();
  }, { once: true });

  setRoles(activeSlot, standbySlot);
  if (!sourceMatches(activeSlot, activeSelection.source)) activeSlot.src = activeSelection.source;
  activeSlot.dataset.guidePose = activeSelection.pose;
  standbySlot.src = activeSelection.source;
  standbySlot.dataset.guidePose = activeSelection.pose;
  settle(activeSelection);
}
