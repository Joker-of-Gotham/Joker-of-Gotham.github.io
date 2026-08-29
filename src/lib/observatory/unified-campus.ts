import * as THREE from "three";
import {
  OBSERVATORY_LANDMARK_PLATFORMS,
  type TerrainField,
} from "./terrain-field";
import type { ThreeObservatoryPalette } from "./palette";
import type { ObservatoryQualityProfile, ObservatoryTimelineState } from "./types";

const CAMPUS_ROUTE = [
  [0, 22],
  [-13, -34],
  [17, -91],
  [31, -149],
  [2, -210],
  [-27, -271],
  [-8, -329],
  [16, -392],
] as const;

const CONNECTED_CHAPTERS = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
] as const;

interface CampusMaterials {
  stone: THREE.MeshStandardMaterial;
  structural: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  signal: THREE.MeshStandardMaterial;
  afterlight: THREE.MeshStandardMaterial;
}

interface CampusPrimitives {
  box: THREE.BoxGeometry;
  column: THREE.CylinderGeometry;
  taper: THREE.CylinderGeometry;
  dome: THREE.SphereGeometry;
  ring: THREE.TorusGeometry;
  crystal: THREE.OctahedronGeometry;
  pyramid: THREE.ConeGeometry;
}

export interface UnifiedObservatoryCampus {
  group: THREE.Group;
  stoneMaterial: THREE.MeshStandardMaterial;
  structuralMaterial: THREE.MeshStandardMaterial;
  update(state: ObservatoryTimelineState, elapsedSeconds: number): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
}

const isLightPalette = (palette: ThreeObservatoryPalette) => {
  const { r, g, b } = palette.fog;
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.45;
};

function createMaterials(palette: ThreeObservatoryPalette): CampusMaterials {
  const stone = new THREE.MeshStandardMaterial({
    name: "CampusStoneMaterial",
    color: palette.metal.clone().lerp(palette.fog, 0.18),
    emissive: palette.fog.clone().lerp(palette.orbit, 0.12),
    emissiveIntensity: 0.11,
    metalness: 0.16,
    roughness: 0.74,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    dithering: true,
  });
  const structural = new THREE.MeshStandardMaterial({
    name: "CampusStructuralMetalMaterial",
    color: palette.metal.clone().lerp(palette.particleBase, 0.24),
    emissive: palette.orbit.clone(),
    emissiveIntensity: 0.095,
    metalness: 0.7,
    roughness: 0.32,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    dithering: true,
  });
  const roof = new THREE.MeshStandardMaterial({
    name: "CampusRoofMaterial",
    color: palette.fog.clone().lerp(palette.metal, 0.62),
    emissive: palette.orbit.clone(),
    emissiveIntensity: 0.075,
    metalness: 0.42,
    roughness: 0.52,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    dithering: true,
  });
  const glass = new THREE.MeshStandardMaterial({
    name: "CampusGlassMaterial",
    color: palette.signal.clone().lerp(palette.fog, 0.22),
    emissive: palette.signal.clone(),
    emissiveIntensity: 0.42,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: isLightPalette(palette) ? 0.42 : 0.54,
    depthWrite: false,
    side: THREE.DoubleSide,
    dithering: true,
  });
  const signal = new THREE.MeshStandardMaterial({
    name: "CampusSignalInlayMaterial",
    color: palette.signal.clone().lerp(palette.particleBase, 0.18),
    emissive: palette.signal.clone(),
    emissiveIntensity: 0.84,
    metalness: 0.26,
    roughness: 0.28,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    toneMapped: false,
    dithering: true,
  });
  const afterlight = new THREE.MeshStandardMaterial({
    name: "CampusAfterlightInlayMaterial",
    color: palette.afterlight.clone().lerp(palette.particleBase, 0.16),
    emissive: palette.afterlight.clone(),
    emissiveIntensity: 0.72,
    metalness: 0.22,
    roughness: 0.3,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    toneMapped: false,
    dithering: true,
  });
  return { stone, structural, roof, glass, signal, afterlight };
}

