import { defineCollection, z } from "astro:content";

const roadmapStatuses = ["now", "next", "later", "done", "blocked"] as const;
const roadmapLevels = ["domain", "pillar", "initiative", "task"] as const;
const artifactTypes = ["project", "paper", "competition", "talk", "award", "dataset"] as const;

const paperFields = {
  title: z.string().trim().min(1), url: z.string().url(), year: z.number().int().optional(),
  abstract: z.string().trim().min(1).optional(),
  abstract_kind: z.enum(["original", "summary", "translation"]).default("summary"),
  authors: z.array(z.string()).default([]), venue: z.string().optional(), pdf: z.string().url().optional(),
};

const links = {
  research: z.array(z.string().trim().min(1)).default([]),
  books: z.array(z.string().trim().min(1)).default([]),
  kind: z.enum(["note", "paper", "reflection", "review", "overview", "book", "reference"]).default("note"),
  order: z.number().default(0),
  papers: z.array(z.object(paperFields)).default([]),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
};

const writingSchema = z.object({
  title: z.string(), slug: z.string().optional(), date: z.coerce.date().optional(),
  summary: z.string().default(""), tags: z.array(z.string()).default([]),
  cover: z.string().optional(), updated_at: z.coerce.date().optional(),
  draft: z.boolean().default(false), published: z.boolean().default(true),
  ...links,
  categories: z.array(z.string()).default([]),
  author: z.string().default(''), status: z.enum(['在读','已读','重读中','暂搁','想读']).optional(),
  recommended: z.boolean().default(false), edition: z.string().optional(),
  url: z.string().url().optional(), abstract: z.string().trim().min(1).optional(),
  abstract_kind: paperFields.abstract_kind, authors: paperFields.authors,
  year: paperFields.year, venue: paperFields.venue, pdf: paperFields.pdf,
});
const research = defineCollection({ type: "content", schema: writingSchema });
const musings = defineCollection({ type: "content", schema: writingSchema });
const reading = defineCollection({ type: "content", schema: writingSchema });

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    category: z.string().optional(),
    summary: z.string().optional().default(""),
    cover: z.string().optional(),
    emoji: z.string().optional(),
    collection: z.string().optional(),
    related_nodes: z.array(z.string()).default([]),
    related_artifacts: z.array(z.string()).default([]),
    related_posts: z.array(z.string()).default([]),
    reading_time: z.number().int().optional(),
    updated_at: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    published: z.boolean().optional().default(true),
    ...links
  })
});

const roadmap = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    track: z.string(),
    node_level: z.enum(roadmapLevels).default("initiative"),
    parent: z.string().optional(),
    sort_order: z.number().int().default(0),
    status: z.enum(roadmapStatuses),
    summary: z.string(),
    cover: z.string().optional(),
    highlights: z.array(z.string()).max(3).default([]),
    tags: z.array(z.string()).default([]),
    progress: z.number().min(0).max(100).optional(),
    last_updated: z.coerce.date(),
    milestones: z
      .array(
        z.object({
          date: z.coerce.date(),
          status: z.enum(roadmapStatuses),
          evidence: z.string().url().optional(),
          note: z.string().optional()
        })
      )
      .default([]),
    related_posts: z.array(z.string()).default([]),
    related_artifacts: z.array(z.string()).default([])
  })
});

const artifacts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    type: z.enum(artifactTypes),
    date: z.coerce.date(),
    venue: z.string().optional(),
    summary: z.string(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().min(1).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), {
            message: "link url must be absolute http(s) url or site-relative path"
          })
        })
      )
      .default([]),
    related_nodes: z.array(z.string()).default([])
  })
});

const site = defineCollection({
  type: "data",
  schema: z.object({
    hero: z.object({
      system_label: z.string().default("Implicit Signal Mining for Personalized Decision Systems"),
      name: z.string(),
      tagline: z.string(),
      intro: z.string(),
      now: z.array(z.string()).default([]),
      cta_primary_label: z.string().optional().default(""),
      cta_primary_url: z.string().optional().default(""),
      cta_secondary_label: z.string().optional().default(""),
      cta_secondary_url: z.string().optional().default(""),
      metrics: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
            detail: z.string().optional().default(""),
            icon: z.string().optional().default("spark")
          })
        )
        .default([])
    }),
    quick_links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
          external: z.boolean().default(true)
        })
      )
      .default([]),
    pinned_tracks: z.array(z.string()).default([]),
    featured_artifacts: z.array(z.string()).default([]),
    featured_posts: z.array(z.string()).default([]),
    changelog: z.array(z.string()).default([])
  })
});

const taxonomy = defineCollection({
  type: "data",
  schema: z.object({
    tracks: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    types: z.array(z.string()).default([]),
    statuses: z.array(z.string()).default([]),
    roadmap_levels: z.array(z.string()).default([]),
    years: z.array(z.union([z.string(), z.number()])).default([])
  })
});

export const collections = {
  research, musings, reading,
  blog,
  roadmap,
  artifacts,
  site,
  taxonomy
};
