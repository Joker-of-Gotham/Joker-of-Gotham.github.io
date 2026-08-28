import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const sha256 = async (path: string) =>
  createHash("sha256").update(await readFile(path)).digest("hex");

describe("observatory production assets", () => {
  it.each([
    ["signal-guide-dark.png", "66148657b089cf3445957381f406cd10cb25fcfe822e2e0ebd6d1e545a91d1d7"],
    ["signal-guide-light.png", "fb4ee7db2bd895982a26167504b4ab627ce2919bf9389064a7008f2ba82d1eea"],
  ])("keeps %s as a true-alpha 1024 × 1536 master", async (filename, expectedHash) => {
    const path = resolve(root, "public/assets/img/observatory", filename);
    const metadata = await sharp(path).metadata();

    expect(metadata).toMatchObject({ width: 1024, height: 1536, hasAlpha: true });
    expect(await sha256(path)).toBe(expectedHash);
  });

  it("keeps the generated runtime manifest in sync with every listed file", async () => {
    const manifestPath = resolve(root, "public/assets/img/observatory/asset-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      assets: Array<{ output: string; bytes: number; sha256: string; width: number; height: number; hasAlpha: boolean }>;
    };

    expect(manifest.assets).toHaveLength(10);

    for (const asset of manifest.assets) {
      const path = resolve(root, "public", asset.output.replace(/^\/assets\//, "assets/"));
      const metadata = await sharp(path).metadata();
      expect((await stat(path)).size).toBe(asset.bytes);
      expect(await sha256(path)).toBe(asset.sha256);
      expect(metadata.width).toBe(asset.width);
      expect(metadata.height).toBe(asset.height);
      expect(metadata.hasAlpha).toBe(asset.hasAlpha);
    }
  });

  it("keeps both aligned eight-pose atlases and their hashes in sync", async () => {
    const manifestPath = resolve(root, "public/assets/img/observatory/pose-atlas-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      columns: number;
      rows: number;
      poses: string[];
      assets: Array<{
        output: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
        hasAlpha: boolean;
        cells: Array<{ opaquePixels: number; alphaBounds: [number, number, number, number] }>;
      }>;
    };

    expect(manifest).toMatchObject({
      columns: 4,
      rows: 2,
      poses: [
        "idle",
        "quarter-turn",
        "walk-profile",
        "back-look",
        "point-up",
        "present",
        "quick-turn",
        "settle",
      ],
    });
    expect(manifest.assets).toHaveLength(2);

    for (const asset of manifest.assets) {
      const path = resolve(root, "public", asset.output.replace(/^\/assets\//, "assets/"));
      const metadata = await sharp(path).metadata();
      expect(metadata).toMatchObject({ width: 1536, height: 1024, hasAlpha: true });
      expect((await stat(path)).size).toBe(asset.bytes);
      expect(await sha256(path)).toBe(asset.sha256);
      expect(asset.cells).toHaveLength(8);
      expect(asset.cells.every((cell) => cell.opaquePixels > 20_000)).toBe(true);
      expect(asset.cells.every((cell) => cell.alphaBounds[3] <= 501)).toBe(true);
    }
  });

  it("keeps the pre-outlined runtime atlases reproducible and alpha-safe", async () => {
    const manifestPath = resolve(root, "public/assets/img/observatory/pose-runtime-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      columns: number;
      rows: number;
      outlineRadius: number;
      assets: Array<{
        source: string;
        sourceSha256: string;
        output: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
      }>;
    };

    expect(manifest).toMatchObject({ columns: 4, rows: 2, outlineRadius: 3 });
    expect(manifest.assets).toHaveLength(2);
    for (const asset of manifest.assets) {
      const sourcePath = resolve(root, "public", asset.source.replace(/^\/assets\//, "assets/"));
      const outputPath = resolve(root, "public", asset.output.replace(/^\/assets\//, "assets/"));
      const metadata = await sharp(outputPath).metadata();
      expect(metadata).toMatchObject({ width: 1536, height: 1024, hasAlpha: true });
      expect(await sha256(sourcePath)).toBe(asset.sourceSha256);
      expect((await stat(outputPath)).size).toBe(asset.bytes);
      expect(await sha256(outputPath)).toBe(asset.sha256);
    }
  });

  it("keeps all twelve authored chapter guide cutouts transparent and reproducible", async () => {
    const manifestPath = resolve(root, "public/assets/img/observatory/chapter-guide-pose-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      assets: Array<{
        theme: "dark" | "light";
        pose: string;
        source: string;
        sourceSha256: string;
        output: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
        hasAlpha: boolean;
      }>;
    };

    expect(manifest.assets).toHaveLength(12);
    expect(new Set(manifest.assets.map((asset) => asset.theme))).toEqual(new Set(["dark", "light"]));
    expect(new Set(manifest.assets.map((asset) => asset.pose))).toEqual(
      new Set(["present", "point-up", "walk-profile", "quick-turn", "back-look", "settle"]),
    );

    for (const asset of manifest.assets) {
      const sourcePath = resolve(root, asset.source);
      const outputPath = resolve(root, "public", asset.output.replace(/^\/assets\//, "assets/"));
      const metadata = await sharp(outputPath).metadata();
      const stats = await sharp(outputPath).stats();
      const alpha = stats.channels[3];

      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(asset.width);
      expect(metadata.height).toBe(asset.height);
      expect(metadata.width).toBeGreaterThanOrEqual(768);
      expect(metadata.height).toBeGreaterThanOrEqual(1152);
      expect(metadata.hasAlpha).toBe(true);
      expect(asset.hasAlpha).toBe(true);
      expect(alpha?.min).toBe(0);
      expect(alpha?.max).toBe(255);
      expect(await sha256(sourcePath)).toBe(asset.sourceSha256);
      expect((await stat(outputPath)).size).toBe(asset.bytes);
      expect(await sha256(outputPath)).toBe(asset.sha256);
    }
  });

  it("keeps both cinematic world plates and their manifest in sync", async () => {
    const manifestPath = resolve(root, "public/assets/img/observatory/world-plate-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      assets: Array<{
        output: string;
        theme: "dark" | "light";
        sourceFile: string;
        sourceSha256: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
      }>;
    };

    expect(manifest.assets.map((asset) => asset.theme).sort()).toEqual(["dark", "light"]);

    for (const asset of manifest.assets) {
      const path = resolve(root, "public", asset.output.replace(/^\/assets\//, "assets/"));
      const metadata = await sharp(path).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(asset.width);
      expect(metadata.height).toBe(asset.height);
      expect(asset.width / asset.height).toBeCloseTo(2, 2);
      expect((await stat(path)).size).toBe(asset.bytes);
      expect(await sha256(path)).toBe(asset.sha256);
      expect(asset.sourceFile).toMatch(/^exec-[a-f0-9-]+\.png$/);
      expect(asset.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("keeps compact world plates in sync for mobile and static fallbacks", async () => {
    const manifestPath = resolve(root, "public/assets/img/observatory/world-plate-variant-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      assets: Array<{
        source: string;
        sourceSha256: string;
        output: string;
        bytes: number;
        sha256: string;
        width: number;
        height: number;
      }>;
    };

    expect(manifest.assets).toHaveLength(2);
    for (const asset of manifest.assets) {
      const sourcePath = resolve(root, "public", asset.source.replace(/^\/assets\//, "assets/"));
      const outputPath = resolve(root, "public", asset.output.replace(/^\/assets\//, "assets/"));
      const metadata = await sharp(outputPath).metadata();
      expect(metadata).toMatchObject({ format: "webp", width: 896, height: 448 });
      expect(await sha256(sourcePath)).toBe(asset.sourceSha256);
      expect((await stat(outputPath)).size).toBe(asset.bytes);
      expect(await sha256(outputPath)).toBe(asset.sha256);
    }
  });
});
