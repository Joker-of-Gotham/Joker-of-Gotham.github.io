import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createSeededRandom } from "./random";
import type { ObservatoryQualityProfile } from "./types";

export const SELENE_MOON_ROCK_ASSET =
  "models/moon-rock-01/moon-rock-01.gltf" as const;

export type SeleneNaturalAssetState =
  | "idle"
  | "loading"
  | "ready"
  | "partial"
  | "disposed";

export interface SeleneNaturalAssetLayer {
  group: THREE.Group;
  ready: Promise<void>;
  readonly state: SeleneNaturalAssetState;
  setQuality(quality: ObservatoryQualityProfile): void;
  dispose(): void;
}

interface SeleneNaturalAssetOptions {
  assetBaseUrl: string;
  material: THREE.Material;
  sampleHeight(x: number, z: number): number;
  signal?: AbortSignal;
}

interface GltfAccessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: "SCALAR" | "VEC2" | "VEC3";
}

interface GltfBufferView {
  byteOffset?: number;
  byteLength: number;
}

interface GltfPrimitive {
  attributes: { POSITION: number; NORMAL: number; TEXCOORD_0?: number };
  indices: number;
}

interface MoonRockGltf {
  accessors: GltfAccessor[];
  bufferViews: GltfBufferView[];
  buffers: Array<{ uri: string }>;
  meshes: Array<{ primitives: GltfPrimitive[] }>;
  nodes: Array<{ mesh: number; name?: string }>;
}

const ROCK_SEED = 0x4d4f4f4e;
const ROCK_COUNT = 36;
const LOW_ROCK_COUNT = 18;
const STANDARD_ROCK_COUNT = 30;
const LANDMARKS = [
  { x: 0, z: -14 },
  { x: -11, z: -72 },
  { x: 22, z: -151 },
  { x: 4, z: -224 },
  { x: -24, z: -296 },
  { x: 20, z: -397 },
] as const;

