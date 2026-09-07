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
  sampleSurface(
    x: number,
    z: number,
  ): { height: number; regions: TerrainRegionWeights };
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
  { id: "signal-gate", x: 0, z: -14, radius: 14, height: 1.35 },
  { id: "dish-array", x: -11, z: -72, radius: 21, height: 1.7 },
  { id: "orbital-yard", x: 22, z: -151, radius: 23, height: 2.65 },
  { id: "observatory-city", x: 4, z: -224, radius: 26, height: 1.95 },
  { id: "relay-canyon", x: -24, z: -296, radius: 15, height: -2.2 },
  { id: "afterlight-archive", x: 20, z: -397, radius: 27, height: 4.35 },
] as const;

// Small graded bridge landings connect districts without becoming landmark
// plinths. The first coordinate is also a long-standing public terrain probe.
const SELENE_TRANSITION_GRADES: readonly TerrainPlatform[] = [
  { id: "truss-forum-landing", x: 27, z: -198, radius: 11, height: 2.25 },
  { id: "forum-umbra-landing", x: -7, z: -253, radius: 9, height: 0.25 },
] as const;

const SELENE_GRADED_AREAS: readonly TerrainPlatform[] = [
  ...OBSERVATORY_LANDMARK_PLATFORMS,
  ...SELENE_TRANSITION_GRADES,
] as const;

const CRATERS = [
  [-54, -32, 17, 7],
  [42, -58, 12, 4.5],
  [-58, -116, 24, 8],
  [63, -166, 20, 7],
  [-52, -209, 15, 5],
  [48, -255, 25, 8.5],
  [-56, -324, 22, 7],
  [56, -373, 19, 6],
] as const;

/** Shared survey datum used by terrain, architecture and camera-adjacent infrastructure. */
export const SELENE_MERIDIAN_ROUTE = [
  [0, 24],
  [-13, -34],
  [17, -91],
  [31, -149],
  [2, -210],
  [-27, -271],
  [-8, -329],
  [20, -397],
  [30, -424],
] as const;

const ROUTE_ELEVATIONS = [
  1.1, 1.25, 1.65, 2.5, 1.7, -1.45, 0.65, 4.2, 4.7,
] as const;

const CANYON_PATH = [
  [8, -219],
  [-20, -245],
  [-31, -274],
  [-12, -302],
  [17, -324],
] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth01 = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hash2(x: number, z: number): number {
  let state =
    Math.imul(x | 0, 0x1f123bb5) ^ Math.imul(z | 0, 0x5f356495) ^ 0x4c554e41;
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
  end: readonly [number, number],
): number {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return Math.hypot(x - start[0], z - start[1]);
  const t = clamp01(
    ((x - start[0]) * dx + (z - start[1]) * dz) / lengthSquared,
  );
  return Math.hypot(x - (start[0] + dx * t), z - (start[1] + dz * t));
}

function distanceToPolyline(
  x: number,
  z: number,
  points: readonly (readonly [number, number])[],
): number {
  let distance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length - 1; index += 1) {
    distance = Math.min(
      distance,
      distanceToSegment(x, z, points[index], points[index + 1]),
    );
  }
  return distance;
}

function closestPointOnPolyline(
  x: number,
  z: number,
  points: readonly (readonly [number, number])[],
) {
  let distance = Number.POSITIVE_INFINITY;
  let segmentIndex = 0;
  let segmentProgress = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const lengthSquared = dx * dx + dz * dz;
    const progress =
      lengthSquared === 0
        ? 0
        : clamp01(((x - start[0]) * dx + (z - start[1]) * dz) / lengthSquared);
    const pointX = start[0] + dx * progress;
    const pointZ = start[1] + dz * progress;
    const nextDistance = Math.hypot(x - pointX, z - pointZ);
    if (nextDistance < distance) {
      distance = nextDistance;
      segmentIndex = index;
      segmentProgress = progress;
    }
  }
  return { distance, segmentIndex, segmentProgress };
}

