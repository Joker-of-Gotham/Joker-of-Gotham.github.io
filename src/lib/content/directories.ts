import { cleanBook, cleanTopic, encodedPath } from './library-model';

type DirectoryData = {
  title?: string; kind?: string; date?: Date; draft?: boolean; published?: boolean;
  research?: string[]; books?: string[]; categories?: string[]; tags?: string[];
  collection?: string; cover?: string; order?: number;
};
export type TreeEntry = { id: string; collection: string; data: DirectoryData };
export const isPublic = (entry: {data: {draft?: boolean; published?: boolean}}) => !entry.data.draft && entry.data.published !== false;
export const filePath = (id: string) => id.replace(/\\/g,'/').normalize('NFC');
export const parentPath = (id: string) => filePath(id).split('/').slice(0,-1).join('/');
export const isDirectoryIndex = (entry: Pick<TreeEntry,'id'>) => /(^|\/)index\.mdx?$/i.test(filePath(entry.id));
export const isOverview = (entry: TreeEntry) => isDirectoryIndex(entry) || entry.data.kind === 'overview';
export const isBook = (entry: TreeEntry) => entry.data.kind === 'book';
export const isReference = (entry: TreeEntry) => entry.data.kind === 'reference';
export const isArticle = (entry: TreeEntry) => !isOverview(entry) && !isBook(entry) && !isReference(entry);
const unique = (items: string[]) => [...new Set(items.filter(Boolean))];
export function ancestors(path: string) {
  const parts = filePath(path).split('/').filter(Boolean);
  return ['', ...parts.map((_,i)=>parts.slice(0,i+1).join('/'))];
}
export const directoryHref = (section: string, path: string) => path ? `/${section}/topics/${encodedPath(path)}/` : `/${section}/`;

/** Filesystem ancestry is the authority. No fixed depth or registration table. */
export function resolveDirectories<E extends TreeEntry>(source: E[]) {
  const indexes = new Map<string,E>();
  for(const entry of source) {
    if(isBook(entry) && (!isDirectoryIndex(entry) || entry.collection !== 'reading')) throw new Error(`${entry.id}: kind: book 请写在阅读目录的 index.md`);
    if(isReference(entry) && (isDirectoryIndex(entry) || entry.collection !== 'research')) throw new Error(`${entry.id}: kind: reference 请写在研究目录的普通 Markdown 中`);
  }
  for (const entry of source.filter(isDirectoryIndex)) {
    const path = parentPath(entry.id);
    if (indexes.has(path)) throw new Error(`目录 ${entry.collection}/${path} 有多个 index.md / index.mdx`);
    if (isBook(entry) && entry.collection !== 'reading') throw new Error(`${entry.id}: kind: book 仅用于阅读目录`);
    indexes.set(path,entry);
  }
  return source.map(entry => {
    const path = parentPath(entry.id);
    const lineage = ancestors(path);
    const parents = lineage.map(p=>indexes.get(p)).filter((e): e is E => Boolean(e));
    const defaults = parents.filter(e=>e.id !== entry.id);
    const namedPath = lineage.filter(Boolean).map(p=>indexes.get(p)?.data.title ?? p.split('/').at(-1)!).join('/');
    const book = [...parents].reverse().find(isBook);
    const inherited = (key: 'research'|'books'|'categories'|'tags') => unique(defaults.flatMap(e=>e.data[key] ?? []));
    const nearest = (key: 'cover'|'collection') => [...defaults].reverse().find(e=>e.data[key])?.data[key];
    const research = unique([...(entry.collection === 'research' && namedPath ? [namedPath] : inherited('research')), ...(entry.data.research ?? [])].map(cleanTopic));
    const books = unique([...inherited('books'), ...(book ? [book.data.title] : []), ...(entry.data.books ?? [])].map(cleanBook));
    const categories=unique([...inherited('categories'), ...(entry.data.categories ?? [])]);
    if(!categories.length && isBook(entry)) categories.push(...lineage.filter(p=>p && p!==path).map(p=>indexes.get(p)?.data.title ?? p.split('/').at(-1)!));
    return {...entry, directory: {path, namedPath}, data: {...entry.data,
      draft: Boolean(entry.data.draft || parents.some(e=>!isPublic(e))),
      research, books, categories,
      tags: unique([...inherited('tags'), ...(entry.data.tags ?? [])]),
      cover: entry.data.cover ?? nearest('cover'), collection: entry.data.collection ?? nearest('collection') ?? (entry.collection==='blog' && path ? path.split('/')[0] : 'blog'),
    }};
  });
}

export function publishedArticles<E extends TreeEntry & {slug: string; data: {slug?: string}}>(entries: E[]) {
  const addresses = new Map<string,string>();
  return entries.filter(e=>isPublic(e) && isArticle(e)).map(entry => {
    if (!(entry.data.date instanceof Date) || Number.isNaN(entry.data.date.getTime())) throw new Error(`${entry.collection}/${entry.id}: 正文需要 date；目录导读请命名为 index.md`);
    const slug = entry.data.slug ?? entry.slug;
    if (!slug || slug === 'index' || /^(topics|notes|reviews|books|library)(\/|$)/.test(slug) || /(^|\/)\.\.?($|\/)/.test(slug)) throw new Error(`${entry.id}: slug 与保留页面冲突或包含无效路径: ${slug}`);
    if (addresses.has(slug)) throw new Error(`重复文章地址 ${slug}: ${addresses.get(slug)} 与 ${entry.id}`);
    addresses.set(slug,entry.id);
    return entry as E & {data: {date: Date}};
  });
}
