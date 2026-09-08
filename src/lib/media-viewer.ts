import '@/styles/media-viewer.css';

export function installMediaViewer() {
  let dialog: HTMLDialogElement;
  let stage: HTMLElement;
  let plane: HTMLElement;
  let trigger: HTMLElement | null = null;
  let scale = 1, fitScale = 1, x = 0, y = 0, width = 1, height = 1;
  let drag: { id: number; x: number; y: number } | undefined;
  let oldOverflow = '';
  let cloneSerial = 0;

  function render() {
    plane.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    dialog.querySelector('output')!.textContent = `${Math.round(scale * 100)}%`;
  }
  function fit() {
    fitScale = Math.min((stage.clientWidth - 40) / width, (stage.clientHeight - 40) / height, 1);
    scale = fitScale;
    x = (stage.clientWidth - width * scale) / 2;
    y = (stage.clientHeight - height * scale) / 2;
    render();
  }
  function zoom(next: number, px = stage.clientWidth / 2, py = stage.clientHeight / 2) {
    next = Math.max(Math.min(.1, fitScale), Math.min(6, next));
    x = px - (px - x) * next / scale;
    y = py - (py - y) * next / scale;
    scale = next; render();
  }
  function create() {
    dialog = document.createElement('dialog');
    dialog.className = 'media-viewer';
    dialog.setAttribute('aria-label', '媒体放大查看');
    dialog.innerHTML = `<div class="media-viewer-toolbar"><span class="media-viewer-title">放大查看</span><div><button type="button" data-zoom="out" aria-label="缩小">−</button><output aria-live="polite">100%</output><button type="button" data-zoom="in" aria-label="放大">+</button><button type="button" data-zoom="fit">适应窗口</button><button type="button" data-zoom="close" aria-label="关闭放大查看">关闭 ×</button></div></div><div class="media-viewer-stage" tabindex="0" aria-label="拖动平移，滚轮或加减键缩放"><div class="media-viewer-plane content"></div></div><p class="media-viewer-hint">拖动平移 · 滚轮缩放 · Esc 关闭</p>`;
    document.body.append(dialog);
    stage = dialog.querySelector('.media-viewer-stage')!;
    plane = dialog.querySelector('.media-viewer-plane')!;
    dialog.addEventListener('close', () => {
      document.documentElement.style.overflow = oldOverflow;
      plane.replaceChildren(); drag = undefined;
      trigger?.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', e => {
      if (e.target === dialog) dialog.close();
      const action = (e.target as Element).closest<HTMLElement>('[data-zoom]')?.dataset.zoom;
      if (action === 'close') dialog.close();
      if (action === 'fit') fit();
      if (action === 'in') zoom(scale * 1.25);
      if (action === 'out') zoom(scale / 1.25);
    });
    stage.addEventListener('wheel', e => {
      e.preventDefault(); const box = stage.getBoundingClientRect();
      zoom(scale * Math.exp(-e.deltaY * .0015), e.clientX - box.left, e.clientY - box.top);
    }, { passive: false });
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      x += e.clientX - drag.x; y += e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY; render();
    });
    const endDrag = () => { drag = undefined; };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    dialog.addEventListener('keydown', e => {
      if (['+', '=', '-', '0', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
      if (e.key === '+' || e.key === '=') zoom(scale * 1.25);
      if (e.key === '-') zoom(scale / 1.25);
      if (e.key === '0') fit();
      if (e.key.startsWith('Arrow')) {
        x += e.key === 'ArrowLeft' ? 40 : e.key === 'ArrowRight' ? -40 : 0;
        y += e.key === 'ArrowUp' ? 40 : e.key === 'ArrowDown' ? -40 : 0;
        render();
      }
    });
  }

  function open(source: Element, opener: HTMLElement) {
    if (!dialog?.isConnected) create();
    trigger = opener;
    const clone = source.cloneNode(true) as HTMLElement | SVGSVGElement;
    // SVG IDs are document-global. Rewrite references as well as IDs in copies.
    const prefix = `viewer-${++cloneSerial}-`;
    const ids = new Map<string, string>();
    [clone, ...clone.querySelectorAll('[id]')].forEach(el => { if (el.id) ids.set(el.id, prefix + el.id); });
    [clone, ...clone.querySelectorAll('*')].forEach(el => {
      for (const attribute of [...el.attributes]) {
        let value = attribute.value;
        if (attribute.name === 'id') value = ids.get(value) ?? value;
        else for (const [id, replacement] of ids) {
          if (value === `#${id}`) value = `#${replacement}`;
          value = value.replaceAll(`url(#${id})`, `url(#${replacement})`);
        }
        el.setAttribute(attribute.name, value);
      }
      if (el.tagName.toLowerCase() === 'style') {
        let css = el.textContent ?? '';
        // Mermaid scopes its stylesheet to the SVG root ID.
        const rootId = source.id;
        if (rootId) css = css.replaceAll(`#${rootId}`, `#${ids.get(rootId)}`);
        el.textContent = css;
      }
    });
    clone.querySelectorAll('button, script').forEach(el => el.remove());
    clone.removeAttribute('tabindex'); clone.removeAttribute('role');
    plane.replaceChildren(clone);
    oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector<HTMLElement>('.media-viewer-title')!.textContent = source instanceof HTMLImageElement ? source.alt || '图片' : source instanceof SVGElement ? '图表' : '表格';
    if (source instanceof HTMLImageElement) {
      width = source.naturalWidth || source.width;
      height = source.naturalHeight || source.height;
      const picture = clone as HTMLImageElement;
      picture.draggable = false;
      picture.removeAttribute('srcset'); picture.removeAttribute('sizes');
      picture.loading = 'eager';
      picture.src = source.dataset.fullSrc || source.currentSrc || source.src;
      picture.onload = () => {
        if (!dialog.open || !picture.isConnected) return;
        width = picture.naturalWidth; height = picture.naturalHeight;
        plane.style.width = `${width}px`; picture.style.height = `${height}px`; fit();
      };
    } else if (source instanceof SVGSVGElement) {
      width = source.viewBox.baseVal.width || source.clientWidth;
      height = source.viewBox.baseVal.height || source.clientHeight;
    } else {
      width = Math.max(900, source.scrollWidth);
      plane.style.width = `${width}px`;
      height = clone.getBoundingClientRect().height / (scale || 1);
      // Measure at natural scale; the old dialog transform must not affect a new table.
      plane.style.transform = 'none';
      height = clone.getBoundingClientRect().height;
    }
    plane.style.width = `${width}px`;
    clone.style.width = '100%'; clone.style.maxWidth = 'none';
    if (source instanceof HTMLImageElement || source instanceof SVGSVGElement) clone.style.height = `${height}px`;
    fit(); stage.focus();
  }

  function enhance() {
    document.querySelectorAll<HTMLElement>('.content img').forEach(img => {
      if (img.closest('.media-viewer')) return;
      img.dataset.mediaImage = 'true';
      img.tabIndex = 0; img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `${(img as HTMLImageElement).alt || '图片'}，放大查看`);
    });
    document.querySelectorAll<HTMLElement>('.content .table-wrap, .content .mermaid-block[data-diagram-ready="true"]').forEach(host => {
      if (host.querySelector('[data-media-open]')) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'media-expand';
      button.dataset.mediaOpen = 'true'; button.textContent = '放大查看 ↗';
      host.append(button);
    });
    document.querySelectorAll<HTMLElement>('.archive-document-cover--image, .archive-node-cover').forEach(host => {
      if (!host.querySelector('img') || host.querySelector('[data-media-open]')) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'media-expand media-expand-cover';
      button.dataset.mediaOpen = 'true'; button.textContent = '查看图片 ↗';
      host.append(button);
    });
  }
  function activate(target: Element) {
    const image = target.closest<HTMLElement>('[data-media-image]');
    const button = target.closest<HTMLElement>('[data-media-open]');
    const source = image || button?.parentElement?.querySelector('svg, table, img');
    if (!source || source.closest('.media-viewer')) return false;
    open(source, (image || button)!); return true;
  }
  document.addEventListener('click', e => { if (e.target instanceof Element && activate(e.target)) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof Element && e.target.matches('[data-media-image]')) {
      e.preventDefault(); activate(e.target);
    }
  });
  window.addEventListener('resize', () => { if (dialog?.open) fit(); });
  document.addEventListener('astro:before-swap', () => { if (dialog?.open) dialog.close(); });
  document.addEventListener('astro:page-load', enhance);
  document.addEventListener('reading:media-ready', enhance);
  enhance();
}
