import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const article = '/blog/2026-08-14-agent-orchestration/';
const output = 'artifacts/tsukuyomi-v14-2026-09-08';

for (const theme of ['dark','light'] as const) test(`readable Mermaid and zoomable reading media — ${theme}`, async ({page}) => {
  test.setTimeout(90000);
  await mkdir(output,{recursive:true});
  await page.emulateMedia({colorScheme:theme});
  await page.goto(article);
  const diagram = page.locator('.mermaid-block').first();
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toHaveAttribute('data-diagram-ready','true',{timeout:30000});
  await expect(diagram).toHaveAttribute('data-diagram-theme',theme);
  const evidence = await diagram.evaluate(host => {
    const labels=[...host.querySelectorAll<SVGGraphicsElement>('.edgeLabel')].map(el=>({text:el.textContent,box:el.getBoundingClientRect().toJSON()}));
    const contrast=[...host.querySelectorAll('.node')].map(node=>({fill:getComputedStyle(node.querySelector('rect,polygon,circle,ellipse,path')!).fill, text:getComputedStyle(node.querySelector('text,.nodeLabel')!).fill}));
    return {labels,contrast};
  });
  const overlaps = evidence.labels.flatMap((a,i)=>evidence.labels.slice(i+1).filter(b=>Math.min(a.box.right,b.box.right)-Math.max(a.box.left,b.box.left)>2 && Math.min(a.box.bottom,b.box.bottom)-Math.max(a.box.top,b.box.top)>2).map(b=>[a.text,b.text]));
  expect(overlaps).toEqual([]);
  // The authored pastel nodes should have dark, high-contrast labels in either theme.
  expect(evidence.contrast.every(node=>node.text==='rgb(23, 18, 29)')).toBe(true);
  await writeFile(`${output}/mermaid-${theme}.json`,JSON.stringify(evidence,null,2));
  await page.screenshot({path:`${output}/article-${theme}.png`});
  const expand = diagram.getByRole('button',{name:'放大查看'});
  await expand.click();
  const viewer=page.getByRole('dialog',{name:'媒体放大查看'});
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('svg')).toBeVisible();
  const before=await viewer.locator('output').textContent();
  await viewer.getByRole('button',{name:'放大',exact:true}).click();
  expect(await viewer.locator('output').textContent()).not.toBe(before);
  const plane=viewer.locator('.media-viewer-plane');
  const transform=await plane.getAttribute('style');
  const stage=viewer.locator('.media-viewer-stage');
  const box=(await stage.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+30);await page.mouse.up();
  expect(await plane.getAttribute('style')).not.toBe(transform);
  await viewer.getByRole('button',{name:'适应窗口'}).click();
  await page.screenshot({path:`${output}/diagram-viewer-${theme}.png`});
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(expand).toBeFocused();
  const table=page.locator('.table-wrap').first();
  await table.scrollIntoViewIfNeeded();
  await table.getByRole('button',{name:'放大查看'}).click();
  await expect(viewer.locator('table')).toBeVisible();
  await page.keyboard.press('Escape');
  const image=page.locator('.content img').first();
  if(await image.count()) {
    await image.scrollIntoViewIfNeeded();await image.focus();await page.keyboard.press('Enter');
    await expect(viewer.locator('img')).toBeVisible();await page.keyboard.press('Escape');
  }
  await diagram.scrollIntoViewIfNeeded();
  await page.locator('[data-theme-toggle]').click();
  await expect(diagram).toHaveAttribute('data-diagram-theme',theme==='dark'?'light':'dark',{timeout:30000});
  const second=page.locator('.mermaid-block').nth(1);
  await second.scrollIntoViewIfNeeded();
  await expect(second).toHaveAttribute('data-diagram-ready','true',{timeout:30000});
});

test('mobile image and cover viewer, sidebar avatar and moon favicon',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(article);
  await page.getByRole('button',{name:'查看图片'}).click();
  const viewer=page.getByRole('dialog',{name:'媒体放大查看'});
  await expect(viewer.locator('img')).toBeVisible();
  await expect.poll(()=>viewer.locator('img').evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
  await page.keyboard.press('Escape');
  const img=page.locator('.content img').first();
  await img.scrollIntoViewIfNeeded();await img.click();
  await expect(viewer).toBeVisible();
  await viewer.getByRole('button',{name:'放大',exact:true}).click();
  await page.screenshot({path:`${output}/image-viewer-phone.png`});
  await page.keyboard.press('Escape');
  await expect(img).toBeFocused();
  await page.locator('#drawer-toggle').click();
  await expect(page.locator('.sidebar-avatar')).toHaveAttribute('src','/assets/img/observatory/komari-avatar-151602028.jpg');
  await expect.poll(()=>page.locator('.sidebar-avatar').evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth===460)).toBe(true);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','/favicon-moon.svg');
  await page.screenshot({path:`${output}/sidebar-phone.png`});
});

test('article direct load does not initialize WebGL; route cycles pause and retain one scene',async({page})=>{
  test.setTimeout(90000);
  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
  await page.goto(article);
  await expect(page.locator('[data-observatory-root]')).toHaveAttribute('data-scene-dormant','true');
  expect(requests.some(url=>/\/controller\.[\w-]+\.js/.test(url))).toBe(false);
  await page.locator('.site-nav a[href="/blog/"]').click();
  const root=page.locator('[data-observatory-root]');
  await expect(root).toHaveAttribute('data-render-state','ready',{timeout:20000});
  await root.locator('canvas').evaluate(canvas=>Reflect.set(window,'v14Canvas',canvas));
  const samples=[];
  for(let i=0;i<3;i++) {
    const start=Date.now();
    await page.locator('a.journal-lead').click();
    await expect(root).toHaveAttribute('data-scene-dormant','true');
    await expect(root).toHaveAttribute('data-animation-active','false');
    expect(await root.locator('canvas').evaluate(c=>c===Reflect.get(window,'v14Canvas'))).toBe(true);
    samples.push({cycle:i,articleArrivalMs:Date.now()-start});
    await page.goBack();
    await expect(root).toHaveAttribute('data-render-state','ready');
    await expect(root).toHaveAttribute('data-animation-active','true');
    expect(await root.locator('canvas').evaluate(c=>c===Reflect.get(window,'v14Canvas'))).toBe(true);
    await expect(page.locator('canvas[data-observatory-canvas]')).toHaveCount(1);
    expect(await root.getAttribute('data-scene-generation')).toBe('1');
  }
  await mkdir(output,{recursive:true});
  await writeFile(`${output}/navigation-cycles.json`,JSON.stringify(samples,null,2));
});
