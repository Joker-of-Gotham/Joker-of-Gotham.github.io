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
    transparent: false,
    opacity: 1,
    depthWrite: true,
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
    transparent: false,
    opacity: 1,
    depthWrite: true,
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

function createRegolithBoulderField(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  sampleHeight: (x: number, z: number) => number
) {
  const maximumCount = quality.worldDetail === 1 ? 54 : quality.worldDetail === 2 ? 96 : 138;
  const geometry = new THREE.IcosahedronGeometry(1, quality.worldDetail === 1 ? 0 : 1);
  const material = new THREE.MeshStandardMaterial({
    name: "RegolithBoulderLayeredStoneMaterial",
    color: palette.metal.clone().lerp(palette.particleBase, 0.22),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.018,
    metalness: 0.05,
    roughness: 0.96,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    dithering: true
  });
  const instances = new THREE.InstancedMesh(geometry, material, maximumCount);
  instances.name = "RegolithForegroundAndRouteBoulders";
  instances.userData = { role: "foreground-occlusion-and-scale", maximumCount };

  const random = createSeededRandom(WORLD_SEED ^ 0x524f434b);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  for (let index = 0; index < maximumCount; index += 1) {
    const lane = index % 6;
    const routeT = index / Math.max(1, maximumCount - 1);
    const z = 18 - routeT * 430 + randomSigned(random) * 11;
    const routeX = Math.sin(routeT * Math.PI * 5.2) * 18 + Math.cos(routeT * Math.PI * 2.1) * 9;
    const side = lane < 3 ? -1 : 1;
    const x = routeX + side * (10 + random() * 52) + randomSigned(random) * 8;
    const radius = 0.28 + random() ** 2 * (index < 18 ? 3.4 : 1.8);
    position.set(x, sampleHeight(x, z) + radius * 0.42, z);
    quaternion.setFromEuler(new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI));
    scale.set(radius * (0.55 + random() * 1.6), radius * (0.34 + random() * 0.9), radius * (0.52 + random() * 1.3));
    matrix.compose(position, quaternion, scale);
    instances.setMatrixAt(index, matrix);
  }
  instances.instanceMatrix.needsUpdate = true;
  return { instances, geometry, material, maximumCount };
}

