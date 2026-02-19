import { getCollection, type CollectionEntry } from "astro:content";

export type BlogEntry = CollectionEntry<"blog">;
export type RoadmapEntry = CollectionEntry<"roadmap">;
export type ArtifactEntry = CollectionEntry<"artifacts">;
export type CommandItemKind = "page" | "roadmap" | "blog" | "artifact";

export interface SiteConfigData {
  hero: {
    system_label: string;
    name: string;
    tagline: string;
    intro: string;
    now: string[];
    cta_primary_label: string;
    cta_primary_url: string;
    cta_secondary_label: string;
    cta_secondary_url: string;
    metrics: Array<{
      label: string;
      value: string;
      detail?: string;
      icon?: string;
    }>;
  };
  quick_links: Array<{
    label: string;
    url: string;
    external: boolean;
  }>;
  pinned_tracks: string[];
  featured_artifacts: string[];
  featured_posts: string[];
  changelog: string[];
}

export interface TaxonomyConfigData {
  tracks: string[];
  topics: string[];
  types: string[];
  statuses: string[];
  roadmap_levels: string[];
  years: Array<string | number>;
}

export interface CommandPaletteItem {
  title: string;
  url: string;
  kind: CommandItemKind;
}

function matchesDataEntryId(entryId: string, baseName: string) {
  const tail = entryId.replace(/\\/g, "/").split("/").pop() ?? entryId;
  const normalizedTail = tail.toLowerCase();
  const normalizedBase = baseName.toLowerCase();

  return (
    normalizedTail === normalizedBase ||
    normalizedTail === `${normalizedBase}.yml` ||
    normalizedTail === `${normalizedBase}.yaml` ||
    normalizedTail === `${normalizedBase}.json` ||
    normalizedTail.startsWith(`${normalizedBase}.`)
  );
}

let blogCache: Promise<BlogEntry[]> | null = null;
let roadmapCache: Promise<RoadmapEntry[]> | null = null;
let artifactCache: Promise<ArtifactEntry[]> | null = null;
let siteConfigCache: Promise<{ home?: SiteConfigData; taxonomy?: TaxonomyConfigData }> | null = null;
let commandItemsCache: Promise<CommandPaletteItem[]> | null = null;

export function normalizeSlug(entry: { slug: string; data: { slug?: string } }) {
  return entry.data.slug ?? entry.slug;
}

export async function getPublishedBlogPosts() {
  if (!blogCache) {
    blogCache = getCollection("blog", ({ data }) => data.published !== false && data.draft !== true).then((posts: BlogEntry[]) =>
      posts.sort((a: BlogEntry, b: BlogEntry) => b.data.date.getTime() - a.data.date.getTime())
    );
  }
  return blogCache;
}

export async function getRoadmapNodes() {
  if (!roadmapCache) {
    roadmapCache = getCollection("roadmap").then((nodes: RoadmapEntry[]) =>
      nodes.sort((a: RoadmapEntry, b: RoadmapEntry) => b.data.last_updated.getTime() - a.data.last_updated.getTime())
    );
  }
  return roadmapCache;
}

export async function getArtifacts() {
  if (!artifactCache) {
    artifactCache = getCollection("artifacts").then((items: ArtifactEntry[]) =>
      items.sort((a: ArtifactEntry, b: ArtifactEntry) => b.data.date.getTime() - a.data.date.getTime())
    );
  }
  return artifactCache;
}

export async function getSiteConfig() {
  if (!siteConfigCache) {
    siteConfigCache = Promise.all([getCollection("site"), getCollection("taxonomy")]).then(([siteEntries, taxonomyEntries]) => {
      const home = siteEntries.find((entry: CollectionEntry<"site">) => matchesDataEntryId(entry.id, "home"));
      const taxonomy = taxonomyEntries.find((entry: CollectionEntry<"taxonomy">) => matchesDataEntryId(entry.id, "taxonomy"));

      return {
        home: home?.data as SiteConfigData | undefined,
        taxonomy: taxonomy?.data as TaxonomyConfigData | undefined
      };
    });
  }
  return siteConfigCache;
}

export async function getCommandPaletteItems() {
  if (!commandItemsCache) {
    commandItemsCache = Promise.all([getRoadmapNodes(), getPublishedBlogPosts(), getArtifacts()]).then(([nodes, posts, artifacts]) => [
      { title: "Home", url: "/", kind: "page" as const },
      { title: "Roadmap", url: "/roadmap/", kind: "page" as const },
      { title: "Blog", url: "/blog/", kind: "page" as const },
      { title: "Artifacts", url: "/artifacts/", kind: "page" as const },
      { title: "About", url: "/about/", kind: "page" as const },
      { title: "Search", url: "/search/", kind: "page" as const },
      ...nodes.slice(0, 36).map((entry) => ({
        title: entry.data.title,
        url: `/roadmap/${normalizeSlug(entry)}/`,
        kind: "roadmap" as const
      })),
      ...posts.slice(0, 48).map((entry) => ({
        title: entry.data.title,
        url: `/blog/${normalizeSlug(entry)}/`,
        kind: "blog" as const
      })),
      ...artifacts.slice(0, 24).map((entry) => ({
        title: entry.data.title,
        url: `/artifacts/${normalizeSlug(entry)}/`,
        kind: "artifact" as const
      }))
    ]);
  }
  return commandItemsCache;
}

export function readingTimeFromBody(raw: string) {
  const text = raw.replace(/```[\\s\\S]*?```/g, "").replace(/\s+/g, " ").trim();
  const count = text.length;
  return Math.max(1, Math.round(count / 450));
}

export function formatDate(input: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(input);
}
