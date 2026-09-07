import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ROOT_SELECTOR = "[data-observatory-root]";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let installed = false;
let activeRoot: HTMLElement | null = null;
let disposeActiveMotion: (() => void) | null = null;
let pluginRegistered = false;

function registerPlugin(): void {
  if (pluginRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  pluginRegistered = true;
}

function clearMotionStyles(root: HTMLElement): void {
  const targets = root.querySelectorAll<HTMLElement>(
    ".observatory-nav-shell, .observatory-chapter-frame",
  );
  gsap.set(targets, { clearProps: "opacity,visibility,transform" });
}

function mountMotion(): void {
  const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (root === activeRoot) return;

  disposeActiveMotion?.();
  disposeActiveMotion = null;
  activeRoot = root;
  if (!root) return;

  registerPlugin();
  const abortController = new AbortController();
  const reduceMotion = window.matchMedia(MOTION_QUERY);
  const triggerIds: string[] = [];
  const refresh = () => ScrollTrigger.refresh();
  const remountForMotionPreference = () => {
    if (activeRoot !== root) return;
    unmountMotion();
    queueMicrotask(mountMotion);
  };

  const context = gsap.context(() => {
    const nav = root.querySelector<HTMLElement>(".observatory-nav-shell");
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-observatory-chapter]"));
    const frames = sections
      .map((section) => section.querySelector<HTMLElement>(".observatory-chapter-frame"))
      .filter((frame): frame is HTMLElement => frame !== null);

    if (reduceMotion.matches) {
      root.dataset.domMotion = "reduced";
      clearMotionStyles(root);
      return;
    }

    root.dataset.domMotion = "active";
    if (nav) {
      gsap.fromTo(
        nav,
        { opacity: 0.72, y: -8 },
        { opacity: 1, y: 0, duration: 0.72, ease: "power3.out", clearProps: "opacity,transform" },
      );
    }

    frames.forEach((frame, index) => {
      if (index === 0) {
        gsap.fromTo(
          frame,
          { autoAlpha: 0.82, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.88,
            delay: 0.08,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          },
        );
        return;
      }

      const id = `observatory-dom-chapter-${index}`;
      triggerIds.push(id);
      gsap.fromTo(
        frame,
        { autoAlpha: 0.74, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.94,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
          scrollTrigger: {
            id,
            trigger: frame.closest("[data-observatory-chapter]") ?? frame,
            start: "top 76%",
            once: true,
          },
        },
      );
    });
  }, root);

  window.addEventListener("load", refresh, { once: true, signal: abortController.signal });
  reduceMotion.addEventListener("change", remountForMotionPreference, { signal: abortController.signal });
  void document.fonts?.ready.then(() => {
    if (!abortController.signal.aborted && root.isConnected) refresh();
  });

  disposeActiveMotion = () => {
    abortController.abort();
    triggerIds.forEach((id) => ScrollTrigger.getById(id)?.kill());
    context.revert();
    clearMotionStyles(root);
    delete root.dataset.domMotion;
    if (activeRoot === root) activeRoot = null;
  };
}

function unmountMotion(): void {
  disposeActiveMotion?.();
  disposeActiveMotion = null;
  activeRoot = null;
}

/**
 * Installs DOM-only chapter choreography. Native document scroll remains the
 * source of truth; Three.js camera/world state is intentionally untouched.
 */
export function installObservatoryDomMotion(): void {
  if (installed) {
    mountMotion();
    return;
  }

  installed = true;
  document.addEventListener("astro:page-load", mountMotion);
  document.addEventListener("astro:before-swap", unmountMotion);
  window.addEventListener("pagehide", unmountMotion);
  window.addEventListener("pageshow", mountMotion);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountMotion, { once: true });
  } else {
    queueMicrotask(mountMotion);
  }
}
