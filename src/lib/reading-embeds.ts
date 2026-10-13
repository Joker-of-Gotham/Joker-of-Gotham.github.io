import '@/styles/reading-embeds.css';

/** Progressive enhancement: authored iframe links and native video controls
 * remain useful without this script, including after Astro page transitions. */
export function installReadingEmbeds() {
  const preference = window.matchMedia('(prefers-color-scheme: light)');
  const theme = () => document.documentElement.dataset.theme ?? (preference.matches ? 'light' : 'dark');
  const syncTheme = () => document.querySelectorAll<HTMLIFrameElement>('iframe[data-embed-theme]').forEach(frame => {
    // Sandboxed local documents have opaque origins; only send the public theme.
    frame.contentWindow?.postMessage({ type: 'blog:theme', theme: theme() }, '*');
  });
  function enhance() {
    document.querySelectorAll<HTMLVideoElement>('.content video').forEach(video => {
      video.controls = true;
      video.playsInline = true;
      if (!video.hasAttribute('preload')) video.preload = 'metadata';
    });
    document.querySelectorAll<HTMLIFrameElement>('.content iframe').forEach(frame => {
      if (frame.dataset.embedReady) return;
      frame.dataset.embedReady = 'true';
      if (!frame.hasAttribute('loading')) frame.loading = 'lazy';
      if (!frame.title) frame.title = frame.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || '嵌入内容';
      frame.addEventListener('load', syncTheme);
    });
    document.querySelectorAll<HTMLElement>('.html-embed').forEach(host => {
      if (!document.fullscreenEnabled || host.querySelector('.embed-fullscreen')) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'embed-fullscreen'; button.textContent = '全屏查看';
      button.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement === host) await document.exitFullscreen();
          else await host.requestFullscreen();
        } catch { button.textContent = '请使用独立页面查看'; }
      });
      (host.querySelector('figcaption') ?? host).append(button);
    });
    syncTheme();
  }
  document.addEventListener('fullscreenchange', () => {
    document.querySelectorAll<HTMLButtonElement>('.embed-fullscreen').forEach(button => {
      button.textContent = document.fullscreenElement === button.closest('.html-embed') ? '退出全屏' : '全屏查看';
    });
  });
  document.addEventListener('astro:before-swap', () => {
    document.querySelectorAll<HTMLVideoElement>('.content video').forEach(video => video.pause());
  });
  window.addEventListener('observatory:theme-change', syncTheme);
  preference.addEventListener('change', syncTheme);
  document.addEventListener('astro:page-load', enhance);
  enhance();
}
