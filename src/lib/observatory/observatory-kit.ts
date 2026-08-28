import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createSeededRandom, randomSigned } from "./random";
import type { ThreeObservatoryPalette } from "./palette";
import type { TerrainField } from "./terrain-field";
import type { ObservatoryQualityProfile, ObservatoryTimelineState } from "./types";

export interface ObservatoryKit {
  group: THREE.Group;
  materials: Set<THREE.Material>;
  update(state: ObservatoryTimelineState, elapsedSeconds: number, deltaSeconds: number): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
}

const KIT_SEED = 0x4f425356;
const isLightWorldPalette = (palette: ThreeObservatoryPalette) => {
  const { r, g, b } = palette.fog;
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.45;
};

function beamGeometry(start: THREE.Vector3, end: THREE.Vector3, radius: number, radialSegments = 5) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, 1, radialSegments, 1, false);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  const matrix = new THREE.Matrix4().compose(
    start.clone().add(end).multiplyScalar(0.5),
    quaternion,
    new THREE.Vector3(1, length, 1)
  );
  geometry.applyMatrix4(matrix);
  return geometry;
}

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Unable to assemble observatory kit geometry");
  return merged;
}

function makeBeamMesh(
  name: string,
  parts: THREE.BufferGeometry[],
  material: THREE.Material
): THREE.Mesh {
  const mesh = new THREE.Mesh(mergeParts(parts), material);
  mesh.name = name;
  return mesh;
}

function createTrussBridge(
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  width: number,
  segments: number,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.userData = { kit: "triangulated-bridge", segments };
  const forward = end.clone().sub(start);
  const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize().multiplyScalar(width * 0.5);
  const up = new THREE.Vector3(0, width * 0.42, 0);
  const rails: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const sideOffset = right.clone().multiplyScalar(side);
    rails.push(
      beamGeometry(start.clone().add(sideOffset), end.clone().add(sideOffset), 0.18, 6),
      beamGeometry(start.clone().add(sideOffset).add(up), end.clone().add(sideOffset).add(up), 0.13, 5)
    );
  }
  const braces: THREE.BufferGeometry[] = [];
  for (let index = 0; index < segments; index += 1) {
    const a = index / segments;
    const b = (index + 1) / segments;
    const baseA = start.clone().lerp(end, a);
    const baseB = start.clone().lerp(end, b);
    for (const side of [-1, 1]) {
      const sideOffset = right.clone().multiplyScalar(side);
      const lowerA = baseA.clone().add(sideOffset);
      const lowerB = baseB.clone().add(sideOffset);
      const upperA = lowerA.clone().add(up);
      const upperB = lowerB.clone().add(up);
      braces.push(beamGeometry(index % 2 === 0 ? lowerA : upperA, index % 2 === 0 ? upperB : lowerB, 0.065, 4));
    }
  }
  group.add(
    makeBeamMesh(`${name}:rails`, rails, material),
    makeBeamMesh(`${name}:cross-bracing`, braces, material)
  );
  return group;
}

function createDishSurfaceGeometry(radius: number, depth: number, segments: number) {
  const profile: THREE.Vector2[] = [];
  for (let index = 0; index <= 10; index += 1) {
    const t = index / 10;
    profile.push(new THREE.Vector2(radius * t, depth * t * t));
  }
  return new THREE.LatheGeometry(profile, segments);
}