function createInteriorDepthOfFieldRoom(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette) {
  const group = new THREE.Group();
  group.name = "InteriorDepthOfFieldRoom";
  group.position.set(-24, 5.6, -48);
  group.rotation.y = -0.28;
  group.userData = {
    role: "foreground-observatory-room",
    referenceExample: "webgpu_postprocessing_dof_basic",
    construction: "layered-near-mid-far-focus-planes",
    fixedWorldCoordinates: true,
  };

  const floorMaterial = new THREE.MeshStandardMaterial({
    name: "InteriorRoomPolishedStoneMaterial",
    color: palette.metal.clone().lerp(palette.fog, 0.18),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.03,
    metalness: 0.16,
    roughness: 0.58,
    envMapIntensity: 0.42,
    dithering: true,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    name: "InteriorRoomGlassConsoleMaterial",
    color: palette.signal.clone().lerp(palette.fog, 0.26),
    emissive: palette.signal.clone(),
    emissiveIntensity: 0.42,
    metalness: 0.04,
    roughness: 0.22,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    toneMapped: false,
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    name: "InteriorRoomRailMaterial",
    color: palette.metal.clone(),
    emissive: palette.orbit.clone(),
    emissiveIntensity: 0.04,
    metalness: 0.38,
    roughness: 0.44,
    envMapIntensity: 0.52,
    dithering: true,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(42, 0.36, 26, 8, 1, 8), floorMaterial);
  floor.name = "InteriorDepthOfFieldRoomFloor";
  floor.position.y = -1.1;
  group.add(floor);

  const nearPortal = new THREE.Group();
  nearPortal.name = "InteriorDepthOfFieldRoomNearPortal";
  nearPortal.position.z = 10.2;
  const portalSideGeometry = new THREE.BoxGeometry(1.2, 10.8, 1.1);
  for (const side of [-1, 1]) {
    const portalSide = new THREE.Mesh(portalSideGeometry, railMaterial);
    portalSide.name = `InteriorDepthOfFieldRoomPortalPier:${side < 0 ? "left" : "right"}`;
    portalSide.position.set(side * 11.8, 4, 0);
    portalSide.rotation.z = side * 0.045;
    nearPortal.add(portalSide);
  }
  const portalLintel = new THREE.Mesh(new THREE.BoxGeometry(25.2, 1.1, 1.1), railMaterial);
  portalLintel.name = "InteriorDepthOfFieldRoomPortalLintel";
  portalLintel.position.y = 9.1;
  nearPortal.add(portalLintel);
  group.add(nearPortal);

  const observationWall = new THREE.Group();
  observationWall.name = "InteriorDepthOfFieldRoomObservationWall";
  observationWall.position.z = -12.8;
  const wallPanelGeometry = new THREE.BoxGeometry(4.4, 11.2, 0.48);
  for (let index = 0; index < 9; index += 1) {
    if (index % 2 === 1) continue;
    const panel = new THREE.Mesh(wallPanelGeometry, floorMaterial);
    panel.name = `InteriorDepthOfFieldRoomWallPier:${index + 1}`;
    panel.position.set(-17.6 + index * 4.4, 4.5, 0);
    observationWall.add(panel);
  }
  const wallLintel = new THREE.Mesh(new THREE.BoxGeometry(44, 1.5, 0.55), floorMaterial);
  wallLintel.name = "InteriorDepthOfFieldRoomWallLintel";
  wallLintel.position.y = 9.35;
  observationWall.add(wallLintel);
  group.add(observationWall);

  const archCount = quality.worldDetail === 1 ? 4 : quality.worldDetail === 2 ? 6 : 8;
  const columnGeometry = new THREE.CylinderGeometry(0.26, 0.34, 8.8, 10);
  const ribGeometry = new THREE.TorusGeometry(2.55, 0.07, 6, 28, Math.PI);
  for (let index = 0; index < archCount; index += 1) {
    const x = -18 + (36 * index) / Math.max(1, archCount - 1);
    const column = new THREE.Mesh(columnGeometry, railMaterial);
    column.name = `InteriorDepthOfFieldRoomColumn:${index + 1}`;
    column.position.set(x, 3.1, -12.45);
    group.add(column);

    const rib = new THREE.Mesh(ribGeometry, railMaterial);
    rib.name = `InteriorDepthOfFieldRoomArchRib:${index + 1}`;
    rib.position.set(x, 7.2, -12.18);
    rib.rotation.z = Math.PI;
    group.add(rib);
  }

  const highDetail = new THREE.Group();
  highDetail.name = "InteriorDepthOfFieldRoomHighDetail";
  highDetail.visible = quality.worldDetail > 2;
  const ceilingRailGeometry = new THREE.BoxGeometry(0.16, 0.16, 23.5);
  for (let index = 0; index < 11; index += 1) {
    const ceilingRail = new THREE.Mesh(ceilingRailGeometry, railMaterial);
    ceilingRail.name = `InteriorDepthOfFieldRoomCeilingRail:${index + 1}`;
    ceilingRail.position.set(-17.5 + index * 3.5, 9.45, -1.1);
    highDetail.add(ceilingRail);
  }

  const floorInsetGeometry = new THREE.BoxGeometry(2.65, 0.055, 19.5);
  for (let index = 0; index < 12; index += 1) {
    const floorInset = new THREE.Mesh(floorInsetGeometry, railMaterial);
    floorInset.name = `InteriorDepthOfFieldRoomFloorInset:${index + 1}`;
    floorInset.position.set(-16.2 + index * 2.95, -0.89, -0.6);
    highDetail.add(floorInset);
  }

  const consoleCount = quality.worldDetail === 1 ? 5 : quality.worldDetail === 2 ? 8 : 11;
  const consoleGeometry = new THREE.BoxGeometry(2.2, 0.12, 1.15);
  const consoleBaseGeometry = new THREE.CylinderGeometry(0.14, 0.24, 1.75, 8);
  for (let index = 0; index < consoleCount; index += 1) {
    const angle = -0.72 + (index / Math.max(1, consoleCount - 1)) * 1.44;
    const radius = 9.5;
    const console = new THREE.Mesh(consoleGeometry, glassMaterial);
    console.name = `InteriorDepthOfFieldRoomFloatingConsole:${index + 1}`;
    console.position.set(Math.sin(angle) * radius, 1.8 + Math.sin(index) * 0.18, Math.cos(angle) * 2.5 - 4.8);
    console.rotation.set(-0.32, angle * 0.28, 0);
    group.add(console);

    const base = new THREE.Mesh(consoleBaseGeometry, railMaterial);
    base.name = `InteriorDepthOfFieldRoomConsolePedestal:${index + 1}`;
    base.position.set(console.position.x, 0.05, console.position.z + 0.28);
    base.rotation.z = -angle * 0.08;
    group.add(base);
  }

  const focalLens = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.52, 48), glassMaterial);
  focalLens.name = "InteriorDepthOfFieldRoomFocalLens";
  focalLens.position.set(0, 5.2, -12.46);
  group.add(focalLens, highDetail);

  return { group, floorMaterial, glassMaterial, railMaterial, focalLens, highDetail };
}

