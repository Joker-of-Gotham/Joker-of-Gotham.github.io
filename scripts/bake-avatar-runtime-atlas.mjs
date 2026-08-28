import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const assetRoot = resolve(root, "public/assets/img/observatory");
const columns = 4;
const rows = 2;
const outlineRadius = 3;
const outlineOpacity = 0.62;

const specifications = [
  {
    theme: "dark",
    input: "signal-guide-dark-poses.webp",
    output: "signal-guide-dark-poses-runtime.webp",
    outline: [148, 125, 245]
  },
  {
    theme: "light",
    input: "signal-guide-light-poses.webp",
    output: "signal-guide-light-poses-runtime.webp",
    outline: [82, 72, 148]
  }
];

const assets = [];
for (const specification of specifications) assets.push(await bakeRuntimeAtlas(specification));

await writeFile(
  resolve(assetRoot, "pose-runtime-manifest.json"),
  `${JSON.stringify({
    generatedAt: "2026-08-28",
    method: "cell-bounded separable alpha dilation and source-over rim composite",
    columns,
    rows,
    outlineRadius,
    outlineOpacity,
    assets
  }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(assets, null, 2));

async function bakeRuntimeAtlas(specification) {
  const inputPath = resolve(assetRoot, specification.input);
  const outputPath = resolve(assetRoot, specification.output);
  const sourceBytes = await readFile(inputPath);
  const image = sharp(sourceBytes, { failOn: "error" }).ensureAlpha();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width % columns || metadata.height % rows) {
    throw new Error(`${specification.input} must be a divisible 4x2 atlas`);
  }

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const outlined = bakeCellBoundedOutline(
    data,
    info.width,
    info.height,
    specification.outline
  );
  await sharp(outlined, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .webp({ quality: 92, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  const outputBytes = await readFile(outputPath);
  const outputMetadata = await sharp(outputBytes).metadata();
  if (!outputMetadata.hasAlpha) throw new Error(`${specification.output} lost its alpha channel`);

  return {
    theme: specification.theme,
    source: `/assets/img/observatory/${specification.input}`,
    sourceSha256: sha256(sourceBytes),
    output: `/assets/img/observatory/${specification.output}`,
    width: outputMetadata.width,
    height: outputMetadata.height,
    bytes: outputBytes.length,
    sha256: sha256(outputBytes),
    outlineRgb: specification.outline
  };
}

function bakeCellBoundedOutline(source, width, height, outlineRgb) {
  const output = Buffer.from(source);
  const horizontal = new Uint8Array(width * height);
  const dilated = new Uint8Array(width * height);
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  for (let row = 0; row < rows; row += 1) {
    const top = row * cellHeight;
    const bottom = top + cellHeight;
    for (let column = 0; column < columns; column += 1) {
      const left = column * cellWidth;
      const right = left + cellWidth;

      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          let maximum = 0;
          for (let offset = -outlineRadius; offset <= outlineRadius; offset += 1) {
            const sampleX = x + offset;
            if (sampleX < left || sampleX >= right) continue;
            maximum = Math.max(maximum, source[(y * width + sampleX) * 4 + 3]);
          }
          horizontal[y * width + x] = maximum;
        }
      }

      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          let maximum = 0;
          for (let offset = -outlineRadius; offset <= outlineRadius; offset += 1) {
            const sampleY = y + offset;
            if (sampleY < top || sampleY >= bottom) continue;
            maximum = Math.max(maximum, horizontal[sampleY * width + x]);
          }
          dilated[y * width + x] = maximum;
        }
      }
    }
  }

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    const sourceAlpha = source[offset + 3] / 255;
    const expandedAlpha = dilated[pixel] / 255;
    const rimAlpha = Math.max(0, expandedAlpha - sourceAlpha) * outlineOpacity;
    if (rimAlpha <= 0.001) continue;

    const outputAlpha = sourceAlpha + rimAlpha * (1 - sourceAlpha);
    const rimContribution = rimAlpha * (1 - sourceAlpha);
    for (let channel = 0; channel < 3; channel += 1) {
      const sourcePremultiplied = (source[offset + channel] / 255) * sourceAlpha;
      const rimPremultiplied = (outlineRgb[channel] / 255) * rimContribution;
      output[offset + channel] = Math.round(
        Math.max(0, Math.min(1, (sourcePremultiplied + rimPremultiplied) / outputAlpha)) * 255
      );
    }
    output[offset + 3] = Math.round(outputAlpha * 255);
  }

  return output;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
