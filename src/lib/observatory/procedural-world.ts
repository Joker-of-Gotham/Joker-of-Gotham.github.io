import * as THREE from "three";
import { OBSERVATORY_WORLD_SPAN } from "./camera-director";
import { createObservatoryKit } from "./observatory-kit";
import { createSeededRandom, randomSigned } from "./random";
import { createObservatoryTerrainField } from "./terrain-field";
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
    emissiveIntensity: 0.025,
    metalness: 0.18,
    roughness: 0.82,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    dithering: true
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "TerrainFieldSurface";
  mesh.renderOrder = -4;
  mesh.userData = {
    generator: "ridged-fbm-craters-canyon-path-platforms",
    width: field.width,
    depth: field.depth,
    centerZ: field.centerZ
  };

  const recolor = (nextPalette: ThreeObservatoryPalette) => {
    // The raster plate carries the macro silhouette. This mesh only contributes
    // camera-reactive relief, so keep every region inside the same atmospheric
    // family instead of painting opaque black/grey land masses over the plate.
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
    material.opacity = isLightWorldPalette(nextPalette) ? 0.055 : 0.09;
  };
  recolor(palette);
  return { field, mesh, geometry, material, recolor };
}

function createTerrainContourLattice(
  field: ReturnType<typeof createObservatoryTerrainField>,
  palette: ThreeObservatoryPalette
) {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const samplesPerContour = 34;
  for (let z = -18; z >= -426; z -= 28) {
    for (let index = 0; index < samplesPerContour - 1; index += 1) {
      const x0 = -104 + (index / (samplesPerContour - 1)) * 208;
      const x1 = -104 + ((index + 1) / (samplesPerContour - 1)) * 208;
      vertices.push(
        x0, field.sampleHeight(x0, z) + 0.18, z,
        x1, field.sampleHeight(x1, z) + 0.18, z
      );
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  const material = new THREE.LineBasicMaterial({
    name: "TerrainContourAtmosphericLineMaterial",
    color: palette.orbit.clone().lerp(palette.metal, 0.34),
    transparent: true,
    opacity: isLightWorldPalette(palette) ? 0.09 : 0.14,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = "TerrainContourAtmosphericLines";
  lines.renderOrder = -3;
  lines.userData = { role: "terrain-parallax-contours", contourSpacing: 28 };
  return { lines, geometry, material };
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

function createCelestialAnchor(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette) {
  const radius = 68;
  const widthSegments = quality.worldDetail === 1 ? 32 : quality.worldDetail === 2 ? 48 : 64;
  const geometry = new THREE.SphereGeometry(radius, widthSegments, Math.round(widthSegments * 0.62));
  const positions = geometry.getAttribute("position");
  const normal = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    normal.fromBufferAttribute(positions, index).normalize();
    const continental =
      Math.sin(normal.x * 13 + normal.z * 9) * 1.35 +
      Math.cos(normal.y * 17 - normal.x * 7) * 0.82 +
      Math.sin((normal.x + normal.y + normal.z) * 31) * 0.38;
    const craterBand = Math.exp(-((normal.y + 0.18) ** 2) / 0.025) * Math.sin(normal.x * 41) * 0.72;
    const displaced = radius + continental + craterBand;
    positions.setXYZ(index, normal.x * displaced, normal.y * displaced, normal.z * displaced);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    name: "GiantCelestialStrataMaterial",
    color: palette.particleBase.clone().multiplyScalar(0.72),
    emissive: palette.orbit.clone(),
    emissiveIntensity: 0.06,
    metalness: 0.03,
    roughness: 0.97,
    transparent: true,
    opacity: isLightWorldPalette(palette) ? 0.04 : 0.065,
    depthWrite: false,
    dithering: true
  });
  const body = new THREE.Mesh(geometry, material);
  body.name = "GiantStratifiedCelestialBody";
  body.position.set(-105, 98, -438);
  body.userData = { generator: "deformed-sphere-strata", layer: "deep-background" };

  const haloMaterial = new THREE.MeshBasicMaterial({
    name: "CelestialLimbHaloMaterial",
    color: palette.orbit.clone(),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.055, 32, 20), haloMaterial);
  halo.name = "CelestialLimbHalo";
  halo.position.copy(body.position);

  const debrisMaximum = quality.worldDetail === 1 ? 28 : quality.worldDetail === 2 ? 56 : 84;
  const debrisGeometry = new THREE.DodecahedronGeometry(1, 0);
  const debrisMaterial = new THREE.MeshStandardMaterial({
    name: "CelestialDebrisMaterial",
    color: palette.metal.clone(),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.02,
    metalness: 0.12,
    roughness: 0.9,
    transparent: true,
    opacity: isLightWorldPalette(palette) ? 0.13 : 0.2,
    depthWrite: false,
    dithering: true
  });
  const debris = new THREE.InstancedMesh(debrisGeometry, debrisMaterial, debrisMaximum);
  debris.name = "CelestialDebrisArcInstances";
  debris.userData = { layer: "deep-background", maximumCount: debrisMaximum };
  const random = createSeededRandom(WORLD_SEED ^ 0x43454c45);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  for (let index = 0; index < debrisMaximum; index += 1) {
    const angle = (index / debrisMaximum) * Math.PI * 1.38 - Math.PI * 0.25 + randomSigned(random) * 0.035;
    const orbitRadius = radius * (1.35 + random() * 0.24);
    position.set(
      body.position.x + Math.cos(angle) * orbitRadius,
      body.position.y + Math.sin(angle) * orbitRadius * 0.3,
      body.position.z + Math.sin(angle) * orbitRadius * 0.78
    );
    quaternion.setFromEuler(new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI));
    const size = 0.28 + random() ** 2 * 1.8;
    scale.set(size * (0.7 + random()), size, size * (0.6 + random()));
    matrix.compose(position, quaternion, scale);
    debris.setMatrixAt(index, matrix);
  }
  debris.instanceMatrix.needsUpdate = true;

  const group = new THREE.Group();
  group.name = "CelestialDeepBackgroundLayer";
  group.add(body, halo, debris);
  return { group, body, material, haloMaterial, debrisMaterial, debris, debrisMaximum };
}

function createGroundLightway(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette, sampleHeight: (x: number, z: number) => number) {
  const route = [
    [0, 20],
    [-13, -34],
    [17, -91],
    [31, -149],
    [2, -210],
    [-27, -271],
    [-8, -329],
    [16, -378]
  ] as const;
  const material = new THREE.MeshStandardMaterial({
    name: "RouteLightwayEmissiveMaterial",
    color: palette.afterlight.clone(),
    emissive: palette.afterlight.clone(),
    emissiveIntensity: 1.75,
    metalness: 0.24,
    roughness: 0.28,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
    dithering: true
  });
  const group = new THREE.Group();
  group.name = "ContinuousGroundLightway";
  group.userData = { role: "route-continuity", fixedWorldCoordinates: true };
  for (const offset of [-1.35, 1.35]) {
    const points = route.map(([x, z]) => new THREE.Vector3(x + offset, sampleHeight(x + offset, z) + 0.32, z));
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(curve, quality.orbitSegments * 2, 0.08, 5, false),
      material
    );
    rail.name = `GroundLightwayRail:${offset < 0 ? "left" : "right"}`;
    group.add(rail);
  }
  return { group, material };
}

function createAtmosphereVeils(palette: ThreeObservatoryPalette) {
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
      float horizontal = smoothstep(0.0, 0.28, vUv.x) * (1.0 - smoothstep(0.72, 1.0, vUv.x));
      float vertical = smoothstep(0.0, 0.52, vUv.y) * (1.0 - smoothstep(0.74, 1.0, vUv.y));
      float bands = 0.72 + sin(vUv.x * 21.0 + vUv.y * 8.0) * 0.08;
      gl_FragColor = vec4(uColor, horizontal * vertical * bands * uOpacity);
    }
  `;
  const material = new THREE.ShaderMaterial({
    name: "AtmosphereDepthVeilMaterial",
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: palette.fog.clone() },
      uOpacity: { value: 0.24 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending
  });
  const group = new THREE.Group();
  group.name = "AtmosphereDepthVeils";
  for (const [index, z] of [-104, -230, -332].entries()) {
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(150, 48, 1, 1), material);
    veil.name = `AtmosphereDepthVeil:${index + 1}`;
    veil.position.set(index % 2 === 0 ? -14 : 18, 14 + index * 5, z);
    veil.rotation.y = index % 2 === 0 ? 0.12 : -0.14;
    group.add(veil);
  }
  return { group, material };
}

export function createProceduralObservatoryWorld(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette
): ProceduralObservatoryWorld {
  const group = new THREE.Group();
  group.name = "ObservatoryWorldV3FixedCoordinates";
  group.userData = {
    worldVersion: 3,
    coordinateSpan: OBSERVATORY_WORLD_SPAN,
    fixedWorldCoordinates: true,
    characterParticles: false
  };

  const terrain = createTerrainSurface(quality, palette);
  const terrainContours = createTerrainContourLattice(terrain.field, palette);
  const stars = createEnvironmentalStars(quality.starCount, palette);
  const celestial = createCelestialAnchor(quality, palette);
  const kit = createObservatoryKit(quality, palette, terrain.field);
  const lightway = createGroundLightway(quality, palette, terrain.field.sampleHeight);
  const atmosphere = createAtmosphereVeils(palette);
  let atmosphereOpacityScale = isLightWorldPalette(palette) ? 0.48 : 1;
  atmosphere.group.visible = quality.worldDetail > 1;
  kit.setQuality(quality);
  group.add(
    stars.points,
    celestial.group,
    terrain.mesh,
    terrainContours.lines,
    lightway.group,
    kit.group,
    atmosphere.group
  );

  const hemisphere = new THREE.HemisphereLight(palette.particleBase.clone(), palette.fog.clone(), 0.52);
  hemisphere.name = "WorldSkyFill";
  const lunarLight = new THREE.DirectionalLight(palette.orbit.clone(), 1.1);
  lunarLight.name = "CelestialKeyLight";
  lunarLight.position.set(-120, 170, -300);
  const signalLight = new THREE.PointLight(palette.signal.clone(), 3.1, 92, 2);
  signalLight.name = "SignalGateLocalLight";
  signalLight.position.set(0, 18, -12);
  const afterlight = new THREE.PointLight(palette.afterlight.clone(), 2.2, 115, 2);
  afterlight.name = "ArchiveAfterlightLocalLight";
  afterlight.position.set(0, 24, -352);
  const lights: THREE.Light[] = [hemisphere, lunarLight, signalLight, afterlight];

  let moonIntensity = 0;
  let afterlightIntensity = 0;

  return {
    group,
    lights,
    update(state, elapsedSeconds, deltaSeconds) {
      moonIntensity = THREE.MathUtils.damp(moonIntensity, state.moonIntensity, 2.6, deltaSeconds);
      afterlightIntensity = THREE.MathUtils.damp(afterlightIntensity, state.afterlightIntensity, 2.6, deltaSeconds);
      // Deliberately never transform `group`: all landmarks occupy authored world coordinates.
      stars.points.rotation.y = Math.sin(elapsedSeconds * 0.0012) * 0.012;
      celestial.body.rotation.y = elapsedSeconds * 0.0018;
      celestial.material.emissiveIntensity = 0.025 + moonIntensity * 0.09;
      celestial.haloMaterial.opacity = 0.025 + moonIntensity * 0.07;
      celestial.debrisMaterial.emissiveIntensity = 0.012 + moonIntensity * 0.035;
      terrain.material.emissiveIntensity = 0.012 + state.ringIntensity * 0.022;
      lightway.material.emissiveIntensity = 0.75 + state.canyonIntensity * 0.8 + afterlightIntensity * 1.25;
      atmosphere.material.uniforms.uOpacity.value =
        (0.12 + state.fogDensity * 12 + afterlightIntensity * 0.05) * atmosphereOpacityScale;
      kit.update(state, elapsedSeconds, deltaSeconds);
      signalLight.intensity = 0.8 + state.signalIntensity * 3.1;
      lunarLight.intensity = 0.42 + moonIntensity * 1.05;
      afterlight.intensity = 0.4 + afterlightIntensity * 2.8;
    },
    setPalette(nextPalette) {
      stars.material.color.copy(nextPalette.particleBase);
      terrain.recolor(nextPalette);
      terrainContours.material.color.copy(nextPalette.orbit).lerp(nextPalette.metal, 0.34);
      const lightPalette = isLightWorldPalette(nextPalette);
      terrainContours.material.opacity = lightPalette ? 0.09 : 0.14;
      celestial.material.color.copy(nextPalette.particleBase).multiplyScalar(0.72);
      celestial.material.emissive.copy(nextPalette.orbit);
      celestial.material.opacity = lightPalette ? 0.04 : 0.065;
      celestial.haloMaterial.color.copy(nextPalette.orbit);
      celestial.debrisMaterial.color.copy(nextPalette.metal);
      celestial.debrisMaterial.emissive.copy(nextPalette.fog);
      celestial.debrisMaterial.opacity = lightPalette ? 0.13 : 0.2;
      lightway.material.color.copy(nextPalette.afterlight);
      lightway.material.emissive.copy(nextPalette.afterlight);
      atmosphere.material.uniforms.uColor.value.copy(nextPalette.fog);
      atmosphereOpacityScale = lightPalette ? 0.48 : 1;
      kit.setPalette(nextPalette);
      hemisphere.color.copy(nextPalette.particleBase);
      hemisphere.groundColor.copy(nextPalette.fog);
      lunarLight.color.copy(nextPalette.orbit);
      signalLight.color.copy(nextPalette.signal);
      afterlight.color.copy(nextPalette.afterlight);
    },
    setQuality(nextQuality) {
      stars.geometry.setDrawRange(0, Math.min(stars.maximumCount, nextQuality.starCount));
      celestial.debris.count = Math.min(celestial.debrisMaximum, Math.max(18, nextQuality.starCount / 10));
      atmosphere.group.visible = nextQuality.worldDetail > 1;
      kit.setQuality(nextQuality);
    },
    dispose() {
      const resources = collectResources(group);
      resources.geometries.forEach((geometry) => geometry.dispose());
      resources.materials.forEach((material) => material.dispose());
      group.clear();
    }
  };
}