function createKeyframedSignalArchitecture(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette) {
  const group = new THREE.Group();
  group.name = "KeyframedSignalArchitecture";
  group.position.set(22, 8, -124);
  group.userData = {
    role: "animated-architectural-landmark",
    referenceExample: "webgl_animation_keyframes",
    animationSystem: "three-animation-mixer-quaternion-track",
    fixedWorldCoordinates: true,
  };

  const material = new THREE.MeshStandardMaterial({
    name: "KeyframedSignalArchitectureMaterial",
    color: palette.metal.clone().lerp(palette.orbit, 0.2),
    emissive: palette.signal.clone(),
    emissiveIntensity: 0.08,
    metalness: 0.42,
    roughness: 0.36,
    envMapIntensity: 0.58,
    dithering: true,
  });
  const membraneMaterial = new THREE.MeshStandardMaterial({
    name: "KeyframedSignalArchitectureMembraneMaterial",
    color: palette.orbit.clone().lerp(palette.signal, 0.34),
    emissive: palette.signal.clone(),
    emissiveIntensity: 0.38,
    metalness: 0.05,
    roughness: 0.32,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const terrace = new THREE.Mesh(new THREE.CylinderGeometry(8.8, 10.4, 1.1, 16), material);
  terrace.name = "KeyframedSignalArchitectureTerrace";
  terrace.position.y = -2.35;
  group.add(terrace);

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.4, 16, 12), material);
  tower.name = "KeyframedSignalArchitectureCoreTower";
  tower.position.y = 5.4;
  group.add(tower);

  const buttressGeometry = new THREE.BoxGeometry(0.7, 11.8, 1.15);
  const buttressRadius = 3.15;
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const buttress = new THREE.Mesh(buttressGeometry, material);
    buttress.name = `KeyframedSignalArchitectureButtress:${index + 1}`;
    buttress.position.set(Math.cos(angle) * buttressRadius, 3.25, Math.sin(angle) * buttressRadius);
    buttress.rotation.set(0, -angle, Math.sin(angle) * 0.08);
    group.add(buttress);
  }

  const crown = new THREE.Group();
  crown.name = "KeyframedSignalArchitectureDeployableCrown";
  crown.position.y = 9.4;
  group.add(crown);

  const rings: THREE.Mesh[] = [];
  const ringCount = quality.worldDetail === 1 ? 2 : 4;
  for (let index = 0; index < ringCount; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5 + index * 1.35, 0.08, 6, quality.orbitSegments), membraneMaterial);
    ring.name = `KeyframedSignalArchitectureOrbitRing:${index + 1}`;
    ring.position.y = -1 + index * 1.15;
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.z = index * 0.42;
    rings.push(ring);
    crown.add(ring);
  }

  const bladeAnchors: THREE.Group[] = [];
  const bladeGeometry = new THREE.BoxGeometry(0.32, 7.4, 0.18);
  for (let index = 0; index < 6; index += 1) {
    const anchor = new THREE.Group();
    anchor.name = `KeyframedSignalArchitectureBladeAnchor:${index + 1}`;
    anchor.rotation.y = (index / 6) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeometry, material);
    blade.name = `KeyframedSignalArchitectureSolarBlade:${index + 1}`;
    blade.position.set(0, 3.2, 4.6);
    blade.rotation.x = -0.2;
    anchor.add(blade);
    bladeAnchors.push(anchor);
    crown.add(anchor);
  }

  const highDetail = new THREE.Group();
  highDetail.name = "KeyframedSignalArchitectureHighDetail";
  highDetail.visible = quality.worldDetail > 2;
  const apertureGeometry = new THREE.RingGeometry(0.2, 0.34, 12);
  for (let level = 0; level < 6; level += 1) {
    for (let side = 0; side < 4; side += 1) {
      const aperture = new THREE.Mesh(apertureGeometry, membraneMaterial);
      aperture.name = `KeyframedSignalArchitectureAperture:${level + 1}:${side + 1}`;
      const angle = (side / 4) * Math.PI * 2;
      aperture.position.set(Math.cos(angle) * 1.78, 0.8 + level * 1.82, Math.sin(angle) * 1.78);
      aperture.rotation.set(0, -angle + Math.PI * 0.5, 0);
      highDetail.add(aperture);
    }
  }
  group.add(highDetail);

  const keyframeQuaternions = [
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.08, -0.035)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.055, Math.PI * 0.22, 0.025)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.025, Math.PI * 0.48, 0.055)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.035, Math.PI * 0.74, -0.02)),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI * 0.98, -0.035)),
  ];
  const crownTrack = new THREE.QuaternionKeyframeTrack(
    `${crown.name}.quaternion`,
    [0, 4.5, 9, 13.5, 18],
    keyframeQuaternions.flatMap((quaternion) => quaternion.toArray()),
  );
  const deployClip = new THREE.AnimationClip("SignalArchitectureDeployCycle", 18, [crownTrack]);
  const mixer = new THREE.AnimationMixer(group);
  const action = mixer.clipAction(deployClip);
  action.setLoop(THREE.LoopRepeat, Infinity).play();

  return {
    group,
    material,
    membraneMaterial,
    crown,
    rings,
    bladeAnchors,
    highDetail,
    mixer,
    action,
  };
}

