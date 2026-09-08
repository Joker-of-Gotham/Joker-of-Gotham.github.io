import sharp from 'sharp';
import {mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='artifacts/tsukuyomi-v14-2026-09-08';
const output='docs/screenshots';
await mkdir(output,{recursive:true});
const manifest=[];
for(const name of ['home-dark','home-light','blog-light','roadmap-dark','artifacts-light','about-dark','diagram-viewer-dark','diagram-viewer-light','home-phone-dark']) {
  const data=await sharp(`${source}/${name}.png`).webp({quality:85,effort:6}).toBuffer();
  await writeFile(`${output}/${name}.webp`,data);
  manifest.push({file:`${name}.webp`,source:`${source}/${name}.png`,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
await writeFile(`${output}/manifest.json`,JSON.stringify({captured:'2026-09-08',baseURL:'http://127.0.0.1:4321',method:'Unmodified viewport screenshots from Playwright, encoded as WebP. No compositing or generated UI.',images:manifest},null,2));
console.log(`Prepared ${manifest.length} real screenshots.`);
