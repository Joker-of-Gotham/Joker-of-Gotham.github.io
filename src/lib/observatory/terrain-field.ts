import type { Vec3Tuple } from "./types";

export type TerrainRegion = "ridge" | "crater" | "canyon" | "path" | "platform";

export interface TerrainRegionWeights {
  ridge: number;
  crater: number;
  canyon: number;
  path: number;
  platform: number;
}

export interface TerrainFieldSample {
  height: number;
  normal: Vec3Tuple;
  regions: TerrainRegionWeights;
  buildable: number;
}

export interface TerrainField {
  readonly width: number;
  readonly depth: number;
  readonly centerZ: number;
  sampleHeight(x: number, z: number): number;
  sampleSurface(x: number, z: number): { height: number; regions: TerrainRegionWeights };
  sample(x: number, z: number): TerrainFieldSample;
}

export interface TerrainPlatform {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
}

export const OBSERVATORY_LANDMARK_PLATFORMS: readonly TerrainPlatform[] = [
  { id: "signal-gate", x: 0, z: -8, radius: 18, height: 1.5 },
  { id: "dish-array", x: -11, z: -66, radius: 24, height: 2.2 },
  { id: "orbital-yard", x: 21, z: -137, radius: 27, height: 3.8 },
  { id: "observatory-city", x: 27, z: -198, radius: 30, height: 2.8 },
  { id: "relay-canyon", x: -20, z: -276, radius: 17, height: -0.8 },
  { id: "afterlight-archive", x: 0, z: -352, radius: 30, height: 5.6 }
] as const;

const CRATERS = [
  [-54, -32, 17, 7],
  [42, -58, 12, 4.5],
  [-58, -116, 24, 8],
  [63, -166, 20, 7],
  [-52, -209, 15, 5],
  [48, -255, 25, 8.5],
  [-56, -324, 22, 7],
  [56, -373, 19, 6]
] as const;

const ROUTE_PATH = [
  [0, 24],
  [-13, -34],
  [17, -91],
  [31, -149],
  [2, -210],
  [-27, -271],
  [-8, -329],
  [16, -378]
] as const;

const CANYON_PATH = [
  [8, -219],
  [-20, -245],
  [-31, -274],
  [-12, -302],
  [17, -324]
] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth01 = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hash2(x: number, z: number): number {
  let state = Math.imul(x | 0, 0x1f123bb5) ^ Math.imul(z | 0, 0x5f356495) ^ 0x4c554e41;
  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
  return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296;
}

function valueNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = smooth01(x - x0);
  const tz = smooth01(z - z0);
  const a = lerp(hash2(x0, z0), hash2(x0 + 1, z0), tx);
  const b = lerp(hash2(x0, z0 + 1), hash2(x0 + 1, z0 + 1), tx);
  return lerp(a, b, tz) * 2 - 1;
}

function ridgedFbm(x: number, z: number): number {
  let frequency = 0.032;
  let amplitude = 1;
  let value = 0;
  let normalization = 0;
  for (let octave = 0; octave < 5; octave += 1) {
    const noise = valueNoise(x * frequency, z * frequency);
    const ridge = 1 - Math.abs(noise);
    value += ridge * ridge * amplitude;
    normalization += amplitude;
    frequency *= 2.06;
    amplitude *= 0.5;
  }
  return value / normalization;
}

function distanceToSegment(
  x: number,
  z: number,
  start: readonly [number, number],
  end: readonly [number, number]
): number {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return Math.hypot(x - start[0], z - start[1]);
  const t = clamp01(((x - start[0]) * dx + (z - start[1]) * dz) / lengthSquared);
  return Math.hypot(x - (start[0] + dx * t), z - (start[1] + dz * t));
}

function distanceToPolyline(x: number, z: number, points: readonly (readonly [number, number])[]): number {
  let distance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length - 1; index += 1) {
    distance = Math.min(distance, distanceToSegment(x, z, points[index], points[index + 1]));
  }
  return distance;
}

function evaluateHeightAndRegions(x: number, z: number): { height: number; regions: TerrainRegionWeights } {
  const ridgeNoise = ridgedFbm(x, z);
  let height = (ridgeNoise - 0.54) * 15 + valueNoise(x * 0.018 + 41, z * 0.018 - 17) * 2.8;
  let craterWeight = 0;

  for (const [craterX, craterZ, radius, depth] of CRATERS) {
    const normalized = Math.hypot(x - craterX, z - craterZ) / radius;
    if (normalized >= 1.28) continue;
    const bowl = normalized < 1 ? (1 - normalized * normalized) ** 2 * depth : 0;
    const rim = Math.exp(-((normalized - 1.02) ** 2) / 0.018) * depth * 0.34;
    height += rim - bowl;
    craterWeight = Math.max(craterWeight, 1 - clamp01(Math.abs(normalized - 0.62) / 0.7));
  }

  const canyonDistance = distanceToPolyline(x, z, CANYON_PATH);
  const canyonWeight = 1 - smooth01((canyonDistance - 5) / 28);
  const canyonCore = 1 - smooth01(canyonDistance / 18);
  const canyonRim = Math.exp(-((canyonDistance - 24) ** 2) / 45) * 3.4;
  height += canyonRim - canyonCore * 17;

  const pathDistance = distanceToPolyline(x, z, ROUTE_PATH);
  const pathWeight = 1 - smooth01((pathDistance - 2.4) / 8.5);
  const pathTarget = 0.8 + ridgedFbm(x * 0.35 + 9, z * 0.35) * 1.4;
  height = lerp(height, pathTarget, pathWeight * 0.7);

  let platformWeight = 0;
  let platformHeight = height;
  for (const platform of OBSERVATORY_LANDMARK_PLATFORMS) {
    const distance = Math.hypot(x - platform.x, z - platform.z);
    const weight = 1 - smooth01((distance - platform.radius * 0.58) / (platform.radius * 0.42));
    if (weight > platformWeight) {
      platformWeight = weight;
      platformHeight = platform.height;
    }
  }
  height = lerp(height, platformHeight, platformWeight * 0.92);

  return {
    height,
    regions: {
      ridge: clamp01((ridgeNoise - 0.42) / 0.45),
      crater: clamp01(craterWeight),
      canyon: clamp01(canyonWeight),
      path: clamp01(pathWeight),
      platform: clamp01(platformWeight)
    }
  };
}

export function createObservatoryTerrainField(): TerrainField {
  const sampleHeight = (x: number, z: number) => evaluateHeightAndRegions(x, z).height;
  return {
    width: 240,
    depth: 470,
    centerZ: -190,
    sampleHeight,
    sampleSurface: evaluateHeightAndRegions,
    sample(x, z) {
      const evaluated = evaluateHeightAndRegions(x, z);
      const epsilon = 0.75;
      const left = sampleHeight(x - epsilon, z);
      const right = sampleHeight(x + epsilon, z);
      const near = sampleHeight(x, z + epsilon);
      const far = sampleHeight(x, z - epsilon);
      const nx = left - right;
      const ny = epsilon * 2;
      const nz = far - near;
      const length = Math.hypot(nx, ny, nz) || 1;
      return {
        ...evaluated,
        normal: [nx / length, ny / length, nz / length],
        buildable: clamp01(Math.max(evaluated.regions.path, evaluated.regions.platform) - evaluated.regions.canyon * 0.65)
      };
    }
  };
}
