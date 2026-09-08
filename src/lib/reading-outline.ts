let installed = false;
let dispose: (() => void) | undefined;

/** Native disclosure remains usable before hydration; only reading position is enhanced. */
export function installReadingOutline() {
  if (installed) return;
  installed = true;
  const mount = () => {
    dispose?.();
    const dock = document.querySelector<HTMLDetailsElement>('.reading-outline');
    if (!dock) return;
    const abort = new AbortController();
    const links = [...dock.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
    const marks = [...dock.querySelectorAll<HTMLElement>('[data-outline-mark]')];
    const headings = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
    const scroller = dock.querySelector<HTMLElement>('.outline-scroll')!;
    const progress = dock.querySelector<HTMLElement>('[data-toc-progress]')!;
    const summary = dock.querySelector('summary')!;
    const minimap = dock.querySelector<HTMLElement>('.outline-minimap')!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(hover:hover) and (pointer:fine) and (min-width:1101px)');
    let animation: Animation | undefined, contentAnimation: Animation | undefined;
    let desiredOpen = dock.open, keyboardMode = false, pointerInside = false, hoverTimer = 0;
    let pending = 0, active = 0;
    const measure = () => {
      if (dock.open && !dock.hasAttribute('data-closing')) {
        const list = scroller.querySelector('ul')!;
        dock.style.setProperty('--outline-content-height', `${list.getBoundingClientRect().height + 62}px`);
      }
    };
    const revealActive = () => {
      const current = links[active];
      if (current) scroller.scrollTop += current.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientHeight * .3;
    };
    const setOpen = (open: boolean) => {
      window.clearTimeout(hoverTimer);
      if (open === desiredOpen && !animation) return;
      const from = dock.getBoundingClientRect();
      desiredOpen = open;
      animation?.cancel(); contentAnimation?.cancel();
      if (open) { dock.open = true; delete dock.dataset.closing; measure(); scroller.inert = false; }
      else { dock.dataset.closing = ''; scroller.inert = true; }
      const to = dock.getBoundingClientRect();
      const finish = () => {
        dock.open = desiredOpen;
        delete dock.dataset.closing;
        animation = undefined;
        schedule();
        // Native End can run during the morph; keep its final few pixels at the bottom
        // when the animated scrollport settles to its final height.
        if (desiredOpen && scroller.scrollTop > 0 && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 16) {
          scroller.scrollTop = scroller.scrollHeight;
        }
      };
      if (motion.matches) { finish(); if (open) revealActive(); return; }
      const next = dock.animate([{ width: `${from.width}px`, height: `${from.height}px` }, { width: `${to.width}px`, height: `${to.height}px` }], {
        duration: 420, easing: 'cubic-bezier(.22,1,.36,1)'
      });
      animation = next;
      if (open) {
        revealActive();
        contentAnimation = scroller.animate([{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 400, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      next.finished.then(() => { if (animation === next) finish(); }).catch(() => {});
    };
    const update = () => {
      pending = 0;
      active = 0;
      headings.forEach((heading, index) => { if (heading && heading.getBoundingClientRect().top <= 140) active = index; });
      const available = Math.max(80, innerHeight - parseFloat(getComputedStyle(document.documentElement).fontSize) * 12.7);
      const base = Math.max(8, Math.min(20, available / Math.max(1, marks.length)));
      links.forEach((link, index) => {
        if (index === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
        const mark = marks[index];
        if (mark) {
          mark.classList.toggle('is-active', index === active);
          const weight = .96 + .18 * Math.exp(-Math.abs(index - active) / 5);
          mark.style.setProperty('--mark-size', `${Math.max(8, Math.min(22, base * weight))}px`);
        }
      });
      const total = marks.reduce((height, mark) => height + parseFloat(mark.style.getPropertyValue('--mark-size')), 0);
      dock.style.setProperty('--outline-rail-height', `calc(${total}px + 3.7rem)`);
      const currentMark = marks[active];
      if (currentMark && !desiredOpen) {
        const current = headings[active]?.getBoundingClientRect().top ?? 140;
        const next = headings[active + 1]?.getBoundingClientRect().top;
        const fraction = next === undefined ? 0 : Math.max(0, Math.min(1, (140 - current) / Math.max(1, next - current)));
        minimap.scrollTop = currentMark.offsetTop + currentMark.offsetHeight * fraction - minimap.clientHeight * .45;
      }
      const range = document.documentElement.scrollHeight - innerHeight;
      progress.textContent = `${Math.round(Math.min(1, scrollY / Math.max(1, range)) * 100)}%`;
    };
    const schedule = () => { if (!pending) pending = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true, signal: abort.signal });
    window.addEventListener('resize', () => {
      animation?.cancel(); animation = undefined; contentAnimation?.cancel();
      dock.open = desiredOpen; delete dock.dataset.closing; measure(); schedule();
    }, { signal: abort.signal });
    const scheduleClose = () => {
      window.clearTimeout(hoverTimer);
      if (!pointerInside && !(keyboardMode && dock.contains(document.activeElement))) {
        hoverTimer = window.setTimeout(() => setOpen(false), 220);
      }
    };
    document.addEventListener('pointerdown', () => { keyboardMode = false; }, { signal: abort.signal });
    document.addEventListener('keydown', () => { keyboardMode = true; }, { signal: abort.signal });
    summary.addEventListener('click', event => {
      event.preventDefault();
      keyboardMode = event.detail === 0;
      setOpen(!desiredOpen);
    }, { signal: abort.signal });
    dock.addEventListener('pointerenter', () => {
      pointerInside = true;
      window.clearTimeout(hoverTimer);
      if (hover.matches && !desiredOpen) hoverTimer = window.setTimeout(() => setOpen(true), 160);
    }, { signal: abort.signal });
    dock.addEventListener('pointerleave', () => {
      pointerInside = false;
      if (hover.matches) scheduleClose();
    }, { signal: abort.signal });
    dock.addEventListener('focusout', () => queueMicrotask(scheduleClose), { signal: abort.signal });
    dock.addEventListener('keydown', event => {
      if (event.key === 'Escape') { setOpen(false); summary.focus(); }
    }, { signal: abort.signal });
    motion.addEventListener('change', () => {
      animation?.cancel(); animation = undefined; contentAnimation?.cancel();
      dock.open = desiredOpen; delete dock.dataset.closing;
    }, { signal: abort.signal });
    const observer = new ResizeObserver(measure);
    observer.observe(scroller.querySelector('ul')!);
    update();
    dispose = () => { abort.abort(); cancelAnimationFrame(pending); window.clearTimeout(hoverTimer); observer.disconnect(); animation?.cancel(); contentAnimation?.cancel(); };
  };
  document.addEventListener('astro:page-load', mount);
  document.addEventListener('astro:before-swap', () => dispose?.());
  window.addEventListener('pagehide', () => dispose?.());
  window.addEventListener('pageshow', mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else queueMicrotask(mount);
}
