type MarkdownNode = {
  type: string;
  depth?: number;
  children?: MarkdownNode[];
};

function normalizeHeadings(node: MarkdownNode) {
  // Detail-page chrome owns the document H1. Preserve the source Markdown while
  // rendering any author-level H1 as a section heading beneath that page title.
  if (node.type === "heading" && node.depth === 1) node.depth = 2;
  node.children?.forEach(normalizeHeadings);
}

export default function remarkNormalizeDocumentHeadings() {
  return (tree: MarkdownNode) => normalizeHeadings(tree);
}
