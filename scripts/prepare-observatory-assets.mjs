import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const outputRoot = resolve(root, "public/assets/img/observatory");

const signals = [
  ["signal-bocchi.webp", "public/assets/img/heroes/孤独摇滚-波奇.webp"],
  ["signal-april.webp", "public/assets/img/heroes/四月是你的谎言-薰和有马.webp"],
  ["signal-gbc.webp", "public/assets/img/heroes/GBC-五人合照2.webp"],
  ["signal-komari.webp", "public/assets/img/heroes/败犬女主-小鞠知花.webp"],
  ["signal-kaguya.webp", "public/assets/img/heroes/超时空辉夜姬壁纸-二人合照3.webp"]
];

const avatars = [
  { outputName: "signal-guide-dark-sample.webp", sourceName: "public/assets/img/observatory/signal-guide-dark.png", width: 480, height: 720, quality: 88 },
  { outputName: "signal-guide-light-sample.webp", sourceName: "public/assets/img/observatory/signal-guide-light.png", width: 480, height: 720, quality: 88 },
  { outputName: "signal-guide-dark-poster.webp", sourceName: "public/assets/img/observatory/signal-guide-dark.png", width: 768, height: 1152, quality: 90 },
  { outputName: "signal-guide-light-poster.webp", sourceName: "public/assets/img/observatory/signal-guide-light.png", width: 768, height: 1152, quality: 90 }
];

await mkdir(outputRoot, { recursive: true });

const manifest = [];

for (const [outputName, sourceName] of signals) {
  const sourcePath = resolve(root, sourceName);
  const outputPath = resolve(outputRoot, outputName);
  await sharp(sourcePath)
    .rotate()
    .resize({ width: 1280, height: 800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 5, smartSubsample: true })
    .toFile(outputPath);
  manifest.push(await describe(outputName, sourceName, outputPath));
}

for (const { outputName, sourceName, width, height, quality } of avatars) {
  const sourcePath = resolve(root, sourceName);
  const outputPath = resolve(outputRoot, outputName);
  const sourceMeta = await sharp(sourcePath).metadata();
  if (!sourceMeta.hasAlpha) {
    throw new Error(`${sourceName} must contain a real alpha channel`);
  }

  await sharp(sourcePath)
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .webp({ quality, alphaQuality: 100, effort: 5 })
    .toFile(outputPath);
  manifest.push(await describe(outputName, sourceName, outputPath, true));
}

const profileSource = "public/assets/img/profile.png";
const profileOutput = "profile-avatar.webp";
await sharp(resolve(root, profileSource))
  .rotate()
  .resize({ width: 128, height: 128, fit: "cover", position: "centre", withoutEnlargement: true })
  .webp({ quality: 86, alphaQuality: 100, effort: 5 })
  .toFile(resolve(outputRoot, profileOutput));
manifest.push(await describe(profileOutput, profileSource, resolve(outputRoot, profileOutput)));

await writeFile(
  resolve(outputRoot, "asset-manifest.json"),
  `${JSON.stringify({ generatedAt: "2026-08-28", assets: manifest }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(manifest, null, 2));

async function describe(outputName, sourceName, outputPath, requireAlpha = false) {
  const metadata = await sharp(outputPath).metadata();
  if (metadata.format !== "webp") {
    throw new Error(`${outputName} is not a real WebP file`);
  }
  if (requireAlpha && !metadata.hasAlpha) {
    throw new Error(`${outputName} lost its alpha channel`);
  }

  const bytes = await readFile(outputPath);
  return {
    output: `/assets/img/observatory/${outputName}`,
    source: sourceName.replaceAll("\\", "/"),
    width: metadata.width,
    height: metadata.height,
    hasAlpha: Boolean(metadata.hasAlpha),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
}
