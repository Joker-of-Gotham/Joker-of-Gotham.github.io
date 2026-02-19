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

function findPreviousRenderableNode(children: MarkdownNode[], index: number) {
  for (let pointer = index - 1; pointer >= 0; pointer -= 1) {
    const candidate = children[pointer];
    if (candidate.type === "text" && (candidate.value ?? "").trim() === "") continue;
    if (isBlankParagraph(candidate)) continue;
    return candidate;
  }

  return null;
}

function processChildren(parent: MarkdownNode) {
  if (!Array.isArray(parent.children)) return;
  const { children } = parent;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    processChildren(child);

    if (child.type !== "paragraph") continue;
    const text = toText(child).trim();
    if (!text) continue;

    const markerOnly = text.match(markerOnlyPattern);
    if (markerOnly) {
      const target = findPreviousRenderableNode(children, index);
      if (target) {
        addClasses(target, parseClassNames(markerOnly[1]));
      }
      children.splice(index, 1);
      index -= 1;
      continue;
    }

    const markerTail = text.match(markerTailPattern);
    if (markerTail) {
      addClasses(child, parseClassNames(markerTail[1]));
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

    return true;
  });
}

export default function remarkLegacyCallout() {
  return (tree: MarkdownNode) => {
    processChildren(tree);
    cleanupMarkerTokens(tree);
  };
}
