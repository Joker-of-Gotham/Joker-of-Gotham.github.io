import sharp from "sharp";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/extract-chroma-key.mjs <input> <output>");
  process.exit(1);
}

const source = sharp(inputPath).ensureAlpha();
const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });

const opaqueThreshold = 10;
const transparentThreshold = 104;

for (let offset = 0; offset < data.length; offset += 4) {
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const sourceAlpha = data[offset + 3];
  const strongestNonGreen = Math.max(red, blue);
  const greenDominance = green - strongestNonGreen;

  let keyAlpha = 255;
  if (green > 56 && greenDominance > opaqueThreshold) {
    const normalized =
      (transparentThreshold - greenDominance) /
      (transparentThreshold - opaqueThreshold);
    keyAlpha = Math.round(Math.max(0, Math.min(1, normalized)) * 255);
  }

  const finalAlpha = Math.round((sourceAlpha * keyAlpha) / 255);
  data[offset + 3] = finalAlpha;

  if (greenDominance > 4) {
    const edgeAllowance = Math.round(6 * (finalAlpha / 255));
    data[offset + 1] = Math.min(green, strongestNonGreen + edgeAllowance);
  }
}

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4
  }
})
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(outputPath);

const metadata = await sharp(outputPath).metadata();
const stats = await sharp(outputPath).stats();
console.log(
  JSON.stringify({
    outputPath,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    opaque: stats.isOpaque,
    alphaRange: stats.channels[3]
      ? [stats.channels[3].min, stats.channels[3].max]
      : null
  })
);