function createSponzaInspiredArchivePalace(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette) {
  const group = new THREE.Group();
  group.name = "SponzaInspiredArchivePalace";
  group.position.set(-12, 5.2, -255);
  group.userData = {
    role: "palace-scale-archive-hall",
    referenceExample: "webgl_lightprobes_sponza",
    lightingModel: "spherical-harmonics-probe-with-local-afterlight",
    fixedWorldCoordinates: true,
  };

  const stoneMaterial = new THREE.MeshStandardMaterial({
    name: "ArchivePalaceStoneMaterial",
    color: palette.metal.clone().lerp(palette.fog, 0.28),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.04,
    metalness: 0.1,
    roughness: 0.72,
    envMapIntensity: 0.34,
    dithering: true,
  });
  const lightMaterial = new THREE.MeshStandardMaterial({
    name: "ArchivePalaceProbeGlowMaterial",
    color: palette.afterlight.clone(),
    emissive: palette.afterlight.clone(),
    emissiveIntensity: 0.9,
    metalness: 0.04,
    roughness: 0.25,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    toneMapped: false,
  });
  const textileMaterial = new THREE.MeshStandardMaterial({
    name: "ArchivePalaceTextileMaterial",
    color: palette.orbit.clone().lerp(palette.afterlight, 0.3),
    emissive: palette.afterlight.clone(),
    emissiveIntensity: 0.12,
    metalness: 0,
    roughness: 0.8,
    side: THREE.DoubleSide,
    dithering: true,
  });

  const nave = new THREE.Mesh(new THREE.BoxGeometry(48, 1.0, 30), stoneMaterial);
  nave.name = "SponzaInspiredArchivePalaceNave";
  nave.position.y = -0.4;
  group.add(nave);

  const rows = quality.worldDetail === 1 ? 4 : quality.worldDetail === 2 ? 6 : 8;
  const columnGeometry = new THREE.CylinderGeometry(0.45, 0.62, 10.5, 12);
  const capitalGeometry = new THREE.BoxGeometry(1.55, 0.42, 1.55);
  const archGeometry = new THREE.TorusGeometry(19, 0.16, 8, 48, Math.PI);
  const probeOrbs: THREE.Mesh[] = [];
  for (let row = 0; row < rows; row += 1) {
    const z = -12 + (24 * row) / Math.max(1, rows - 1);
    for (const side of [-1, 1]) {
      const column = new THREE.Mesh(columnGeometry, stoneMaterial);
      column.name = `SponzaInspiredArchivePalaceColumn:${side}:${row + 1}`;
      column.position.set(side * 19, 4.2, z);
      group.add(column);

      const capital = new THREE.Mesh(capitalGeometry, stoneMaterial);
      capital.name = `SponzaInspiredArchivePalaceCapital:${side}:${row + 1}`;
      capital.position.set(side * 19, 9.38, z);
      capital.rotation.y = row * 0.11;
      group.add(capital);
    }

    const arch = new THREE.Mesh(archGeometry, stoneMaterial);
    arch.name = `SponzaInspiredArchivePalaceVaultArch:${row + 1}`;
    arch.position.set(0, 9.1, z);
    arch.rotation.z = Math.PI;
    group.add(arch);

    const probe = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), lightMaterial);
    probe.name = `SponzaInspiredArchivePalaceLightProbe:${row + 1}`;
    probe.position.set(0, 7.5, z);
    probeOrbs.push(probe);
    group.add(probe);
  }

  const gallery = new THREE.Group();
  gallery.name = "SponzaInspiredArchivePalaceGallery";
  const gallerySlabGeometry = new THREE.BoxGeometry(4.8, 0.55, 29.2);
  const galleryRailGeometry = new THREE.BoxGeometry(0.16, 1.55, 29.2);
  for (const side of [-1, 1]) {
    const slab = new THREE.Mesh(gallerySlabGeometry, stoneMaterial);
    slab.name = `SponzaInspiredArchivePalaceGallerySlab:${side}`;
    slab.position.set(side * 16.8, 7.8, 0);
    gallery.add(slab);

    const rail = new THREE.Mesh(galleryRailGeometry, stoneMaterial);
    rail.name = `SponzaInspiredArchivePalaceGalleryRail:${side}`;
    rail.position.set(side * 14.4, 8.75, 0);
    gallery.add(rail);
  }
  group.add(gallery);

  const highDetail = new THREE.Group();
  highDetail.name = "SponzaInspiredArchivePalaceHighDetail";
  highDetail.visible = quality.worldDetail > 2;
  const inlayGeometry = new THREE.BoxGeometry(2.6, 0.07, 2.6);
  for (let row = 0; row < 10; row += 1) {
    const inlay = new THREE.Mesh(inlayGeometry, row % 2 === 0 ? lightMaterial : stoneMaterial);
    inlay.name = `SponzaInspiredArchivePalaceFloorInlay:${row + 1}`;
    inlay.position.set(0, 0.13, -11.7 + row * 2.6);
    inlay.rotation.y = Math.PI * 0.25;
    highDetail.add(inlay);
  }

  const ceilingBeamGeometry = new THREE.BoxGeometry(40.5, 0.22, 0.28);
  for (let row = 0; row < 9; row += 1) {
    const ceilingBeam = new THREE.Mesh(ceilingBeamGeometry, stoneMaterial);
    ceilingBeam.name = `SponzaInspiredArchivePalaceCofferBeam:${row + 1}`;
    ceilingBeam.position.set(0, 12.2, -12 + row * 3);
    highDetail.add(ceilingBeam);
  }

  const bannerGeometry = new THREE.PlaneGeometry(3.8, 6.6, 1, 8);
  for (let index = 0; index < 4; index += 1) {
    const banner = new THREE.Mesh(bannerGeometry, textileMaterial);
    banner.name = `SponzaInspiredArchivePalaceArchiveBanner:${index + 1}`;
    banner.position.set(index < 2 ? -14.25 : 14.25, 5.35, index % 2 === 0 ? -7.5 : 7.5);
    banner.rotation.y = index < 2 ? Math.PI * 0.5 : -Math.PI * 0.5;
    highDetail.add(banner);
  }

  const portalGeometry = new THREE.TorusGeometry(7.4, 0.42, 10, 48, Math.PI);
  for (const z of [-15.05, 15.05]) {
    const portal = new THREE.Mesh(portalGeometry, stoneMaterial);
    portal.name = `SponzaInspiredArchivePalaceMonumentalPortal:${z < 0 ? "north" : "south"}`;
    portal.position.set(0, 6.4, z);
    portal.rotation.z = Math.PI;
    portal.rotation.y = z < 0 ? 0 : Math.PI;
    highDetail.add(portal);
  }
  group.add(highDetail);

  const lightProbe = new THREE.LightProbe(undefined, 0.72);
  lightProbe.name = "SponzaInspiredArchivePalaceSphericalHarmonicsLightProbe";
  lightProbe.position.set(0, 7.2, 0);
  lightProbe.sh.coefficients[0]
    .set(palette.afterlight.r, palette.afterlight.g, palette.afterlight.b)
    .multiplyScalar(0.16);
  lightProbe.sh.coefficients[1]
    .set(palette.orbit.r, palette.orbit.g, palette.orbit.b)
    .multiplyScalar(0.045);
  group.add(lightProbe);

  const localAfterlight = new THREE.PointLight(palette.afterlight.clone(), 0.85, 48, 2);
  localAfterlight.name = "SponzaInspiredArchivePalaceLocalAfterlight";
  localAfterlight.position.set(0, 8.5, 0);
  group.add(localAfterlight);

  return {
    group,
    stoneMaterial,
    lightMaterial,
    textileMaterial,
    probeOrbs,
    highDetail,
    lightProbe,
    localAfterlight,
  };
}

