import { describe, expect, it } from 'vitest';
import { buildTopics, cleanBook, cleanTopic, bookHref, topicHref, collectPapers, type LinkedWriting } from '../../src/lib/content/library-model';

const entry = (id: string, topics: string[], papers: LinkedWriting['papers'] = []): LinkedWriting => ({
  id, topics, papers, title: id, href: `/blog/${id}/`, section: 'blog', summary: '',
  date: new Date('2026-09-09'), updated: new Date('2026-09-09'), books: [], tags: [], kind: 'note', order: 0,
});

describe('Markdown content associations', () => {
  it('creates every ancestor, includes direct and descendant articles once, and respects path boundaries', () => {
    const a = entry('shared', ['知识/图谱/质量/规则', '知识/图谱/质量']);
    const b = entry('other', ['知识/图谱工具']);
    const topics = buildTopics([a,b], ['新方向/初步问题']);
    expect(topics.map(t => t.path)).toContain('知识/图谱/质量/规则');
    expect(topics.find(t => t.path === '知识/图谱')?.entries).toEqual([a]);
    expect(topics.find(t => t.path === '知识')?.entries).toEqual([a,b]);
    expect(topics.find(t => t.path === '新方向')?.entries).toEqual([]);
  });
  it('normalizes simple names while keeping punctuation safe in URLs', () => {
    expect(cleanBook(' 《善恶的彼岸》 ')).toBe('善恶的彼岸');
    expect(cleanTopic(' 知识 / / 图谱 / 质量 ')).toBe('知识/图谱/质量');
    expect(bookHref('A/B & C')).toBe('/reading/books/A%2FB%20%26%20C/');
    expect(topicHref('知识/质量')).toBe('/research/topics/%E7%9F%A5%E8%AF%86/%E8%B4%A8%E9%87%8F/');
  });
  it('one paper links back to multiple canonical articles without repeating a discussion', () => {
    const paper = {title:'Survey',url:'https://example.org/paper'};
    const a = entry('a',[],[paper, paper]);
    const b = entry('b',[],[{...paper,url:paper.url+'/'}]);
    const index = collectPapers([a,b]);
    expect(index).toHaveLength(1);
    expect(index[0].entries.map(e => e.href)).toEqual(['/blog/a/','/blog/b/']);
  });
  it('keeps collected papers without notes and merges rich metadata with citation backlinks', () => {
    const paper = {title:'Survey',url:'https://example.org/paper',abstract:'Source abstract',year:2023,topics:['方向/问题']};
    const note = entry('note',['方向/另一个问题'],[{title:'Short citation',url:paper.url+'/',year:2022}]);
    const result = collectPapers([note],[paper,{title:'Unread',url:'https://example.org/unread',abstract:'Another abstract',topics:['另一方向']}]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({title:'Survey',abstract:'Source abstract',year:2023,topics:['方向/问题','方向/另一个问题']});
    expect(result[0].entries).toEqual([note]);
    expect(result[1].entries).toEqual([]);
    expect(buildTopics([],result.flatMap(p=>p.topics)).map(t=>t.path)).toContain('另一方向');
  });
});
