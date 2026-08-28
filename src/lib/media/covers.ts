import coverManifestJson from "@/data/cover-manifest.json";

export interface CoverVariant {
  targetWidth: number;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  path: string;
}

export interface CoverRecord {
  source: {
    path: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    sha256: string;
  };
  variants: CoverVariant[];
}

interface CoverManifest {
  entries: Record<string, CoverRecord>;
}

const manifest = coverManifestJson as CoverManifest;

export const getResponsiveCover = (sourcePath: string) => {
  const record = manifest.entries[sourcePath];
  if (!record) return null;

  const variants = record.variants
    .slice()
    .sort((a, b) => a.width - b.width)
    .filter((variant, index, all) => index === all.findIndex((candidate) => candidate.width === variant.width));
  const fallback = variants[0];
  const largest = variants.at(-1);

  if (!fallback || !largest) return null;

  return {
    fallbackSrc: fallback.path,
    largestSrc: largest.path,
    srcset: variants.map((variant) => `${variant.path} ${variant.width}w`).join(", "),
    width: largest.width,
    height: largest.height,
    variants,
    source: record.source
  };
};
