import * as THREE from "three";
import { OBSERVATORY_WORLD_SPAN } from "./camera-director";
import type { ThreeObservatoryPalette } from "./palette";
import { createSeededRandom, randomSigned } from "./random";
import { createSeleneAtmosphere } from "./selene-atmosphere";
import { createSeleneLightRig } from "./selene-lighting";
import {
  createSelenePbrMaterialSystem,
  SELENE_ASSET_BASE_URL,
  type SeleneEnvironmentState,
} from "./selene-materials";
import { createSeleneNaturalAssetLayer } from "./selene-natural-assets";
import { createObservatoryTerrainField } from "./terrain-field";
import { createUnifiedObservatoryCampus } from "./unified-campus";
import type { ObservatoryQualityProfile, ObservatoryTimelineState } from "./types";

export interface ProceduralObservatoryWorldOptions {
  renderer?: THREE.WebGLRenderer | null;
  signal?: AbortSignal;
  assetBaseUrl?: string;
}

export interface ProceduralObservatoryWorld {
  group: THREE.Group;
  lights: THREE.Light[];
  ready: Promise<void>;
  readonly environmentStatus: SeleneEnvironmentState;
  update(state: ObservatoryTimelineState, elapsedSeconds: number, deltaSeconds: number): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
  dispose(): void;
}

const WORLD_SEED = 0x4c554e41;

interface WorldResources {
  geometries: Set<THREE.BufferGeometry>;
  materials: Set<THREE.Material>;
}

const isLightWorldPalette = (palette: ThreeObservatoryPalette) => {
  const { r, g, b } = palette.fog;
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.45;
};

function collectResources(root: THREE.Object3D): WorldResources {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  return { geometries, materials };
}

function createTerrainSurface(
  quality: ObservatoryQualityProfile,
  material: THREE.MeshStandardMaterial,
) {
  const field = createObservatoryTerrainField();
  const horizontalSegments = Math.max(28, Math.round(quality.terrainSegments * 0.52));
  const verticalSegments = Math.max(48, quality.terrainSegments);
  const geometry = new THREE.PlaneGeometry(field.width, field.depth, horizontalSegments, verticalSegments);
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getY(index) + field.centerZ;
    const sample = field.sampleSurface(x, z);
    positions.setXYZ(index, x, sample.height, z);
    // One stable, neutral macro mask multiplies the PBR map. It is authored once
    // at construction and never recoloured or uploaded during theme transitions.
    const shade = THREE.MathUtils.clamp(
      0.76 +
        sample.regions.ridge * 0.1 -
        sample.regions.canyon * 0.13 +
        sample.regions.path * 0.08 +
        sample.regions.platform * 0.07,
      0.58,
      0.98,
    );
    const colorOffset = index * 3;
    colors[colorOffset] = shade;
    colors[colorOffset + 1] = shade;
    colors[colorOffset + 2] = shade;
  }
  positions.needsUpdate = true;
  // PlaneGeometry is authored in XY with +Z winding. Remapping its Y axis to
  // world Z changes handedness, so the untouched index buffer points every
  // triangle down and Three.js culls the entire terrain from the camera above.
  // Reverse each triangle once at construction; this restores an upward PBR
  // ground plane without paying the permanent DoubleSide fragment cost.
  const terrainIndex = geometry.getIndex();
  if (terrainIndex) {
    for (let index = 0; index < terrainIndex.count; index += 3) {
      const second = terrainIndex.getX(index + 1);
      terrainIndex.setX(index + 1, terrainIndex.getX(index + 2));
      terrainIndex.setX(index + 2, second);
    }
    terrainIndex.needsUpdate = true;
  }
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  colorAttribute.setUsage(THREE.StaticDrawUsage);
  geometry.setAttribute("color", colorAttribute);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "TerrainFieldSurface";
  mesh.renderOrder = -4;
  mesh.receiveShadow = true;
  mesh.userData = {
    generator: "ridged-fbm-craters-canyon-path-platforms",
    materialSystem: "pbr-world-space-triplanar",
    paletteUploadPolicy: "construction-only-static-vertex-mask",
    width: field.width,
    depth: field.depth,
    centerZ: field.centerZ,
  };
  return { field, mesh, geometry, material };
}

