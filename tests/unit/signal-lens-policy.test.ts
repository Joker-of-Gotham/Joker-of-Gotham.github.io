import { describe, expect, it } from "vitest";
import { decideSignalLens } from "../../src/lib/observatory/signal-lens-policy";

describe("canvas-ui signal lens policy", () => {
  it("only enables the isolated lens for an explicit fine-pointer interaction", () => {
    expect(
      decideSignalLens({ reducedMotion: false, saveData: false, finePointer: true, webgl2: true }),
    ).toEqual({ enabled: true, reason: "interactive-fine-pointer" });
  });

  it.each([
    ["reduced-motion", { reducedMotion: true, saveData: false, finePointer: true, webgl2: true }],
    ["save-data", { reducedMotion: false, saveData: true, finePointer: true, webgl2: true }],
    ["coarse-pointer", { reducedMotion: false, saveData: false, finePointer: false, webgl2: true }],
    ["no-webgl2", { reducedMotion: false, saveData: false, finePointer: true, webgl2: false }],
  ] as const)("keeps the semantic image path for %s", (reason, context) => {
    expect(decideSignalLens(context)).toEqual({ enabled: false, reason });
  });
});