function createHeroDish(material: THREE.Material, accentMaterial: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = "PeriapsisHeroDishAssembly";
  group.userData = { kit: "parabolic-dish", role: "hero-landmark" };
  const pedestal = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0.75, 0),
      new THREE.Vector2(0.82, 0.25),
      new THREE.Vector2(0.42, 0.4),
      new THREE.Vector2(0.34, 3.4),
      new THREE.Vector2(0.52, 3.7),
      new THREE.Vector2(0, 3.8)
    ], 12),
    material
  );
  pedestal.name = "DishFacetedPedestal";
  const pivot = new THREE.Group();
  pivot.name = "DishTrackingPivot";
  pivot.position.y = 3.65;
  pivot.rotation.set(-0.7, 0.18, 0.08);
  const bowl = new THREE.Mesh(createDishSurfaceGeometry(3.2, 1.05, 32), material);
  bowl.name = "DishParabolicReflector";
  const rimCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 25 }, (_, index) => {
      const angle = (index / 24) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * 3.18, 1.05, Math.sin(angle) * 3.18);
    }),
    true,
    "centripetal"
  );
  const rim = new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 48, 0.085, 6, true), accentMaterial);
  rim.name = "DishSignalRim";
  const feedParts: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2;
    feedParts.push(
      beamGeometry(
        new THREE.Vector3(Math.cos(angle) * 2.6, 0.72, Math.sin(angle) * 2.6),
        new THREE.Vector3(0, 2.5, 0),
        0.055,
        5
      )
    );
  }
  const feed = makeBeamMesh("DishFeedTruss", feedParts, accentMaterial);
  const receiver = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), accentMaterial);
  receiver.name = "DishReceiver";
  receiver.position.y = 2.52;
  pivot.add(bowl, rim, feed, receiver);
  group.add(pedestal, pivot);
  return group;
}

function createDishArray(
  maximumCount: number,
  terrain: TerrainField,
  material: THREE.Material,
  accentMaterial: THREE.Material
) {
  const random = createSeededRandom(KIT_SEED ^ 0x44495348);
  const dishGeometry = createDishSurfaceGeometry(1.25, 0.42, 16);
  const supportGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0.28, 0),
    new THREE.Vector2(0.32, 0.18),
    new THREE.Vector2(0.14, 0.3),
    new THREE.Vector2(0.11, 2.1),
    new THREE.Vector2(0, 2.2)
  ], 8);
  const receiversGeometry = new THREE.OctahedronGeometry(0.13, 0);
  const dishes = new THREE.InstancedMesh(dishGeometry, material, maximumCount);
  const supports = new THREE.InstancedMesh(supportGeometry, material, maximumCount);
  const receivers = new THREE.InstancedMesh(receiversGeometry, accentMaterial, maximumCount);
  dishes.name = "PeriapsisDishArrayReflectors";
  supports.name = "PeriapsisDishArrayPedestals";
  receivers.name = "PeriapsisDishArrayReceivers";
  dishes.userData = supports.userData = receivers.userData = { kit: "instanced-dish-array", maximumCount };
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  for (let index = 0; index < maximumCount; index += 1) {
    const row = Math.floor(index / 7);
    const column = index % 7;
    const x = -37 + column * 8.3 + randomSigned(random) * 1.4;
    const z = -48 - row * 9.2 + randomSigned(random) * 1.6;
    const ground = terrain.sampleHeight(x, z);
    const size = 0.72 + random() * 0.45;
    position.set(x, ground, z);
    quaternion.identity();
    scale.setScalar(size);
    matrix.compose(position, quaternion, scale);
    supports.setMatrixAt(index, matrix);

    position.y = ground + 2.25 * size;
    quaternion.setFromEuler(new THREE.Euler(-0.42 - random() * 0.5, randomSigned(random) * 0.62, randomSigned(random) * 0.08));
    matrix.compose(position, quaternion, scale);
    dishes.setMatrixAt(index, matrix);

    position.y += 1.35 * size;
    scale.setScalar(size * 0.9);
    matrix.compose(position, quaternion.identity(), scale);
    receivers.setMatrixAt(index, matrix);
  }
  dishes.instanceMatrix.needsUpdate = true;
  supports.instanceMatrix.needsUpdate = true;
  receivers.instanceMatrix.needsUpdate = true;
  return { dishes, supports, receivers, maximumCount };
}

function createSteppedTowerGeometry(radialSegments: number) {
  return new THREE.LatheGeometry([
    new THREE.Vector2(0.74, 0),
    new THREE.Vector2(0.82, 0.08),
    new THREE.Vector2(0.62, 0.16),
    new THREE.Vector2(0.57, 0.43),
    new THREE.Vector2(0.42, 0.47),
    new THREE.Vector2(0.4, 0.72),
    new THREE.Vector2(0.25, 0.77),
    new THREE.Vector2(0.18, 0.94),
    new THREE.Vector2(0.06, 1.05),
    new THREE.Vector2(0, 1.14)
  ], radialSegments);
}

