import * as THREE from "three";
import { OBSERVATORY_WORLD_SPAN } from "./camera-director";
import { createSeededRandom, randomSigned } from "./random";
import { createObservatoryTerrainField } from "./terrain-field";
import { createUnifiedObservatoryCampus } from "./unified-campus";
import type { ThreeObservatoryPalette } from "./palette";
import type { ObservatoryQualityProfile, ObservatoryTimelineState } from "./types";

export interface ProceduralObservatoryWorld {
  group: THREE.Group;
  lights: THREE.Light[];
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

function createTerrainSurface(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette) {
  const field = createObservatoryTerrainField();
  const horizontalSegments = Math.max(28, Math.round(quality.terrainSegments * 0.52));
  const verticalSegments = Math.max(48, quality.terrainSegments);
  const geometry = new THREE.PlaneGeometry(field.width, field.depth, horizontalSegments, verticalSegments);
  const positions = geometry.getAttribute("position");
  const regionData = new Float32Array(positions.count * 5);
  const colors = new Float32Array(positions.count * 3);
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getY(index) + field.centerZ;
    const sample = field.sampleSurface(x, z);
    positions.setXYZ(index, x, sample.height, z);
    const offset = index * 5;
    regionData[offset] = sample.regions.ridge;
    regionData[offset + 1] = sample.regions.crater;
    regionData[offset + 2] = sample.regions.canyon;
    regionData[offset + 3] = sample.regions.path;
    regionData[offset + 4] = sample.regions.platform;
  }
  positions.needsUpdate = true;
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    name: "TerrainFieldLayeredMaterial",
    color: 0xffffff,
    vertexColors: true,
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.075,
    metalness: 0.18,
    roughness: 0.82,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    dithering: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "TerrainFieldSurface";
  mesh.renderOrder = -4;
  mesh.receiveShadow = true;
  mesh.userData = {
    generator: "ridged-fbm-craters-canyon-path-platforms",
    width: field.width,
    depth: field.depth,
    centerZ: field.centerZ
  };

  const recolor = (nextPalette: ThreeObservatoryPalette) => {
    // The live terrain owns the macro silhouette. Every region stays within the
    // semantic lunar palette so the poster can disappear after first frame.
    const base = nextPalette.fog.clone().lerp(nextPalette.metal, 0.64);
    const ridgeColor = nextPalette.fog.clone().lerp(nextPalette.orbit, 0.52);
    const canyonColor = nextPalette.fog.clone().lerp(nextPalette.particleBase, 0.18);
    const pathColor = nextPalette.metal.clone().lerp(nextPalette.signal, 0.22);
    const platformColor = nextPalette.metal.clone().lerp(nextPalette.afterlight, 0.2);
    const color = new THREE.Color();
    for (let index = 0; index < positions.count; index += 1) {
      const offset = index * 5;
      color.copy(base);
      color.lerp(ridgeColor, regionData[offset] * 0.3);
      color.lerp(canyonColor, regionData[offset + 2] * 0.62);
      color.lerp(pathColor, regionData[offset + 3] * 0.52);
      color.lerp(platformColor, regionData[offset + 4] * 0.66);
      const colorOffset = index * 3;
      colors[colorOffset] = color.r;
      colors[colorOffset + 1] = color.g;
      colors[colorOffset + 2] = color.b;
    }
    geometry.getAttribute("color").needsUpdate = true;
    material.emissive.copy(nextPalette.fog);
    material.opacity = 1;
  };
  recolor(palette);
  return { field, mesh, geometry, material, recolor };
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
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  points.name = "EnvironmentalStarDust";
  points.userData = { role: "environment-only", neverCharacter: true, maximumCount };
  points.frustumCulled = false;
  return { points, geometry, material, maximumCount };
}

