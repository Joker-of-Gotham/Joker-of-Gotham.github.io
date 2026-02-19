export type RoadmapStatus = "now" | "next" | "later" | "done" | "blocked";

export interface RoadmapTreeSeed {
  slug: string;
  track: string;
  status: RoadmapStatus;
  lastUpdatedISO: string;
  sortOrder?: number;
  parent?: string;
}

export type RoadmapTreeNode<T extends RoadmapTreeSeed> = T & {
  depth: number;
  children: Array<RoadmapTreeNode<T>>;
};

const statusPriority: Record<RoadmapStatus, number> = {
  now: 0,
  blocked: 1,
  next: 2,
  later: 3,
  done: 4
};

function compareNodes<T extends RoadmapTreeSeed>(a: RoadmapTreeNode<T>, b: RoadmapTreeNode<T>) {
  const orderDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (orderDelta !== 0) return orderDelta;

  const statusDelta = statusPriority[a.status] - statusPriority[b.status];
  if (statusDelta !== 0) return statusDelta;

  return Date.parse(b.lastUpdatedISO) - Date.parse(a.lastUpdatedISO);
}

function wouldCreateCycle(parentOf: Map<string, string>, childSlug: string, nextParentSlug: string) {
  let current: string | undefined = nextParentSlug;
  let hopCount = 0;

  while (current && hopCount < parentOf.size + 2) {
    if (current === childSlug) {
      return true;
    }
    current = parentOf.get(current);
    hopCount += 1;
  }

  return false;
}

export function buildRoadmapTree<T extends RoadmapTreeSeed>(seeds: T[]) {
  const bySlug = new Map<string, RoadmapTreeNode<T>>();
  const parentOf = new Map<string, string>();

  seeds.forEach((seed) => {
    bySlug.set(seed.slug, {
      ...seed,
      depth: 0,
      children: []
    });
  });

  const roots: Array<RoadmapTreeNode<T>> = [];

  bySlug.forEach((node) => {
    const parentSlug = node.parent?.trim();
    if (!parentSlug || parentSlug === node.slug || !bySlug.has(parentSlug)) {
      roots.push(node);
      return;
    }

    if (wouldCreateCycle(parentOf, node.slug, parentSlug)) {
      roots.push(node);
      return;
    }

    parentOf.set(node.slug, parentSlug);
    bySlug.get(parentSlug)?.children.push(node);
  });

  const assignDepthAndSort = (nodes: Array<RoadmapTreeNode<T>>, depth: number) => {
    nodes.sort(compareNodes);
    nodes.forEach((node) => {
      node.depth = depth;
      assignDepthAndSort(node.children, depth + 1);
    });
  };

  assignDepthAndSort(roots, 0);

  return {
    roots,
    bySlug
  };
}

export function collectAncestorSlugs<T extends RoadmapTreeSeed>(slug: string, bySlug: Map<string, RoadmapTreeNode<T>>) {
  const ancestors: string[] = [];
  const visited = new Set<string>();
  let current = bySlug.get(slug)?.parent?.trim();

  while (current && !visited.has(current)) {
    visited.add(current);
    ancestors.unshift(current);
    current = bySlug.get(current)?.parent?.trim();
  }

  return ancestors;
}
