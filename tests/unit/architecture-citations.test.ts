import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';

const root = 'src/content/research/具身智能/自主学习/模型结构/';
const read = (name: string) => matter(readFileSync(root + name + '.md', 'utf8'));
describe('architecture survey bibliography', () => {
  it('keeps embedded and exported diagram links aligned with the bibliography', () => {
    const html=readFileSync('public/embeds/embodied-architecture-atlas/index.html','utf8');
    const models=JSON.parse(html.match(/const MODELS\s*=\s*(\[.*?\]);/s)![1]);
    const figures=JSON.parse(html.match(/const FIGURES\s*=\s*(\{.*?\});/s)![1]);
    const papers=read('index').data.papers;
    for (const model of models) expect(papers.some((p:any)=>p.url===model.url && String(p.year)===model.year)).toBe(true);
    for (const group of Object.values(figures) as Record<string,string>[]) {
      for (const encoded of Object.values(group)) {
        const svg=Buffer.from(encoded,'base64').toString('utf8');
        for (const [tag] of svg.matchAll(/<a\b[^>]*>/g)) {
          const model=models.find((m:any)=>m.id===tag.match(/data-model="([^"]+)"/)?.[1]);
          if(model) expect(tag).toContain(`href="${model.url}"`);
        }
      }
    }
    expect(readFileSync('public/embeds/embodied-architecture-atlas/overview.svg','utf8').replace(/\r\n/g,'\n')).toBe(Buffer.from(figures.dark.overview,'base64').toString('utf8').replace(/\r\n/g,'\n'));
  });
  it('uses consistent canonical metadata and covers every series in the overview', () => {
    const index = read('index').data.papers;
    expect(index).toHaveLength(30);
    expect(new Set(index.map((p: any)=>p.url)).size).toBe(index.length);
    for (const [name,count] of [['vla-series',11],['wm-series',5],['wam-series',7]] as const) {
      const entries = read(name).data.papers;
      expect(entries).toHaveLength(count);
      for (const paper of entries) expect(index.find((p:any)=>p.url===paper.url)).toEqual(paper);
    }
    expect(read('wm-series').data.papers.find((p:any)=>p.venue==='Nature').year).toBe(2025);
    for (const name of ['wm-series','wam-series']) expect(read(name).data.papers.some((p:any)=>p.title.startsWith('RDT2'))).toBe(false);
  });
});
