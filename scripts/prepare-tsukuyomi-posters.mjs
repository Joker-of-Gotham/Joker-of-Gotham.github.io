import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

// Inputs are world-only captures produced by tests/e2e/readme-captures.spec.ts.
// Reference photographs are never used as runtime background plates.
const source = resolve("artifacts/tsukuyomi-v14-2026-09-08");
const output = resolve("public/assets/img/observatory");
await mkdir(output, { recursive: true });
const manifest = [];
for (const [theme, desktop, portrait] of [["dark", "desktop", "phone"], ["light", "day", "phone-day"]]) {
  for (const [suffix, capture, width] of [["", desktop, 1440], ["-compact", desktop, 960], ["-portrait", portrait, 390]]) {
    const filename = `tsukuyomi-world-v14-${theme}${suffix}.webp`;
    const buffer = await sharp(resolve(source, `${capture}-world.png`)).resize({ width }).webp({ quality: 86, effort: 6 }).toBuffer();
    await writeFile(resolve(output, filename), buffer);
    manifest.push({ file: `/assets/img/observatory/${filename}`, bytes: buffer.length,
      sha256: createHash("sha256").update(buffer).digest("hex"), source: `${capture}-world.png` });
  }
}
await writeFile(resolve(source, "poster-manifest.json"), JSON.stringify(manifest, null, 2));
await writeFile(resolve("docs/research/tsukuyomi-poster-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
