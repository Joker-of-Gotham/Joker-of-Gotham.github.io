type Node = {
  type: string;
  children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
  data?: { hProperties?: Record<string, unknown> };
};

/** remark-math treats same-line $$...$$ as inlineMath. Honor display delimiters
 * everywhere, including lists, quotes and MDX, without touching code or $...$.
 */
export default function remarkDisplayMath() {
  return (tree: Node, file: { value: unknown }) => {
    const source = String(file.value);
    function visit(node: Node) {
      if (node.type === 'inlineMath' && node.position && source.slice(node.position.start.offset, node.position.end.offset).startsWith('$$')) {
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, className: ['language-math', 'math-display'] };
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
