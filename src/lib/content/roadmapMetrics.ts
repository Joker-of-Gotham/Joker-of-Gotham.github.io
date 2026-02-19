import type { RoadmapEntry } from "@/lib/content/queries";
import { normalizeSlug } from "@/lib/content/queries";

export interface NodePointMetrics {
  total: number;
  completed: number;
  progress: number;
  isRoot: boolean;
}

export interface TrackPointMetrics {
  total: number;
  completed: number;
  progress: number;
  rootCount: number;
  nodeCount: number;
}

export interface RoadmapPointSummary {
  pointsBySlug: Map<string, NodePointMetrics>;
  rootSlugs: Set<string>;
  childrenByParent: Map<string, string[]>;
  trackMetrics: Map<string, TrackPointMetrics>;
}

function round1(input: number) {
  return Number(input.toFixed(1));
}

function computeOwnPoints(entry: RoadmapEntry, childCount: number) {
  const milestoneCount = entry.data.milestones.length;
  if (milestoneCount > 0) {
    const completed = entry.data.milestones.filter((milestone: (typeof entry.data.milestones)[number]) => milestone.status === "done").length;
    return { total: milestoneCount, completed };
  }

  // Leaf nodes without milestones still count as one executable point.
  if (childCount === 0) {
    return {
      total: 1,
      completed: entry.data.status === "done" ? 1 : 0
    };
  }

  return {
    total: 0,
    completed: 0
  };
}

export function computeRoadmapPointSummary(nodes: RoadmapEntry[]): RoadmapPointSummary {
  const slugMap = new Map<string, RoadmapEntry>(nodes.map((entry) => [normalizeSlug(entry), entry]));
  const childrenByParent = new Map<string, string[]>();
  const rootSlugs = new Set<string>();

  nodes.forEach((entry) => {
    const slug = normalizeSlug(entry);
    const parent = entry.data.parent;
    const validParent = parent && parent !== slug && slugMap.has(parent);

    if (validParent) {
      const list = childrenByParent.get(parent) ?? [];
      list.push(slug);
      childrenByParent.set(parent, list);
    } else {
      rootSlugs.add(slug);
    }
  });

  const rawPointCache = new Map<string, { total: number; completed: number }>();
  const visiting = new Set<string>();

  const computePoints = (slug: string): { total: number; completed: number } => {
    const cached = rawPointCache.get(slug);
    if (cached) return cached;

    const entry = slugMap.get(slug);
    if (!entry) {
      return { total: 1, completed: 0 };
    }

    if (visiting.has(slug)) {
      const fallback = computeOwnPoints(entry, 0);
      rawPointCache.set(slug, fallback);
      return fallback;
    }

    visiting.add(slug);
    const children = childrenByParent.get(slug) ?? [];
    const own = computeOwnPoints(entry, children.length);
    const childPoints = children.reduce(
      (sum, childSlug) => {
        const current = computePoints(childSlug);
        return {
          total: sum.total + current.total,
          completed: sum.completed + current.completed
        };
      },
      { total: 0, completed: 0 }
    );
    visiting.delete(slug);

    const result = {
      total: own.total + childPoints.total,
      completed: own.completed + childPoints.completed
    };
    rawPointCache.set(slug, result);
    return result;
  };

  const pointsBySlug = new Map<string, NodePointMetrics>();
  slugMap.forEach((_entry, slug) => {
    const point = computePoints(slug);
    pointsBySlug.set(slug, {
      total: point.total,
      completed: point.completed,
      progress: point.total > 0 ? round1((point.completed / point.total) * 100) : 0,
      isRoot: rootSlugs.has(slug)
    });
  });

  const trackMetrics = new Map<string, TrackPointMetrics>();
  const entriesByTrack = nodes.reduce((map, entry) => {
    const list = map.get(entry.data.track) ?? [];
    list.push(entry);
    map.set(entry.data.track, list);
    return map;
  }, new Map<string, RoadmapEntry[]>());

  entriesByTrack.forEach((entries: RoadmapEntry[], track: string) => {
    const roots = entries.filter((entry: RoadmapEntry) => rootSlugs.has(normalizeSlug(entry)));
    const rootPoints = roots.reduce(
      (sum: { total: number; completed: number }, entry: RoadmapEntry) => {
        const slug = normalizeSlug(entry);
        const point = pointsBySlug.get(slug);
        return {
          total: sum.total + (point?.total ?? 0),
          completed: sum.completed + (point?.completed ?? 0)
        };
      },
      { total: 0, completed: 0 }
    );

    trackMetrics.set(track, {
      total: rootPoints.total,
      completed: rootPoints.completed,
      progress: rootPoints.total > 0 ? round1((rootPoints.completed / rootPoints.total) * 100) : 0,
      rootCount: roots.length,
      nodeCount: entries.length
    });
  });

  return {
    pointsBySlug,
    rootSlugs,
    childrenByParent,
    trackMetrics
  };
}
