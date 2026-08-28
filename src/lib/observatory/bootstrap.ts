import { installAmbientAudio } from "./ambient-audio";
import type { AmbientAudioController } from "./ambient-audio";
import { decideObservatoryQuality } from "./quality-tier";
import { getResolvedObservatoryTheme } from "./theme";
import type { ObservatoryController } from "./controller";

const ROOT_SELECTOR = "[data-observatory-root]";

interface MountedObservatory {
  root: HTMLElement;
  abortController: AbortController;
  audio: AmbientAudioController | null;
  controller: ObservatoryController | null;
  themeObserver: MutationObserver;
}

interface ObservatoryRuntimeState {
  installed: boolean;
  generation: number;
  mount: MountedObservatory | null;
}

declare global {
  interface Window {
    __lunarObservatoryRuntime?: ObservatoryRuntimeState;
  }
}

function runtimeState(): ObservatoryRuntimeState {
  window.__lunarObservatoryRuntime ??= { installed: false, generation: 0, mount: null };
  return window.__lunarObservatoryRuntime;
}

function waitForAnimationFrames(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    let settled = false;
    const frameIds: number[] = [];
    const finish = () => {
      if (settled) return;
      settled = true;
      for (const frameId of frameIds) window.cancelAnimationFrame(frameId);
      resolve();
    };

    signal.addEventListener("abort", finish, { once: true });
    const requestFrame = window.requestAnimationFrame.bind(window);
    frameIds.push(requestFrame(() => {
      frameIds.push(requestFrame(finish));
    }));
  });
}

async function waitForFirstContentfulPaint(signal: AbortSignal): Promise<void> {
  if (signal.aborted || performance.getEntriesByName("first-contentful-paint", "paint").length > 0) return;

  const supportsPaintTiming =
    "PerformanceObserver" in window &&
    PerformanceObserver.supportedEntryTypes?.includes("paint");
  if (!supportsPaintTiming) {
    await waitForAnimationFrames(signal);
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    let observer: PerformanceObserver | null = null;
    const timeoutId = window.setTimeout(finish, 1_500);

    function finish() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      observer?.disconnect();
      resolve();
    }

    signal.addEventListener("abort", finish, { once: true });
    try {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries().some((entry) => entry.name === "first-contentful-paint")) finish();
      });
      observer.observe({ type: "paint", buffered: true });
    } catch {
      observer?.disconnect();
      void waitForAnimationFrames(signal).then(finish);
    }
  });
}

async function waitForRendererOpportunity(signal: AbortSignal): Promise<void> {
  await waitForFirstContentfulPaint(signal);
  if (signal.aborted) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const requestIdle = Reflect.get(window, "requestIdleCallback") as
      | ((callback: IdleRequestCallback, options?: IdleRequestOptions) => number)
      | undefined;
    const cancelIdle = Reflect.get(window, "cancelIdleCallback") as
      | ((handle: number) => void)
      | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (idleId !== null && typeof cancelIdle === "function") cancelIdle.call(window, idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      resolve();
    };

    signal.addEventListener("abort", finish, { once: true });
    if (typeof requestIdle === "function") {
      idleId = requestIdle.call(window, finish, { timeout: 1_200 });
    } else {
      timeoutId = window.setTimeout(finish, 0);
    }
  });
}

function syncPoster(root: HTMLElement) {
  const theme = getResolvedObservatoryTheme();
  const connection = Reflect.get(navigator, "connection") as { saveData?: boolean } | undefined;
  const prefersCompact =
    connection?.saveData === true ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 720px)").matches;
  const images = root.querySelectorAll<HTMLImageElement>("[data-observatory-themed-visual]");
  for (const image of images) {
    const regularSource = theme === "light" ? image.dataset.lightSource : image.dataset.darkSource;
    const compactSource = theme === "light"
      ? image.dataset.lightCompactSource
      : image.dataset.darkCompactSource;
    const nextSource = prefersCompact ? compactSource ?? regularSource : regularSource;
    if (nextSource && image.getAttribute("src") !== nextSource) image.src = nextSource;
  }
  root.dataset.resolvedTheme = theme;
}

function syncThemeControl(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>("[data-observatory-theme-toggle]");
  if (!button) return;
  const theme = getResolvedObservatoryTheme();
  const currentLabel = theme === "dark" ? "深空" : "月纸";
  const nextLabel = theme === "dark" ? "浅色" : "深色";
  button.setAttribute("aria-label", `当前为${currentLabel}主题，切换至${nextLabel}主题`);
  button.setAttribute("aria-pressed", String(theme === "light"));
  button.dataset.theme = theme;
  const label = button.querySelector<HTMLElement>("[data-theme-label]");
  if (label) label.textContent = currentLabel;
}

