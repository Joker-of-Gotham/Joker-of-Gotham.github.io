import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceRoot = resolve(
  projectRoot,
  "assets-src/observatory/chapter-guide-poses",
);
const outputRoot = resolve(projectRoot, "public/assets/img/observatory");
const manifestPath = resolve(
  outputRoot,
  "chapter-guide-pose-manifest.json",
);

const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 1800;
const POSES = [
  "present",
  "point-up",
  "walk-profile",
  "quick-turn",
  "back-look",
  "settle",
];
const THEMES = ["dark", "light"];

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (edge0, edge1, value) => {
  const normalized = clamp((value - edge0) / (edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
};

const median = (values) => {
  const ordered = values.toSorted((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? Math.round((ordered[middle - 1] + ordered[middle]) / 2)
    : ordered[middle];
};

const sha256 = async (path) =>
  createHash("sha256").update(await readFile(path)).digest("hex");

/**
 * Samples only green-dominant perimeter pixels. This follows small lighting
 * gradients in generated source images without learning any subject colour.
 */
function sampleScreenColour(data, width, height) {
  const red = [];
  const green = [];
  const blue = [];
  const band = Math.max(3, Math.round(Math.min(width, height) * 0.018));
  const stride = 3;

  const sample = (x, y) => {
    const offset = (y * width + x) * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    if (g < 80 || g - Math.max(r, b) < 28) return;
    red.push(r);
    green.push(g);
    blue.push(b);
  };

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < band; x += stride) sample(x, y);
    for (let x = width - band; x < width; x += stride) sample(x, y);
  }
  for (let x = band; x < width - band; x += stride) {
    for (let y = 0; y < band; y += stride) sample(x, y);
    for (let y = height - band; y < height; y += stride) sample(x, y);
  }

  if (red.length < 32) {
    throw new Error("Unable to sample a reliable green-screen perimeter.");
  }

  return {
    red: median(red),
    green: median(green),
    blue: median(blue),
    samples: red.length,
  };
}

/**
 * Produces a soft chroma matte from both screen-colour distance and relative
 * green dominance. The latter removes mixed green edge pixels; blue/cyan and
 * violet light particles have non-positive green dominance and stay opaque.
 */
function keyGreenScreen(sourceData, width, height, screen) {
  const data = Buffer.from(sourceData);
  let bluePurplePixels = 0;
  let retainedBluePurplePixels = 0;

  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const sourceAlpha = data[offset + 3] / 255;

    const redDistance = r - screen.red;
    const greenDistance = g - screen.green;
    const blueDistance = b - screen.blue;
    const colourDistance = Math.sqrt(
      redDistance * redDistance +
        greenDistance * greenDistance +
        blueDistance * blueDistance,
    );
    const greenDominance = g - Math.max(r, b);

    const distanceLikelihood = 1 - smoothstep(20, 142, colourDistance);
    const dominanceLikelihood =
      smoothstep(7, 55, greenDominance) * smoothstep(25, 90, g);
    const screenLikelihood = Math.max(
      distanceLikelihood,
      dominanceLikelihood,
    );
    const foregroundAlpha =
      sourceAlpha * (1 - smoothstep(0.08, 0.94, screenLikelihood));
    const finalAlpha = Math.round(clamp(foregroundAlpha) * 255);

    // Blue, cyan and violet details must not be mistaken for the green screen.
    const isBluePurple = b > 74 && b > r + 18 && greenDominance <= 10;
    if (isBluePurple) {
      bluePurplePixels += 1;
      if (finalAlpha >= 224) retainedBluePurplePixels += 1;
    }

    if (finalAlpha <= 3) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      continue;
    }

    // Suppress green spill only at translucent boundaries. Fully opaque
    // foreground pixels keep their original colour and illumination.
    const straightAlpha = finalAlpha / 255;
    const spill = Math.max(0, g - Math.max(r, b));
    if (spill > 3) {
      const edgeWeight = Math.max(
        1 - straightAlpha,
        smoothstep(3, 36, spill) * 0.94,
      );
      data[offset + 1] = Math.round(g - spill * clamp(edgeWeight));
    }
    data[offset + 3] = finalAlpha;
  }

  const bluePurpleRetention =
    bluePurplePixels === 0
      ? 1
      : retainedBluePurplePixels / bluePurplePixels;
  if (bluePurpleRetention < 0.985) {
    throw new Error(
      `Blue/purple detail retention fell below 98.5% (${(
        bluePurpleRetention * 100
      ).toFixed(2)}%).`,
    );
  }

  return {
    data,
    preservation: {
      bluePurplePixels,
      retainedBluePurplePixels,
      bluePurpleRetention: Number(bluePurpleRetention.toFixed(6)),
    },
  };
}

