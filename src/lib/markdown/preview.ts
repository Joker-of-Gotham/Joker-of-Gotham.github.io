import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

type Node = { type: string; value?: string; lang?: string; children?: Node[] };

// Parse first, shorten text nodes second: math, emphasis and code remain balanced.
function remarkPreview() {
  return (tree: Node) => {
    let remaining = 360;
    function clean(nodes: Node[]): Node[] {
      const result: Node[] = [];
      for (const node of nodes) {
        if (remaining <= 0) break;
        if (['html','image','imageReference','definition','footnoteDefinition','footnoteReference','thematicBreak'].includes(node.type)) continue;
        if (node.type === 'code' && node.lang === 'mermaid') continue;
        if (node.type === 'link' || node.type === 'linkReference') { result.push(...clean(node.children ?? [])); continue; }
        if (node.type === 'heading') node.type = 'paragraph';
        if (node.children) node.children = clean(node.children);
        if (node.children && !node.children.length) continue;
        if (node.value) {
          const value = node.value;
          if (node.type === 'text' && value.length > remaining) node.value = value.slice(0,remaining).trimEnd() + '…';
          if (node.type === 'code' && value.length > remaining) node.value = value.slice(0,remaining).trimEnd() + '\n…';
          // Atomic math/inline code may finish beyond the soft text limit.
          remaining -= node.value.length;
        }
        result.push(node);
      }
      return result;
    }
    tree.children = clean(tree.children ?? []);
  };
}

function rehypePreview() {
  type Element = { type: string; tagName?: string; properties?: Record<string,unknown>; children?: Element[] };
  return (tree: Element) => {
    const clean = (node: Element) => {
      if (node.properties) { delete node.properties.tabIndex; delete node.properties.tabindex; delete node.properties.id; }
      if (node.children) { node.children = node.children.filter(child=>child.tagName !== 'input'); node.children.forEach(clean); }
    };
    clean(tree);
  };
}

const processor = createMarkdownProcessor({
  syntaxHighlight: 'shiki',
  shikiConfig: { themes: { light:'github-light', dark:'github-dark-default' }, defaultColor:false },
  remarkPlugins: [remarkMath, remarkPreview],
  rehypePlugins: [[rehypeKatex, { strict:'ignore', trust:false, throwOnError:false }], rehypePreview],
});
const cache = new Map<string, Promise<{html:string; text:string}>>();

// Frontmatter is the sole source of a preview. Formatting problems or an empty
// summary must never silently substitute the article's opening (or its code).
export function renderPreview(summary = '') {
  const source = summary.replace(/\r\n?/g,'\n').replace(/\{:\s*(?:\.[\w-]+\s*)+\}/g,'').trim();
  if (!cache.has(source)) cache.set(source, (async () => {
    const { code: html } = await (await processor).render(source);
    const text = html.replace(/<[^>]*>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(_,value)=>{
      const point = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1),16) : Number(value);
      return point <= 0x10ffff ? String.fromCodePoint(point) : '';
    }).replace(/&(?:amp|lt|gt|quot);/g,e=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"'}[e]!)).replace(/\s+/g,' ').trim();
    return { html, text };
  })());
  return cache.get(source)!;
}
