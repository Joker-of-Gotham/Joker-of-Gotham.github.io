import {mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

// Exercise the complete Astro loader and rest routes, then restore the production build.
const workspace=resolve('.');
const content=join(workspace,'src','content');
const probe='authoring-check-probe';
const roots=['research','reading','musings'].map(section=>join(content,section,probe));
for(const root of roots){assert.ok(root.startsWith(content+sep));assert.equal(existsSync(root),false,`Fixture path already exists: ${root}`);}
const write=(section,path,header,body='')=>{
  const file=resolve(content,section,probe,path);
  assert.ok(roots.some(root=>file.startsWith(root+sep)),'Fixture must stay inside its own directory');
  mkdirSync(resolve(file,'..'),{recursive:true});writeFileSync(file,`---\n${header}\n---\n${body}\n`);
};
const build=()=>{
  assert.ok(process.env.npm_execpath,'Run through npm run test:content');
  const result=spawnSync(process.execPath,[process.env.npm_execpath,'run','build'],{cwd:workspace,encoding:'utf8'});
  if(result.status!==0){process.stderr.write(result.stdout+result.stderr);throw Error('Astro build failed');}
};
const html=url=>readFileSync(join(workspace,'dist',decodeURIComponent(url),'index.html'),'utf8');
let failure;
try{
  let path='';
  for(let i=0;i<8;i++){
    write('research',path+'index.md',`title: d${i}\ntags: [inherited-probe]`,`导读 ${i} 正文。`);
    if(i<7)path+=`d${i+1}/`;
  }
  write('research',path+'note.md','title: Deep authoring verification\ndate: 2026-09-09','**深层正文** 与 $x^2$。');
  write('research',path+'reference.md','kind: reference\ntitle: Nested reference verification\nurl: https://example.org/nested-reference\nabstract: A fixture abstract.');
  write('research','hidden/index.md','title: Hidden subtree\ndraft: true');
  write('research','hidden/deep/secret.md','title: Hidden fixture must stay private\ndate: 2026-09-09\npublished: true');
  write('reading','index.md','title: 校验题材');
  write('reading','book/index.md','kind: book\ntitle: 目录写作校验书','书目介绍正文。');
  write('reading','book/chapter/deeper/index.md','title: 章节导读','子目录导读可见。');
  write('reading','book/chapter/deeper/review.md','title: Nested review verification\ndate: 2026-09-09','独立书评正文。');
  write('musings','life/travel/note.md','title: Nested musing verification\ndate: 2026-09-09','没有 slug 的杂谈。');
  build();
  const index=JSON.parse(readFileSync(join(workspace,'dist/search-index.json'),'utf8'));
  for(const title of ['Deep authoring verification','Nested review verification','Nested musing verification']){
    const entry=index.find(e=>e.title===title);assert.ok(entry,title);assert.ok(entry.url.includes(probe),entry.url);assert.ok(html(entry.url).includes(title));
  }
  const article=index.find(e=>e.title==='Deep authoring verification');
  assert.ok(article.tags.includes('inherited-probe'));
  assert.ok(article.tags.includes('d0/d1/d2/d3/d4/d5/d6/d7'));
  assert.ok(html(article.url).includes('class="katex"'));
  const topic='/research/topics/d0/d1/d2/d3/d4/d5/d6/d7/';
  assert.ok(html(topic).includes('导读 7 正文'));
  assert.ok(html(topic).includes('Nested reference verification'));
  const review=index.find(e=>e.title==='Nested review verification');
  assert.deepEqual(review.books,['目录写作校验书']);
  assert.ok(index.find(e=>e.kind==='book' && e.title==='目录写作校验书').tags.includes('校验题材'));
  assert.ok(html('/reading/topics/'+probe+'/book/chapter/deeper/').includes('子目录导读可见'));
  assert.ok(!index.some(e=>e.title==='Hidden fixture must stay private'));
  assert.ok(!existsSync(join(workspace,'dist/research/notes',probe,'hidden/deep/secret/index.html')));
  console.log('PASS: eight-level research, nested unslugged routes, reference cards, book inheritance, introductions and hidden subtrees.');
}catch(error){failure=error;}finally{
  for(const root of roots){const target=resolve(root);assert.ok(target.startsWith(content+sep) && target.endsWith(sep+probe));rmSync(target,{recursive:true,force:true});}
  build();
  console.log('Fixture directories removed; production build restored.');
}
if(failure)throw failure;
