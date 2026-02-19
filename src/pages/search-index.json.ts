import type { APIRoute } from "astro";
import { getArtifacts, getPublishedBlogPosts, getRoadmapNodes, normalizeSlug } from "@/lib/content/queries";

export const prerender = true;

interface SearchIndexItem {
  title: string;
  url: string;
  kind: "page" | "roadmap" | "blog" | "project" | "paper" | "artifact";
  summary: string;
  tags: string[];
  track?: string;
  status?: string;
  type?: string;
  collection?: string;
  year?: number;
  cover?: string;
}

function normalizeText(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\{:\s*\.([a-zA-Z0-9_-]+)\s*\}/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const GET: APIRoute = async () => {
  const [nodes, posts, artifacts] = await Promise.all([getRoadmapNodes(), getPublishedBlogPosts(), getArtifacts()]);

  const pages: SearchIndexItem[] = [
    {
      title: "Home",
      url: "/",
      kind: "page",
      summary: "主页",
      tags: []
    },
    {
      title: "Roadmap",
      url: "/roadmap/",
      kind: "page",
      summary: "路线图总览",
      tags: []
    },
    {
      title: "Blog",
      url: "/blog/",
      kind: "page",
      summary: "博客总览",
      tags: []
    },
    {
      title: "Artifacts",
      url: "/artifacts/",
      kind: "page",
      summary: "成果总览",
      tags: []
    },
    {
      title: "About",
      url: "/about/",
      kind: "page",
      summary: "关于页",
      tags: []
    }
  ];

  const roadmapItems: SearchIndexItem[] = nodes.map((entry) => ({
    title: entry.data.title,
    url: `/roadmap/${normalizeSlug(entry)}/`,
    kind: "roadmap",
    summary: normalizeText(entry.data.summary),
    tags: entry.data.tags,
    track: entry.data.track,
    status: entry.data.status,
    year: entry.data.last_updated.getFullYear(),
    cover: entry.data.cover
  }));

  const blogItems: SearchIndexItem[] = posts.map((entry) => ({
    title: entry.data.title,
    url: `/blog/${normalizeSlug(entry)}/`,
    kind: "blog",
    summary: normalizeText(entry.data.summary ?? ""),
    tags: entry.data.tags,
    collection: entry.data.collection,
    year: entry.data.date.getFullYear(),
    cover: entry.data.cover
  }));

  const artifactItems: SearchIndexItem[] = artifacts.map((entry) => ({
    title: entry.data.title,
    url: `/artifacts/${normalizeSlug(entry)}/`,
    kind: entry.data.type === "project" ? "project" : entry.data.type === "paper" ? "paper" : "artifact",
    summary: normalizeText(entry.data.summary),
    tags: entry.data.tags,
    type: entry.data.type,
    year: entry.data.date.getFullYear(),
    cover: entry.data.cover
  }));

  const payload = [...pages, ...roadmapItems, ...blogItems, ...artifactItems];

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600"
    }
  });
};
