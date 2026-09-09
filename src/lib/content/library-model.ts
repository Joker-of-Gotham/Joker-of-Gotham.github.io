/** Names are the authoring interface: no registry, generated IDs, or manual backlinks. */
export const cleanBook = (name: string) => name.trim().replace(/^《(.*)》$/, "$1").normalize("NFC");
export const cleanTopic = (path: string) => path.split("/").map(p => p.trim().normalize("NFC")).filter(Boolean).join("/");
export const encodedPath = (path: string) => path.split("/").map(encodeURIComponent).join("/");
export const topicHref = (path: string) => `/research/topics/${encodedPath(path)}/`;
export const bookHref = (name: string) => `/reading/books/${encodeURIComponent(cleanBook(name))}/`;
export const inTopic = (path: string, parent: string) => path === parent || path.startsWith(`${parent}/`);

export interface LinkedWriting {
  id: string; title: string; href: string; section: string; summary: string; summaryHtml?: string;
  date: Date; updated: Date; topics: string[]; books: string[]; tags: string[];
  kind: string; order: number; cover?: string;
  papers: PaperReference[];
}
export interface PaperReference {
  title: string; url: string; year?: number; abstract?: string;
  abstract_kind?: 'original' | 'summary' | 'translation'; authors?: string[]; venue?: string; pdf?: string;
}
export interface CollectedPaper extends PaperReference { topics: string[]; entries: LinkedWriting[]; }
export const paperKey = (url: string) => url.replace(/\/$/, '');
export function paperAnchor(url: string) {
  let hash = 2166136261;
  for (const c of paperKey(url)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `paper-${(hash >>> 0).toString(36)}`;
}
export interface Topic {
  path: string; title: string; parent: string; depth: number; entries: LinkedWriting[];
}
export function buildTopics(entries: LinkedWriting[], extraPaths: string[] = []) {
  const nodes = new Map<string, Topic>();
  for (const raw of [...extraPaths, ...entries.flatMap(e => e.topics)]) {
    const parts = cleanTopic(raw).split("/").filter(Boolean);
    for (let i = 1; i <= parts.length; i++) {
      const path = parts.slice(0, i).join("/");
      if (!nodes.has(path)) nodes.set(path, { path, title: parts[i - 1], parent: parts.slice(0, i - 1).join("/"), depth: i, entries: [] });
    }
  }
  for (const node of nodes.values()) node.entries = entries.filter(e => e.topics.some(t => inTopic(cleanTopic(t), node.path)));
  const values = [...nodes.values()];
  const walk = (parent: string): Topic[] => values.filter(n => n.parent === parent).flatMap(n => [n, ...walk(n.path)]);
  return walk('');
}
export function collectPapers(entries: LinkedWriting[], collected: (PaperReference & { topics: string[] })[] = []) {
  const papers = new Map<string, CollectedPaper>();
  const merge = (paper: PaperReference, topics: string[]) => {
    const key = paperKey(paper.url);
    const existing = papers.get(key);
    const item: CollectedPaper = existing ?? { ...paper, topics: [], entries: [] };
    // Rich standalone metadata wins; a minimal citation never erases an abstract.
    for (const field of ['abstract', 'abstract_kind', 'authors', 'venue', 'year', 'pdf'] as const) {
      if (item[field] === undefined || (Array.isArray(item[field]) && !item[field].length)) {
        Object.assign(item, { [field]: paper[field] });
      }
    }
    item.topics = [...new Set([...item.topics, ...topics.map(cleanTopic).filter(Boolean)])];
    papers.set(key, item);
    return item;
  };
  for (const paper of collected) merge(paper, paper.topics);
  for (const entry of entries) for (const paper of entry.papers) {
    const item = merge(paper, entry.topics);
    if (!item.entries.some(e => e.id === entry.id)) item.entries.push(entry);
  }
  return [...papers.values()];
}
