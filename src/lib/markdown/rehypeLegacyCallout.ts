import type { Element, Parent, Root, RootContent, Text } from "hast";

const markerPattern = /\{\:\s*\.([a-zA-Z0-9_-]+)\s*\}/g;
const skipTextTags = new Set(["code", "pre", "script", "style"]);

function isElementNode(node: RootContent): node is Element {
  return node.type === "element";
}

function isTextNode(node: RootContent): node is Text {
  return node.type === "text";
}

function nodeText(node: RootContent): string {
  if (isTextNode(node)) return node.value;
  if (!isElementNode(node)) return "";
  return node.children.map((child) => nodeText(child)).join("");
}

function addClasses(target: Element, classNames: string[]) {
  if (classNames.length === 0) return;

  const properties = target.properties ?? {};
  const existing = properties.className;
  const next = Array.isArray(existing)
    ? existing.map((item) => String(item))
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : [];

  if (!next.includes("callout")) next.push("callout");
  classNames.forEach((className) => {
    if (!next.includes(className)) {
      next.push(className);
    }
  });

  target.properties = {
    ...properties,
    className: next
  };
}

function nearestPreviousElement(children: RootContent[], index: number): Element | null {
  for (let i = index - 1; i >= 0; i -= 1) {
    const current = children[i];
    if (isElementNode(current)) return current;
    if (isTextNode(current) && current.value.trim() === "") continue;
    break;
  }
  return null;
}

function stripMarkersFromSubtree(node: RootContent): string[] {
  const matched: string[] = [];

  const walk = (current: RootContent, inSkippedTag = false) => {
    if (isTextNode(current)) {
      if (inSkippedTag) return;

      current.value = current.value.replace(markerPattern, (_raw, className: string) => {
        matched.push(className);
        return "";
      });
      return;
    }

    if (!isElementNode(current)) return;
    const nextSkipped = inSkippedTag || skipTextTags.has(current.tagName);
    current.children.forEach((child) => walk(child, nextSkipped));
  };

  walk(node);
  return matched;
}

function cleanWhitespaceNodes(parent: Parent) {
  parent.children = parent.children.filter((node) => !(isTextNode(node) && node.value.trim() === ""));
}

function processParent(parent: Parent) {
  parent.children.forEach((child) => {
    if (isElementNode(child)) {
      processParent(child as Parent);
    }
  });

  const children = [...parent.children];
  const parentElement = parent.type === "element" ? (parent as Element) : null;
  const parentIsBlockquote = parentElement?.tagName === "blockquote";

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (isTextNode(child)) {
      child.value = child.value.replace(markerPattern, "");
      continue;
    }

    if (!isElementNode(child)) continue;
    const markerClasses = stripMarkersFromSubtree(child);
    if (markerClasses.length === 0) continue;

    const markerOnlyNode = (child.tagName === "p" || child.tagName === "li") && nodeText(child).trim() === "";

    if (markerOnlyNode) {
      const previous = nearestPreviousElement(children, index);
      if (previous) {
        addClasses(previous, markerClasses);
      } else if (parentIsBlockquote && parentElement) {
        addClasses(parentElement, markerClasses);
      }

      children.splice(index, 1);
      index -= 1;
      continue;
    }

    if (parentIsBlockquote && parentElement) {
      addClasses(parentElement, markerClasses);
    } else {
      addClasses(child, markerClasses);
    }
  }

  parent.children = children;
  cleanWhitespaceNodes(parent);
}

export default function rehypeLegacyCallout() {
  return (tree: Root) => {
    processParent(tree as unknown as Parent);
  };
}
