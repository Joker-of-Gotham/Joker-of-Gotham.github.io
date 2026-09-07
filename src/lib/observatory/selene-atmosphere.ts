import * as THREE from "three";
import type { ThreeObservatoryPalette } from "./palette";
import { createSeededRandom, randomSigned } from "./random";
import { SELENE_MERIDIAN_ROUTE } from "./terrain-field";
import type { ObservatoryQualityProfile, ObservatoryTimelineState } from "./types";

export interface SeleneAtmosphere {
  group: THREE.Group;
  update(state: ObservatoryTimelineState, elapsedSeconds: number): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
}

interface SeleneAtmosphereOptions {
  sampleHeight(x: number, z: number): number;
}

const DUST_POOL_SIZE = 18_000;
const VAPOUR_POOL_SIZE = 720;
const RIDGE_LAYER_COUNT = 4;
const RIDGE_SEGMENTS = 72;
const RIDGE_VERTICES_PER_LAYER = RIDGE_SEGMENTS * 6;
const HORIZON_VEIL_VERTEX_COUNT = 6;
const ATMOSPHERE_SEED = 0x53454c45;

function getQualityCounts(quality: ObservatoryQualityProfile) {
  if (quality.tier === "poster") return { dust: 0, vapour: 0, ridgeLayers: 2 };
  if (quality.tier === "low") return { dust: 3_200, vapour: 96, ridgeLayers: 3 };
  if (quality.tier === "standard") return { dust: 9_000, vapour: 320, ridgeLayers: 4 };
  return { dust: 16_000, vapour: 620, ridgeLayers: 4 };
}

function sampleRoutePosition(random: () => number) {
  const segmentIndex = Math.min(
    SELENE_MERIDIAN_ROUTE.length - 2,
    Math.floor(random() * (SELENE_MERIDIAN_ROUTE.length - 1)),
  );
  const start = SELENE_MERIDIAN_ROUTE[segmentIndex];
  const end = SELENE_MERIDIAN_ROUTE[segmentIndex + 1];
  const t = random();
  return {
    x: THREE.MathUtils.lerp(start[0], end[0], t),
    z: THREE.MathUtils.lerp(start[1], end[1], t),
  };
}

