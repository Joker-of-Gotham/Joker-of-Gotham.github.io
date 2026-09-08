import { OBSERVATORY_CHAPTERS, type ObservatoryChapterId } from './types';

const routeScenes: Record<string, ObservatoryChapterId> = {
  '/blog/': 'observe', '/roadmap/': 'structure', '/artifacts/': 'orchestrate',
  '/about/': 'embodiment', '/search/': 'archive-afterlight'
};

export function sceneForRoute(pathname: string): ObservatoryChapterId | undefined {
  return routeScenes[`${pathname.replace(/\/+$/, '')}/`];
}

export function resolveRouteScene(pathname: string, search: string): ObservatoryChapterId | undefined {
  const fallback = sceneForRoute(pathname);
  if (!fallback) return undefined;
  const requested = new URLSearchParams(search).get('scene');
  return OBSERVATORY_CHAPTERS.find(chapter => chapter === requested) ?? fallback;
}
