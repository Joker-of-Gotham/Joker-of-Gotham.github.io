import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import sharp from "sharp";

const [darkInput, lightInput] = process.argv.slice(2);

if (!darkInput || !lightInput) {
  console.error(
    "Usage: node scripts/prepare-avatar-pose-atlas.mjs <dark-chroma-sheet> <light-chroma-sheet>"
  );
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const outputRoot = resolve(root, "public/assets/img/observatory");
const atlasWidth = 1536;
const atlasHeight = 1024;
const columns = 4;
const rows = 2;

await mkdir(outputRoot, { recursive: true });

const manifest = [];
manifest.push(
  await buildAtlas(darkInput, "signal-guide-dark-poses.webp", "dark"),
  await buildAtlas(lightInput, "signal-guide-light-poses.webp", "light")
);

await writeFile(
  resolve(outputRoot, "pose-atlas-manifest.json"),
  `${JSON.stringify({ generatedAt: "2026-08-28", columns, rows, poses: [
    "idle",
    "quarter-turn",
    "walk-profile",
    "back-look",
    "point-up",
    "present",
    "quick-turn",
    "settle"
  ], assets: manifest }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(manifest, null, 2));

async function buildAtlas(inputPath, outputName, theme) {
  const absoluteInput = resolve(inputPath);
  const sourceBytes = await readFile(absoluteInput);
  const source = sharp(sourceBytes, { failOn: "error" }).rotate().ensureAlpha();
  const metadata = await source.metadata();

  if (metadata.width !== atlasWidth || metadata.height !== atlasHeight) {
    throw new Error(
      `${basename(inputPath)} must be ${atlasWidth}x${atlasHeight}; received ${metadata.width}x${metadata.height}`
    );
  }

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

    const keyedAlpha = Math.round((sourceAlpha * keyAlpha) / 255);
    const normalizedMatte = Math.max(0, Math.min(1, (keyedAlpha - 72) / 136));
    const finalAlpha = Math.round(
      normalizedMatte * normalizedMatte * (3 - 2 * normalizedMatte) * 255
    );
    data[offset + 3] = finalAlpha;

    if (greenDominance > 4) {
      const edgeAllowance = Math.round(6 * (finalAlpha / 255));
      data[offset + 1] = Math.min(green, strongestNonGreen + edgeAllowance);
    }
  }

  const normalizedData = await normalizePoseComponents(data, info.width, info.height);
  const cells = describeCells(normalizedData, info.width, info.height);
  for (const cell of cells) {
    if (cell.opaquePixels < 900) {
      throw new Error(`${outputName} pose ${cell.index} contains too little opaque artwork`);
    }
  }

  const outputPath = resolve(outputRoot, outputName);
  await sharp(normalizedData, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .webp({ quality: 92, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  const outputBytes = await readFile(outputPath);
  const outputMetadata = await sharp(outputBytes).metadata();
  if (!outputMetadata.hasAlpha) {
    throw new Error(`${outputName} lost its alpha channel`);
  }

  return {
    output: `/assets/img/observatory/${outputName}`,
    theme,
    sourceFile: basename(inputPath),
    sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"),
    width: outputMetadata.width,
    height: outputMetadata.height,
    columns,
    rows,
    hasAlpha: true,
    bytes: outputBytes.length,
    sha256: createHash("sha256").update(outputBytes).digest("hex"),
    cells
  };
}

async function normalizePoseComponents(data, width, height) {
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const components = [];
  const alphaThreshold = 4;

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= alphaThreshold) continue;

    const queue = [start];
    const pixels = [];
    visited[start] = 1;
    let cursor = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let sumX = 0;
    let sumY = 0;

    while (cursor < queue.length) {
      const index = queue[cursor++];
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      sumX += x;
      sumY += y;

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x + 1 < width ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y + 1 < height ? index + width : -1
      ];
      for (const neighbor of neighbors) {
        if (
          neighbor >= 0 &&
          !visited[neighbor] &&
          data[neighbor * 4 + 3] > alphaThreshold
        ) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }

    const componentWidth = maxX - minX + 1;
    const componentHeight = maxY - minY + 1;
    if (pixels.length > 5000 && componentHeight > 280 && componentWidth < 360) {
      components.push({
        pixels,
        minX,
        minY,
        maxX,
        maxY,
        width: componentWidth,
        height: componentHeight,
        centerX: sumX / pixels.length,
        centerY: sumY / pixels.length
      });
    }
  }

  if (components.length !== columns * rows) {
    throw new Error(
      `Expected ${columns * rows} isolated character silhouettes; found ${components.length}`
    );
  }

  const byRow = [...components].sort((a, b) => a.centerY - b.centerY);
  const ordered = [
    ...byRow.slice(0, columns).sort((a, b) => a.centerX - b.centerX),
    ...byRow.slice(columns).sort((a, b) => a.centerX - b.centerX)
  ];
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const layers = [];

  for (const [index, component] of ordered.entries()) {
    const componentData = Buffer.alloc(component.width * component.height * 4);
    for (const sourceIndex of component.pixels) {
      const sourceX = sourceIndex % width;
      const sourceY = Math.floor(sourceIndex / width);
      const localIndex =
        ((sourceY - component.minY) * component.width + (sourceX - component.minX)) * 4;
      const sourceOffset = sourceIndex * 4;
      componentData[localIndex] = data[sourceOffset];
      componentData[localIndex + 1] = data[sourceOffset + 1];
      componentData[localIndex + 2] = data[sourceOffset + 2];
      componentData[localIndex + 3] = data[sourceOffset + 3];
    }

    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = Math.round(column * cellWidth + (cellWidth - component.width) / 2);
    const top = Math.round((row + 1) * cellHeight - component.height - 10);
    layers.push({
      input: componentData,
      raw: { width: component.width, height: component.height, channels: 4 },
      left,
      top
    });
  }

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(layers)
    .raw()
    .toBuffer();
}

function describeCells(data, width, height) {
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    let minX = cellWidth;
    let minY = cellHeight;
    let maxX = -1;
    let maxY = -1;
    let opaquePixels = 0;

    for (let localY = 0; localY < cellHeight; localY += 1) {
      const y = row * cellHeight + localY;
      for (let localX = 0; localX < cellWidth; localX += 1) {
        const x = column * cellWidth + localX;
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha <= 20) continue;
        opaquePixels += 1;
        minX = Math.min(minX, localX);
        minY = Math.min(minY, localY);
        maxX = Math.max(maxX, localX);
        maxY = Math.max(maxY, localY);
      }
    }

    return {
      index,
      opaquePixels,
      alphaBounds: [minX, minY, maxX, maxY]
    };
  });
}
