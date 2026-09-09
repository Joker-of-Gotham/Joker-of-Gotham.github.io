import {readdirSync,readFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import matter from 'gray-matter';
import {slug as githubSlug} from 'github-slugger';
import {isArticle,resolveDirectories} from './directories';
/** Detect slug collisions before Astro's legacy loader can overwrite an entry. */
export function validateDirectorySources(contentRoot: string) {
  const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):/\.mdx?$/i.test(e.name)?[join(dir,e.name)]:[]);
  for(const collection of ['blog','research','reading','musings']){
    const base=join(contentRoot,collection);
    const source=walk(base).map(file=>({id:relative(base,file).replace(/\\/g,'/'),collection,data:matter(readFileSync(file,'utf8')).data}));
    const tree=resolveDirectories(source);
    const seen=new Map<string,string>();
    // Match Astro's legacy storage key, including index.md and drafts: an overwrite can happen before publication filtering.
    for(const entry of tree){
      const slug=entry.data.slug ?? entry.id.replace(/\.mdx?$/i,'').split('/').map(segment=>githubSlug(segment)).join('/').replace(/\/index$/,'');
      if(seen.has(slug))throw new Error(`${isArticle(entry)?'重复文章 slug':'重复目录标识'} ${slug}: ${collection}/${seen.get(slug)} 与 ${collection}/${entry.id}；请使用不同的 slug`);
      seen.set(slug,entry.id);
    }
  }
}
