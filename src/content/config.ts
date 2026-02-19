import { defineCollection, z } from "astro:content";

const roadmapStatuses = ["now", "next", "later", "done", "blocked"] as const;
const roadmapLevels = ["domain", "pillar", "initiative", "task"] as const;
const artifactTypes = ["project", "paper", "competition", "talk", "award", "dataset"] as const;

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    category: z.string().optional(),
    summary: z.string().optional().default(""),
    cover: z.string().optional(),
    collection: z.string().optional().default("blog"),
    related_nodes: z.array(z.string()).default([]),
    related_artifacts: z.array(z.string()).default([]),
    reading_time: z.number().int().optional(),
    updated_at: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    published: z.boolean().optional().default(true)
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
      system_label: z.string().default("Personal Knowledge and Blog System"),
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
  blog,
  roadmap,
  artifacts,
  site,
  taxonomy
};
