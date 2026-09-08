import { sampleReadingPose } from "./composition";
let installed = false;
let cleanup: ((restore?: boolean) => void) | undefined;

/** The rendered camera director is the sole clock for the text composition. */
export function installObservatoryDomMotion(): void {
  if (installed) return;
  installed = true;
  const mount = () => {
    cleanup?.();
    const root = document.querySelector<HTMLElement>("[data-observatory-root]");
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>("[data-observatory-chapter]")];
    if (sections.length === 0) return;
    const frames = sections.map(section => section.querySelector<HTMLElement>(".observatory-chapter-frame"));
    const abort = new AbortController();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const reset = () => {
      frames.forEach(frame => { if (frame) { frame.removeAttribute("style"); frame.querySelectorAll(".home-entries li").forEach(card => card.removeAttribute("style")); frame.inert = false; } });
      delete root.dataset.domMotion;
    };
    const observer = new MutationObserver(() => {
      if (["static", "failed"].includes(root.dataset.renderState ?? "")) reset();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-render-state"] });
    motion.addEventListener("change", () => { if (motion.matches) reset(); }, { signal: abort.signal });
    const sync = (event: Event) => {
      if (motion.matches) return;
      const progress = (event as CustomEvent<number>).detail;
      root.dataset.domMotion = "active";
      frames.forEach((frame, index) => {
        if (!frame) return;
        const distance = progress - index;
        const { opacity: alpha, offset } = sampleReadingPose(distance);
        frame.style.opacity = String(alpha);
        const side = index === 3 ? -1 : 1;
        frame.style.transform = offset === 0 ? 'none' : `perspective(1400px) translate3d(${offset * side * 3}rem, ${-offset * 1.8}rem, ${-Math.abs(offset) * 90}px) rotateY(${offset * side * 4}deg)`;
        frame.dataset.readingPose = offset === 0 ? 'settled' : 'transit';
        frame.querySelectorAll<HTMLElement>('.home-entries li').forEach((card, order) => {
          card.style.transform = offset === 0 ? 'none' : `translate3d(0, ${-offset * (order + 1) * .6}rem, ${-Math.abs(offset) * (order + 1) * 14}px)`;
        });
        frame.style.visibility = alpha > 0.02 ? "visible" : "hidden";
        frame.inert = alpha < 0.5;
      });
      root.style.setProperty("--journey-progress", String(progress / 5));
    };
    root.addEventListener("observatory:direct", sync, { signal: abort.signal });
    cleanup = (restore = true) => {
      abort.abort();
      observer.disconnect();
      if (restore) reset();
    };
  };
  document.addEventListener("astro:page-load", mount);
  // Keep the outgoing composition and its height stable for the transition snapshot.
  document.addEventListener("astro:before-swap", () => cleanup?.(false));
  window.addEventListener("pagehide", () => cleanup?.());
  window.addEventListener("pageshow", mount);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else queueMicrotask(mount);
}
