import { getCollection } from 'astro:content';
import { ancestors, directoryHref, isBook, isDirectoryIndex, isPublic, parentPath, resolveDirectories } from './directories';
import { bookHref } from './library-model';
export const directorySections = ['blog','research','reading','musings'] as const;
export type DirectorySection = typeof directorySections[number];
export async function getDirectories(section: DirectorySection) {
  const source = resolveDirectories(await getCollection(section)).filter(isPublic);
  const indexes = new Map(source.filter(isDirectoryIndex).map(e=>[parentPath(e.id),e]));
  const paths = [...new Set(source.flatMap(e=>ancestors(e.directory.path)))];
  const result=paths.map(path=>{
    const intro=indexes.get(path);
    const title=intro?.data.title ?? path.split('/').at(-1) ?? section;
    const namedPath=ancestors(path).filter(Boolean).map(p=>indexes.get(p)?.data.title ?? p.split('/').at(-1)).join('/');
    return {section,path,title,namedPath,intro,parent:path ? parentPath(path) : undefined,
      href: intro && isBook(intro) ? bookHref(title) : directoryHref(section,section==='research'?namedPath:path),
    };
  }).sort((a,b)=>(a.intro?.data.order ?? 0)-(b.intro?.data.order ?? 0) || a.title.localeCompare(b.title,'zh-CN'));
  const addresses=new Set<string>();
  for(const d of result){if(addresses.has(d.href))throw new Error(`重复目录地址 ${d.href}，请区分目录导读标题`);addresses.add(d.href);}
  return result;
}