function createThreeDTilesInspiredTownField(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette) {
  const group = new THREE.Group();
  group.name = "ThreeDTilesInspiredTownField";
  group.position.set(18, 4.2, -340);
  group.userData = {
    role: "distant-town-instancing",
    referenceExample: "webgl_loader_3dtiles",
    hierarchy: "four-authored-spatial-tiles-with-distance-lod",
    fixedWorldCoordinates: true,
  };

  const count = quality.worldDetail === 1 ? 48 : quality.worldDetail === 2 ? 92 : 148;
  const geometry = new THREE.BoxGeometry(1, 1, 1, 1, 2, 1);
  const material = new THREE.MeshStandardMaterial({
    name: "ThreeDTilesTownBuildingMaterial",
    color: palette.metal.clone().lerp(palette.orbit, 0.16),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.04,
    metalness: 0.16,
    roughness: 0.68,
    envMapIntensity: 0.28,
    dithering: true,
  });
  const instances = new THREE.InstancedMesh(geometry, material, count);
  instances.name = "ThreeDTilesInspiredTownInstances";
  instances.userData = { maximumCount: count, semantic: "tile-building-shells" };

  const roofMaterial = new THREE.MeshStandardMaterial({
    name: "ThreeDTilesTownRoofMaterial",
    color: palette.fog.clone().lerp(palette.metal, 0.7),
    emissive: palette.orbit.clone(),
    emissiveIntensity: 0.055,
    metalness: 0.34,
    roughness: 0.52,
    dithering: true,
  });
  const roofInstances = new THREE.InstancedMesh(new THREE.ConeGeometry(0.82, 0.72, 4), roofMaterial, count);
  roofInstances.name = "ThreeDTilesInspiredTownRoofInstances";
  roofInstances.userData = { maximumCount: count, semantic: "tile-roof-caps" };

  const windowMaterial = new THREE.MeshBasicMaterial({
    name: "ThreeDTilesTownWindowMaterial",
    color: palette.afterlight.clone(),
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    toneMapped: false,
  });
  const windowInstances = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.52, 0.18), windowMaterial, count);
  windowInstances.name = "ThreeDTilesInspiredTownWindowInstances";
  windowInstances.userData = { maximumCount: count, semantic: "tile-window-signals" };

  const random = createSeededRandom(WORLD_SEED ^ 0x54494c45);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  for (let index = 0; index < count; index += 1) {
    const band = index % 8;
    const row = Math.floor(index / 8);
    const width = 1.1 + random() * 1.9;
    const height = 1.6 + random() * 7.2;
    const depth = 1.1 + random() * 1.8;
    const x = (band - 3.5) * (3.2 + random() * 0.9);
    const z = row * -3.2 + randomSigned(random) * 0.7;
    const yaw = randomSigned(random) * 0.08;
    position.set(x, height * 0.5, z);
    scale.set(width, height, depth);
    quaternion.setFromEuler(new THREE.Euler(0, yaw, 0));
    matrix.compose(position, quaternion, scale);
    instances.setMatrixAt(index, matrix);

    position.set(x, height + 0.36, z);
    scale.set(width * 0.78, 0.8 + random() * 0.5, depth * 0.78);
    matrix.compose(position, quaternion, scale);
    roofInstances.setMatrixAt(index, matrix);

    position.set(x + Math.sin(yaw) * depth * 0.52, height * 0.62, z + Math.cos(yaw) * depth * 0.52 + 0.02);
    scale.set(0.65 + width * 0.08, 0.55 + Math.min(1, height * 0.05), 1);
    quaternion.setFromEuler(new THREE.Euler(0, yaw, 0));
    matrix.compose(position, quaternion, scale);
    windowInstances.setMatrixAt(index, matrix);
  }
  instances.instanceMatrix.needsUpdate = true;
  roofInstances.instanceMatrix.needsUpdate = true;
  windowInstances.instanceMatrix.needsUpdate = true;
  group.add(instances, roofInstances, windowInstances);

  const roadMaterial = new THREE.MeshStandardMaterial({
    name: "ThreeDTilesTownRoadMaterial",
    color: palette.afterlight.clone().lerp(palette.metal, 0.45),
    emissive: palette.afterlight.clone(),
    emissiveIntensity: 0.28,
    metalness: 0.08,
    roughness: 0.5,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    toneMapped: false,
  });
  const spatialTiles = new THREE.Group();
  spatialTiles.name = "ThreeDTilesInspiredTownSpatialHierarchy";
  for (let index = 0; index < 4; index += 1) {
    const tile = new THREE.Group();
    tile.name = `ThreeDTilesInspiredTownTileNode:L${index < 2 ? 1 : 2}:${index + 1}`;
    tile.userData = {
      tileId: `observatory-town-${index + 1}`,
      geometricError: index < 2 ? 18 : 9,
      refinement: "ADD",
      boundingVolume: "authored-box",
    };
    spatialTiles.add(tile);
  }
  group.add(spatialTiles);

  for (const x of [-8, 0, 8]) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 58), roadMaterial);
    road.name = `ThreeDTilesInspiredTownLightRoad:${x}`;
    road.position.set(x, 0.08, -24);
    group.add(road);
  }

  const highDetail = new THREE.Group();
  highDetail.name = "ThreeDTilesInspiredTownHighDetail";
  highDetail.visible = quality.worldDetail > 2;
  for (let row = 0; row < 7; row += 1) {
    const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(30, 0.07, 0.16), roadMaterial);
    crossRoad.name = `ThreeDTilesInspiredTownCrossRoad:${row + 1}`;
    crossRoad.position.set(0, 0.075, -3.1 - row * 7.8);
    highDetail.add(crossRoad);
  }

  const plazaMaterial = new THREE.MeshStandardMaterial({
    name: "ThreeDTilesTownPlazaMaterial",
    color: palette.metal.clone().lerp(palette.afterlight, 0.2),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.04,
    metalness: 0.12,
    roughness: 0.74,
    dithering: true,
  });
  for (let level = 0; level < 3; level += 1) {
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(10.5 + level * 5.5, 11.5 + level * 5.5, 0.38, 16),
      plazaMaterial,
    );
    plaza.name = `ThreeDTilesInspiredTownTerrace:${level + 1}`;
    plaza.position.set(0, -0.35 - level * 0.4, -24 - level * 4.5);
    plaza.rotation.y = level * 0.16;
    highDetail.add(plaza);
  }

  const civicHigh = new THREE.Group();
  civicHigh.name = "ThreeDTilesInspiredTownCivicTowerHighLOD";
  const civicCore = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.8, 17, 10), material);
  civicCore.position.y = 8.5;
  civicHigh.add(civicCore);
  for (let level = 0; level < 4; level += 1) {
    const crown = new THREE.Mesh(new THREE.TorusGeometry(2.1 + level * 0.42, 0.1, 6, 24), roadMaterial);
    crown.position.y = 10.5 + level * 1.6;
    crown.rotation.x = Math.PI * 0.5;
    civicHigh.add(crown);
  }
  const civicLow = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, 17, 7), material);
  civicLow.name = "ThreeDTilesInspiredTownCivicTowerLowLOD";
  civicLow.position.y = 8.5;
  const civicLod = new THREE.LOD();
  civicLod.name = "ThreeDTilesInspiredTownCivicTowerDistanceLOD";
  civicLod.position.set(-1.5, 0, -27);
  civicLod.addLevel(civicHigh, 0);
  civicLod.addLevel(civicLow, 115);
  group.add(civicLod, highDetail);

  return {
    group,
    instances,
    roofInstances,
    windowInstances,
    material,
    roofMaterial,
    windowMaterial,
    roadMaterial,
    plazaMaterial,
    highDetail,
    maximumCount: count,
  };
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
    uniform float uMoon;
    uniform float uAfterlight;
    varying vec3 vWorldDirection;

    void main() {
      float height = clamp(vWorldDirection.y * 0.5 + 0.5, 0.0, 1.0);
      float horizon = 1.0 - smoothstep(0.08, 0.48, height);
      float moonLimb = smoothstep(0.985, 1.0, dot(vWorldDirection, normalize(vec3(-0.42, 0.58, -0.7))));
      vec3 color = mix(uHorizon, uZenith, smoothstep(0.0, 0.92, height));
      color += uSignal * moonLimb * (0.14 + uMoon * 0.26);
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
  group.name = "ObservatoryWorldV5ArchitecturalRealtime";
  group.userData = {
    worldVersion: 5,
    coordinateSpan: OBSERVATORY_WORLD_SPAN,
    fixedWorldCoordinates: true,
    characterParticles: false,
    livePlateDependency: false,
    visualSource: "procedural-pbr-threejs",
    referenceExamples: [
      "webgpu_postprocessing_dof_basic",
      "webgl_animation_keyframes",
      "webgl_lightprobes_sponza",
      "webgl_loader_3dtiles",
    ],
  };

  const terrain = createTerrainSurface(quality, palette);
  const terrainContours = createTerrainContourLattice(terrain.field, palette);
  const stars = createEnvironmentalStars(quality.starCount, palette);
  const celestial = createCelestialAnchor(quality, palette);
  const kit = createObservatoryKit(quality, palette, terrain.field);
  const lightway = createGroundLightway(quality, palette, terrain.field.sampleHeight);
  const boulders = createRegolithBoulderField(quality, palette, terrain.field.sampleHeight);
  const interiorRoom = createInteriorDepthOfFieldRoom(quality, palette);
  const signalArchitecture = createKeyframedSignalArchitecture(quality, palette);
  const archivePalace = createSponzaInspiredArchivePalace(quality, palette);
  const townField = createThreeDTilesInspiredTownField(quality, palette);
  const sky = createAtmosphericSky(palette);
  const atmosphere = createAtmosphereVeils(palette);
  let skyIsLight = isLightWorldPalette(palette);
  let atmosphereOpacityScale = isLightWorldPalette(palette) ? 0.48 : 1;
  atmosphere.group.visible = quality.worldDetail > 1;
  interiorRoom.group.visible = quality.worldDetail > 1;
  archivePalace.group.visible = quality.worldDetail > 1;
  kit.setQuality(quality);
  group.add(
    sky.group,
    stars.points,
    celestial.group,
    terrain.mesh,
    terrainContours.lines,
    boulders.instances,
    interiorRoom.group,
    signalArchitecture.group,
    archivePalace.group,
    townField.group,
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
      sky.skyMaterial.uniforms.uMoon.value = moonIntensity;
      sky.skyMaterial.uniforms.uAfterlight.value = afterlightIntensity;
      sky.horizonMaterial.opacity = (skyIsLight ? 0.06 : 0.13)
        + afterlightIntensity * 0.07
        + state.ringIntensity * 0.035;
      signalArchitecture.mixer.timeScale = 0.18 + state.signalIntensity * 0.52 + state.ringIntensity * 0.38;
      signalArchitecture.mixer.update(Math.min(deltaSeconds, 0.1));
      signalArchitecture.rings.forEach((ring, index) => {
        ring.rotation.z = elapsedSeconds * (0.08 + index * 0.012) + index * 0.42;
      });
      signalArchitecture.bladeAnchors.forEach((anchor, index) => {
        anchor.rotation.z = Math.sin(elapsedSeconds * 0.22 + index * 0.8) * (0.025 + state.signalIntensity * 0.035);
      });
      interiorRoom.focalLens.rotation.z = elapsedSeconds * 0.035;
      interiorRoom.glassMaterial.emissiveIntensity = 0.24 + state.signalIntensity * 0.38;
      archivePalace.lightMaterial.emissiveIntensity = 0.5 + afterlightIntensity * 0.8;
      archivePalace.localAfterlight.intensity = 0.34 + afterlightIntensity * 1.15;
      archivePalace.probeOrbs.forEach((probe, index) => {
        const pulse = 0.92 + Math.sin(elapsedSeconds * 0.5 + index * 0.7) * 0.08;
        probe.scale.setScalar(pulse);
      });
      townField.roadMaterial.emissiveIntensity = 0.16 + state.cityIntensity * 0.35;
      townField.windowMaterial.opacity = 0.36 + state.cityIntensity * 0.42;
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
      boulders.material.color.copy(nextPalette.metal).lerp(nextPalette.particleBase, 0.22);
      boulders.material.emissive.copy(nextPalette.fog);
      boulders.material.opacity = 1;
      celestial.material.color.copy(nextPalette.particleBase).multiplyScalar(0.72);
      celestial.material.emissive.copy(nextPalette.orbit);
      celestial.material.opacity = 1;
      celestial.haloMaterial.color.copy(nextPalette.orbit);
      celestial.debrisMaterial.color.copy(nextPalette.metal);
      celestial.debrisMaterial.emissive.copy(nextPalette.fog);
      celestial.debrisMaterial.opacity = 1;
      skyIsLight = lightPalette;
      sky.skyMaterial.uniforms.uZenith.value.copy(nextPalette.fog).lerp(nextPalette.particleBase, 0.18);
      sky.skyMaterial.uniforms.uHorizon.value.copy(nextPalette.fog).lerp(nextPalette.orbit, 0.24);
      sky.skyMaterial.uniforms.uSignal.value.copy(nextPalette.signal);
      sky.horizonMaterial.color.copy(nextPalette.orbit).lerp(nextPalette.metal, 0.2);
      sky.horizonMaterial.opacity = lightPalette ? 0.08 : 0.16;
      interiorRoom.floorMaterial.color.copy(nextPalette.metal).lerp(nextPalette.fog, 0.18);
      interiorRoom.floorMaterial.emissive.copy(nextPalette.fog);
      interiorRoom.glassMaterial.color.copy(nextPalette.signal).lerp(nextPalette.fog, 0.26);
      interiorRoom.glassMaterial.emissive.copy(nextPalette.signal);
      interiorRoom.glassMaterial.opacity = lightPalette ? 0.38 : 0.5;
      interiorRoom.railMaterial.color.copy(nextPalette.metal);
      interiorRoom.railMaterial.emissive.copy(nextPalette.orbit);
      signalArchitecture.material.color.copy(nextPalette.metal).lerp(nextPalette.orbit, 0.2);
      signalArchitecture.material.emissive.copy(nextPalette.signal);
      signalArchitecture.membraneMaterial.color.copy(nextPalette.orbit).lerp(nextPalette.signal, 0.34);
      signalArchitecture.membraneMaterial.emissive.copy(nextPalette.signal);
      archivePalace.stoneMaterial.color.copy(nextPalette.metal).lerp(nextPalette.fog, 0.28);
      archivePalace.stoneMaterial.emissive.copy(nextPalette.fog);
      archivePalace.lightMaterial.color.copy(nextPalette.afterlight);
      archivePalace.lightMaterial.emissive.copy(nextPalette.afterlight);
      archivePalace.lightMaterial.opacity = lightPalette ? 0.48 : 0.66;
      archivePalace.textileMaterial.color.copy(nextPalette.orbit).lerp(nextPalette.afterlight, 0.3);
      archivePalace.textileMaterial.emissive.copy(nextPalette.afterlight);
      archivePalace.lightProbe.sh.coefficients[0]
        .set(nextPalette.afterlight.r, nextPalette.afterlight.g, nextPalette.afterlight.b)
        .multiplyScalar(0.16);
      archivePalace.lightProbe.sh.coefficients[1]
        .set(nextPalette.orbit.r, nextPalette.orbit.g, nextPalette.orbit.b)
        .multiplyScalar(0.045);
      archivePalace.localAfterlight.color.copy(nextPalette.afterlight);
      townField.material.color.copy(nextPalette.metal).lerp(nextPalette.orbit, 0.16);
      townField.material.emissive.copy(nextPalette.fog);
      townField.roofMaterial.color.copy(nextPalette.fog).lerp(nextPalette.metal, 0.7);
      townField.roofMaterial.emissive.copy(nextPalette.orbit);
      townField.windowMaterial.color.copy(nextPalette.afterlight);
      townField.roadMaterial.color.copy(nextPalette.afterlight).lerp(nextPalette.metal, 0.45);
      townField.roadMaterial.emissive.copy(nextPalette.afterlight);
      townField.roadMaterial.opacity = lightPalette ? 0.3 : 0.42;
      townField.plazaMaterial.color.copy(nextPalette.metal).lerp(nextPalette.afterlight, 0.2);
      townField.plazaMaterial.emissive.copy(nextPalette.fog);
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
      boulders.instances.count = Math.min(
        boulders.maximumCount,
        nextQuality.worldDetail === 1 ? 54 : nextQuality.worldDetail === 2 ? 96 : 138
      );
      celestial.debris.count = Math.min(celestial.debrisMaximum, Math.max(18, nextQuality.starCount / 10));
      townField.instances.count = Math.min(
        townField.maximumCount,
        nextQuality.worldDetail === 1 ? 48 : nextQuality.worldDetail === 2 ? 92 : 148
      );
      townField.roofInstances.count = townField.instances.count;
      townField.windowInstances.count = townField.instances.count;
      interiorRoom.group.visible = nextQuality.worldDetail > 1;
      interiorRoom.highDetail.visible = nextQuality.worldDetail > 2;
      signalArchitecture.highDetail.visible = nextQuality.worldDetail > 2;
      archivePalace.group.visible = nextQuality.worldDetail > 1;
      archivePalace.highDetail.visible = nextQuality.worldDetail > 2;
      townField.highDetail.visible = nextQuality.worldDetail > 2;
      signalArchitecture.rings.forEach((ring, index) => {
        ring.visible = nextQuality.worldDetail > 1 || index < 2;
      });
      atmosphere.group.visible = nextQuality.worldDetail > 1;
      kit.setQuality(nextQuality);
    },
    dispose() {
      signalArchitecture.action.stop();
      signalArchitecture.mixer.stopAllAction();
      signalArchitecture.mixer.uncacheRoot(signalArchitecture.group);
      const resources = collectResources(group);
      resources.geometries.forEach((geometry) => geometry.dispose());
      resources.materials.forEach((material) => material.dispose());
      group.clear();
    }
  };
}