function createDustPool(
  palette: ThreeObservatoryPalette,
  sampleHeight: (x: number, z: number) => number,
) {
  const random = createSeededRandom(ATMOSPHERE_SEED);
  const positions = new Float32Array(DUST_POOL_SIZE * 3);
  const phase = new Float32Array(DUST_POOL_SIZE);
  const size = new Float32Array(DUST_POOL_SIZE);
  for (let index = 0; index < DUST_POOL_SIZE; index += 1) {
    const offset = index * 3;
    const followsRoute = random() < 0.58;
    const route = followsRoute ? sampleRoutePosition(random) : null;
    const x = route
      ? route.x + randomSigned(random) * (4 + Math.pow(random(), 1.6) * 22)
      : randomSigned(random) * (30 + random() * 58);
    const z = route ? route.z + randomSigned(random) * 7 : 18 - random() * 472;
    const surface = sampleHeight(x, z);
    positions[offset] = x;
    positions[offset + 1] = surface + 0.08 + Math.pow(random(), 3.15) * 4.8;
    positions[offset + 2] = z;
    phase[index] = random() * Math.PI * 2;
    size[index] = 0.7 + random() * 1.65;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geometry.setDrawRange(0, 0);
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    name: "SeleneElectrostaticDustMaterial",
    uniforms: {
      uTime: { value: 0 },
      uActivity: { value: 0.2 },
      uColor: { value: palette.particleBase.clone().lerp(palette.fog, 0.34) },
      uPixelScale: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      uniform float uActivity;
      uniform float uPixelScale;
      varying float vAlpha;

      void main() {
        vec3 point = position;
        float slowTime = uTime * (0.075 + aSize * 0.012);
        point.x += sin(aPhase + slowTime) * (0.18 + uActivity * 0.32);
        point.y += (sin(aPhase * 1.73 + slowTime * 1.4) * 0.5 + 0.5) * (0.16 + uActivity * 0.5);
        point.z += cos(aPhase * 0.83 + slowTime) * (0.12 + uActivity * 0.22);
        vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
        float viewDistance = max(0.0, -viewPosition.z);
        float nearFade = smoothstep(3.0, 16.0, viewDistance);
        float farFade = 1.0 - smoothstep(240.0, 520.0, viewDistance);
        gl_PointSize = clamp(aSize * uPixelScale * (205.0 / max(16.0, viewDistance)), 0.8, 4.4);
        gl_Position = projectionMatrix * viewPosition;
        vAlpha = nearFade * farFade * (0.11 + uActivity * 0.18);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        vec2 centred = gl_PointCoord - 0.5;
        float radial = smoothstep(0.5, 0.08, length(centred));
        if (radial < 0.01) discard;
        gl_FragColor = vec4(uColor, radial * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "PooledElectrostaticDust";
  points.renderOrder = 8;
  points.frustumCulled = false;
  points.userData = { poolSize: DUST_POOL_SIZE, weatherType: "electrostatic-lunar-dust" };
  return { points, geometry, material };
}

function createVapourPool(palette: ThreeObservatoryPalette, sampleHeight: (x: number, z: number) => number) {
  const random = createSeededRandom(ATMOSPHERE_SEED ^ 0x56415052);
  const positions = new Float32Array(VAPOUR_POOL_SIZE * 3);
  const phase = new Float32Array(VAPOUR_POOL_SIZE);
  const size = new Float32Array(VAPOUR_POOL_SIZE);
  const facilities = [
    [-13, -58],
    [18, -154],
    [-22, -212],
    [16, -287],
    [-11, -378],
  ] as const;
  for (let index = 0; index < VAPOUR_POOL_SIZE; index += 1) {
    const facility = facilities[index % facilities.length];
    const x = facility[0] + randomSigned(random) * 4.8;
    const z = facility[1] + randomSigned(random) * 5.2;
    const offset = index * 3;
    positions[offset] = x;
    positions[offset + 1] = sampleHeight(x, z) + 1.1 + random() * 2.4;
    positions[offset + 2] = z;
    phase[index] = random() * Math.PI * 2;
    size[index] = 2.4 + random() * 5.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geometry.setDrawRange(0, 0);
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    name: "SeleneLocalServiceVapourMaterial",
    uniforms: {
      uTime: { value: 0 },
      uActivity: { value: 0.2 },
      uColor: { value: palette.orbit.clone().lerp(palette.particleBase, 0.62) },
      uWarm: { value: palette.afterlight.clone() },
      uPixelScale: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      uniform float uActivity;
      uniform float uPixelScale;
      varying float vAlpha;
      varying float vCycle;

      void main() {
        vec3 point = position;
        float cycle = fract(aPhase * 0.15915494 + uTime * (0.008 + aSize * 0.0007));
        point.y += cycle * (3.2 + uActivity * 2.8);
        point.x += sin(aPhase + cycle * 4.0) * (0.7 + cycle * 1.5);
        point.z += cos(aPhase * 1.3 + cycle * 2.8) * (0.45 + cycle);
        vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
        gl_PointSize = clamp(aSize * uPixelScale * (170.0 / max(18.0, -viewPosition.z)), 1.2, 20.0);
        gl_Position = projectionMatrix * viewPosition;
        vAlpha = sin(cycle * 3.14159265) * (0.028 + uActivity * 0.045);
        vCycle = cycle;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uWarm;
      varying float vAlpha;
      varying float vCycle;

      void main() {
        vec2 centred = gl_PointCoord - 0.5;
        centred.x *= 0.72 + vCycle * 0.28;
        centred.y *= 1.28 - vCycle * 0.24;
        float radial = smoothstep(0.5, 0.04, length(centred));
        if (radial < 0.01) discard;
        float softCore = smoothstep(0.42, 0.03, length(centred + vec2(0.04, 0.08)));
        vec3 colour = mix(uColor, uWarm, softCore * (0.08 + vCycle * 0.09));
        gl_FragColor = vec4(colour, radial * vAlpha * 1.22);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "LocalServiceVapour";
  points.renderOrder = 7;
  points.frustumCulled = false;
  points.userData = { poolSize: VAPOUR_POOL_SIZE, weatherType: "facility-vapour" };
  return { points, geometry, material };
}

interface RidgeLayerDefinition {
  z: number;
  bottom: number;
  baseline: number;
  amplitude: number;
  phase: number;
}

const RIDGE_LAYERS: readonly RidgeLayerDefinition[] = [
  { z: -548, bottom: -38, baseline: 27, amplitude: 15, phase: 0.3 },
  { z: -514, bottom: -36, baseline: 20, amplitude: 12, phase: 2.1 },
  { z: -476, bottom: -34, baseline: 14, amplitude: 9, phase: 4.4 },
  { z: -447, bottom: -32, baseline: 9, amplitude: 6, phase: 1.2 },
] as const;

function ridgeHeight(x: number, layer: RidgeLayerDefinition) {
  const broad =
    Math.sin(x * 0.018 + layer.phase) * 0.48 +
    Math.sin(x * 0.041 - layer.phase * 0.73) * 0.24 +
    Math.sin(x * 0.083 + layer.phase * 1.41) * 0.1;
  const escarpment = Math.pow(
    Math.max(0, Math.sin(x * 0.011 + layer.phase * 0.52)),
    2.4,
  );
  return layer.baseline + layer.amplitude * (broad + escarpment * 0.44);
}

/**
 * Four deterministic horizon silhouettes live in one buffer and one draw
 * call. Low tiers shorten the draw range; they never rebuild the geometry.
 */
function createLayeredRidges(palette: ThreeObservatoryPalette) {
  const ridgeVertexCount = RIDGE_LAYER_COUNT * RIDGE_VERTICES_PER_LAYER;
  const vertexCount = ridgeVertexCount + HORIZON_VEIL_VERTEX_COUNT;
  const positions = new Float32Array(vertexCount * 3);
  const layerDepth = new Float32Array(vertexCount);
  const edge = new Float32Array(vertexCount);
  const kind = new Float32Array(vertexCount);
  const uvs = new Float32Array(vertexCount * 2);
  let vertexIndex = 0;

  const writeVertex = (
    x: number,
    y: number,
    z: number,
    depth: number,
    topEdge: number,
    kindValue = 0,
    uvX = 0,
    uvY = 0,
  ) => {
    const offset = vertexIndex * 3;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    layerDepth[vertexIndex] = depth;
    edge[vertexIndex] = topEdge;
    kind[vertexIndex] = kindValue;
    uvs[vertexIndex * 2] = uvX;
    uvs[vertexIndex * 2 + 1] = uvY;
    vertexIndex += 1;
  };

  RIDGE_LAYERS.forEach((layer, layerIndex) => {
    const depth = layerIndex / Math.max(1, RIDGE_LAYER_COUNT - 1);
    for (let segment = 0; segment < RIDGE_SEGMENTS; segment += 1) {
      const x0 = THREE.MathUtils.lerp(-248, 248, segment / RIDGE_SEGMENTS);
      const x1 = THREE.MathUtils.lerp(-248, 248, (segment + 1) / RIDGE_SEGMENTS);
      const top0 = ridgeHeight(x0, layer);
      const top1 = ridgeHeight(x1, layer);
      writeVertex(x0, layer.bottom, layer.z, depth, 0);
      writeVertex(x1, layer.bottom, layer.z, depth, 0);
      writeVertex(x1, top1, layer.z, depth, 1);
      writeVertex(x0, layer.bottom, layer.z, depth, 0);
      writeVertex(x1, top1, layer.z, depth, 1);
      writeVertex(x0, top0, layer.z, depth, 1);
    }
  });

  // The atmospheric fold/moon plane shares this same geometry and shader,
  // preserving the original atmosphere draw-call count after adding ridges.
  const left = -260;
  const right = 260;
  const bottom = -29;
  const top = 121;
  const horizonZ = -512;
  writeVertex(left, bottom, horizonZ, 0, 0, 1, 0, 0);
  writeVertex(right, bottom, horizonZ, 0, 0, 1, 1, 0);
  writeVertex(right, top, horizonZ, 0, 1, 1, 1, 1);
  writeVertex(left, bottom, horizonZ, 0, 0, 1, 0, 0);
  writeVertex(right, top, horizonZ, 0, 1, 1, 1, 1);
  writeVertex(left, top, horizonZ, 0, 1, 1, 0, 1);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aLayerDepth", new THREE.BufferAttribute(layerDepth, 1));
  geometry.setAttribute("aTopEdge", new THREE.BufferAttribute(edge, 1));
  geometry.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setDrawRange(0, vertexCount);
  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    name: "SeleneLayeredRegolithRidgeMaterial",
    uniforms: {
      uFog: { value: palette.fog.clone() },
      uOrbit: { value: palette.orbit.clone() },
      uParticle: { value: palette.particleBase.clone() },
      uAfterlight: { value: palette.afterlight.clone() },
      uAfterlightAmount: { value: 0 },
      uSignal: { value: palette.signal.clone() },
      uHorizonBase: { value: palette.fog.clone().lerp(palette.orbit, 0.26) },
      uTime: { value: 0 },
      uOpacity: { value: 0.12 },
      uMoon: { value: 0 },
      uLayerLimit: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aLayerDepth;
      attribute float aTopEdge;
      attribute float aKind;
      varying float vLayerDepth;
      varying float vTopEdge;
      varying float vKind;
      varying float vWorldX;
      varying vec2 vUv;

      void main() {
        vLayerDepth = aLayerDepth;
        vTopEdge = aTopEdge;
        vKind = aKind;
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldX = worldPosition.x;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFog;
      uniform vec3 uOrbit;
      uniform vec3 uParticle;
      uniform vec3 uAfterlight;
      uniform vec3 uSignal;
      uniform vec3 uHorizonBase;
      uniform float uAfterlightAmount;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uMoon;
      uniform float uLayerLimit;
      varying float vLayerDepth;
      varying float vTopEdge;
      varying float vKind;
      varying float vWorldX;
      varying vec2 vUv;

      void main() {
        if (vKind > 0.5) {
          float edgeFade = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
          float verticalFade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.34, vUv.y);
          float foldA = pow(0.5 + 0.5 * sin(vUv.x * 28.0 + sin(vUv.x * 7.0 - uTime * 0.014)), 5.0);
          float foldB = pow(0.5 + 0.5 * sin(vUv.x * 47.0 - uTime * 0.009 + 1.7), 7.0);
          float lowerGlow = pow(1.0 - vUv.y, 2.4);
          float folds = foldA * 0.54 + foldB * 0.25 + lowerGlow * 0.34;
          vec3 colour = mix(uHorizonBase, mix(uSignal, uAfterlight, uAfterlightAmount), 0.2 + lowerGlow * 0.46);
          float servicePoolA = exp(-dot(vUv - vec2(0.24, 0.16), vUv - vec2(0.24, 0.16)) * 42.0);
          float servicePoolB = exp(-dot(vUv - vec2(0.67, 0.12), vUv - vec2(0.67, 0.12)) * 58.0);
          float serviceGlow = servicePoolA * 0.7 + servicePoolB;
          colour = mix(colour, mix(uAfterlight, uParticle, 0.34), serviceGlow * (0.14 + uAfterlightAmount * 0.12));
          float atmosphereAlpha = (folds + serviceGlow * (0.34 + uMoon * 0.08)) * edgeFade * verticalFade * uOpacity * (0.72 + uAfterlightAmount * 0.42);
          gl_FragColor = vec4(colour, atmosphereAlpha);
          return;
        }
        if (vLayerDepth > uLayerLimit + 0.001) discard;
        float broadStrata = sin(vWorldX * 0.052 + vLayerDepth * 9.0) * 0.026;
        float fineStrata = sin(vWorldX * 0.17 - vLayerDepth * 13.0) * 0.012;
        float strata = 0.98 + broadStrata + fineStrata;
        vec3 farTone = mix(mix(uFog, uOrbit, 0.38), uParticle, 0.34);
        vec3 nearTone = mix(mix(uFog, uOrbit, 0.34), uParticle, 0.22);
        vec3 colour = mix(farTone * 1.12, nearTone * 0.96, vLayerDepth) * strata;
        colour = mix(colour, uAfterlight, uAfterlightAmount * (0.035 + vLayerDepth * 0.026));
        float ridgeLight = smoothstep(0.68, 0.98, vTopEdge) * mix(0.075, 0.025, vLayerDepth);
        colour += mix(uOrbit, uParticle, 0.48) * ridgeLight;
        float baseAlpha = mix(0.52, 0.72, vLayerDepth);
        float alpha = baseAlpha * mix(0.92, 1.0, vTopEdge);
        gl_FragColor = vec4(colour, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "LayeredDistantRegolithRidges";
  mesh.renderOrder = -8;
  mesh.frustumCulled = false;
  mesh.userData = {
    role: "batched-distant-depth-ridges",
    layers: RIDGE_LAYER_COUNT,
    visibleLayers: RIDGE_LAYER_COUNT,
    qualityDegradation: "single-batch-layer-visibility",
    integratedHorizonVeil: true,
    fixedWorldCoordinates: true,
  };
  return { mesh, geometry, material };
}

export function createSeleneAtmosphere(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  options: SeleneAtmosphereOptions,
): SeleneAtmosphere {
  const group = new THREE.Group();
  group.name = "SeleneAtmosphereRoot";
  group.userData = {
    role: "lunar-atmosphere",
    precipitation: "none",
    qualityDegradation: "draw-range",
  };
  const dust = createDustPool(palette, options.sampleHeight);
  const vapour = createVapourPool(palette, options.sampleHeight);
  const ridges = createLayeredRidges(palette);
  group.add(ridges.mesh, dust.points, vapour.points);
  let horizonVisible = quality.tier !== "poster";

  const setQuality = (nextQuality: ObservatoryQualityProfile) => {
    const counts = getQualityCounts(nextQuality);
    dust.geometry.setDrawRange(0, counts.dust);
    vapour.geometry.setDrawRange(0, counts.vapour);
    const visibleLayers = Math.min(RIDGE_LAYER_COUNT, counts.ridgeLayers);
    ridges.material.uniforms.uLayerLimit.value =
      (visibleLayers - 1) / Math.max(1, RIDGE_LAYER_COUNT - 1);
    ridges.mesh.userData.visibleLayers = visibleLayers;
    const pixelScale = nextQuality.tier === "low" ? 0.78 : nextQuality.tier === "enhanced" ? 1.08 : 1;
    dust.material.uniforms.uPixelScale.value = pixelScale;
    vapour.material.uniforms.uPixelScale.value = pixelScale;
    horizonVisible = nextQuality.tier !== "poster";
  };
  setQuality(quality);

  return {
    group,
    update(state, elapsedSeconds) {
      const dustActivity = 0.16 + state.canyonIntensity * 0.34 + state.ringIntensity * 0.14;
      const vapourActivity = 0.12 + state.cityIntensity * 0.34 + state.canyonIntensity * 0.28;
      dust.material.uniforms.uTime.value = elapsedSeconds;
      dust.material.uniforms.uActivity.value = dustActivity;
      vapour.material.uniforms.uTime.value = elapsedSeconds;
      vapour.material.uniforms.uActivity.value = vapourActivity;
      ridges.material.uniforms.uTime.value = elapsedSeconds;
      ridges.material.uniforms.uMoon.value = horizonVisible ? state.moonIntensity : 0;
      ridges.material.uniforms.uOpacity.value = horizonVisible
        ? 0.135 + state.afterlightIntensity * 0.075
        : 0;
      ridges.material.uniforms.uAfterlightAmount.value = state.afterlightIntensity;
    },
    setPalette(nextPalette) {
      dust.material.uniforms.uColor.value.copy(nextPalette.particleBase).lerp(nextPalette.fog, 0.34);
      vapour.material.uniforms.uColor.value.copy(nextPalette.orbit).lerp(nextPalette.particleBase, 0.62);
      vapour.material.uniforms.uWarm.value.copy(nextPalette.afterlight);
      ridges.material.uniforms.uFog.value.copy(nextPalette.fog);
      ridges.material.uniforms.uOrbit.value.copy(nextPalette.orbit);
      ridges.material.uniforms.uParticle.value.copy(nextPalette.particleBase);
      ridges.material.uniforms.uAfterlight.value.copy(nextPalette.afterlight);
      ridges.material.uniforms.uSignal.value.copy(nextPalette.signal);
      ridges.material.uniforms.uHorizonBase.value
        .copy(nextPalette.fog)
        .lerp(nextPalette.orbit, 0.26);
    },
    setQuality,
  };
}
