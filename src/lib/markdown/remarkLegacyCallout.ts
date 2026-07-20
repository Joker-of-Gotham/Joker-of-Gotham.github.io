type MarkdownNode = {
  type: string;
  value?: string;
  data?: {
    hProperties?: {
      className?: string[] | string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  children?: MarkdownNode[];
};

const markerOnlyPattern = /^\s*\{:\s*((?:\.[a-zA-Z0-9_-]+\s*)+)\}\s*$/;
const markerTailPattern = /\s*\{:\s*((?:\.[a-zA-Z0-9_-]+\s*)+)\}\s*$/;
const markerTokenPattern = /\{:\s*((?:\.[a-zA-Z0-9_-]+\s*)+)\}/g;
const markerIgnoredValueTypes = new Set(["code", "inlineCode", "math", "inlineMath"]);

function toText(node: MarkdownNode): string {
  if (typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map((child) => toText(child)).join("");
}

function parseClassNames(raw: string): string[] {
  return raw
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith(".") ? item.slice(1) : item))
    .filter(Boolean);
}

function addClasses(node: MarkdownNode, classNames: string[]) {
  if (classNames.length === 0) return;

  const data = (node.data ??= {});
  const hProperties = (data.hProperties ??= {});
  const existing = hProperties.className;
  const next = Array.isArray(existing)
    ? existing.map((item) => String(item))
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : [];

  if (!next.includes("callout")) next.push("callout");
  classNames.forEach((className) => {
    if (!next.includes(className)) next.push(className);
  });

  hProperties.className = next;
}

function stripMarkerTokens(node: MarkdownNode) {
  if (typeof node.value === "string") {
    node.value = node.value.replace(markerTokenPattern, "").replace(/\s{2,}/g, " ").trimEnd();
    return;
  }

  if (!Array.isArray(node.children)) return;
  node.children.forEach((child) => stripMarkerTokens(child));
}

function isBlankParagraph(node: MarkdownNode) {
  return node.type === "paragraph" && toText(node).trim() === "";
}

function isStandaloneMarkerNode(node: MarkdownNode) {
  if (!["paragraph", "code"].includes(node.type)) return false;
  return markerOnlyPattern.test(toText(node).trim());
}

function findPreviousRenderableNode(children: MarkdownNode[], index: number) {
  for (let pointer = index - 1; pointer >= 0; pointer -= 1) {
    const candidate = children[pointer];
    if (candidate.type === "text" && (candidate.value ?? "").trim() === "") continue;
    if (isBlankParagraph(candidate)) continue;
    return candidate;
  }

  return null;
}

// Walk the ancestor chain (root..parent, oldest first) and return the nearest blockquote.
// Used when a `{: .prompt-x }` marker is lazy-continued into a blockquote's inner paragraph
// or list — the class must land on the blockquote, not the inner paragraph/listItem.
function nearestBlockquoteAncestor(ancestors: MarkdownNode[]) {
  for (let pointer = ancestors.length - 1; pointer >= 0; pointer -= 1) {
    if (ancestors[pointer].type === "blockquote") return ancestors[pointer];
  }
  return null;
}

function processChildren(parent: MarkdownNode, ancestors: MarkdownNode[] = []) {
  if (!Array.isArray(parent.children)) return;
  const { children } = parent;
  const parentAncestors = [...ancestors, parent];

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    processChildren(child, parentAncestors);

    if (!["paragraph", "code"].includes(child.type)) continue;
    const text = toText(child).trim();
    if (!text) continue;

    const markerOnly = text.match(markerOnlyPattern);
    if (markerOnly) {
      // Prefer the nearest blockquote ancestor so the callout style applies to the
      // blockquote itself even when the marker was absorbed as lazy-continuation into
      // an inner paragraph or list item.
      const blockquote =
        parent.type === "blockquote" ? parent : nearestBlockquoteAncestor(parentAncestors);
      const target = blockquote
        ? blockquote
        : findPreviousRenderableNode(children, index) ?? (parent.type === "listItem" ? parent : null);
      if (target) {
        addClasses(target, parseClassNames(markerOnly[1]));
      }
      children.splice(index, 1);
      index -= 1;
      continue;
    }

    if (child.type !== "paragraph") continue;

    const markerTail = text.match(markerTailPattern);
    if (markerTail) {
      // Promote the class to the enclosing blockquote when the marker was lazy-continued
      // into the paragraph; otherwise keep the legacy behaviour of tagging the paragraph.
      const blockquote =
        parent.type === "blockquote" ? parent : nearestBlockquoteAncestor(parentAncestors);
      if (blockquote) {
        addClasses(blockquote, parseClassNames(markerTail[1]));
      } else {
        addClasses(child, parseClassNames(markerTail[1]));
      }
      stripMarkerTokens(child);
    }
  }
}

function cleanupMarkerTokens(node: MarkdownNode) {
  if (typeof node.value === "string" && !markerIgnoredValueTypes.has(node.type)) {
    node.value = node.value.replace(markerTokenPattern, "").replace(/\s{2,}/g, " ").trimEnd();
  }

  if (!Array.isArray(node.children)) return;
  node.children.forEach((child) => cleanupMarkerTokens(child));
  node.children = node.children.filter((child) => {
    if (child.type === "text") {
      return (child.value ?? "").trim().length > 0;
    }

    if (child.type === "paragraph") {
      return toText(child).trim().length > 0;
    }

    if (isStandaloneMarkerNode(child)) {
      return false;
    }

    return true;
  });
}

export default function remarkLegacyCallout() {
  return (tree: MarkdownNode) => {
    processChildren(tree);
    cleanupMarkerTokens(tree);
  };
}
