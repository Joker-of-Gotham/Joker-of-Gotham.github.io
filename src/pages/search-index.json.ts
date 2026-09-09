import type { APIRoute } from "astro";
import { getArtifacts, getPublishedBlogPosts, getRoadmapNodes, normalizeSlug } from "@/lib/content/queries";
import { getLibrary, topicHref, bookHref, paperAnchor } from "@/lib/content/library";

export const prerender = true;

interface SearchIndexItem {
  title: string;
  url: string;
  kind: string;
  summary: string;
  summaryHtml?: string;
  tags: string[];
  books?: string[];
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
  const [nodes, posts, artifacts, library] = await Promise.all([getRoadmapNodes(), getPublishedBlogPosts(), getArtifacts(), getLibrary()]);

  const pages: SearchIndexItem[] = [
    { title: "研究", url: "/research/", kind: "page", summary: "研究方向、论文研读与思考", tags: [] },
    { title: "阅读", url: "/reading/", kind: "page", summary: "书架、书评与阅读札记", tags: [] },
    { title: "杂谈", url: "/musings/", kind: "page", summary: "生活、感悟与非技术写作", tags: [] },
    { title: "文献索引", url: "/research/library/", kind: "page", summary: "按论文查找相关研读和思考", tags: [] },
    {
      title: "Home",
      url: "/",
      kind: "page",
      summary: "Home page",
      tags: []
    },
    {
      title: "计划",
      url: "/roadmap/",
      kind: "page",
      summary: "计划与进展",
      tags: []
    },
    {
      title: "Blog",
      url: "/blog/",
      kind: "page",
      summary: "Blog overview",
      tags: []
    },
    {
      title: "Artifacts",
      url: "/artifacts/",
      kind: "page",
      summary: "Artifacts overview",
      tags: []
    },
    {
      title: "About",
      url: "/about/",
      kind: "page",
      summary: "About page",
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
    summary: library.entries.find(e => e.id === `blog:${entry.id}`)?.summary ?? '',
    summaryHtml: library.entries.find(e => e.id === `blog:${entry.id}`)?.summaryHtml,
    tags: [...entry.data.tags, ...entry.data.research],
    books: library.entries.find(e => e.id === `blog:${entry.id}`)?.books ?? [],
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

  const writingItems: SearchIndexItem[] = library.entries.filter(e => e.section !== 'blog').map(e => ({
    title: e.title, url: e.href, kind: e.section, summary: e.summary, summaryHtml: e.summaryHtml,
    tags: [...e.tags, ...e.topics], books: e.books, year: e.date.getFullYear(), cover: e.cover,
  }));
  const topicItems: SearchIndexItem[] = library.topics.map(t => ({
    title: t.path.split('/').join(' / '), url: topicHref(t.path), kind: 'topic',
    summary: library.overviews.find(e => e.data.research[0] === t.path)?.data.summary ?? '', tags: [],
  }));
  const bookItems: SearchIndexItem[] = library.books.map(b => ({
    title: b.title, url: bookHref(b.title), kind: 'book', summary: [b.author, b.summary].filter(Boolean).join(' · '),
    tags: b.categories, status: b.status,
  }));
  const paperItems: SearchIndexItem[] = library.papers.map(p => ({
    title: p.title, url: `/research/library/#${paperAnchor(p.url)}`, kind: 'literature',
    summary: p.abstract ?? '', tags: [...p.topics, ...(p.authors ?? [])], year: p.year,
  }));
  const {getDirectories}=await import('@/lib/content/directory-queries');
  const directories=(await Promise.all([getDirectories('blog'),getDirectories('reading'),getDirectories('musings')])).flat();
  const known=new Set([...pages,...bookItems].map(e=>e.url));
  const directoryItems=directories.filter(d=>d.path && !known.has(d.href)).map(d=>({title:d.namedPath.split('/').join(' / '),url:d.href,kind:'directory',summary:d.intro?.data.summary ?? '',tags:[]}));
  const payload = [...pages, ...roadmapItems, ...blogItems, ...artifactItems, ...writingItems, ...topicItems, ...bookItems, ...paperItems,...directoryItems];

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600"
    }
  });
};