function evaluateHeightAndRegions(
  x: number,
  z: number,
): { height: number; regions: TerrainRegionWeights } {
  // Domain warping breaks the characteristic "stacked noise islands" look.
  // The same deterministic field is sampled by the terrain mesh, route,
  // campus and atmosphere, so every prop continues to sit on one datum.
  const warpX = valueNoise(x * 0.013 + 31, z * 0.013 - 23) * 17;
  const warpZ = valueNoise(x * 0.013 - 47, z * 0.013 + 19) * 17;
  const warpedX = x + warpX;
  const warpedZ = z + warpZ;
  const ridgeNoise = ridgedFbm(warpedX, warpedZ);
  const broadUndulation = valueNoise(warpedX * 0.012 + 41, warpedZ * 0.012 - 17);
  const regolithRelief =
    valueNoise(warpedX * 0.072 + 9, warpedZ * 0.072 - 6) * 0.42 +
    valueNoise(warpedX * 0.15 - 21, warpedZ * 0.15 + 12) * 0.16;
  const route = closestPointOnPolyline(x, z, SELENE_MERIDIAN_ROUTE);
  const riftDistance = route.distance;
  const routeElevation = lerp(
    ROUTE_ELEVATIONS[route.segmentIndex],
    ROUTE_ELEVATIONS[
      Math.min(ROUTE_ELEVATIONS.length - 1, route.segmentIndex + 1)
    ],
    smooth01(route.segmentProgress),
  );

  // The entire experience occupies one eroded rift. Its floor stays coherent
  // around the survey datum while the two outer walls rise gradually instead
  // of producing isolated mountain slabs between chapter platforms.
  const floorNoise =
    (ridgeNoise - 0.58) * 3.25 +
    broadUndulation * 1.45 +
    regolithRelief;
  const wallProgress = smooth01((riftDistance - 28) / 70);
  const asymmetricWall = x < 0 ? 1.08 : 0.86;
  const strata =
    Math.sin((warpedZ + warpedX * 0.32) * 0.052) * 0.8 +
    valueNoise(warpedX * 0.026 - 8, warpedZ * 0.026 + 14) * 1.35;
  const layeredRidge =
    wallProgress *
    (ridgeNoise - 0.44) *
    (2.6 + smooth01((Math.abs(x) - 42) / 62) * 2.4);

  // A compacted route floor with low wind-packed shoulders visually joins the
  // architecture to the landscape. The shoulders are broad and shallow: they
  // read as excavated regolith, not as a new set of geometric plinths.
  const routeShoulder =
    Math.exp(-((riftDistance - 11.5) ** 2) / 34) *
    (1.48 + valueNoise(warpedX * 0.045 + 6, warpedZ * 0.045 - 3) * 0.3);
  let height =
    routeElevation +
    floorNoise +
    routeShoulder +
    layeredRidge +
    wallProgress * (5.2 * asymmetricWall + strata);
  let craterWeight = 0;

  for (const [craterX, craterZ, radius, depth] of CRATERS) {
    const normalized = Math.hypot(x - craterX, z - craterZ) / radius;
    if (normalized >= 1.28) continue;
    const bowl =
      normalized < 1 ? (1 - normalized * normalized) ** 2 * depth * 0.54 : 0;
    const rim = Math.exp(-((normalized - 1.02) ** 2) / 0.028) * depth * 0.22;
    height += rim - bowl;
    craterWeight = Math.max(
      craterWeight,
      1 - clamp01(Math.abs(normalized - 0.62) / 0.7),
    );
  }

  const canyonDistance = distanceToPolyline(x, z, CANYON_PATH);
  const canyonWeight = 1 - smooth01((canyonDistance - 5) / 28);
  const canyonCore = 1 - smooth01(canyonDistance / 18);
  const canyonRim = Math.exp(-((canyonDistance - 22) ** 2) / 68) * 2.6;
  const canyonExtent = 1 - smooth01(Math.abs(z + 278) / 92);
  height += (canyonRim - canyonCore * 8.8) * canyonExtent;

  const pathDistance = route.distance;
  const pathWeight = 1 - smooth01((pathDistance - 2.4) / 8.5);
  const compactedVariation = valueNoise(x * 0.18 + 9, z * 0.18) * 0.14;
  const routeCut = 0.18 + 0.08 * Math.sin((z - x * 0.23) * 0.057);
  const pathTarget = routeElevation - routeCut + compactedVariation;
  height = lerp(height, pathTarget, pathWeight * 0.86);

  let platformWeight = 0;
  let platformHeight = height;
  for (const platform of SELENE_GRADED_AREAS) {
    const distance = Math.hypot(x - platform.x, z - platform.z);
    const weight =
      1 -
      smooth01((distance - platform.radius * 0.42) / (platform.radius * 0.58));
    if (weight > platformWeight) {
      platformWeight = weight;
      platformHeight = platform.height;
    }
  }
  height = lerp(height, platformHeight, platformWeight * 0.86);

  return {
    height,
    regions: {
      ridge: clamp01((ridgeNoise - 0.42) / 0.45),
      crater: clamp01(craterWeight),
      canyon: clamp01(canyonWeight),
      path: clamp01(pathWeight),
      platform: clamp01(platformWeight),
    },
  };
}

export function createObservatoryTerrainField(): TerrainField {
  const sampleHeight = (x: number, z: number) =>
    evaluateHeightAndRegions(x, z).height;
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
        buildable: clamp01(
          Math.max(evaluated.regions.path, evaluated.regions.platform) -
            evaluated.regions.canyon * 0.65,
        ),
      };
    },
  };
}
