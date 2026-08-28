import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceManifestPath = resolve(root, "src/data/cover-manifest.json");
const publicManifestPath = resolve(root, "public/assets/img/covers/generated/manifest.json");

const sha256 = async (filePath: string) =>
  createHash("sha256").update(await readFile(filePath)).digest("hex");

interface ManifestEntry {
  group: string;
  source: { path: string; bytes: number; sha256: string };
  variants: Array<{
    targetWidth: number;
    width: number;
    height: number;
    bytes: number;
    sha256: string;
    path: string;
  }>;
}

describe("responsive cover assets", () => {
  it("keeps the build-time and public manifests identical", async () => {
    expect(await readFile(sourceManifestPath, "utf8")).toBe(await readFile(publicManifestPath, "utf8"));
  });

  it("tracks every source and emits verified 640w/1280w WebP derivatives", async () => {
    const manifest = JSON.parse(await readFile(sourceManifestPath, "utf8")) as {
      summary: { coverDirectorySourceCount: number; sourceCount: number; derivativeCount: number };
      entries: Record<string, ManifestEntry>;
    };

    expect(manifest.summary.coverDirectorySourceCount).toBe(34);
    expect(manifest.summary.sourceCount).toBe(38);
    expect(manifest.summary.derivativeCount).toBe(76);

    for (const entry of Object.values(manifest.entries)) {
      expect(entry.variants.map((variant) => variant.targetWidth)).toEqual([640, 1280]);

      for (const variant of entry.variants) {
        const outputPath = resolve(root, "public", variant.path.replace(/^\/+/, ""));
        const metadata = await sharp(outputPath).metadata();
        expect(metadata.format).toBe("webp");
        expect(metadata.width).toBe(variant.width);
        expect(metadata.height).toBe(variant.height);
        expect((await stat(outputPath)).size).toBe(variant.bytes);
        expect(await sha256(outputPath)).toBe(variant.sha256);
        expect(variant.path).toContain(entry.source.sha256.slice(0, 10));
      }
    }
  });

  it("does not leave orphaned generated WebP files", async () => {
    const manifest = JSON.parse(await readFile(sourceManifestPath, "utf8")) as {
      entries: Record<string, ManifestEntry>;
    };
    const expected = new Set(
      Object.values(manifest.entries).flatMap((entry) => entry.variants.map((variant) => variant.path.split("/").at(-1)))
    );
    const generated = (await readdir(resolve(root, "public/assets/img/covers/generated")))
      .filter((filename) => filename.endsWith(".webp"));

    expect(new Set(generated)).toEqual(expected);
  });
});
