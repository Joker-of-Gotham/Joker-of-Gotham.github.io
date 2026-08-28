import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const assetRoot = resolve(root, "public/assets/img/observatory");
const specifications = [
  ["dark", "observatory-world-dark.webp", "observatory-world-dark-compact.webp"],
  ["light", "observatory-world-light.webp", "observatory-world-light-compact.webp"]
];

const assets = [];
for (const [theme, inputName, outputName] of specifications) {
  const inputPath = resolve(assetRoot, inputName);
  const outputPath = resolve(assetRoot, outputName);
  const sourceBytes = await readFile(inputPath);
  const sourceMetadata = await sharp(sourceBytes, { failOn: "error" }).metadata();
  if (!sourceMetadata.width || !sourceMetadata.height) {
    throw new Error(`${inputName} has no readable dimensions`);
  }

  await sharp(sourceBytes)
    .resize({ width: 896, height: 448, fit: "cover", position: "centre" })
    .webp({ quality: 72, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  const outputBytes = await readFile(outputPath);
  const outputMetadata = await sharp(outputBytes).metadata();
  assets.push({
    theme,
    source: `/assets/img/observatory/${inputName}`,
    sourceSha256: sha256(sourceBytes),
    output: `/assets/img/observatory/${outputName}`,
    width: outputMetadata.width,
    height: outputMetadata.height,
    bytes: outputBytes.length,
    sha256: sha256(outputBytes)
  });
}

await writeFile(
  resolve(assetRoot, "world-plate-variant-manifest.json"),
  `${JSON.stringify({ generatedAt: "2026-08-28", purpose: "mobile, reduced-motion and Save-Data fallback", assets }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(assets, null, 2));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
