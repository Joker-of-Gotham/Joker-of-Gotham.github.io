import { describe, expect, it } from "vitest";
import remarkNormalizeDocumentHeadings from "../../src/lib/markdown/remarkNormalizeDocumentHeadings";

describe("remarkNormalizeDocumentHeadings", () => {
  it("demotes authored H1 nodes without changing lower-level headings", () => {
    const tree = {
      type: "root",
      children: [
        { type: "heading", depth: 1, children: [{ type: "text" }] },
        { type: "heading", depth: 2, children: [{ type: "text" }] }
      ]
    };

    remarkNormalizeDocumentHeadings()(tree);

    expect(tree.children.map((node) => node.depth)).toEqual([2, 2]);
  });
});