function createTerracedCity(
  maximumCount: number,
  terrain: TerrainField,
  material: THREE.Material,
  windowMaterial: THREE.Material,
  deckMaterial: THREE.Material
) {
  const group = new THREE.Group();
  group.name = "TerracedObservatoryCity";
  group.userData = { landmark: "observatory-city", layer: "midground" };
  const random = createSeededRandom(KIT_SEED ^ 0x43495459);
  const towers = new THREE.InstancedMesh(createSteppedTowerGeometry(10), material, maximumCount);
  const beacons = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.12, 0), windowMaterial, maximumCount);
  towers.name = "CitySteppedTowerInstances";
  beacons.name = "CitySignalBeaconInstances";
  towers.userData = beacons.userData = { kit: "instanced-stepped-city", maximumCount };
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  for (let index = 0; index < maximumCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 18 + Math.sqrt(random()) * 55;
    const x = 27 + Math.cos(angle) * radius;
    const z = -198 + Math.sin(angle) * radius * 0.72;
    const ground = terrain.sampleHeight(x, z);
    const height = 3.5 + random() ** 2 * 17;
    position.set(x, ground, z);
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI);
    scale.set(1.4 + random() * 2.3, height, 1.4 + random() * 2.3);
    matrix.compose(position, quaternion, scale);
    towers.setMatrixAt(index, matrix);
    position.y = ground + height * 1.16;
    scale.setScalar(0.65 + random() * 0.8);
    matrix.compose(position, quaternion.identity(), scale);
    beacons.setMatrixAt(index, matrix);
  }
  towers.instanceMatrix.needsUpdate = true;
  beacons.instanceMatrix.needsUpdate = true;

  for (let level = 0; level < 3; level += 1) {
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(14 + level * 7, 16 + level * 7, 1.1, 16),
      deckMaterial
    );
    deck.name = `CityTerraceDeck:${level + 1}`;
    deck.position.set(27, terrain.sampleHeight(27, -198) + level * 2.5, -198);
    deck.rotation.y = level * 0.22;
    group.add(deck);
  }
  group.add(towers, beacons);
  return { group, towers, beacons, maximumCount };
}

function createFarHorizonCity(
  maximumCount: number,
  terrain: TerrainField,
  material: THREE.Material,
  accentMaterial: THREE.Material
) {
  const group = new THREE.Group();
  group.name = "FarHorizonObservatoryCity";
  group.userData = { landmark: "far-city", layer: "deep-background" };
  const towers = new THREE.InstancedMesh(createSteppedTowerGeometry(7), material, maximumCount);
  const crowns = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.1, 0), accentMaterial, maximumCount);
  towers.name = "FarCitySteppedTowerInstances";
  crowns.name = "FarCityAfterlightCrowns";
  const random = createSeededRandom(KIT_SEED ^ 0x46415243);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  for (let index = 0; index < maximumCount; index += 1) {
    const x = 38 + randomSigned(random) * 49;
    const z = -390 - random() * 33;
    const ground = terrain.sampleHeight(x, z);
    const height = 6 + random() ** 2 * 26;
    position.set(x, ground, z);
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI);
    scale.set(1.2 + random() * 2.6, height, 1.2 + random() * 2.6);
    matrix.compose(position, quaternion, scale);
    towers.setMatrixAt(index, matrix);
    position.y = ground + height * 1.16;
    scale.setScalar(0.55 + random() * 0.72);
    matrix.compose(position, quaternion.identity(), scale);
    crowns.setMatrixAt(index, matrix);
  }
  towers.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  group.add(towers, crowns);
  return { group, towers, crowns, maximumCount };
}

