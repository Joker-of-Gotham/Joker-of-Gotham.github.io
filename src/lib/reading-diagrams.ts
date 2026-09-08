import { getResolvedObservatoryTheme } from './observatory/theme';

// One serialized renderer: Mermaid's configuration is global. Route generations
// discard detached work; distant diagrams never enter the queue until approached.
let engine: Promise<typeof import('mermaid')['default']> | undefined;
let queue = Promise.resolve();
let generation = 0;
let serial = 0;
let observer: IntersectionObserver | undefined;
const sources = new WeakMap<HTMLElement, string>();
const visible = new Set<HTMLElement>();
const pending = new WeakMap<HTMLElement, string>();

function loadEngine() {
  return engine ??= Promise.all([import('mermaid'), import('@mermaid-js/layout-elk')]).then(([{ default: mermaid }, { default: elk }]) => {
    mermaid.registerLayoutLoaders(elk);
    return mermaid;
  });
}

function contrastNodes(host: HTMLElement) {
  // Authored pastel fills need dark labels even in the dark page theme.
  host.querySelectorAll<SVGGElement>('.node, .cluster').forEach(node => {
    const shape = node.querySelector('rect, polygon, circle, ellipse, path');
    if (!shape) return;
    const rgb = getComputedStyle(shape).fill.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!rgb || rgb.length !== 3) return;
    const luminance = rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    const light = luminance[0] * .2126 + luminance[1] * .7152 + luminance[2] * .0722;
    const color = light > .179 ? '#17121d' : '#fff9f2';
    const labels = node.classList.contains('cluster') ? '.cluster-label text, .cluster-label tspan, .cluster-label span, .cluster-label p' : 'text, tspan, .nodeLabel, .nodeLabel *';
    node.querySelectorAll<SVGElement | HTMLElement>(labels).forEach(label => {
      label.style.setProperty('fill', color, 'important');
      label.style.setProperty('color', color, 'important');
    });
  });
}

function enqueue(host: HTMLElement) {
  const theme = getResolvedObservatoryTheme();
  if (pending.get(host) === theme || host.dataset.diagramTheme === theme) return;
  pending.set(host, theme);
  const version = generation;
  queue = queue.catch(() => {}).then(async () => {
    if (version !== generation || !host.isConnected) return;
    const mermaid = await loadEngine();
    if (version !== generation || !host.isConnected) return;
    const dark = theme === 'dark';
    const background = dark ? '#100d16' : '#faf6ee';
    const ink = dark ? '#f5eee8' : '#241c2d';
    const surface = dark ? '#302738' : '#ece4ed';
    mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true,
      theme: 'base', layout: 'elk', htmlLabels: false,
      fontFamily: 'Arial, "Noto Sans SC", sans-serif',
      themeVariables: {
        darkMode: dark, background, primaryColor: surface, primaryTextColor: ink,
        secondaryColor: dark ? '#253731' : '#e0ece6', secondaryTextColor: ink,
        tertiaryColor: dark ? '#44313a' : '#f5e4de', tertiaryTextColor: ink,
        primaryBorderColor: dark ? '#a998b1' : '#75627f', lineColor: dark ? '#cbbbd2' : '#685671',
        textColor: ink, nodeTextColor: ink, edgeLabelBackground: background,
        clusterBkg: surface, clusterBorder: dark ? '#a998b1' : '#75627f',
        fontSize: '16px', titleColor: ink,
      },
      flowchart: { useMaxWidth: true, nodeSpacing: 80, rankSpacing: 100, padding: 18, curve: 'basis' },
      sequence: { useMaxWidth: true, actorMargin: 70, messageMargin: 45 },
    });
    const result = await mermaid.render(`reading-diagram-${++serial}`, sources.get(host)!);
    if (version !== generation || !host.isConnected) return;
    const drawing = host.querySelector<HTMLElement>('.mermaid')!;
    drawing.innerHTML = result.svg;
    result.bindFunctions?.(drawing);
    contrastNodes(host);
    host.dataset.diagramTheme = theme;
    host.dataset.diagramReady = 'true';
    pending.delete(host);
    document.dispatchEvent(new Event('reading:media-ready'));
  }).catch(() => {
    pending.delete(host);
    if (host.isConnected) host.dataset.diagramReady = 'error';
    // The original source stays readable if parsing or loading fails.
  });
}

function mount() {
  generation++;
  observer?.disconnect();
  visible.clear();
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const host = entry.target as HTMLElement;
      if (entry.isIntersecting) { visible.add(host); enqueue(host); }
      else visible.delete(host);
    }
  }, { rootMargin: '600px 0px' });
  document.querySelectorAll<HTMLElement>('.content pre').forEach(pre => {
    if (pre.closest('.mermaid-block')) return;
    if (pre.dataset.language !== 'mermaid' && !pre.querySelector('code.language-mermaid')) return;
    const source = pre.textContent?.trim();
    if (!source) return;
    const host = document.createElement('figure');
    host.className = 'mermaid-block';
    const drawing = document.createElement('div');
    drawing.className = 'mermaid';
    pre.replaceWith(host);
    host.append(drawing);
    drawing.append(pre);
    sources.set(host, source);
  });
  document.querySelectorAll<HTMLElement>('.mermaid-block').forEach(host => {
    pending.delete(host);
    if (sources.has(host)) observer!.observe(host);
  });
}

export function installReadingDiagrams() {
  document.addEventListener('astro:page-load', mount);
  document.addEventListener('astro:before-swap', () => { generation++; observer?.disconnect(); visible.clear(); });
  new MutationObserver(() => visible.forEach(enqueue)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => visible.forEach(enqueue));
  mount();
}