function createPrimitives(quality: ObservatoryQualityProfile): CampusPrimitives {
  const radialSegments = quality.worldDetail > 1 ? 20 : 12;
  return {
    box: new THREE.BoxGeometry(1, 1, 1),
    column: new THREE.CylinderGeometry(0.72, 1, 1, radialSegments),
    taper: new THREE.CylinderGeometry(0.54, 1, 1, 6),
    dome: new THREE.SphereGeometry(1, radialSegments * 2, radialSegments, 0, Math.PI * 2, 0, Math.PI * 0.5),
    ring: new THREE.TorusGeometry(1, 0.055, 8, radialSegments * 2),
    crystal: new THREE.OctahedronGeometry(1, quality.worldDetail > 1 ? 1 : 0),
    pyramid: new THREE.ConeGeometry(1, 1, 4),
  };
}

function addBlock(
  parent: THREE.Object3D,
  geometry: THREE.BoxGeometry,
  material: THREE.Material,
  name: string,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  rotationY = 0,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addTaper(
  parent: THREE.Object3D,
  geometry: THREE.CylinderGeometry,
  material: THREE.Material,
  name: string,
  radius: number,
  height: number,
  position: readonly [number, number, number],
  rotationY = 0,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(radius, height, radius);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createRibbonGeometry(
  terrain: TerrainField,
  halfWidth: number,
  thickness: number,
  yOffset: number,
  lateralOffset = 0,
  samples = 92,
) {
  const routeCurve = new THREE.CatmullRomCurve3(
    CAMPUS_ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  const vertices: number[] = [];
  const indices: number[] = [];
  const normal = new THREE.Vector3();
  const center = new THREE.Vector3();

  for (let index = 0; index < samples; index += 1) {
    const t = index / (samples - 1);
    const point = routeCurve.getPointAt(t);
    const tangent = routeCurve.getTangentAt(t).normalize();
    normal.set(tangent.z, 0, -tangent.x).normalize();
    center.copy(point).addScaledVector(normal, lateralOffset);
    center.y = terrain.sampleHeight(center.x, center.z) + yOffset;
    const left = center.clone().addScaledVector(normal, halfWidth);
    const right = center.clone().addScaledVector(normal, -halfWidth);
    vertices.push(
      left.x, left.y, left.z,
      right.x, right.y, right.z,
      left.x, left.y - thickness, left.z,
      right.x, right.y - thickness, right.z,
    );
  }

  for (let index = 0; index < samples - 1; index += 1) {
    const current = index * 4;
    const next = (index + 1) * 4;
    indices.push(
      current, current + 1, next,
      current + 1, next + 1, next,
      current + 2, next + 2, current + 3,
      current + 3, next + 2, next + 3,
      current + 2, current, next + 2,
      current, next, next + 2,
      current + 1, current + 3, next + 1,
      current + 3, next + 3, next + 1,
    );
  }
  indices.push(0, 2, 1, 1, 2, 3);
  const end = (samples - 1) * 4;
  indices.push(end, end + 1, end + 2, end + 1, end + 3, end + 2);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createChapterGroup(name: string, chapter: string, terrain: TerrainField, x: number, z: number) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, terrain.sampleHeight(x, z) + 0.34, z);
  group.userData = {
    role: "campus-chapter-district",
    chapter,
    fixedWorldCoordinates: true,
  };
  return group;
}

function addSignalSlits(
  parent: THREE.Object3D,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  prefix: string,
  x: number,
  z: number,
  count: number,
  width: number,
  spacing: number,
  y: number,
) {
  for (let index = 0; index < count; index += 1) {
    addBlock(
      parent,
      primitives.box,
      materials.signal,
      `${prefix}SignalSlit:${index + 1}`,
      [width, 0.16, 0.16],
      [x, y + index * spacing, z],
    );
  }
}

function createGateAtrium(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  animatedCrystals: THREE.Mesh[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[0];
  const group = createChapterGroup("UnifiedGateAtrium", "signal-gate", terrain, anchor.x, anchor.z);
  group.position.z = -14;
  group.position.y = terrain.sampleHeight(group.position.x, group.position.z) + 0.34;
  addBlock(group, primitives.box, materials.stone, "GateAtriumFoundation", [34, 0.9, 22], [0, -0.1, 0]);
  addBlock(group, primitives.box, materials.roof, "GateAtriumThreshold", [17, 0.3, 2.6], [0, 0.55, 7]);

  for (const side of [-1, 1]) {
    addTaper(
      group,
      primitives.taper,
      materials.stone,
      `GateAtriumPylon:${side < 0 ? "west" : "east"}`,
      2.45,
      10.5,
      [side * 14.7, 5.25, -1.5],
      Math.PI / 6,
    );
    addBlock(
      group,
      primitives.box,
      materials.structural,
      `GateAtriumPylonCap:${side < 0 ? "west" : "east"}`,
      [4.6, 0.48, 4.2],
      [side * 14.7, 10.25, -1.5],
    );
    addBlock(
      group,
      primitives.box,
      materials.signal,
      `GateAtriumVerticalBeacon:${side < 0 ? "west" : "east"}`,
      [0.2, 6.2, 0.18],
      [side * 12.65, 5.5, 1],
    );
  }
  addBlock(group, primitives.box, materials.structural, "GateAtriumLintel", [26.8, 0.62, 1.1], [0, 10.25, -1.4]);

  const crystal = new THREE.Mesh(primitives.crystal, materials.glass);
  crystal.name = "GateAtriumSignalCrystal";
  crystal.position.set(0, 8.7, 0.8);
  crystal.scale.set(0.52, 1.05, 0.52);
  group.add(crystal);
  animatedCrystals.push(crystal);

  return group;
}

function createObservationHall(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  animatedRings: THREE.Mesh[],
  animatedCrystals: THREE.Mesh[],
  detailGroups: THREE.Group[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[1];
  const group = createChapterGroup("UnifiedDofObservationHall", "observe", terrain, anchor.x, anchor.z);
  group.rotation.y = -0.14;
  addBlock(group, primitives.box, materials.stone, "ObservationHallPodium", [38, 0.9, 29], [0, -0.05, 0]);
  addBlock(group, primitives.box, materials.stone, "ObservationHallMainVolume", [26, 5.5, 15], [0, 3.1, -4]);
  addBlock(group, primitives.box, materials.roof, "ObservationHallRoofDatum", [30, 0.55, 18], [0, 6.05, -4]);

  const dome = new THREE.Mesh(primitives.dome, materials.glass);
  dome.name = "ObservationHallOpticalDome";
  dome.position.set(0, 6.25, -4);
  dome.scale.set(8.8, 5.8, 8.8);
  group.add(dome);

  const aperture = new THREE.Mesh(primitives.ring, materials.structural);
  aperture.name = "ObservationHallFocalAperture";
  aperture.position.set(0, 5.3, 4.75);
  aperture.scale.setScalar(4.2);
  group.add(aperture);
  animatedRings.push(aperture);

  const focalCrystal = new THREE.Mesh(primitives.crystal, materials.signal);
  focalCrystal.name = "ObservationHallFocalCrystal";
  focalCrystal.position.set(0, 5.3, 4.8);
  focalCrystal.scale.set(0.7, 1.15, 0.7);
  group.add(focalCrystal);
  animatedCrystals.push(focalCrystal);

  for (const side of [-1, 1]) {
    addBlock(
      group,
      primitives.box,
      materials.stone,
      `ObservationHallWing:${side < 0 ? "west" : "east"}`,
      [7.5, 3.8, 21],
      [side * 16, 2.2, -1],
    );
    addBlock(
      group,
      primitives.box,
      materials.roof,
      `ObservationHallWingRoof:${side < 0 ? "west" : "east"}`,
      [8.8, 0.4, 23],
      [side * 16, 4.3, -1],
    );
    addSignalSlits(
      group,
      primitives,
      materials,
      `ObservationHall${side < 0 ? "West" : "East"}`,
      side * 16,
      9.55,
      3,
      4.5,
      0.75,
      1.45,
    );
  }

  const detail = new THREE.Group();
  detail.name = "ObservationHallOpticalRibDetail";
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    addBlock(
      detail,
      primitives.box,
      materials.structural,
      `ObservationHallDomeRib:${index + 1}`,
      [0.18, 0.18, 9.4],
      [Math.sin(angle) * 4.1, 7.1, -4 + Math.cos(angle) * 4.1],
      angle,
    );
  }
  group.add(detail);
  detailGroups.push(detail);

  return group;
}

function createSignalSpire(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  animatedRings: THREE.Mesh[],
  animatedCrystals: THREE.Mesh[],
  detailGroups: THREE.Group[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[2];
  const group = createChapterGroup("UnifiedKeyframedSignalSpire", "structure", terrain, anchor.x, anchor.z);
  group.position.set(34, terrain.sampleHeight(34, -178) + 0.34, -178);
  group.rotation.y = 0.08;
  for (let level = 0; level < 3; level += 1) {
    const radius = 18 - level * 4.2;
    const terrace = new THREE.Mesh(primitives.column, materials.stone);
    terrace.name = `SignalSpireTerrace:${level + 1}`;
    terrace.position.y = level * 0.55;
    terrace.scale.set(radius, 0.7, radius);
    group.add(terrace);
  }
  addTaper(group, primitives.taper, materials.stone, "SignalSpireCore", 3.5, 19, [0, 10.4, 0], Math.PI / 6);
  addTaper(group, primitives.taper, materials.structural, "SignalSpireCrown", 1.8, 6.5, [0, 23.1, 0], Math.PI / 6);
  addBlock(group, primitives.box, materials.signal, "SignalSpireVerticalDatum", [0.22, 19, 0.22], [0, 13, 2]);

  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(primitives.ring, index === 2 ? materials.signal : materials.structural);
    ring.name = `SignalSpireKineticCollar:${index + 1}`;
    ring.position.y = 7.5 + index * 5.2;
    ring.rotation.x = Math.PI * 0.5 + (index - 1) * 0.12;
    ring.scale.setScalar(3.3 + index * 0.95);
    group.add(ring);
    animatedRings.push(ring);
  }

  const crownCrystal = new THREE.Mesh(primitives.crystal, materials.glass);
  crownCrystal.name = "SignalSpireCrownCrystal";
  crownCrystal.position.y = 27.2;
  crownCrystal.scale.set(0.76, 1.5, 0.76);
  group.add(crownCrystal);
  animatedCrystals.push(crownCrystal);

  const detail = new THREE.Group();
  detail.name = "SignalSpireRadialFinDetail";
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    addBlock(
      detail,
      primitives.box,
      materials.roof,
      `SignalSpireRadialFin:${index + 1}`,
      [0.5, 4.5, 8],
      [Math.sin(angle) * 9, 3.2, Math.cos(angle) * 9],
      angle,
    );
  }
  group.add(detail);
  detailGroups.push(detail);

  return group;
}

function createCivicQuarter(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  animatedCrystals: THREE.Mesh[],
  detailGroups: THREE.Group[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[3];
  const group = createChapterGroup("UnifiedArchiveCivicQuarter", "orchestrate", terrain, anchor.x, anchor.z);
  group.rotation.y = 0.12;
  addBlock(group, primitives.box, materials.stone, "CivicQuarterUnifiedPlinth", [46, 1, 38], [0, -0.05, -2]);
  addBlock(group, primitives.box, materials.stone, "CivicQuarterCentralHall", [24, 8.5, 10], [0, 4.7, -12]);
  addBlock(group, primitives.box, materials.roof, "CivicQuarterCentralCornice", [28, 0.65, 13], [0, 9.2, -12]);
  addBlock(group, primitives.box, materials.structural, "CivicQuarterFrontDatum", [30, 0.45, 1], [0, 6.8, -6.4]);

  for (const side of [-1, 1]) {
    addBlock(
      group,
      primitives.box,
      materials.stone,
      `CivicQuarterWing:${side < 0 ? "west" : "east"}`,
      [8, 5.2, 29],
      [side * 17, 3.05, -1],
    );
    addBlock(
      group,
      primitives.box,
      materials.roof,
      `CivicQuarterWingCornice:${side < 0 ? "west" : "east"}`,
      [9.5, 0.5, 31],
      [side * 17, 5.85, -1],
    );
    for (let index = 0; index < 6; index += 1) {
      addBlock(
        group,
        primitives.box,
        materials.afterlight,
        `CivicQuarterWindow:${side}:${index + 1}`,
        [3.8, 0.18, 0.14],
        [side * 17, 2 + (index % 2) * 1.3, 10 - Math.floor(index / 2) * 7.8],
      );
    }
  }

  const courtCrystal = new THREE.Mesh(primitives.crystal, materials.glass);
  courtCrystal.name = "CivicQuarterCourtyardSignal";
  courtCrystal.position.set(0, 4.5, 5);
  courtCrystal.scale.set(1.5, 2.6, 1.5);
  group.add(courtCrystal);
  animatedCrystals.push(courtCrystal);

  const detail = new THREE.Group();
  detail.name = "CivicQuarterColonnadeDetail";
  for (let index = 0; index < 11; index += 1) {
    const x = -15 + index * 3;
    const column = new THREE.Mesh(primitives.column, materials.structural);
    column.name = `CivicQuarterCourtColumn:${index + 1}`;
    column.position.set(x, 2.4, -5.7);
    column.scale.set(0.35, 4.8, 0.35);
    detail.add(column);
  }
  group.add(detail);
  detailGroups.push(detail);

  return group;
}

function createAfterlightHall(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  detailGroups: THREE.Group[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[4];
  const group = createChapterGroup("UnifiedAfterlightArchiveHall", "embodiment", terrain, anchor.x, anchor.z);
  group.position.set(-27, terrain.sampleHeight(-27, -299) + 0.34, -299);
  group.rotation.y = -0.32;
  addBlock(group, primitives.box, materials.stone, "AfterlightHallCanyonDeck", [29, 1.1, 46], [0, 0, -3]);
  addBlock(group, primitives.box, materials.stone, "AfterlightHallSanctum", [22, 9.5, 12], [0, 5.3, -20]);
  addBlock(group, primitives.box, materials.roof, "AfterlightHallSanctumRoof", [25, 0.7, 15], [0, 10.4, -20]);
  addBlock(group, primitives.box, materials.glass, "AfterlightHallLuminousApse", [13, 6.2, 0.24], [0, 5.4, -13.85]);

  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index += 1) {
      const column = new THREE.Mesh(primitives.column, materials.structural);
      column.name = `AfterlightHallCloisterColumn:${side}:${index + 1}`;
      column.position.set(side * 10.8, 3.15, 15 - index * 4.1);
      column.scale.set(0.5, 6.3, 0.5);
      group.add(column);
      if (index % 2 === 0) {
        addBlock(
          group,
          primitives.box,
          materials.roof,
          `AfterlightHallCanopyRib:${side}:${index + 1}`,
          [11.2, 0.35, 0.5],
          [side * 5.4, 6.35, 15 - index * 4.1],
        );
      }
    }
  }
  addBlock(group, primitives.box, materials.afterlight, "AfterlightHallProcessionalInlay", [1.1, 0.15, 38], [0, 0.72, -1]);

  const detail = new THREE.Group();
  detail.name = "AfterlightHallArchiveFinDetail";
  for (let index = 0; index < 7; index += 1) {
    addTaper(
      detail,
      primitives.taper,
      materials.roof,
      `AfterlightHallArchiveFin:${index + 1}`,
      0.7,
      4 + index * 0.45,
      [-9 + index * 3, 11.5 + index * 0.22, -20.5],
      Math.PI / 6,
    );
  }
  group.add(detail);
  detailGroups.push(detail);

  return group;
}

function createDistantCivicField(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
  animatedRings: THREE.Mesh[],
  detailGroups: THREE.Group[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[5];
  const group = createChapterGroup("UnifiedDistantCivicField", "archive-afterlight", terrain, anchor.x, anchor.z);
  group.position.set(28, terrain.sampleHeight(28, -406) + 0.34, -406);
  group.rotation.y = -0.08;
  for (let level = 0; level < 3; level += 1) {
    const terrace = new THREE.Mesh(primitives.column, materials.stone);
    terrace.name = `DistantCivicFieldTerrace:${level + 1}`;
    terrace.position.y = -level * 0.48;
    terrace.scale.set(25 + level * 5, 0.65, 25 + level * 5);
    group.add(terrace);
  }
  addBlock(group, primitives.box, materials.stone, "DistantCivicFieldArchiveBase", [44, 1, 34], [0, 0.3, -5]);
  for (const side of [-1, 1]) {
    addBlock(
      group,
      primitives.box,
      materials.stone,
      `DistantCivicFieldArchiveWing:${side < 0 ? "west" : "east"}`,
      [15, 6.5, 24],
      [side * 17, 3.9, -5],
    );
    addBlock(
      group,
      primitives.box,
      materials.roof,
      `DistantCivicFieldArchiveWingRoof:${side < 0 ? "west" : "east"}`,
      [17, 0.55, 26],
      [side * 17, 7.35, -5],
    );
  }

  const dome = new THREE.Mesh(primitives.dome, materials.glass);
  dome.name = "DistantCivicFieldArchiveDome";
  dome.position.set(0, 1, -5);
  dome.scale.set(11.5, 8.2, 11.5);
  group.add(dome);
  const crownRing = new THREE.Mesh(primitives.ring, materials.afterlight);
  crownRing.name = "DistantCivicFieldArchiveCrown";
  crownRing.position.set(0, 9.3, -5);
  crownRing.rotation.x = Math.PI * 0.5;
  crownRing.scale.setScalar(5.8);
  group.add(crownRing);
  animatedRings.push(crownRing);
  addTaper(group, primitives.taper, materials.structural, "DistantCivicFieldArchiveBeacon", 2.2, 15, [0, 16.2, -14], Math.PI / 6);

  for (let index = 0; index < 12; index += 1) {
    const x = -16.5 + index * 3;
    const column = new THREE.Mesh(primitives.column, materials.structural);
    column.name = `DistantCivicFieldFrontColumn:${index + 1}`;
    column.position.set(x, 3.4, 7.4);
    column.scale.set(0.38, 6.8, 0.38);
    group.add(column);
  }
  addBlock(group, primitives.box, materials.roof, "DistantCivicFieldFrontCornice", [38, 0.5, 1.8], [0, 7.15, 7.4]);

  const detail = new THREE.Group();
  detail.name = "DistantCivicFieldConnectedQuarterDetail";
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const height = 3.4 + ((row * 3 + column * 2) % 5) * 1.15;
      const x = (column - 3) * 6.4;
      const z = -12 - row * 6.2;
      addBlock(
        detail,
        primitives.box,
        materials.stone,
        `DistantCivicFieldQuarterBlock:${row + 1}:${column + 1}`,
        [4.8, height, 5.2],
        [x, height * 0.5, z],
      );
      addBlock(
        detail,
        primitives.box,
        materials.afterlight,
        `DistantCivicFieldQuarterWindow:${row + 1}:${column + 1}`,
        [2.3, 0.2, 0.14],
        [x, height * 0.62, z + 2.64],
      );
    }
  }
  group.add(detail);
  detailGroups.push(detail);

  return group;
}

function createCampusDeck(terrain: TerrainField, materials: CampusMaterials) {
  const group = new THREE.Group();
  group.name = "CampusProcessionalDeck";
  group.userData = { role: "continuous-processional-axis", connectedChapters: [...CONNECTED_CHAPTERS] };
  const deck = new THREE.Mesh(createRibbonGeometry(terrain, 7.8, 0.82, 0.62), materials.stone);
  deck.name = "CampusContinuousStoneDeck";
  deck.receiveShadow = true;
  group.add(deck);
  const centerInlay = new THREE.Mesh(createRibbonGeometry(terrain, 0.15, 0.06, 0.74), materials.afterlight);
  centerInlay.name = "CampusContinuousAfterlightDatum";
  group.add(centerInlay);
  return group;
}

function createCourtyardTerraces(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
) {
  const group = new THREE.Group();
  group.name = "CampusCourtyardTerraces";
  group.userData = { role: "shared-campus-ground-plane" };
  for (const [index, platform] of OBSERVATORY_LANDMARK_PLATFORMS.entries()) {
    const terrace = new THREE.Mesh(primitives.column, materials.stone);
    terrace.name = `CampusCourtyardTerrace:${CONNECTED_CHAPTERS[index]}`;
    terrace.position.set(platform.x, terrain.sampleHeight(platform.x, platform.z) + 0.16, platform.z);
    terrace.scale.set(platform.radius * 0.82, 0.82, platform.radius * 0.82);
    terrace.receiveShadow = true;
    group.add(terrace);

    const ring = new THREE.Mesh(primitives.ring, index < 3 ? materials.signal : materials.afterlight);
    ring.name = `CampusCourtyardDatum:${CONNECTED_CHAPTERS[index]}`;
    ring.position.set(platform.x, terrain.sampleHeight(platform.x, platform.z) + 0.61, platform.z);
    ring.rotation.x = Math.PI * 0.5;
    ring.scale.setScalar(Math.min(4.2, platform.radius * 0.22));
    group.add(ring);
  }
  return group;
}

function createCampusColonnade(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: CampusMaterials,
) {
  const group = new THREE.Group();
  group.name = "CampusColonnade";
  group.userData = { role: "continuous-architectural-rhythm" };
  const maximumStations = 18;
  const columns = new THREE.InstancedMesh(primitives.column, materials.structural, maximumStations * 2);
  columns.name = "CampusColonnadeColumnInstances";
  columns.userData = { maximumStations };
  columns.castShadow = true;
  group.add(columns);

  const routeCurve = new THREE.CatmullRomCurve3(
    CAMPUS_ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(0.34, 4.2, 0.34);
  const normal = new THREE.Vector3();

  const applyQuality = (quality: ObservatoryQualityProfile) => {
    const stationCount = quality.worldDetail === 1 ? 9 : quality.worldDetail === 2 ? 14 : 18;
    let instance = 0;
    for (let index = 0; index < stationCount; index += 1) {
      const t = 0.035 + (index / Math.max(1, stationCount - 1)) * 0.92;
      const point = routeCurve.getPointAt(t);
      const tangent = routeCurve.getTangentAt(t).normalize();
      normal.set(tangent.z, 0, -tangent.x).normalize();
      for (const side of [-1, 1]) {
        position.copy(point).addScaledVector(normal, side * 16.5);
        position.y = terrain.sampleHeight(position.x, position.z) + 2.75;
        quaternion.setFromEuler(new THREE.Euler(0, Math.atan2(tangent.x, tangent.z), 0));
        matrix.compose(position, quaternion, scale);
        columns.setMatrixAt(instance, matrix);
        instance += 1;
      }
    }
    columns.count = instance;
    columns.instanceMatrix.needsUpdate = true;
  };
  return { group, applyQuality };
}

export function createUnifiedObservatoryCampus(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  terrain: TerrainField,
): UnifiedObservatoryCampus {
  const materials = createMaterials(palette);
  const primitives = createPrimitives(quality);
  const group = new THREE.Group();
  group.name = "UnifiedObservatoryCampus";
  group.userData = {
    role: "continuous-observatory-campus",
    composition: "single-continuous-observatory-campus",
    spatialContinuity: true,
    connectedChapters: [...CONNECTED_CHAPTERS],
    fixedWorldCoordinates: true,
    designLanguage: "lunar-stone-metal-glass-processional-campus",
  };

  const animatedRings: THREE.Mesh[] = [];
  const animatedCrystals: THREE.Mesh[] = [];
  const detailGroups: THREE.Group[] = [];
  const deck = createCampusDeck(terrain, materials);
  const terraces = createCourtyardTerraces(terrain, primitives, materials);
  const colonnade = createCampusColonnade(terrain, primitives, materials);
  const gate = createGateAtrium(terrain, primitives, materials, animatedCrystals);
  const observation = createObservationHall(
    terrain,
    primitives,
    materials,
    animatedRings,
    animatedCrystals,
    detailGroups,
  );
  const spire = createSignalSpire(
    terrain,
    primitives,
    materials,
    animatedRings,
    animatedCrystals,
    detailGroups,
  );
  const civic = createCivicQuarter(
    terrain,
    primitives,
    materials,
    animatedCrystals,
    detailGroups,
  );
  const afterlightHall = createAfterlightHall(
    terrain,
    primitives,
    materials,
    detailGroups,
  );
  const distantField = createDistantCivicField(
    terrain,
    primitives,
    materials,
    animatedRings,
    detailGroups,
  );

  group.add(
    deck,
    terraces,
    colonnade.group,
    gate,
    observation,
    spire,
    civic,
    afterlightHall,
    distantField,
  );

  const recolor = (nextPalette: ThreeObservatoryPalette) => {
    const light = isLightPalette(nextPalette);
    materials.stone.color.copy(nextPalette.metal).lerp(nextPalette.fog, light ? 0.42 : 0.18);
    materials.stone.emissive.copy(nextPalette.fog).lerp(nextPalette.orbit, light ? 0.025 : 0.12);
    materials.structural.color.copy(nextPalette.metal).lerp(nextPalette.particleBase, light ? 0.1 : 0.24);
    materials.structural.emissive.copy(nextPalette.orbit);
    materials.roof.color.copy(nextPalette.fog).lerp(nextPalette.metal, light ? 0.74 : 0.62);
    materials.roof.emissive.copy(nextPalette.orbit);
    materials.glass.color.copy(nextPalette.signal).lerp(nextPalette.fog, 0.22);
    materials.glass.emissive.copy(nextPalette.signal);
    materials.glass.opacity = light ? 0.42 : 0.54;
    materials.signal.color.copy(nextPalette.signal).lerp(nextPalette.particleBase, 0.18);
    materials.signal.emissive.copy(nextPalette.signal);
    materials.afterlight.color.copy(nextPalette.afterlight).lerp(nextPalette.particleBase, 0.16);
    materials.afterlight.emissive.copy(nextPalette.afterlight);
  };

  recolor(palette);
  colonnade.applyQuality(quality);
  detailGroups.forEach((detail) => {
    detail.visible = quality.worldDetail > 1;
  });

  return {
    group,
    stoneMaterial: materials.stone,
    structuralMaterial: materials.structural,
    update(state, elapsedSeconds) {
      animatedRings.forEach((ring, index) => {
        ring.rotation.z = elapsedSeconds * (0.025 + index * 0.006) + index * 0.18;
      });
      animatedCrystals.forEach((crystal, index) => {
        crystal.rotation.y = elapsedSeconds * (0.08 + index * 0.018);
        const pulse = 0.97 + Math.sin(elapsedSeconds * 0.46 + index * 0.8) * 0.03;
        crystal.scale.multiplyScalar(pulse / (crystal.userData.previousPulse ?? 1));
        crystal.userData.previousPulse = pulse;
      });
      materials.signal.emissiveIntensity = 0.66 + state.signalIntensity * 0.42 + state.ringIntensity * 0.26;
      materials.afterlight.emissiveIntensity = 0.54 + state.afterlightIntensity * 0.72 + state.cityIntensity * 0.16;
      materials.glass.emissiveIntensity = 0.28 + state.signalIntensity * 0.3 + state.afterlightIntensity * 0.24;
    },
    setPalette: recolor,
    setQuality(nextQuality) {
      colonnade.applyQuality(nextQuality);
      detailGroups.forEach((detail) => {
        detail.visible = nextQuality.worldDetail > 1;
      });
    },
  };
}