function createAtmosphericSky(palette: ThreeObservatoryPalette) {
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
    varying vec3 vWorldDirection;

    void main() {
      float height = clamp(vWorldDirection.y * 0.5 + 0.5, 0.0, 1.0);
      float horizon = 1.0 - smoothstep(0.08, 0.48, height);
      float moonAlignment = dot(vWorldDirection, normalize(vec3(-0.42, 0.58, -0.7)));
      float moonDisc = smoothstep(0.991, 0.994, moonAlignment);
      float moonHalo = smoothstep(0.968, 0.993, moonAlignment) * (1.0 - moonDisc);
      vec3 color = mix(uHorizon, uZenith, smoothstep(0.0, 0.92, height));
      color = mix(color, uMoonColor, moonDisc * (0.52 + uMoon * 0.28));
      color += uSignal * moonHalo * (0.035 + uMoon * 0.055);
      color += uHorizon * horizon * (0.12 + uAfterlight * 0.1);
      gl_FragColor = vec4(color, 1.0);
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
      uAfterlight: { value: 0 }
    },
    transparent: false,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.NormalBlending
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
    blending: THREE.AdditiveBlending
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
  palette: ThreeObservatoryPalette
): ProceduralObservatoryWorld {
  const group = new THREE.Group();
  group.name = "ObservatoryWorldV6UnifiedCampusRealtime";
  group.userData = {
    worldVersion: 6,
    coordinateSpan: OBSERVATORY_WORLD_SPAN,
    fixedWorldCoordinates: true,
    characterParticles: false,
    livePlateDependency: false,
    visualSource: "procedural-pbr-threejs",
    composition: "single-continuous-observatory-campus",
    referenceExamples: [
      "webgpu_postprocessing_dof_basic",
      "webgl_animation_keyframes",
      "webgl_lightprobes_sponza",
      "webgl_loader_3dtiles",
    ],
  };

  const terrain = createTerrainSurface(quality, palette);
  const stars = createEnvironmentalStars(quality.starCount, palette);
  const campus = createUnifiedObservatoryCampus(quality, palette, terrain.field);
  const sky = createAtmosphericSky(palette);
  let skyIsLight = isLightWorldPalette(palette);

  group.add(
    sky.group,
    stars.points,
    terrain.mesh,
    campus.group,
  );

  const hemisphere = new THREE.HemisphereLight(
    palette.particleBase.clone().lerp(palette.signal, 0.08),
    palette.fog.clone(),
    skyIsLight ? 0.78 : 1.16,
  );
  hemisphere.name = "WorldSkyFill";

  const lunarLight = new THREE.DirectionalLight(palette.orbit.clone(), skyIsLight ? 1 : 1.72);
  lunarLight.name = "CelestialKeyLight";
  lunarLight.position.set(-120, 170, -260);

  const campusFill = new THREE.DirectionalLight(palette.signal.clone(), skyIsLight ? 0.48 : 0.92);
  campusFill.name = "CampusProcessionalFill";
  campusFill.position.set(90, 64, 36);

  const lights: THREE.Light[] = [hemisphere, lunarLight, campusFill];
  let moonIntensity = 0;
  let afterlightIntensity = 0;

  return {
    group,
    lights,
    update(state, elapsedSeconds, deltaSeconds) {
      moonIntensity = THREE.MathUtils.damp(moonIntensity, state.moonIntensity, 2.6, deltaSeconds);
      afterlightIntensity = THREE.MathUtils.damp(afterlightIntensity, state.afterlightIntensity, 2.6, deltaSeconds);

      // The camera travels through authored coordinates; the campus itself never
      // moves or rebuilds, preserving the resident Canvas and stable WebGL scene.
      stars.points.rotation.y = Math.sin(elapsedSeconds * 0.0012) * 0.012;
      sky.skyMaterial.uniforms.uMoon.value = moonIntensity;
      sky.skyMaterial.uniforms.uAfterlight.value = afterlightIntensity;
      sky.horizonMaterial.opacity =
        (skyIsLight ? 0.055 : 0.11) +
        afterlightIntensity * 0.055 +
        state.ringIntensity * 0.025;
      terrain.material.emissiveIntensity =
        (skyIsLight ? 0.025 : 0.055) +
        state.ringIntensity * 0.03 +
        state.cityIntensity * 0.014;
      campus.update(state, elapsedSeconds);
      lunarLight.intensity = (skyIsLight ? 0.8 : 1.15) + moonIntensity * 0.75;
      campusFill.intensity = (skyIsLight ? 0.42 : 0.72) + state.signalIntensity * 0.24;
    },
    setPalette(nextPalette) {
      const lightPalette = isLightWorldPalette(nextPalette);
      skyIsLight = lightPalette;
      stars.material.color.copy(nextPalette.particleBase);
      terrain.recolor(nextPalette);
      sky.skyMaterial.uniforms.uZenith.value.copy(nextPalette.fog).lerp(nextPalette.particleBase, 0.18);
      sky.skyMaterial.uniforms.uHorizon.value.copy(nextPalette.fog).lerp(nextPalette.orbit, 0.24);
      sky.skyMaterial.uniforms.uSignal.value.copy(nextPalette.signal);
      sky.skyMaterial.uniforms.uMoonColor.value.copy(nextPalette.particleBase).lerp(nextPalette.orbit, 0.18);
      sky.horizonMaterial.color.copy(nextPalette.orbit).lerp(nextPalette.metal, 0.2);
      sky.horizonMaterial.opacity = lightPalette ? 0.055 : 0.11;
      campus.setPalette(nextPalette);
      hemisphere.color.copy(nextPalette.particleBase).lerp(nextPalette.signal, 0.08);
      hemisphere.groundColor.copy(nextPalette.fog);
      hemisphere.intensity = lightPalette ? 0.78 : 1.16;
      lunarLight.color.copy(nextPalette.orbit);
      lunarLight.intensity = lightPalette ? 1 : 1.72;
      campusFill.color.copy(nextPalette.signal);
      campusFill.intensity = lightPalette ? 0.48 : 0.92;
    },
    setQuality(nextQuality) {
      stars.geometry.setDrawRange(0, Math.min(stars.maximumCount, nextQuality.starCount));
      campus.setQuality(nextQuality);
    },
    dispose() {
      const resources = collectResources(group);
      resources.geometries.forEach((geometry) => geometry.dispose());
      resources.materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
}
