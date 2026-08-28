import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "public");
const coverRoot = path.join(publicRoot, "assets", "img", "covers");
const outputRoot = path.join(coverRoot, "generated");
const contentRoot = path.join(projectRoot, "src", "content");
const sourceManifestPath = path.join(projectRoot, "src", "data", "cover-manifest.json");
const publicManifestPath = path.join(outputRoot, "manifest.json");

const TARGETS = [
  { width: 640, quality: 78 },
  { width: 1280, quality: 82 }
];

const ADDITIONAL_FIRST_VIEW_ASSETS = ["/assets/img/observatory/signal-bocchi.webp"];
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"]);

const toPosixPath = (value) => value.split(path.sep).join("/");

const sha256File = async (filePath) => {
  const contents = await readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
};

const displayDimensions = (metadata) => {
  const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation ?? 1);
  return {
    width: swapsAxes ? metadata.height : metadata.width,
    height: swapsAxes ? metadata.width : metadata.height
  };
};

const walkFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
};

const readFrontmatterCoverPaths = async () => {
  const contentFiles = (await walkFiles(contentRoot)).filter((filePath) => [".md", ".mdx"].includes(path.extname(filePath).toLowerCase()));
  const coverPaths = new Set();

  for (const filePath of contentFiles) {
    const source = await readFile(filePath, "utf8");
    const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/u)?.[1];
    const rawCover = frontmatter?.match(/^cover:\s*(.+?)\s*$/mu)?.[1]?.trim();
    if (!rawCover) continue;

    const normalizedCover = rawCover.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, "$1$2");
    if (normalizedCover.startsWith("/")) coverPaths.add(normalizedCover);
  }

  return coverPaths;
};