function createEnvironmentalStars(count: number, palette: ThreeObservatoryPalette) {
  const random = createSeededRandom(WORLD_SEED);
  const maximumCount = Math.max(count, 1);
  const positions = new Float32Array(maximumCount * 3);
  const sizes = new Float32Array(maximumCount);
  for (let index = 0; index < maximumCount; index += 1) {
    const offset = index * 3;
    const radius = 170 + random() * 390;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(randomSigned(random));
    positions[offset] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[offset + 1] = Math.abs(Math.cos(phi) * radius) * 0.82 - 28;
    positions[offset + 2] = Math.sin(phi) * Math.sin(theta) * radius - 190;
    sizes[index] = 0.65 + random() * 1.35;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setDrawRange(0, count);
  const material = new THREE.PointsMaterial({
    name: "EnvironmentalStarDustMaterial",
    color: palette.particleBase.clone(),
    size: 0.75,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "EnvironmentalStarDust";
  points.userData = { role: "environment-only", neverCharacter: true, maximumCount };
  points.frustumCulled = false;
  return { points, geometry, material, maximumCount };
}

function getSkyDetail(quality: ObservatoryQualityProfile) {
  if (quality.tier === "poster") return 0;
  if (quality.tier === "low") return 0.42;
  if (quality.tier === "standard") return 0.78;
  return 1;
}

function createAtmosphericSky(
  palette: ThreeObservatoryPalette,
  quality: ObservatoryQualityProfile,
) {
  const vertexShader = /* glsl */ `
    varying vec3 vWorldDirection;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldDirection = normalize(worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = /* glsl */ `
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uSignal;
    uniform vec3 uMoonColor;
    uniform float uMoon;
    uniform float uAfterlight;
    uniform float uSkyDetail;
    varying vec3 vWorldDirection;

    float hash21(vec2 point) {
      point = fract(point * vec2(123.34, 456.21));
      point += dot(point, point + 45.32);
      return fract(point.x * point.y);
    }

    float valueNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      return mix(
        mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), local.x),
        mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + 1.0), local.x),
        local.y
      );
    }

    float starLayer(vec2 skyUv, float scale, float threshold) {
      vec2 grid = skyUv * scale;
      vec2 cell = floor(grid);
      vec2 local = fract(grid) - 0.5;
      vec2 offset = vec2(hash21(cell + 7.1), hash21(cell + 19.7)) - 0.5;
      float star = 1.0 - smoothstep(0.018, 0.074, length(local - offset * 0.7));
      return star * smoothstep(threshold, 1.0, hash21(cell + 31.4));
    }

    void main() {
      vec3 direction = normalize(vWorldDirection);
      float elevation = clamp(direction.y, -0.16, 1.0);
      float height = clamp(elevation * 0.86 + 0.14, 0.0, 1.0);
      float horizon = exp(-abs(elevation + 0.015) * 8.6);
      float upperHaze = exp(-abs(elevation - 0.18) * 4.3);
      float longitude = atan(direction.z, direction.x);
      vec3 colour = mix(uHorizon, uZenith, smoothstep(0.01, 0.88, height));

      // A layered, non-uniform horizon replaces the previous flat navy fill.
      float foldA = 0.5 + 0.5 * sin(longitude * 4.7 + sin(longitude * 1.9) * 1.6);
      float foldB = 0.5 + 0.5 * sin(longitude * 8.9 - 1.8);
      float curtain = pow(foldA, 4.0) * 0.62 + pow(foldB, 7.0) * 0.25;
      colour += mix(uHorizon, uSignal, 0.16) * horizon * (0.075 + curtain * 0.055);
      colour += uHorizon * upperHaze * (0.035 + uAfterlight * 0.025);
      colour += mix(uSignal, uMoonColor, 0.58) * horizon * uAfterlight * 0.026;

      // Deterministic angular stars are folded into the dome shader, so the
      // richer sky does not add geometry or another draw call.
      vec2 skyUv = vec2(longitude / 6.2831853 + 0.5, asin(clamp(direction.y, -1.0, 1.0)) / 3.14159265 + 0.5);
      float stars = starLayer(skyUv, 410.0, 0.992) + starLayer(skyUv + 0.173, 237.0, 0.996) * 1.45;
      float starVisibility = smoothstep(0.03, 0.28, elevation) * (1.0 - horizon * 0.82) * uSkyDetail;
      colour += mix(uMoonColor, uSignal, 0.16) * stars * starVisibility * 0.72;

      // One physically shaded moon lives in the sky dome. Local tangent-space
      // coordinates provide a soft limb, directional terminator and subtle
      // deterministic maria/crater variation instead of a flat circle.
      vec3 moonDirection = normalize(vec3(-0.42, 0.58, -0.7));
      vec3 moonRight = normalize(cross(vec3(0.0, 1.0, 0.0), moonDirection));
      vec3 moonUp = normalize(cross(moonDirection, moonRight));
      vec2 moonUv = vec2(dot(direction, moonRight), dot(direction, moonUp)) / 0.118;
      float moonRadius = length(moonUv);
      float moonDisc = 1.0 - smoothstep(0.985, 1.025, moonRadius);
      float moonHalo = (1.0 - smoothstep(1.02, 2.55, moonRadius)) * (1.0 - moonDisc);
      float moonZ = sqrt(max(0.0, 1.0 - moonRadius * moonRadius));
      vec3 moonNormal = normalize(vec3(moonUv, moonZ));
      float lunarLight = smoothstep(-0.08, 0.76, dot(moonNormal, normalize(vec3(-0.48, 0.34, 0.81))));
      float maria = valueNoise(moonUv * 5.4 + 17.0) * 0.58 + valueNoise(moonUv * 13.7 - 8.0) * 0.42;
      float mareShadow = smoothstep(0.48, 0.68, maria);
      float craterCoreA = 1.0 - smoothstep(0.04, 0.13, length(moonUv - vec2(-0.29, 0.21)));
      float craterRimA = 1.0 - smoothstep(0.018, 0.055, abs(length(moonUv - vec2(-0.29, 0.21)) - 0.14));
      float craterCoreB = 1.0 - smoothstep(0.025, 0.09, length(moonUv - vec2(0.34, -0.17)));
      float craterRimB = 1.0 - smoothstep(0.014, 0.04, abs(length(moonUv - vec2(0.34, -0.17)) - 0.1));
      float lunarTexture = 1.02 - mareShadow * 0.28 - craterCoreA * 0.2 - craterCoreB * 0.17 + craterRimA * 0.1 + craterRimB * 0.08;
      float moonLuma = dot(uMoonColor, vec3(0.2126, 0.7152, 0.0722));
      vec3 lunarNeutral = mix(uMoonColor, vec3(moonLuma * 1.06), 0.78);
      vec3 moonTone = lunarNeutral * (0.3 + lunarLight * 1.02) * lunarTexture * 1.34;
      colour = mix(colour, moonTone, moonDisc * (0.78 + uMoon * 0.18));
      colour += mix(uSignal, uMoonColor, 0.72) * moonHalo * (0.025 + uMoon * 0.045);
      gl_FragColor = vec4(colour, 1.0);
    }
  `;
  const skyMaterial = new THREE.ShaderMaterial({
    name: "AtmosphericLunarSkyMaterial",
    vertexShader,
    fragmentShader,
    uniforms: {
      uZenith: { value: palette.fog.clone().lerp(palette.particleBase, 0.18) },
      uHorizon: { value: palette.fog.clone().lerp(palette.orbit, 0.24) },
      uSignal: { value: palette.signal.clone() },
      uMoonColor: { value: palette.particleBase.clone().lerp(palette.orbit, 0.18) },
      uMoon: { value: 0 },
      uAfterlight: { value: 0 },
      uSkyDetail: { value: getSkyDetail(quality) },
    },
    transparent: false,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.NormalBlending,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(560, 48, 24), skyMaterial);
  dome.name = "AtmosphericLunarSkyDome";
  dome.renderOrder = -10;
  dome.frustumCulled = false;

  const horizonMaterial = new THREE.MeshBasicMaterial({
    name: "AtmosphericHorizonGlowMaterial",
    color: palette.orbit.clone().lerp(palette.metal, 0.2),
    transparent: true,
    opacity: isLightWorldPalette(palette) ? 0.08 : 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const horizon = new THREE.Mesh(new THREE.RingGeometry(150, 380, 96), horizonMaterial);
  horizon.name = "AtmosphericHorizonGlowBand";
  horizon.position.set(0, -18, -230);
  horizon.rotation.x = -Math.PI / 2;
  horizon.renderOrder = -9;

  const group = new THREE.Group();
  group.name = "ProceduralAtmosphericSkyLayer";
  group.userData = { role: "programmatic-atmosphere", fixedWorldCoordinates: true };
  group.add(dome, horizon);
  return { group, skyMaterial, horizonMaterial };
}

export function createProceduralObservatoryWorld(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  options: ProceduralObservatoryWorldOptions = {},
): ProceduralObservatoryWorld {
  const group = new THREE.Group();
  group.name = "ObservatoryWorldV6UnifiedCampusRealtime";
  group.userData = {
    worldVersion: 6,
    world: "Selene Meridian",
    coordinateSpan: OBSERVATORY_WORLD_SPAN,
    fixedWorldCoordinates: true,
    characterParticles: false,
    livePlateDependency: false,
    visualSource: "procedural-geometry-plus-cc0-pbr-hdr-photogrammetry",
    composition: "single-continuous-observatory-campus",
    sceneLifetime: "persistent",
    referenceExamples: [
      "webgpu_postprocessing_dof_basic",
      "webgl_animation_keyframes",
      "webgl_lightprobes_sponza",
      "webgl_loader_3dtiles",
    ],
  };

  const materialSystem = createSelenePbrMaterialSystem(palette, quality, {
    renderer: options.renderer,
    signal: options.signal,
    assetBaseUrl: options.assetBaseUrl,
  });
  const terrain = createTerrainSurface(quality, materialSystem.terrainMaterial);
  const stars = createEnvironmentalStars(quality.starCount, palette);
  const campus = createUnifiedObservatoryCampus(
    quality,
    palette,
    terrain.field,
    materialSystem.campusMaterials,
  );
  // The campus accepts injected shared materials but also applies its fallback
  // palette during construction. Restore the PBR system's physically neutral
  // albedo multipliers before the first frame; subsequent hydration is in-place.
  materialSystem.setPalette(palette, true);
  const sky = createAtmosphericSky(palette, quality);
  const atmosphere = createSeleneAtmosphere(quality, palette, {
    sampleHeight: terrain.field.sampleHeight,
  });
  const naturalAssets = createSeleneNaturalAssetLayer(quality, {
    assetBaseUrl: options.assetBaseUrl ?? SELENE_ASSET_BASE_URL,
    material: materialSystem.terrainMaterial,
    sampleHeight: terrain.field.sampleHeight,
    signal: options.signal,
  });
  const lighting = createSeleneLightRig(quality, palette, options.renderer);
  let skyIsLight = isLightWorldPalette(palette);
  let moonIntensity = 0;
  let afterlightIntensity = 0;
  let disposed = false;

  group.add(
    sky.group,
    stars.points,
    terrain.mesh,
    naturalAssets.group,
    campus.group,
    atmosphere.group,
    lighting.group,
  );

  const world: ProceduralObservatoryWorld = {
    group,
    lights: lighting.lights,
    ready: Promise.all([materialSystem.ready, naturalAssets.ready]).then(() => undefined),
    get environmentStatus() {
      if (disposed) return "disposed";
      if (materialSystem.status.state === "partial" || naturalAssets.state === "partial") {
        return "partial";
      }
      if (naturalAssets.state === "loading" || materialSystem.status.state === "loading") {
        return "loading";
      }
      if (naturalAssets.state === "ready" && materialSystem.status.state === "ready") {
        return "ready";
      }
      return materialSystem.status.state;
    },
    update(state, elapsedSeconds, deltaSeconds) {
      if (disposed) return;
      moonIntensity = THREE.MathUtils.damp(moonIntensity, state.moonIntensity, 2.6, deltaSeconds);
      afterlightIntensity = THREE.MathUtils.damp(afterlightIntensity, state.afterlightIntensity, 2.6, deltaSeconds);

      // Camera motion never mutates, replaces or reparents the resident world.
      stars.points.rotation.y = Math.sin(elapsedSeconds * 0.0012) * 0.012;
      sky.skyMaterial.uniforms.uMoon.value = moonIntensity;
      sky.skyMaterial.uniforms.uAfterlight.value = afterlightIntensity;
      sky.horizonMaterial.opacity =
        (skyIsLight ? 0.055 : 0.11) +
        afterlightIntensity * 0.055 +
        state.ringIntensity * 0.025;
      terrain.material.emissiveIntensity =
        (skyIsLight ? 0.006 : 0.012) +
        state.ringIntensity * 0.006 +
        state.cityIntensity * 0.004;
      campus.update(state, elapsedSeconds);
      atmosphere.update(state, elapsedSeconds);
      lighting.update(state);
    },
    setPalette(nextPalette) {
      if (disposed || !materialSystem.setPalette(nextPalette)) return;
      skyIsLight = isLightWorldPalette(nextPalette);
      stars.material.color.copy(nextPalette.particleBase);
      sky.skyMaterial.uniforms.uZenith.value.copy(nextPalette.fog).lerp(nextPalette.particleBase, 0.18);
      sky.skyMaterial.uniforms.uHorizon.value.copy(nextPalette.fog).lerp(nextPalette.orbit, 0.24);
      sky.skyMaterial.uniforms.uSignal.value.copy(nextPalette.signal);
      sky.skyMaterial.uniforms.uMoonColor.value.copy(nextPalette.particleBase).lerp(nextPalette.orbit, 0.18);
      sky.horizonMaterial.color.copy(nextPalette.orbit).lerp(nextPalette.metal, 0.2);
      sky.horizonMaterial.opacity = skyIsLight ? 0.055 : 0.11;
      atmosphere.setPalette(nextPalette);
      lighting.setPalette(nextPalette);
    },
    setQuality(nextQuality) {
      if (disposed) return;
      stars.geometry.setDrawRange(0, Math.min(stars.maximumCount, nextQuality.starCount));
      sky.skyMaterial.uniforms.uSkyDetail.value = getSkyDetail(nextQuality);
      campus.setQuality(nextQuality);
      atmosphere.setQuality(nextQuality);
      naturalAssets.setQuality(nextQuality);
      lighting.setQuality(nextQuality);
      materialSystem.setQuality(nextQuality);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      naturalAssets.dispose();
      materialSystem.dispose();
      lighting.dispose();
      const resources = collectResources(group);
      resources.geometries.forEach((geometry) => geometry.dispose());
      resources.materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
  return world;
}