function resolveAssetUrl(baseUrl: string, relativePath: string) {
  return `${baseUrl.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

function componentLength(type: GltfAccessor["type"]) {
  if (type === "VEC3") return 3;
  if (type === "VEC2") return 2;
  return 1;
}

function readFloatAccessor(
  gltf: MoonRockGltf,
  buffer: ArrayBuffer,
  accessorIndex: number,
) {
  const accessor = gltf.accessors[accessorIndex];
  if (!accessor || accessor.componentType !== 5126) {
    throw new Error(`Unsupported moon-rock float accessor ${accessorIndex}`);
  }
  const view = gltf.bufferViews[accessor.bufferView];
  const byteOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return new Float32Array(
    new Float32Array(buffer, byteOffset, accessor.count * componentLength(accessor.type)),
  );
}

function readIndexAccessor(
  gltf: MoonRockGltf,
  buffer: ArrayBuffer,
  accessorIndex: number,
) {
  const accessor = gltf.accessors[accessorIndex];
  if (!accessor || accessor.componentType !== 5123) {
    throw new Error(`Unsupported moon-rock index accessor ${accessorIndex}`);
  }
  const view = gltf.bufferViews[accessor.bufferView];
  const byteOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return new Uint16Array(new Uint16Array(buffer, byteOffset, accessor.count));
}

function buildLodGeometry(gltf: MoonRockGltf, buffer: ArrayBuffer, lod: 2 | 3) {
  const node = gltf.nodes.find((candidate) => candidate.name?.endsWith(`LOD${lod}`));
  const primitive = node ? gltf.meshes[node.mesh]?.primitives[0] : undefined;
  if (!primitive) throw new Error(`Moon rock LOD${lod} is missing`);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(readFloatAccessor(gltf, buffer, primitive.attributes.POSITION), 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(readFloatAccessor(gltf, buffer, primitive.attributes.NORMAL), 3),
  );
  if (primitive.attributes.TEXCOORD_0 !== undefined) {
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(readFloatAccessor(gltf, buffer, primitive.attributes.TEXCOORD_0), 2),
    );
  }
  geometry.setIndex(new THREE.BufferAttribute(readIndexAccessor(gltf, buffer, primitive.indices), 1));
  return geometry;
}

function createMergedRockGeometry(
  gltf: MoonRockGltf,
  buffer: ArrayBuffer,
  sampleHeight: SeleneNaturalAssetOptions["sampleHeight"],
) {
  const lod2 = buildLodGeometry(gltf, buffer, 2);
  const lod3 = buildLodGeometry(gltf, buffer, 3);
  const shadowTemplate = new THREE.CircleGeometry(1, 14);
  const random = createSeededRandom(ROCK_SEED);
  const parts: THREE.BufferGeometry[] = [];
  const cumulativeIndexCounts: number[] = [];
  let indexCount = 0;

  // Round-robin landmark ordering means the low tier retains three authored
  // silhouettes beside every chapter, rather than filling only the first half.
  for (let slot = 0; slot < 6; slot += 1) {
    for (let landmarkIndex = 0; landmarkIndex < LANDMARKS.length; landmarkIndex += 1) {
      const placementIndex = slot * LANDMARKS.length + landmarkIndex;
      const landmark = LANDMARKS[landmarkIndex];
      const side = (slot + landmarkIndex) % 2 === 0 ? -1 : 1;
      // Keep the rocks close enough to the authored approach axis to read as
      // foreground/midground scale cues, but outside the eleven-unit route
      // shoulder so they never obstruct the camera path.
      const distance = 14 + random() * 10;
      const x = landmark.x + side * distance + (random() - 0.5) * 5;
      const z = landmark.z + (random() - 0.5) * 16;
      const scale = 15 + random() * 20;
      const shade = 0.8 + random() * 0.18;
      // The low tier keeps the first three placements at each landmark, so
      // give those silhouettes LOD2 and use LOD3 for the optional density.
      const source = placementIndex < LOW_ROCK_COUNT ? lod2 : lod3;
      const geometry = source.clone();
      const vertexCount = geometry.getAttribute("position").count;
      const colors = new Float32Array(vertexCount * 3);
      colors.fill(shade);
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const terrainHeight = sampleHeight(x, z);

      const matrix = new THREE.Matrix4().compose(
        // The source scan includes a small flat capture underside. Sink it
        // into the regolith so every boulder reads as accumulated terrain,
        // never as a detached object floating against the horizon.
        new THREE.Vector3(x, terrainHeight - scale * 0.024, z),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            (random() - 0.5) * 0.24,
            random() * Math.PI * 2,
            (random() - 0.5) * 0.2,
          ),
        ),
        new THREE.Vector3(
          scale * (0.82 + random() * 0.38),
          scale * (0.76 + random() * 0.48),
          scale * (0.84 + random() * 0.34),
        ),
      );
      geometry.applyMatrix4(matrix);

      // Low tiers intentionally disable real-time shadows. Merge a dark,
      // shallow contact patch into the same rock batch so the scan remains
      // visually attached to the regolith without another draw call.
      const contactShadow = shadowTemplate.clone();
      const shadowColors = new Float32Array(contactShadow.getAttribute("position").count * 3);
      shadowColors.fill(0.22);
      contactShadow.setAttribute("color", new THREE.BufferAttribute(shadowColors, 3));
      contactShadow.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, terrainHeight + 0.025, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI * 0.5, 0, 0)),
          new THREE.Vector3(scale * 0.115, scale * 0.068, 1),
        ),
      );
      const placement = mergeGeometries([contactShadow, geometry], false);
      contactShadow.dispose();
      geometry.dispose();
      if (!placement) throw new Error("Moon-rock placement merge failed");
      parts.push(placement);
      indexCount += placement.index?.count ?? 0;
      cumulativeIndexCounts.push(indexCount);
    }
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((geometry) => geometry.dispose());
  shadowTemplate.dispose();
  lod2.dispose();
  lod3.dispose();
  if (!merged) throw new Error("Moon-rock geometry merge failed");
  merged.computeBoundingSphere();
  merged.setDrawRange(0, cumulativeIndexCounts[ROCK_COUNT - 1]);
  return { geometry: merged, cumulativeIndexCounts };
}

function rockCountForQuality(quality: ObservatoryQualityProfile) {
  if (quality.tier === "poster") return 0;
  if (quality.tier === "low") return LOW_ROCK_COUNT;
  if (quality.tier === "standard") return STANDARD_ROCK_COUNT;
  return ROCK_COUNT;
}

export function createSeleneNaturalAssetLayer(
  quality: ObservatoryQualityProfile,
  options: SeleneNaturalAssetOptions,
): SeleneNaturalAssetLayer {
  const group = new THREE.Group();
  group.name = "SeleneNaturalAssetLayer";
  group.userData = {
    role: "cc0-photogrammetry-natural-detail",
    asset: "Poly Haven moon_rock_01",
    license: "CC0",
    batchCount: 1,
    maximumRockCount: ROCK_COUNT,
  };

  let currentQuality = quality;
  let state: SeleneNaturalAssetState = quality.tier === "poster" ? "idle" : "loading";
  let disposed = false;
  let mesh: THREE.Mesh | null = null;
  let cumulativeIndexCounts: number[] = [];
  const abortController = new AbortController();
  const handleExternalAbort = () => abortController.abort();
  options.signal?.addEventListener("abort", handleExternalAbort, { once: true });
  if (options.signal?.aborted) abortController.abort();

  const setQuality = (nextQuality: ObservatoryQualityProfile) => {
    currentQuality = nextQuality;
    if (!mesh) return;
    const count = rockCountForQuality(nextQuality);
    mesh.visible = count > 0;
    mesh.geometry.setDrawRange(0, count > 0 ? cumulativeIndexCounts[count - 1] : 0);
    mesh.userData.visibleRockCount = count;
  };

  const ready = (async () => {
    if (quality.tier === "poster") {
      state = "ready";
      return;
    }
    try {
      const gltfUrl = resolveAssetUrl(options.assetBaseUrl, SELENE_MOON_ROCK_ASSET);
      const gltfResponse = await fetch(gltfUrl, { signal: abortController.signal });
      if (!gltfResponse.ok) throw new Error(`Moon-rock glTF ${gltfResponse.status}`);
      const gltf = (await gltfResponse.json()) as MoonRockGltf;
      const gltfDirectory = gltfUrl.slice(0, gltfUrl.lastIndexOf("/"));
      const binUrl = resolveAssetUrl(gltfDirectory, gltf.buffers[0].uri);
      const binResponse = await fetch(binUrl, { signal: abortController.signal });
      if (!binResponse.ok) throw new Error(`Moon-rock binary ${binResponse.status}`);
      const buffer = await binResponse.arrayBuffer();
      if (disposed || abortController.signal.aborted) return;

      const batch = createMergedRockGeometry(gltf, buffer, options.sampleHeight);
      cumulativeIndexCounts = batch.cumulativeIndexCounts;
      mesh = new THREE.Mesh(batch.geometry, options.material);
      mesh.name = "BatchedCc0MoonRocks";
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.userData = {
        sourceAsset: "Poly Haven moon_rock_01",
        sourceLods: [2, 3],
        maximumRockCount: ROCK_COUNT,
        mergedDrawCalls: 1,
        qualityPolicy: "visible-and-index-draw-range-only",
      };
      group.add(mesh);
      setQuality(currentQuality);
      state = "ready";
    } catch (error) {
      if (!disposed) {
        state = "partial";
        group.userData.loadError = error instanceof Error ? error.message : String(error);
      }
    }
  })();

  return {
    group,
    ready,
    get state() {
      return state;
    },
    setQuality,
    dispose() {
      if (disposed) return;
      disposed = true;
      state = "disposed";
      abortController.abort();
      options.signal?.removeEventListener("abort", handleExternalAbort);
      if (mesh) {
        group.remove(mesh);
        mesh.geometry.dispose();
        mesh = null;
      }
      group.clear();
    },
  };
}