const sourceUrlToAbsolutePath = (sourceUrl) => {
  const decodedUrl = decodeURIComponent(sourceUrl.split(/[?#]/u, 1)[0]);
  const relativePath = decodedUrl.replace(/^\/+/, "");
  const absolutePath = path.resolve(publicRoot, ...relativePath.split("/"));
  const relativeToPublic = path.relative(publicRoot, absolutePath);

  if (relativeToPublic.startsWith("..") || path.isAbsolute(relativeToPublic)) {
    throw new Error(`Cover source escapes public/: ${sourceUrl}`);
  }

  return absolutePath;
};

const sanitizeStem = (sourceUrl) => {
  const basename = path.posix.basename(sourceUrl).replace(/\.[^.]+$/u, "");
  const safeName = basename
    .normalize("NFC")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 72);
  return safeName || "cover";
};

const sourceGroup = (sourceUrl) => {
  if (sourceUrl.startsWith("/assets/img/covers/")) return "cover-directory";
  if (sourceUrl === "/assets/img/observatory/signal-bocchi.webp") return "about-first-view";
  return "frontmatter-cover";
};

const collectSources = async () => {
  const coverDirectoryFiles = (await readdir(coverRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => `/assets/img/covers/${entry.name}`);
  const frontmatterCovers = await readFrontmatterCoverPaths();
  return [...new Set([...coverDirectoryFiles, ...frontmatterCovers, ...ADDITIONAL_FIRST_VIEW_ASSETS])].sort((a, b) => a.localeCompare(b, "zh-CN"));
};

const cleanPreviousDerivatives = async () => {
  let previousManifest;
  try {
    previousManifest = JSON.parse(await readFile(publicManifestPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw new Error(`Unable to read the previous cover manifest: ${error instanceof Error ? error.message : String(error)}`);
  }

  const previousPaths = Object.values(previousManifest.entries ?? {})
    .flatMap((entry) => entry?.variants ?? [])
    .map((variant) => variant?.path)
    .filter((variantPath) => typeof variantPath === "string");

  for (const variantPath of previousPaths) {
    const absolutePath = sourceUrlToAbsolutePath(variantPath);
    const relativeToOutput = path.relative(outputRoot, absolutePath);
    const isGeneratedWebP = !relativeToOutput.startsWith("..") && !path.isAbsolute(relativeToOutput) && path.extname(absolutePath).toLowerCase() === ".webp";
    if (!isGeneratedWebP) {
      throw new Error(`Refusing to remove a path outside the generated cover directory: ${variantPath}`);
    }

    try {
      await unlink(absolutePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
};

const encodeSource = async (sourceUrl) => {
  const absoluteSourcePath = sourceUrlToAbsolutePath(sourceUrl);
  const sourceStats = await stat(absoluteSourcePath);
  const sourceSha256 = await sha256File(absoluteSourcePath);
  const sourceMetadata = await sharp(absoluteSourcePath, { failOn: "error" }).metadata();
  const dimensions = displayDimensions(sourceMetadata);

  if (!dimensions.width || !dimensions.height) {
    throw new Error(`Unable to determine cover dimensions: ${sourceUrl}`);
  }

  const sourceId = sourceSha256.slice(0, 10);
  const stem = sanitizeStem(sourceUrl);
  const variants = [];

  for (const target of TARGETS) {
    const outputName = `${stem}-${sourceId}-${target.width}w.webp`;
    const absoluteOutputPath = path.join(outputRoot, outputName);

    const result = await sharp(absoluteSourcePath, { failOn: "error" })
      .rotate()
      .resize({ width: target.width, withoutEnlargement: true, fit: "inside" })
      .webp({
        quality: target.quality,
        alphaQuality: 82,
        effort: 6,
        smartSubsample: true
      })
      .toFile(absoluteOutputPath);

    if (result.format !== "webp") {
      throw new Error(`Expected a WebP derivative for ${sourceUrl}, received ${result.format}`);
    }

    const outputStats = await stat(absoluteOutputPath);
    variants.push({
      targetWidth: target.width,
      width: result.width,
      height: result.height,
      bytes: outputStats.size,
      sha256: await sha256File(absoluteOutputPath),
      path: `/assets/img/covers/generated/${outputName}`
    });
  }

  return {
    group: sourceGroup(sourceUrl),
    source: {
      path: sourceUrl,
      format: sourceMetadata.format ?? "unknown",
      width: dimensions.width,
      height: dimensions.height,
      bytes: sourceStats.size,
      sha256: sourceSha256
    },
    variants
  };
};

const main = async () => {
  await mkdir(outputRoot, { recursive: true });
  await mkdir(path.dirname(sourceManifestPath), { recursive: true });
  await cleanPreviousDerivatives();

  const sourceUrls = await collectSources();
  const entries = {};

  for (const sourceUrl of sourceUrls) {
    const absoluteSourcePath = sourceUrlToAbsolutePath(sourceUrl);
    const extension = path.extname(absoluteSourcePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) continue;

    try {
      await stat(absoluteSourcePath);
    } catch {
      throw new Error(`Referenced cover source does not exist: ${sourceUrl}`);
    }

    entries[sourceUrl] = await encodeSource(sourceUrl);
  }

  const records = Object.values(entries);
  const coverDirectoryRecords = records.filter((entry) => entry.group === "cover-directory");
  const sumBytes = (values) => values.reduce((total, value) => total + value, 0);
  const manifest = {
    version: 1,
    generator: "scripts/prepare-cover-assets.mjs",
    settings: {
      format: "webp",
      effort: 6,
      targets: TARGETS
    },
    summary: {
      sourceCount: records.length,
      derivativeCount: records.reduce((count, entry) => count + entry.variants.length, 0),
      sourceBytes: sumBytes(records.map((entry) => entry.source.bytes)),
      derivativeBytes: sumBytes(records.flatMap((entry) => entry.variants.map((variant) => variant.bytes))),
      coverDirectorySourceCount: coverDirectoryRecords.length,
      coverDirectorySourceBytes: sumBytes(coverDirectoryRecords.map((entry) => entry.source.bytes)),
      coverDirectoryDerivativeBytes: sumBytes(coverDirectoryRecords.flatMap((entry) => entry.variants.map((variant) => variant.bytes)))
    },
    entries
  };

  const serializedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(sourceManifestPath, serializedManifest, "utf8");
  await writeFile(publicManifestPath, serializedManifest, "utf8");

  console.log(`Prepared ${manifest.summary.derivativeCount} derivatives from ${manifest.summary.sourceCount} sources.`);
  console.log(`Cover originals: ${manifest.summary.coverDirectorySourceBytes} bytes.`);
  console.log(`Cover derivatives: ${manifest.summary.coverDirectoryDerivativeBytes} bytes.`);
  console.log(`Manifest: ${toPosixPath(path.relative(projectRoot, sourceManifestPath))}`);
};

await main();
