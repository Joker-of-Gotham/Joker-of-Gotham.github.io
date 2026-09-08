type MarkdownNode = {
  type: string;
  depth?: number;
  children?: MarkdownNode[];
};

function containsH1(node: MarkdownNode): boolean {
  return (node.type === "heading" && node.depth === 1) || Boolean(node.children?.some(containsH1));
}

function normalizeHeadings(node: MarkdownNode) {
  // Shift the complete outline together, preserving parent/child hierarchy.
  if (node.type === "heading" && node.depth) node.depth = Math.min(6, node.depth + 1);
  node.children?.forEach(normalizeHeadings);
}

export default function remarkNormalizeDocumentHeadings() {
  return (tree: MarkdownNode) => { if (containsH1(tree)) normalizeHeadings(tree); };
}
