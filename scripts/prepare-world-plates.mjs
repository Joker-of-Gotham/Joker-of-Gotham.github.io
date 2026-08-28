import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import sharp from "sharp";

const [darkInput, lightInput] = process.argv.slice(2);
if (!darkInput || !lightInput) {
  console.error("Usage: node scripts/prepare-world-plates.mjs <dark-source> <light-source>");
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const outputRoot = resolve(root, "public/assets/img/observatory");
await mkdir(outputRoot, { recursive: true });

const assets = [
  await preparePlate(darkInput, "observatory-world-dark.webp", "dark"),
  await preparePlate(lightInput, "observatory-world-light.webp", "light")
];

await writeFile(
  resolve(outputRoot, "world-plate-manifest.json"),
  `${JSON.stringify({ generatedAt: "2026-08-28", assets }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(assets, null, 2));

async function preparePlate(inputPath, outputName, theme) {
  const absoluteInput = resolve(inputPath);
  const sourceBytes = await readFile(absoluteInput);
  const sourceMetadata = await sharp(sourceBytes, { failOn: "error" }).metadata();
  if (!sourceMetadata.width || !sourceMetadata.height) {
    throw new Error(`${basename(inputPath)} has no readable dimensions`);
  }
  const ratio = sourceMetadata.width / sourceMetadata.height;
  if (ratio < 1.95 || ratio > 2.05) {
    throw new Error(`${basename(inputPath)} must be an approximately 2:1 cinematic plate`);
  }

  const outputPath = resolve(outputRoot, outputName);
  await sharp(sourceBytes)
    .rotate()
    .resize({ width: 1792, height: 896, fit: "cover", position: "centre", withoutEnlargement: true })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  const outputBytes = await readFile(outputPath);
  const outputMetadata = await sharp(outputBytes).metadata();
  return {
    output: `/assets/img/observatory/${outputName}`,
    theme,
    sourceFile: basename(inputPath),
    sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"),
    width: outputMetadata.width,
    height: outputMetadata.height,
    bytes: outputBytes.length,
    sha256: createHash("sha256").update(outputBytes).digest("hex")
  };
}