async function inspectOutput(outputPath) {
  const image = sharp(outputPath).ensureAlpha();
  const metadata = await image.metadata();
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = metadata.width * metadata.height;
  let transparentPixels = 0;
  let translucentPixels = 0;
  let opaquePixels = 0;
  let minimumAlpha = 255;
  let maximumAlpha = 0;

  for (let offset = 3; offset < data.length; offset += 4) {
    const alpha = data[offset];
    minimumAlpha = Math.min(minimumAlpha, alpha);
    maximumAlpha = Math.max(maximumAlpha, alpha);
    if (alpha === 0) transparentPixels += 1;
    else if (alpha === 255) opaquePixels += 1;
    else translucentPixels += 1;
  }

  if (
    metadata.width < 768 ||
    metadata.height < 1152 ||
    metadata.hasAlpha !== true ||
    minimumAlpha !== 0 ||
    maximumAlpha !== 255
  ) {
    throw new Error(
      `Invalid output ${outputPath}: ${metadata.width}x${metadata.height}, ` +
        `hasAlpha=${metadata.hasAlpha}, alpha=${minimumAlpha}-${maximumAlpha}.`,
    );
  }

  const alpha = {
    minimum: minimumAlpha,
    maximum: maximumAlpha,
    transparentPixels,
    translucentPixels,
    opaquePixels,
    transparentRatio: Number((transparentPixels / pixels).toFixed(6)),
    translucentRatio: Number((translucentPixels / pixels).toFixed(6)),
    opaqueRatio: Number((opaquePixels / pixels).toFixed(6)),
  };
  if (alpha.transparentRatio < 0.2 || alpha.opaqueRatio < 0.08) {
    throw new Error(
      `Suspicious matte in ${outputPath}: transparent=${alpha.transparentRatio}, ` +
        `opaque=${alpha.opaqueRatio}.`,
    );
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    colourSpace: metadata.space,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    alpha,
  };
}

async function processPose(theme, pose) {
  const fileName = `guide-pose-${theme}-${pose}`;
  const sourcePath = resolve(sourceRoot, `${fileName}.png`);
  const outputPath = resolve(outputRoot, `${fileName}.webp`);
  const sourceImage = sharp(sourcePath).ensureAlpha();
  const sourceMetadata = await sourceImage.metadata();
  const { data: sourceData, info } = await sourceImage
    .raw()
    .toBuffer({ resolveWithObject: true });
  const screen = sampleScreenColour(sourceData, info.width, info.height);
  const keyed = keyGreenScreen(sourceData, info.width, info.height, screen);

  await sharp(keyed.data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality: 92,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const sourceStats = await stat(sourcePath);
  const outputStats = await stat(outputPath);
  const outputInspection = await inspectOutput(outputPath);
  return {
    theme,
    pose,
    source: {
      path: `assets-src/observatory/chapter-guide-poses/${fileName}.png`,
      width: sourceMetadata.width,
      height: sourceMetadata.height,
      bytes: sourceStats.size,
      sha256: await sha256(sourcePath),
    },
    output: {
      path: `public/assets/img/observatory/${fileName}.webp`,
      publicPath: `/assets/img/observatory/${fileName}.webp`,
      bytes: outputStats.size,
      sha256: await sha256(outputPath),
      ...outputInspection,
    },
    processing: {
      sampledScreen: screen,
      preservation: keyed.preservation,
    },
  };
}

await mkdir(outputRoot, { recursive: true });

const entries = [];
for (const theme of THEMES) {
  for (const pose of POSES) {
    entries.push(await processPose(theme, pose));
  }
}

const assets = entries.map((entry) => ({
  theme: entry.theme,
  pose: entry.pose,
  source: entry.source.path,
  sourceSha256: entry.source.sha256,
  output: entry.output.publicPath,
  width: entry.output.width,
  height: entry.output.height,
  hasAlpha: entry.output.hasAlpha,
  bytes: entry.output.bytes,
  sha256: entry.output.sha256,
  sourceMetadata: {
    width: entry.source.width,
    height: entry.source.height,
    bytes: entry.source.bytes,
  },
  outputMetadata: {
    file: entry.output.path,
    format: entry.output.format,
    colourSpace: entry.output.colourSpace,
    channels: entry.output.channels,
    alpha: entry.output.alpha,
  },
  processing: entry.processing,
}));

const manifest = {
  schemaVersion: 1,
  generator: "scripts/prepare-chapter-guide-poses.mjs",
  processing: {
    output: {
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      format: "webp",
      quality: 92,
      alphaQuality: 100,
    },
    chromaKey:
      "Perimeter-sampled RGB distance + green-dominance soft matte with edge despill",
  },
  assets,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      outputs: entries.length,
      manifest: "public/assets/img/observatory/chapter-guide-pose-manifest.json",
      files: entries.map(({ theme, pose, output, processing }) => ({
        theme,
        pose,
        width: output.width,
        height: output.height,
        bytes: output.bytes,
        transparentRatio: output.alpha.transparentRatio,
        translucentRatio: output.alpha.translucentRatio,
        bluePurpleRetention: processing.preservation.bluePurpleRetention,
      })),
    },
    null,
    2,
  ),
);
