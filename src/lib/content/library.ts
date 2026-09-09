import { getCollection, type CollectionEntry } from "astro:content";
import { getPublishedBlogPosts, normalizeSlug } from "./queries";
import { buildTopics, cleanTopic, cleanBook, collectPapers, paperKey, inTopic, type LinkedWriting } from "./library-model";
import { writingCover } from "../media/writing-cover";
import { renderPreview } from '../markdown/preview';
import { resolveDirectories, publishedArticles, isOverview, isBook, isReference, isPublic } from './directories';
export { isPublic } from './directories';
export * from "./library-model";
export type WritingEntry = (CollectionEntry<"research"> | CollectionEntry<"reading"> | CollectionEntry<"musings">) & {data: {date: Date}};
export const sectionLabels: Record<string, string> = { blog: "博客", research: "研究", reading: "阅读", musings: "杂谈" };
export const kindLabels: Record<string, string> = { note: "笔记", paper: "论文研读", reflection: "思考", review: "书评" };
export async function getWritingTree() {
  const groups = await Promise.all([getCollection('research'), getCollection('reading'), getCollection('musings')]);
  return groups.flatMap(group=>resolveDirectories<CollectionEntry<'research'> | CollectionEntry<'reading'> | CollectionEntry<'musings'>>(group));
}
export async function getNewWriting() {
  const tree = await getWritingTree();
  return ['research','reading','musings'].flatMap(section=>publishedArticles(tree.filter(e=>e.collection === section)));
}
export async function getLibrary() {
  const [blog, tree] = await Promise.all([getPublishedBlogPosts(), getWritingTree()]);
  const newer = ['research','reading','musings'].flatMap(section=>publishedArticles(tree.filter(e=>e.collection === section)));
  const allBooks = tree.filter(isBook);
  const allPapers = tree.filter(isReference);
  const bookEntries = allBooks.filter(isPublic);
  const seenBooks=new Set<string>();
  for(const book of bookEntries){const name=cleanBook(book.data.title);if(seenBooks.has(name))throw new Error(`重复书目 ${name}，只保留一个 kind: book 的 index.md`);seenBooks.add(name);}
  const excluded = new Set(allBooks.filter(e => !isPublic(e)).map(e => cleanBook(e.data.title)));
  const hiddenTopics=tree.filter(e=>e.collection==='research' && isOverview(e) && !isPublic(e)).flatMap(e=>e.data.research);
  const publicTopics=(paths:string[])=>paths.map(cleanTopic).filter(p=>!hiddenTopics.some(hidden=>inTopic(p,hidden)));
  const overviews = tree.filter(e=>e.collection === 'research' && isOverview(e) && isPublic(e));
  const entries: LinkedWriting[] = [...blog, ...newer].map(entry => ({
    id: `${entry.collection}:${entry.id}`, title: entry.data.title,
    href: entry.collection === "blog" ? `/blog/${normalizeSlug(entry)}/` : `/${entry.collection}/${entry.collection === "research" ? "notes/" : entry.collection === "reading" ? "reviews/" : ""}${normalizeSlug(entry)}/`,
    section: entry.collection, summary: entry.data.summary ?? "", date: entry.data.date,
    updated: entry.data.updated_at ?? entry.data.date, topics: [...new Set(publicTopics(entry.data.research).filter(Boolean))],
    books: [...new Set(entry.data.books.map(cleanBook).filter(name => name && !excluded.has(name)))], tags: entry.data.tags,
    kind: entry.data.kind, order: entry.data.order, cover: writingCover(entry.data.cover, entry.collection),
    papers: entry.data.papers.map(p => ({ ...p, title: p.title, url: p.url })),
  })).sort((a, b) => b.date.getTime() - a.date.getTime());
  await Promise.all(entries.map(async item => {
    const source = [...blog, ...newer].find(e => `${e.collection}:${e.id}` === item.id)!;
    const preview = await renderPreview(item.summary, source.body);
    item.summaryHtml = preview.html;
    item.summary = preview.text;
  }));
  const excludedPapers = new Set(allPapers.filter(e => !isPublic(e) && e.data.url).map(e => paperKey(e.data.url)));
  const papers = collectPapers(entries, allPapers.filter(isPublic).map(entry => {
    const p = entry.data;
    if (!p.url || !p.abstract) throw new Error(`${entry.id}: 论文收藏需要 url 和 abstract`);
    return {...p, title: p.title, url: p.url, topics: publicTopics(p.research)};
  })).filter(p => !excludedPapers.has(paperKey(p.url)));
  const topics = buildTopics(entries, [...overviews.flatMap(e => e.data.research), ...papers.flatMap(p => p.topics)]);
  const names = [...new Set([...bookEntries.map(e => cleanBook(e.data.title)), ...entries.flatMap(e => e.books)])].filter(name => !excluded.has(name));
  const books = names.map(title => {
    const entry = bookEntries.find(e => cleanBook(e.data.title) === title);
    const articles = entries.filter(e => e.books.includes(title));
    const latest = Math.max(entry?.data.date?.getTime() ?? 0, ...articles.map(e => e.updated.getTime()));
    return { title, entry, articles, latest, author: entry?.data.author ?? "", categories: entry?.data.categories ?? [], status: entry?.data.status, summary: entry?.data.summary ?? "", cover: entry?.data.cover, recommended: entry?.data.recommended ?? false };
  }).sort((a, b) => b.latest - a.latest || a.title.localeCompare(b.title, "zh-CN"));
  return { entries, topics, books, overviews, papers, tree };
}
export type Library = Awaited<ReturnType<typeof getLibrary>>;