function installChapterBridge(root: HTMLElement, signal: AbortSignal) {
  const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-observatory-chapter]"));
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-observatory-nav-link]"));
  if (sections.length === 0) return;

  let frameId = 0;
  const sync = () => {
    frameId = 0;
    const readingLine = window.scrollY + Math.min(window.innerHeight * 0.36, 360);
    let activeIndex = 0;
    for (let index = 0; index < sections.length; index += 1) {
      const sectionTop = sections[index].getBoundingClientRect().top + window.scrollY;
      if (sectionTop <= readingLine) activeIndex = index;
      else break;
    }

    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    if (window.scrollY + window.innerHeight >= documentHeight - 2) activeIndex = sections.length - 1;
    const activeSection = sections[activeIndex];
    const activeId = activeSection?.dataset.observatoryChapter;
    if (!activeId) return;

    root.dataset.activeChapter = activeId;
    sections.forEach((section, index) => section.classList.toggle("is-active", index === activeIndex));
    links.forEach((link) => {
      if (link.hash === `#${activeSection.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const scheduleSync = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(sync);
  };

  window.addEventListener("scroll", scheduleSync, { passive: true, signal });
  window.addEventListener("resize", scheduleSync, { passive: true, signal });
  window.addEventListener("hashchange", scheduleSync, { signal });
  signal.addEventListener("abort", () => window.cancelAnimationFrame(frameId), { once: true });
  sync();
}

function installThemeBridge(root: HTMLElement, signal: AbortSignal): MutationObserver {
  syncPoster(root);
  syncThemeControl(root);

  const observer = new MutationObserver(() => {
    syncPoster(root);
    syncThemeControl(root);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const themeMedia = window.matchMedia("(prefers-color-scheme: light)");
  themeMedia.addEventListener(
    "change",
    () => {
      if (document.documentElement.dataset.theme) return;
      syncPoster(root);
      syncThemeControl(root);
    },
    { signal }
  );

  window.addEventListener(
    "observatory:theme-change",
    () => {
      syncPoster(root);
      syncThemeControl(root);
    },
    { signal }
  );
  window.matchMedia("(max-width: 720px)").addEventListener("change", () => syncPoster(root), { signal });

  return observer;
}

export function unmountObservatory() {
  const state = runtimeState();
  state.generation += 1;
  const current = state.mount;
  state.mount = null;
  if (!current) return;
  current.abortController.abort();
  current.themeObserver.disconnect();
  current.audio?.dispose();
  current.controller?.dispose();
}

export async function mountObservatory() {
  const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  const state = runtimeState();
  if (!root) {
    unmountObservatory();
    return;
  }
  if (state.mount?.root === root) return;

  unmountObservatory();
  const generation = ++state.generation;
  const abortController = new AbortController();
  const audio = installAmbientAudio(root);
  const themeObserver = installThemeBridge(root, abortController.signal);
  installChapterBridge(root, abortController.signal);
  const mounted: MountedObservatory = { root, abortController, audio, controller: null, themeObserver };
  state.mount = mounted;

  const canvas = root.querySelector<HTMLCanvasElement>("[data-observatory-canvas]");
  if (!canvas) {
    root.dataset.renderState = "failed";
    root.dataset.renderReason = "canvas-missing";
    return;
  }

  root.dataset.renderState = "loading";
  try {
    await waitForRendererOpportunity(abortController.signal);
    if (abortController.signal.aborted || state.generation !== generation || !root.isConnected || state.mount !== mounted) return;

    // Creating a WebGL context can itself be a long task on software-rendered or
    // constrained devices. Keep the whole capability decision outside first paint.
    const decision = decideObservatoryQuality(root, canvas);
    root.dataset.qualityTier = decision.profile.tier;
    root.dataset.renderReason = decision.reason;

    if (decision.profile.tier === "poster" || !decision.context) {
      root.dataset.renderState = "static";
      return;
    }

    const module = await import("./controller");
    if (state.generation !== generation || !root.isConnected || state.mount !== mounted) return;

    const controller = new module.ObservatoryController({
      root,
      canvas,
      context: decision.context,
      quality: decision.profile,
      avatarDarkAtlasSource: "/assets/img/observatory/signal-guide-dark-poses-runtime.webp",
      avatarLightAtlasSource: "/assets/img/observatory/signal-guide-light-poses-runtime.webp",
      avatarDarkFallbackSource:
        root.dataset.avatarDarkSource?.replace(/-sample\.webp$/u, "-poster.webp") ??
        "/assets/img/observatory/signal-guide-dark-poster.webp",
      avatarLightFallbackSource:
        root.dataset.avatarLightSource?.replace(/-sample\.webp$/u, "-poster.webp") ??
        "/assets/img/observatory/signal-guide-light-poster.webp",
      enableRealtimeAvatar: !window.matchMedia("(max-width: 820px) and (orientation: portrait)").matches
    });
    mounted.controller = controller;
    await controller.initialize();
  } catch {
    if (state.generation === generation && root.isConnected) {
      root.dataset.renderState = "failed";
      root.dataset.renderReason = "renderer-initialization-failed";
    }
  }
}

function remountForMotionPreference() {
  const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (!root) return;
  unmountObservatory();
  void mountObservatory();
}

export function installObservatoryBootstrap() {
  const state = runtimeState();
  if (state.installed) {
    void mountObservatory();
    return;
  }
  state.installed = true;

  document.addEventListener("astro:page-load", () => void mountObservatory());
  document.addEventListener("astro:before-swap", unmountObservatory);
  window.addEventListener("pagehide", unmountObservatory);
  window.addEventListener("pageshow", () => void mountObservatory());
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", remountForMotionPreference);
  window.matchMedia("(max-width: 820px) and (orientation: portrait)").addEventListener("change", remountForMotionPreference);
  document.addEventListener("observatory:remount", remountForMotionPreference);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void mountObservatory(), { once: true });
  } else {
    queueMicrotask(() => void mountObservatory());
  }
}
