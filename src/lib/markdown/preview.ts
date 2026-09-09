import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { decodeString } from 'micromark-util-decode-string';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

type Node = {
  type: string; value?: string; children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
};

// Complete emphasis, code and math are already parsed. Clean only text left
// behind by truncation, preserving deliberately escaped literal punctuation.
function cleanText(raw: string): string {
  const literals: string[] = [];
  let marker = '\uE000';
  while (raw.includes(marker)) marker += '\uE000';
  const protectedText = raw.replace(/\\[!-/:-@[-`{-~]|&(?:#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi, token => {
    literals.push(decodeString(token));
    return `${marker}${literals.length - 1}\uE001`;
  });
  const cleaned = protectedText
    .replace(/\{:\s*(?:\.[\w-]+\s*)+\}/g, '')
    .split('\n').filter(line => !/^\s*\|/.test(line) && !/^\s*\[[^\]]+\]:/.test(line)).join(' ')
    .replace(/<\/?[a-z][\w:-]*(?:\s[^>]*|\s*\/)?(?:>|$)/gi, '')
    .replace(/!\[[^\]\n]*(?:\](?:\([^)]*(?:\)|$)|\[[^\]]*(?:\]|$))?|$)/g, '')
    .replace(/\[([^\]]*)(?:\](?:\([^)]*(?:\)|$)|\[[^\]]*(?:\]|$))?|$)/g, '$1')
    // Complete inline math never passes here. Keep ordinary currency amounts.
    .replace(/\${2,}.*$|\$(?!\d[\d,.]*(?:\s|$)).*$/g, '')
    .replace(/\*+|~{2,}|`+|(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}])/gu, '');
  return cleaned.replace(new RegExp(`${marker}(\\d+)\uE001`, 'g'), (_, index) => literals[Number(index)]);
}

function remarkPreview() {
  return (tree: Node, file: { value: unknown }) => {
    const source = String(file.value);
    let remaining = 360;
    const raw = (node: Node) => source.slice(node.position?.start.offset, node.position?.end.offset);
    function inline(nodes: Node[]): Node[] {
      const result: Node[] = [];
      let discardTail = false;
      for (const node of nodes) {
        if (remaining <= 0 || discardTail) break;
        if (node.type === 'text') {
          const original = node.position ? raw(node) : node.value ?? '';
          // GFM can autolink a URL inside a cut-off image/link/HTML fragment.
          // Its following AST siblings still belong to that discarded fragment.
          discardTail = /!?\[[^\]]*\]\($|<\/?[a-z][\w:-]*(?:\s[^>]*)?$/i.test(original);
          let value = cleanText(original).replace(/\s+/g, ' ');
          if (Array.from(value).length > remaining) value = Array.from(value).slice(0, remaining).join('').trimEnd() + '…';
          remaining -= Array.from(value).length;
          if (value) result.push({ type: 'text', value });
        } else if (node.type === 'inlineCode' || node.type === 'inlineMath') {
          // remark-math accepts $$...$$ inline too; display syntax is excluded.
          if (node.type === 'inlineMath' && raw(node).startsWith('$$')) continue;
          remaining -= Array.from(node.value ?? '').length;
          result.push(node); // Never split an atomic formula or code span.
        } else if (['strong', 'emphasis', 'delete', 'link', 'linkReference'].includes(node.type)) {
          const children = inline(node.children ?? []);
          if (!children.length) continue;
          if (node.type === 'link' || node.type === 'linkReference') result.push(...children);
          else result.push({ ...node, children });
        } else if (node.type === 'break') {
          result.push({ type: 'text', value: ' ' });
        }
      }
      return result;
    }
    function blocks(nodes: Node[]): Node[] {
      const result: Node[] = [];
      for (const node of nodes) {
        if (remaining <= 0) break;
        let children: Node[] = [];
        if (node.type === 'paragraph' || node.type === 'heading') children = inline(node.children ?? []);
        else if (['blockquote', 'list', 'listItem'].includes(node.type)) children = blocks(node.children ?? []);
        // Skip tables, fenced/indented code, display math and HTML before taking
        // the text budget, so prose after a large omitted block still appears.
        if (!children.length) continue;
        if (result.length) result.push({ type: 'text', value: ' ' });
        result.push(...children);
      }
      return result;
    }
    const children = blocks(tree.children ?? []);
    tree.children = children.length ? [{ type: 'paragraph', children }] : [];
  };
}

function rehypePreview() {
  type Element = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: Element[] };
  return (tree: Element) => {
    const clean = (node: Element) => {
      if (node.properties) { delete node.properties.tabIndex; delete node.properties.tabindex; delete node.properties.id; }
      if (node.children) {
        node.children = node.children.filter(child => {
          const classes = child.properties?.className;
          // Invalid/truncated TeX must not become KaTeX's raw error output.
          return child.tagName !== 'input' && !(Array.isArray(classes) && classes.includes('katex-error'));
        });
        node.children.forEach(clean);
      }
    };
    clean(tree);
  };
}

const processor = createMarkdownProcessor({
  syntaxHighlight: false,
  remarkPlugins: [remarkMath, remarkPreview],
  rehypePlugins: [[rehypeKatex, { strict: 'ignore', trust: false, throwOnError: false }], rehypePreview],
});
const cache = new Map<string, Promise<{ html: string; text: string }>>();

// Frontmatter is the sole source; no body fallback, even for a missing summary.
export function renderPreview(summary = '') {
  // Leading indentation is meaningful Markdown (including indented code).
  const source = summary.replace(/\r\n?/g, '\n').trimEnd();
  if (!cache.has(source)) cache.set(source, (async () => {
    const { code: html } = await (await processor).render(source);
    const text = html.replace(/<[^>]*>/g, ' ').replace(/&#(x[\da-f]+|\d+);/gi, (_, value) => {
      const point = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value);
      return point <= 0x10ffff ? String.fromCodePoint(point) : '';
    }).replace(/&(?:amp|lt|gt|quot);/g, e => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"' }[e]!)).replace(/\s+/g, ' ').trim();
    return { html: text ? html : '', text };
  })());
  return cache.get(source)!;
}