function createOrbitalLattice(
  orbitSegments: number,
  maximumTrussCount: number,
  material: THREE.Material,
  accentMaterial: THREE.Material
) {
  const center = new THREE.Vector3(0, 48, -154);
  const points = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return new THREE.Vector3(
      center.x + Math.cos(angle) * 76,
      center.y + Math.sin(angle) * 39,
      center.z + Math.cos(angle + 0.6) * 9 + Math.sin(angle) * 4
    );
  });
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  const group = new THREE.Group();
  group.name = "OrbitalLatticeMegastructure";
  group.userData = { landmark: "orbital-lattice", layer: "far-midground", fixedWorldCoordinates: true };
  const rails: THREE.Mesh[] = [];
  for (const offset of [-2.8, 0, 2.8]) {
    const railPoints = points.map((point) => point.clone().add(new THREE.Vector3(0, 0, offset)));
    const railCurve = new THREE.CatmullRomCurve3(railPoints, true, "centripetal");
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(railCurve, orbitSegments, offset === 0 ? 0.34 : 0.2, 6, true),
      offset === 0 ? material : accentMaterial
    );
    rail.name = `OrbitalLatticeRail:${offset}`;
    rails.push(rail);
    group.add(rail);
  }

  const trussParts = [
    beamGeometry(new THREE.Vector3(-2.8, -0.8, 0), new THREE.Vector3(2.8, 0.8, 0), 0.09, 4),
    beamGeometry(new THREE.Vector3(-2.8, 0.8, 0), new THREE.Vector3(2.8, -0.8, 0), 0.09, 4),
    beamGeometry(new THREE.Vector3(-2.8, 0, -0.7), new THREE.Vector3(2.8, 0, 0.7), 0.075, 4)
  ];
  const trussGeometry = mergeParts(trussParts);
  const trusses = new THREE.InstancedMesh(trussGeometry, material, maximumTrussCount);
  trusses.name = "OrbitalLatticeTrussInstances";
  trusses.userData = { kit: "instanced-orbital-trusses", maximumCount: maximumTrussCount };
  const frames = curve.computeFrenetFrames(maximumTrussCount, true);
  const matrix = new THREE.Matrix4();
  const basis = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  for (let index = 0; index < maximumTrussCount; index += 1) {
    const t = index / maximumTrussCount;
    const position = curve.getPointAt(t);
    basis.makeBasis(frames.normals[index], frames.binormals[index], frames.tangents[index]);
    quaternion.setFromRotationMatrix(basis);
    matrix.compose(position, quaternion, scale);
    trusses.setMatrixAt(index, matrix);
  }
  trusses.instanceMatrix.needsUpdate = true;
  group.add(trusses);

  const pods = [0, 0.33, 0.67].map((phase, index) => {
    const pod = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.72, 1.8, 4, 8),
      accentMaterial
    );
    pod.name = `OrbitalMaintenancePod:${index + 1}`;
    pod.userData.phase = phase;
    group.add(pod);
    return pod;
  });
  return { group, curve, rails, trusses, pods, maximumTrussCount };
}

function createSignalGate(
  terrain: TerrainField,
  material: THREE.Material,
  accentMaterial: THREE.Material
) {
  const group = new THREE.Group();
  group.name = "MeridianSignalGate";
  group.userData = { landmark: "signal-gate", layer: "foreground" };
  const ground = terrain.sampleHeight(0, -8);
  const archParts: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 10, ground, -3),
      new THREE.Vector3(side * 8.5, ground + 8, -7),
      new THREE.Vector3(side * 4.2, ground + 14, -10),
      new THREE.Vector3(side * 1.1, ground + 17, -11)
    ], false, "centripetal");
    const arch = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.48, 7, false), material);
    arch.name = `SignalGateSweep:${side < 0 ? "left" : "right"}`;
    archParts.push(arch);
    group.add(arch);
  }
  const crown = createTrussBridge(
    "SignalGateCrownTruss",
    new THREE.Vector3(-4.2, ground + 14, -10),
    new THREE.Vector3(4.2, ground + 14, -10),
    1.8,
    7,
    accentMaterial
  );
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 2), accentMaterial);
  beacon.name = "SignalGateBeacon";
  beacon.position.set(0, ground + 17.3, -11);
  group.add(crown, beacon);
  return { group, beacon, archParts };
}

