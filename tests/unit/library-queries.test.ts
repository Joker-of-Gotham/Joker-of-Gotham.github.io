import { vi, describe, it, expect, beforeEach } from 'vitest';
const { rows } = vi.hoisted(() => ({ rows: {} as Record<string, any[]> }));
vi.mock('astro:content', () => ({ getCollection: vi.fn(async (name:string, filter?: (e:any)=>boolean) => (rows[name] ?? []).filter(filter ?? (()=>true))) }));
vi.mock('../../src/lib/content/queries', () => ({
  getPublishedBlogPosts: async () => (rows.blog ?? []).filter(e => !e.data.draft && e.data.published !== false),
  normalizeSlug: (e:any) => e.data.slug ?? e.slug,
}));
import { getLibrary } from '../../src/lib/content/library';
const writing = (collection:string, id:string, extra = {}) => ({collection,id,slug:id,data:{title:id,date:new Date('2026-09-09'),summary:'',tags:[],books:[],research:[],kind:'note',order:0,papers:[],...extra}});
describe('public content graph', () => {
  beforeEach(() => { for (const key of Object.keys(rows)) delete rows[key]; });
  it('aggregates independent and blog writings without cloning, and excludes draft content and book links', async () => {
    rows.blog = [writing('blog','one',{books:['《同一本书》'],research:['方向/问题']})];
    rows.reading = [writing('reading','two',{books:['同一本书','隐藏书目']}),writing('reading','private',{draft:true,books:['不公开']})];
    rows.research = [writing('research','guide',{kind:'overview',research:['方向/问题']}),writing('research','private-topic',{published:false,research:['隐藏方向']})];
    rows.musings = [writing('musings','essay')];
    rows.reading.push(writing('reading','hidden/index.md',{title:'隐藏书目',kind:'book',draft:true}));
    const lib = await getLibrary();
    expect(lib.entries.map(e=>e.href)).toEqual(['/blog/one/','/reading/reviews/two/','/musings/essay/']);
    expect(lib.books.map(b=>b.title)).toEqual(['同一本书']);
    expect(lib.books[0].articles).toHaveLength(2);
    expect(lib.overviews).toHaveLength(1);
    expect(lib.topics.map(t=>t.path)).toEqual(['方向','方向/问题']);
    expect(lib.entries.find(e=>e.title==='two')?.books).toEqual(['同一本书']);
  });
  it('creates standalone paper topics and keeps hidden collected papers out of the public index', async () => {
    rows.research = [
      writing('research','新方向/子问题/paper.md',{kind:'reference',title:'Collected',url:'https://example.org/paper',abstract:'An abstract'}),
      writing('research','隐藏/paper.md',{kind:'reference',title:'Hidden',url:'https://example.org/hidden',abstract:'Private abstract',draft:true}),
    ];
    rows.research.push(writing('research','note',{papers:[{title:'Hidden',url:'https://example.org/hidden/'}]}));
    const lib = await getLibrary();
    expect(lib.papers.map(p=>p.title)).toEqual(['Collected']);
    expect(lib.papers[0].entries).toEqual([]);
    expect(lib.topics.map(t=>t.path)).toEqual(['新方向','新方向/子问题']);
    expect(lib.entries[0].cover).toMatch(/\.webp$/);
  });
});
