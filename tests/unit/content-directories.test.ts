import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {resolveDirectories,publishedArticles,isOverview} from '../../src/lib/content/directories';
import {validateDirectorySources} from '../../src/lib/content/validate-directories';
const node=(collection:string,id:string,data:Record<string,unknown>={})=>({collection,id,slug:id.replace(/\.md$/,''),data:{title:id,books:[],research:[],tags:[],categories:[],...data}});
describe('recursive Markdown authoring',()=>{
  it('infers arbitrary deep topic paths, resolves every introduction, and inherits defaults',()=>{
    const path=Array.from({length:24},(_,i)=>`层${i}`).join('/');
    const source=[node('research','index.md',{title:'研究',tags:['基础']}),...path.split('/').map((_,i)=>node('research',path.split('/').slice(0,i+1).join('/')+'/index.md',{title:`方向${i}`})),node('research',path+'/note.md',{date:new Date(),research:['另一条/关联'],tags:['文章']})];
    const tree=resolveDirectories(source), article=publishedArticles(tree)[0];
    expect(tree.filter(isOverview)).toHaveLength(25);
    expect(article.data.research).toEqual([Array.from({length:24},(_,i)=>`方向${i}`).join('/'),'另一条/关联']);
    expect(article.data.tags).toEqual(['基础','文章']);
    expect(article.slug).toBe(path+'/note');
  });
  it('keeps book metadata alongside reviews and allows explicit cross-book links',()=>{
    const tree=resolveDirectories([node('reading','历史/index.md',{title:'历史'}),node('reading','历史/一本书/index.md',{title:'一本书',kind:'book',cover:'/book.webp'}),node('reading','历史/一本书/章节/问题/review.md',{date:new Date(),books:['另一本书'],cover:'/review.webp'})]);
    expect(tree[1].data.categories).toEqual(['历史']);
    expect(publishedArticles(tree)[0].data.books).toEqual(['一本书','另一本书']);
    expect(tree[2].data.cover).toBe('/review.webp');
  });
  it('excludes a draft subtree but preserves public siblings',()=>{
    const tree=resolveDirectories([node('musings','private/index.md',{draft:true}),node('musings','private/deep/a.md',{date:new Date(),published:true}),node('musings','public/b.md',{date:new Date()})]);
    expect(publishedArticles(tree).map(e=>e.id)).toEqual(['public/b.md']);
  });
  it('keeps an explicit slug stable when directories change; rejects missing dates and collisions',()=>{
    const date=new Date();
    expect(publishedArticles([node('blog','a/b/note.md',{date,slug:'stable'})])[0].data.slug).toBe('stable');
    expect(()=>publishedArticles([node('blog','a.md')])).toThrow('date');
    expect(()=>publishedArticles([node('blog','a.md',{date,slug:'same'}),node('blog','b.md',{date,slug:'same'})])).toThrow('重复文章地址');
    expect(()=>resolveDirectories([node('reading','book.md',{kind:'book'})])).toThrow('index.md');
  });
  it('detects duplicate source slugs before the Astro store can overwrite files',()=>{
    const root=mkdtempSync(join(tmpdir(),'content-directory-test-'));
    try{
      for(const dir of ['blog','research','reading','musings'])mkdirSync(join(root,dir));
      for(const filename of ['a.md','b.md'])writeFileSync(join(root,'blog',filename),'---\ntitle: article\nslug: same\ndate: 2026-09-09\n---\nBody');
      expect(()=>validateDirectorySources(root)).toThrow('重复文章 slug');
      writeFileSync(join(root,'blog','b.md'),'---\ntitle: article\nslug: other\ndate: 2026-09-09\n---\nBody');
      mkdirSync(join(root,'blog','same'));
      writeFileSync(join(root,'blog','same','index.md'),'---\ntitle: introduction\n---\nIntro');
      expect(()=>validateDirectorySources(root)).toThrow('slug');
    }finally{rmSync(root,{recursive:true,force:true});}
  });
});