function createRelayCanyonInfrastructure(
  terrain: TerrainField,
  material: THREE.Material,
  accentMaterial: THREE.Material,
  detail: number
) {
  const group = new THREE.Group();
  group.name = "RelayCanyonInfrastructure";
  group.userData = { landmark: "relay-canyon", layer: "midground" };
  const pipelines: THREE.Mesh[] = [];
  for (let lane = 0; lane < (detail === 1 ? 2 : 4); lane += 1) {
    const points = Array.from({ length: 8 }, (_, index) => {
      const t = index / 7;
      const z = -224 - t * 104;
      const x = -18 + Math.sin(t * Math.PI * 2.1 + lane * 0.7) * (12 + lane * 2.4) + (lane - 1.5) * 2;
      return new THREE.Vector3(x, terrain.sampleHeight(x, z) + 3.2 + lane * 0.8, z);
    });
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const pipe = new THREE.Mesh(
      new THREE.TubeGeometry(curve, detail === 1 ? 42 : 76, lane === 1 ? 0.34 : 0.2, 7, false),
      lane === 1 ? accentMaterial : material
    );
    pipe.name = `CanyonRelayPipeline:${lane + 1}`;
    pipelines.push(pipe);
    group.add(pipe);
  }
  const trestleParts: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 10; index += 1) {
    const z = -230 - index * 9.5;
    const x = -18 + Math.sin(index * 0.78) * 12;
    const ground = terrain.sampleHeight(x, z);
    trestleParts.push(
      beamGeometry(new THREE.Vector3(x - 4, ground, z), new THREE.Vector3(x - 2, ground + 6, z), 0.12, 5),
      beamGeometry(new THREE.Vector3(x + 4, ground, z), new THREE.Vector3(x + 2, ground + 6, z), 0.12, 5),
      beamGeometry(new THREE.Vector3(x - 2.6, ground + 5.5, z), new THREE.Vector3(x + 2.6, ground + 5.5, z), 0.1, 5)
    );
  }
  const trestles = makeBeamMesh("CanyonPipelineTrestles", trestleParts, material);
  group.add(trestles);
  return { group, pipelines, trestles };
}

function createArchiveDome(
  terrain: TerrainField,
  material: THREE.Material,
  accentMaterial: THREE.Material
) {
  const root = new THREE.Group();
  root.name = "ArchiveAfterlightBasin";
  root.userData = { landmark: "archive-afterlight", layer: "far-midground" };
  const center = new THREE.Vector3(0, terrain.sampleHeight(0, -352), -352);
  const high = new THREE.Group();
  high.name = "ArchiveDomeHighLOD";
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(15, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
    material
  );
  shell.name = "ArchiveGeodesicShell";
  high.add(shell);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI;
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(Math.cos(angle) * 15, 0, Math.sin(angle) * 15),
      new THREE.Vector3(Math.cos(angle) * 12, 15, Math.sin(angle) * 12),
      new THREE.Vector3(-Math.cos(angle) * 12, 15, -Math.sin(angle) * 12),
      new THREE.Vector3(-Math.cos(angle) * 15, 0, -Math.sin(angle) * 15)
    );
    const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.11, 5, false), accentMaterial);
    rib.name = `ArchiveDomeRib:${index + 1}`;
    high.add(rib);
  }
  const low = new THREE.Mesh(
    new THREE.SphereGeometry(15, 14, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
    material
  );
  low.name = "ArchiveDomeLowLOD";
  const lod = new THREE.LOD();
  lod.name = "ArchiveDomeDistanceLOD";
  lod.addLevel(high, 0);
  lod.addLevel(low, 130);
  lod.position.copy(center);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(17, 19, 64),
    accentMaterial
  );
  halo.name = "ArchiveAfterlightConcourse";
  halo.rotation.x = -Math.PI / 2;
  halo.position.copy(center).add(new THREE.Vector3(0, 0.08, 0));
  root.add(lod, halo);
  return { group: root, lod, halo };
}

export function createObservatoryKit(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  terrain: TerrainField
): ObservatoryKit {
  const initialLightPalette = isLightWorldPalette(palette);
  const metalMaterial = new THREE.MeshStandardMaterial({
    name: "ObservatoryKitMetal",
    color: palette.metal.clone(),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.035,
    metalness: 0.68,
    roughness: 0.4,
    transparent: true,
    opacity: initialLightPalette ? 0.18 : 0.28,
    depthWrite: false,
    dithering: true
  });
  const darkMetalMaterial = new THREE.MeshStandardMaterial({
    name: "ObservatoryKitStructuralVeil",
    color: palette.fog.clone().lerp(palette.metal, 0.72),
    emissive: palette.fog.clone(),
    emissiveIntensity: 0.025,
    metalness: 0.48,
    roughness: 0.62,
    transparent: true,
    opacity: initialLightPalette ? 0.12 : 0.19,
    depthWrite: false,
    dithering: true
  });
  const signalMaterial = new THREE.MeshStandardMaterial({
    name: "ObservatoryKitSignal",
    color: palette.signal.clone(),
    emissive: palette.signal.clone(),
    emissiveIntensity: 2.1,
    metalness: 0.38,
    roughness: 0.24,
    transparent: true,
    opacity: initialLightPalette ? 0.46 : 0.58,
    depthWrite: false,
    dithering: true
  });
  const afterlightMaterial = new THREE.MeshStandardMaterial({
    name: "ObservatoryKitAfterlight",
    color: palette.afterlight.clone(),
    emissive: palette.afterlight.clone(),
    emissiveIntensity: 1.6,
    metalness: 0.28,
    roughness: 0.3,
    transparent: true,
    opacity: initialLightPalette ? 0.38 : 0.48,
    depthWrite: false,
    dithering: true
  });
  const materials = new Set<THREE.Material>([
    metalMaterial,
    darkMetalMaterial,
    signalMaterial,
    afterlightMaterial
  ]);

  const group = new THREE.Group();
  group.name = "RecognizableObservatoryKit";
  group.userData = { worldVersion: 3, proceduralAsset: true };

  const gate = createSignalGate(terrain, darkMetalMaterial, signalMaterial);
  const heroDish = createHeroDish(metalMaterial, signalMaterial);
  heroDish.position.set(-10, terrain.sampleHeight(-10, -67), -67);
  const dishArray = createDishArray(quality.dishInstanceCount, terrain, metalMaterial, signalMaterial);
  const orbital = createOrbitalLattice(quality.orbitSegments, quality.trussInstanceCount, darkMetalMaterial, signalMaterial);
  const city = createTerracedCity(
    quality.cityInstanceCount,
    terrain,
    metalMaterial,
    signalMaterial,
    darkMetalMaterial
  );
  const farCity = createFarHorizonCity(
    Math.max(18, Math.round(quality.cityInstanceCount * 0.45)),
    terrain,
    darkMetalMaterial,
    afterlightMaterial
  );
  const canyon = createRelayCanyonInfrastructure(terrain, darkMetalMaterial, afterlightMaterial, quality.worldDetail);
  const archive = createArchiveDome(terrain, darkMetalMaterial, afterlightMaterial);
  const bridgeA = createTrussBridge(
    "DishToOrbitalServiceBridge",
    new THREE.Vector3(-10, terrain.sampleHeight(-10, -86) + 3, -86),
    new THREE.Vector3(18, terrain.sampleHeight(18, -126) + 5, -126),
    4.2,
    quality.worldDetail === 1 ? 8 : 14,
    metalMaterial
  );
  const bridgeB = createTrussBridge(
    "CityToCanyonSuspendedBridge",
    new THREE.Vector3(22, terrain.sampleHeight(22, -219) + 7, -219),
    new THREE.Vector3(-16, terrain.sampleHeight(-16, -252) + 7, -252),
    5.4,
    quality.worldDetail === 1 ? 9 : 16,
    darkMetalMaterial
  );
  group.add(
    gate.group,
    heroDish,
    dishArray.dishes,
    dishArray.supports,
    dishArray.receivers,
    orbital.group,
    city.group,
    farCity.group,
    canyon.group,
    archive.group,
    bridgeA,
    bridgeB
  );

  let moonIntensity = 0;
  let cityIntensity = 0;
  let ringIntensity = 0;
  let canyonIntensity = 0;
  const dishPivot = heroDish.getObjectByName("DishTrackingPivot");

  return {
    group,
    materials,
    update(state, elapsedSeconds, deltaSeconds) {
      moonIntensity = THREE.MathUtils.damp(moonIntensity, state.moonIntensity, 2.6, deltaSeconds);
      cityIntensity = THREE.MathUtils.damp(cityIntensity, state.cityIntensity, 2.6, deltaSeconds);
      ringIntensity = THREE.MathUtils.damp(ringIntensity, state.ringIntensity, 2.6, deltaSeconds);
      canyonIntensity = THREE.MathUtils.damp(canyonIntensity, state.canyonIntensity, 2.6, deltaSeconds);
      signalMaterial.emissiveIntensity = 0.9 + state.signalIntensity * 2.2;
      afterlightMaterial.emissiveIntensity = 0.55 + state.afterlightIntensity * 2.35 + canyonIntensity * 0.4;
      metalMaterial.emissiveIntensity = 0.025 + cityIntensity * 0.07;
      darkMetalMaterial.emissiveIntensity = 0.018 + ringIntensity * 0.055;
      if (dishPivot) {
        dishPivot.rotation.z = 0.08 + Math.sin(elapsedSeconds * 0.11) * 0.1;
        dishPivot.rotation.y = 0.18 + Math.sin(elapsedSeconds * 0.075) * 0.2;
      }
      gate.beacon.rotation.x = elapsedSeconds * 0.32;
      gate.beacon.rotation.y = elapsedSeconds * 0.46;
      const pulse = 0.9 + Math.sin(elapsedSeconds * 1.2) * 0.09;
      gate.beacon.scale.setScalar(pulse);
      orbital.pods.forEach((pod, index) => {
        const t = (elapsedSeconds * (0.007 + index * 0.0015) + Number(pod.userData.phase)) % 1;
        const position = orbital.curve.getPointAt(t);
        const tangent = orbital.curve.getTangentAt(t).normalize();
        pod.position.copy(position);
        pod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        pod.scale.setScalar(0.72 + ringIntensity * 0.28);
      });
      archive.halo.rotation.z = elapsedSeconds * 0.018;
    },
    setPalette(nextPalette) {
      const lightPalette = isLightWorldPalette(nextPalette);
      metalMaterial.color.copy(nextPalette.metal);
      metalMaterial.emissive.copy(nextPalette.fog);
      metalMaterial.opacity = lightPalette ? 0.18 : 0.28;
      darkMetalMaterial.color.copy(nextPalette.fog).lerp(nextPalette.metal, 0.72);
      darkMetalMaterial.emissive.copy(nextPalette.fog);
      darkMetalMaterial.opacity = lightPalette ? 0.12 : 0.19;
      signalMaterial.color.copy(nextPalette.signal);
      signalMaterial.emissive.copy(nextPalette.signal);
      signalMaterial.opacity = lightPalette ? 0.46 : 0.58;
      afterlightMaterial.color.copy(nextPalette.afterlight);
      afterlightMaterial.emissive.copy(nextPalette.afterlight);
      afterlightMaterial.opacity = lightPalette ? 0.38 : 0.48;
    },
    setQuality(nextQuality) {
      dishArray.dishes.count = Math.min(dishArray.maximumCount, nextQuality.dishInstanceCount);
      dishArray.supports.count = dishArray.dishes.count;
      dishArray.receivers.count = dishArray.dishes.count;
      city.towers.count = Math.min(city.maximumCount, nextQuality.cityInstanceCount);
      city.beacons.count = city.towers.count;
      farCity.towers.count = Math.min(
        farCity.maximumCount,
        Math.max(12, Math.round(nextQuality.cityInstanceCount * 0.45))
      );
      farCity.crowns.count = farCity.towers.count;
      orbital.trusses.count = Math.min(orbital.maximumTrussCount, nextQuality.trussInstanceCount);
      orbital.pods.forEach((pod, index) => {
        pod.visible = nextQuality.worldDetail > 1 || index === 0;
      });
    }
  };
}
