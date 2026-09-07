import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  OBSERVATORY_LANDMARK_PLATFORMS,
  SELENE_MERIDIAN_ROUTE,
  type TerrainField,
} from "./terrain-field";
import {
  SeleneInstanceBatch,
  createEllipticalDomeGeometry,
  createParabolicDishGeometry,
  createTaperedModuleGeometry,
  markArchitecturalMesh,
} from "./selene-geometry";
import type { ThreeObservatoryPalette } from "./palette";
import type {
  ObservatoryQualityProfile,
  ObservatoryTimelineState,
} from "./types";

const CONNECTED_CHAPTERS = [
  "signal-gate",
  "observe",
  "structure",
  "orchestrate",
  "embodiment",
  "archive-afterlight",
] as const;

export interface SeleneCampusMaterials {
  stone: THREE.MeshStandardMaterial;
  structural: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  signal: THREE.MeshStandardMaterial;
  afterlight: THREE.MeshStandardMaterial;
}

interface CampusPrimitives {
  unitBox: THREE.BoxGeometry;
  taperedModule: THREE.BoxGeometry;
  column: THREE.CylinderGeometry;
  ring: THREE.TorusGeometry;
  dome: THREE.SphereGeometry;
  dish: THREE.BufferGeometry;
  roundedSegments: number;
}

interface AnimatedScaleMesh {
  mesh: THREE.Mesh;
  baseScale: THREE.Vector3;
  phase: number;
}

interface QualityObject {
  object: THREE.Object3D;
  minimumDetail: 2 | 3;
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

function campusMineralBase(
  palette: ThreeObservatoryPalette,
  metalMix: number,
) {
  return palette.particleBase
    .clone()
    .lerp(palette.orbit, 0.08)
    .lerp(palette.metal, metalMix);
}

function campusMineralBounce(palette: ThreeObservatoryPalette) {
  return palette.particleBase.clone().lerp(palette.orbit, 0.14);
}

function occupiedApertureColor(palette: ThreeObservatoryPalette) {
  return palette.metal
    .clone()
    .lerp(palette.afterlight, 0.28)
    .lerp(palette.particleBase, 0.08);
}

function sparseSignalCobalt(palette: ThreeObservatoryPalette) {
  return palette.orbit
    .clone()
    .lerp(palette.signal, 0.18)
    .lerp(palette.particleBase, 0.08);
}

function setSurfaceRole(material: THREE.Material, role: string) {
  material.userData = {
    ...material.userData,
    surfaceRole: role,
    pbrHydratable: true,
  };
  return material;
}

/** Fallback materials; production can inject the same shape with hydrated PBR maps. */
export function createSeleneCampusMaterials(
  palette: ThreeObservatoryPalette,
): SeleneCampusMaterials {
  const stone = setSurfaceRole(
    new THREE.MeshStandardMaterial({
      name: "CampusStoneMaterial",
      color: campusMineralBase(palette, 0.1),
      emissive: campusMineralBounce(palette),
      emissiveIntensity: 0.07,
      metalness: 0,
      roughness: 0.72,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      dithering: true,
    }),
    "regolith-stone",
  ) as THREE.MeshStandardMaterial;
  const structural = setSurfaceRole(
    new THREE.MeshStandardMaterial({
      name: "CampusStructuralMetalMaterial",
      color: campusMineralBase(palette, 0.14),
      emissive: campusMineralBounce(palette),
      emissiveIntensity: 0.028,
      metalness: 0.68,
      roughness: 0.4,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      dithering: true,
    }),
    "structural-metal",
  ) as THREE.MeshStandardMaterial;
  const roof = setSurfaceRole(
    new THREE.MeshStandardMaterial({
      name: "CampusRoofMaterial",
      color: campusMineralBase(palette, 0.06),
      emissive: campusMineralBounce(palette),
      emissiveIntensity: 0.04,
      metalness: 0.12,
      roughness: 0.62,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      dithering: true,
    }),
    "thermal-roof",
  ) as THREE.MeshStandardMaterial;
  const glass = setSurfaceRole(
    new THREE.MeshPhysicalMaterial({
      name: "CampusGlassMaterial",
      color: palette.fog
        .clone()
        .lerp(palette.particleBase, 0.22)
        .lerp(palette.orbit, 0.12),
      emissive: occupiedApertureColor(palette),
      emissiveIntensity: 0.08,
      metalness: 0,
      roughness: 0.34,
      transmission: 0,
      thickness: 0.42,
      ior: 1.46,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
      dithering: true,
    }),
    "optical-glass",
  ) as THREE.MeshStandardMaterial;
  const signal = setSurfaceRole(
    new THREE.MeshStandardMaterial({
      name: "CampusSignalInlayMaterial",
      color: sparseSignalCobalt(palette),
      emissive: sparseSignalCobalt(palette),
      emissiveIntensity: 0.42,
      metalness: 0.42,
      roughness: 0.5,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      toneMapped: true,
      dithering: true,
    }),
    "signal-emissive",
  ) as THREE.MeshStandardMaterial;
  const afterlight = setSurfaceRole(
    new THREE.MeshStandardMaterial({
      name: "CampusAfterlightInlayMaterial",
      color: occupiedApertureColor(palette),
      emissive: occupiedApertureColor(palette),
      emissiveIntensity: 0.42,
      metalness: 0.02,
      roughness: 0.64,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      toneMapped: true,
      dithering: true,
    }),
    "afterlight-emissive",
  ) as THREE.MeshStandardMaterial;
  return { stone, structural, roof, glass, signal, afterlight };
}

function createPrimitives(
  quality: ObservatoryQualityProfile,
): CampusPrimitives {
  const radialSegments = quality.worldDetail > 1 ? 28 : 18;
  return {
    unitBox: new THREE.BoxGeometry(1, 1, 1),
    taperedModule: createTaperedModuleGeometry(0.14, 0.075),
    column: new THREE.CylinderGeometry(0.5, 0.5, 1, radialSegments),
    ring: new THREE.TorusGeometry(
      1,
      0.055,
      quality.worldDetail > 1 ? 10 : 7,
      radialSegments * 2,
    ),
    dome: createEllipticalDomeGeometry(
      radialSegments * 2,
      quality.worldDetail > 1 ? 16 : 10,
    ),
    dish: createParabolicDishGeometry(
      radialSegments * 2,
      quality.worldDetail > 1 ? 14 : 8,
      0.31,
    ),
    roundedSegments: quality.worldDetail > 1 ? 2 : 1,
  };
}

function addVolume(
  parent: THREE.Object3D,
  primitives: CampusPrimitives,
  material: THREE.Material,
  name: string,
  size: readonly [number, number, number],
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
  options: { radius?: number; role?: string; occluder?: boolean } = {},
) {
  const radius = Math.min(options.radius ?? 0.16, Math.min(...size) * 0.24);
  const geometry = new RoundedBoxGeometry(
    size[0],
    size[1],
    size[2],
    primitives.roundedSegments,
    Math.max(0.025, radius),
  );
  geometry.name = `${name}Geometry`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  markArchitecturalMesh(mesh, options.role ?? "architectural-volume", {
    occluder: options.occluder,
  });
  parent.add(mesh);
  return mesh;
}

interface MergedVolumeSpec {
  size: readonly [number, number, number];
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  radius?: number;
}

function addMergedVolumes(
  parent: THREE.Object3D,
  primitives: CampusPrimitives,
  material: THREE.Material,
  name: string,
  volumes: readonly MergedVolumeSpec[],
  options: { role?: string; occluder?: boolean } = {},
) {
  const geometries = volumes.map(
    ({ size, position, rotation = [0, 0, 0], radius }) => {
      const safeRadius = Math.max(
        0.025,
        Math.min(radius ?? 0.16, Math.min(...size) * 0.24),
      );
      const geometry = new RoundedBoxGeometry(
        size[0],
        size[1],
        size[2],
        primitives.roundedSegments,
        safeRadius,
      );
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...rotation),
      );
      geometry.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(...position),
          quaternion,
          new THREE.Vector3(1, 1, 1),
        ),
      );
      return geometry;
    },
  );
  const geometry = mergeGeometries(geometries, false);
  geometry.name = `${name}Geometry`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  markArchitecturalMesh(
    mesh,
    options.role ?? "layered-architectural-envelope",
    {
      occluder: options.occluder,
    },
  );
  parent.add(mesh);
  return mesh;
}

function addNamedAnchor(
  parent: THREE.Object3D,
  name: string,
  options: { occluder?: boolean; role?: string } = {},
) {
  const anchor = new THREE.Group();
  anchor.name = name;
  anchor.userData = {
    role: options.role ?? "architectural-semantic-anchor",
    fixedWorldCoordinates: true,
    ...(options.occluder ? { transitionOccluder: true } : {}),
  };
  parent.add(anchor);
  return anchor;
}

function addCylinder(
  parent: THREE.Object3D,
  primitives: CampusPrimitives,
  material: THREE.Material,
  name: string,
  radius: number,
  height: number,
  position: readonly [number, number, number],
) {
  const mesh = new THREE.Mesh(primitives.column, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(radius * 2, height, radius * 2);
  markArchitecturalMesh(mesh, "structural-column");
  parent.add(mesh);
  return mesh;
}

function addRing(
  parent: THREE.Object3D,
  primitives: CampusPrimitives,
  material: THREE.Material,
  name: string,
  radius: number,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [Math.PI * 0.5, 0, 0],
) {
  const mesh = new THREE.Mesh(primitives.ring, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.setScalar(radius);
  markArchitecturalMesh(mesh, "architectural-ring", { castShadow: false });
  parent.add(mesh);
  return mesh;
}

function createRouteCurve(
  terrain: TerrainField,
  lateralOffset: number,
  yOffset: number,
  samples = 72,
) {
  const survey = new THREE.CatmullRomCurve3(
    SELENE_MERIDIAN_ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  const points: THREE.Vector3[] = [];
  const lateral = new THREE.Vector3();
  for (let index = 0; index < samples; index += 1) {
    const t = index / (samples - 1);
    const point = survey.getPointAt(t);
    const tangent = survey.getTangentAt(t).normalize();
    lateral.set(tangent.z, 0, -tangent.x).normalize();
    point.addScaledVector(lateral, lateralOffset);
    point.y = terrain.sampleHeight(point.x, point.z) + yOffset;
    points.push(point);
  }
  return new THREE.CatmullRomCurve3(points, false, "centripetal");
}

function createRibbonGeometry(
  terrain: TerrainField,
  halfWidth: number,
  thickness: number,
  yOffset: number,
  lateralOffset = 0,
  samples = 112,
) {
  const route = createRouteCurve(terrain, lateralOffset, yOffset, samples);
  const vertices: number[] = [];
  const indices: number[] = [];
  const lateral = new THREE.Vector3();
  for (let index = 0; index < samples; index += 1) {
    const t = index / (samples - 1);
    const center = route.getPointAt(t);
    const tangent = route.getTangentAt(t).normalize();
    lateral.set(tangent.z, 0, -tangent.x).normalize();
    const left = center.clone().addScaledVector(lateral, halfWidth);
    const right = center.clone().addScaledVector(lateral, -halfWidth);
    vertices.push(
      left.x,
      left.y,
      left.z,
      right.x,
      right.y,
      right.z,
      left.x,
      left.y - thickness,
      left.z,
      right.x,
      right.y - thickness,
      right.z,
    );
  }
  for (let index = 0; index < samples - 1; index += 1) {
    const current = index * 4;
    const next = current + 4;
    indices.push(
      current,
      current + 1,
      next,
      current + 1,
      next + 1,
      next,
      current + 2,
      next + 2,
      current + 3,
      current + 3,
      next + 2,
      next + 3,
      current + 2,
      current,
      next + 2,
      current,
      next,
      next + 2,
      current + 1,
      current + 3,
      next + 1,
      current + 3,
      next + 3,
      next + 1,
    );
  }
  indices.push(0, 2, 1, 1, 2, 3);
  const end = (samples - 1) * 4;
  indices.push(end, end + 1, end + 2, end + 1, end + 3, end + 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function addRouteTube(
  parent: THREE.Object3D,
  terrain: TerrainField,
  material: THREE.Material,
  name: string,
  lateralOffset: number,
  yOffset: number,
  radius: number,
  detail: number,
) {
  const geometry = createRouteTubeGeometry(
    terrain,
    lateralOffset,
    yOffset,
    radius,
    detail,
  );
  geometry.name = `${name}Geometry`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  markArchitecturalMesh(mesh, "continuous-utility-line", { castShadow: false });
  parent.add(mesh);
  return mesh;
}

function createRouteTubeGeometry(
  terrain: TerrainField,
  lateralOffset: number,
  yOffset: number,
  radius: number,
  detail: number,
) {
  const curve = createRouteCurve(terrain, lateralOffset, yOffset, 74);
  return new THREE.TubeGeometry(curve, 150, radius, detail, false);
}

function createChapterGroup(
  name: string,
  chapter: string,
  district: string,
  terrain: TerrainField,
  x: number,
  z: number,
) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, terrain.sampleHeight(x, z) + 0.18, z);
  group.userData = {
    role: "campus-chapter-district",
    chapter,
    district,
    fixedWorldCoordinates: true,
    contiguousInfrastructure: true,
  };
  return group;
}

function registerBatch(
  batch: SeleneInstanceBatch,
  parent: THREE.Object3D,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
) {
  parent.add(batch.build(quality.worldDetail));
  batches.push(batch);
  return batch;
}

function createCampusDeck(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
) {
  const group = new THREE.Group();
  group.name = "CampusProcessionalDeck";
  group.userData = {
    role: "continuous-processional-axis",
    connectedChapters: [...CONNECTED_CHAPTERS],
    physicalSystem: "maintenance-rail-power-data",
  };

  const deck = new THREE.Mesh(
    createRibbonGeometry(terrain, 2.75, 0.34, 0.31),
    materials.stone,
  );
  deck.name = "CampusContinuousStoneDeck";
  markArchitecturalMesh(deck, "continuous-maintenance-deck", {
    castShadow: false,
  });
  group.add(deck);

  const shoulderGeometry = mergeGeometries(
    [-1, 1].map((side) =>
      createRibbonGeometry(terrain, 0.42, 0.3, 0.36, side * 3.18),
    ),
  );
  const shoulders = new THREE.Mesh(shoulderGeometry, materials.roof);
  shoulders.name = "CampusContinuousShoulders";
  markArchitecturalMesh(shoulders, "continuous-deck-shoulder", {
    castShadow: false,
  });
  group.add(shoulders);

  const railGeometry = mergeGeometries(
    [-1, 1].map((side) =>
      createRouteTubeGeometry(
        terrain,
        side * 1.72,
        0.52,
        0.075,
        quality.worldDetail > 1 ? 8 : 6,
      ),
    ),
  );
  const rails = new THREE.Mesh(railGeometry, materials.structural);
  rails.name = "CampusMaintenanceRails";
  markArchitecturalMesh(rails, "continuous-maintenance-rail", {
    castShadow: false,
  });
  group.add(rails);
  const centerInlay = new THREE.Mesh(
    createRibbonGeometry(terrain, 0.095, 0.045, 0.68),
    materials.afterlight,
  );
  centerInlay.name = "CampusContinuousAfterlightDatum";
  markArchitecturalMesh(centerInlay, "continuous-signal-datum", {
    castShadow: false,
  });
  group.add(centerInlay);
  addRouteTube(
    group,
    terrain,
    materials.structural,
    "CampusPowerConduit",
    4.25,
    0.72,
    0.12,
    7,
  );
  addRouteTube(
    group,
    terrain,
    materials.signal,
    "CampusSignalFibre",
    4.38,
    0.94,
    0.035,
    6,
  );

  const survey = createRouteCurve(terrain, 0, 0, 72);
  const supports = new SeleneInstanceBatch(
    "CampusBridgeSupportInstances",
    primitives.unitBox,
    materials.structural,
  );
  const retaining = new SeleneInstanceBatch(
    "CampusRetainingWallInstances",
    primitives.unitBox,
    materials.stone,
  );
  const lamps = new SeleneInstanceBatch(
    "CampusWayfindingLampInstances",
    primitives.unitBox,
    materials.signal,
  );
  const lateral = new THREE.Vector3();
  for (let index = 1; index < 31; index += 1) {
    const t = index / 32;
    const point = survey.getPointAt(t);
    const tangent = survey.getTangentAt(t).normalize();
    lateral.set(tangent.z, 0, -tangent.x).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const side = index % 2 === 0 ? -1 : 1;
    const wallX = point.x + lateral.x * side * 5.25;
    const wallZ = point.z + lateral.z * side * 5.25;
    const terrainY = terrain.sampleHeight(wallX, wallZ);
    const deckY = point.y + 0.31;
    const height = Math.max(
      1.1,
      Math.min(4.8, Math.abs(terrainY - deckY) + 1.35),
    );
    retaining.addBox(
      [wallX, Math.min(terrainY, deckY) + height * 0.5, wallZ],
      [5.6, height, 0.42],
      [0, yaw, 0],
      index % 3 === 0 ? 1 : 2,
    );
    supports.addBox(
      [
        point.x + lateral.x * side * 3.35,
        deckY - 1.25,
        point.z + lateral.z * side * 3.35,
      ],
      [0.28, 2.5, 0.28],
      [0, yaw, 0],
      index % 3 === 0 ? 1 : 2,
    );
    lamps.addBox(
      [
        point.x + lateral.x * -side * 3.55,
        deckY + 0.42,
        point.z + lateral.z * -side * 3.55,
      ],
      [0.12, 0.64, 0.12],
      [0, yaw, 0],
      1,
    );
  }
  registerBatch(supports, group, quality, batches);
  registerBatch(retaining, group, quality, batches);
  registerBatch(lamps, group, quality, batches);
  return group;
}

function createCourtyardTerraces(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
) {
  const group = new THREE.Group();
  group.name = "CampusCourtyardTerraces";
  group.userData = {
    role: "shared-campus-foundations",
    circularExhibitPlatforms: false,
  };
  const foundations = new SeleneInstanceBatch(
    "CampusDistrictFoundationInstances",
    primitives.unitBox,
    materials.stone,
  );
  // Follow the occupied masses instead of dropping one exhibition plinth under
  // each district. The staggered grade beams keep every facility grounded in
  // the terrain while preserving rift, court and lightwell negative space.
  const footprints: readonly (readonly {
    offset: readonly [number, number, number];
    size: readonly [number, number, number];
    yaw?: number;
    detail?: 1 | 2;
  }[])[] = [
    [
      { offset: [0, 0, -0.7], size: [17.8, 0.34, 11.8] },
      { offset: [0, -0.2, 1.8], size: [10.2, 0.28, 5.2] },
    ],
    [
      { offset: [12.8, 0, -2.4], size: [7.2, 0.32, 19.8], yaw: 0.03 },
      { offset: [-12.8, 0, 5.8], size: [9.2, 0.3, 8.4], yaw: -0.08 },
      { offset: [-1.7, -0.2, -3.4], size: [16.5, 0.24, 16.5], detail: 2 },
    ],
    [
      { offset: [-1.8, 0, 0], size: [8.8, 0.32, 31.8] },
      { offset: [-11.7, 0, 5.4], size: [8.2, 0.3, 11.2], yaw: -0.06 },
      { offset: [17.2, -0.1, -7], size: [8.2, 0.26, 8.2], detail: 2 },
    ],
    [
      { offset: [-17.2, 0, -5], size: [9.4, 0.32, 20.8], yaw: -0.045 },
      { offset: [17, 0, -2], size: [9.2, 0.3, 18.8], yaw: 0.035 },
      { offset: [0, 0, -18], size: [21.8, 0.34, 8.3], yaw: 0.035 },
      { offset: [0, -0.16, 2.4], size: [14.2, 0.22, 12.2], detail: 2 },
    ],
    [
      { offset: [-9.4, 0, -2], size: [5.1, 0.32, 31.8], yaw: -0.04 },
      { offset: [9.6, 0, -3.8], size: [4.4, 0.3, 27.8], yaw: 0.035 },
      { offset: [-1, 0, -14.8], size: [10.4, 0.28, 12], detail: 2 },
    ],
    [
      { offset: [-17.8, 0, -7], size: [13.4, 0.34, 23.8], yaw: -0.055 },
      { offset: [17.8, 0, -7], size: [13.4, 0.34, 23.8], yaw: 0.055 },
      { offset: [0, -0.12, -5], size: [14, 0.24, 14], yaw: Math.PI * 0.25 },
      { offset: [0, -0.2, 8.5], size: [10, 0.22, 6.2], detail: 2 },
    ],
  ];
  OBSERVATORY_LANDMARK_PLATFORMS.forEach((platform, index) => {
    footprints[index].forEach(({ offset, size, yaw = 0, detail = 1 }) => {
      const x = platform.x + offset[0];
      const z = platform.z + offset[2];
      foundations.addBox(
        [x, terrain.sampleHeight(x, z) + offset[1] + 0.04, z],
        size,
        [0, yaw, 0],
        detail,
      );
    });
  });
  registerBatch(foundations, group, quality, batches);
  return group;
}

function createCampusColonnade(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
) {
  const group = new THREE.Group();
  group.name = "CampusColonnade";
  group.userData = {
    role: "continuous-architectural-rhythm",
    form: "maintenance-frames",
  };
  const route = createRouteCurve(terrain, 0, 0, 72);
  const frames = new SeleneInstanceBatch(
    "CampusMaintenanceFrameInstances",
    primitives.unitBox,
    materials.structural,
  );
  const beacons = new SeleneInstanceBatch(
    "CampusMaintenanceBeaconInstances",
    primitives.unitBox,
    materials.afterlight,
  );
  const lateral = new THREE.Vector3();
  for (let index = 0; index < 23; index += 1) {
    const t = 0.025 + (index / 22) * 0.95;
    const point = route.getPointAt(t);
    const tangent = route.getTangentAt(t).normalize();
    lateral.set(tangent.z, 0, -tangent.x).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const level = index % 3 === 0 ? 1 : 2;
    for (const side of [-1, 1]) {
      frames.addBox(
        [
          point.x + lateral.x * side * 5.05,
          point.y + 2.1,
          point.z + lateral.z * side * 5.05,
        ],
        [0.3, 4.2, 0.36],
        [0, yaw, 0],
        level,
      );
    }
    frames.addBeam(
      [point.x + lateral.x * -5.05, point.y + 4.2, point.z + lateral.z * -5.05],
      [point.x + lateral.x * 5.05, point.y + 4.2, point.z + lateral.z * 5.05],
      [0.26, 0.32],
      index % 4 === 0 ? 1 : 2,
    );
    beacons.addBox(
      [point.x + lateral.x * 4.98, point.y + 3.25, point.z + lateral.z * 4.98],
      [0.08, 0.82, 0.1],
      [0, yaw, 0],
      level,
    );
  }
  registerBatch(frames, group, quality, batches);
  registerBatch(beacons, group, quality, batches);
  return group;
}

function createGateAtrium(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
  animatedScales: AnimatedScaleMesh[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[0];
  const group = createChapterGroup(
    "UnifiedGateAtrium",
    "signal-gate",
    "selene-signal-gate",
    terrain,
    anchor.x,
    anchor.z,
  );
  group.rotation.y = 0.035;
  const envelope = new SeleneInstanceBatch(
    "GateLayeredEnvelopeInstances",
    primitives.taperedModule,
    materials.stone,
  );
  envelope.addBox([0, 0.18, -0.5], [17, 0.42, 11], [0, 0, 0], 1);
  for (const side of [-1, 1]) {
    envelope.addBox(
      [side * 7.1, 3.45, -1.1],
      [5.3, 6.7, 6.2],
      [0, 0, side * -0.075],
      1,
    );
    envelope.addBox(
      [side * 6.65, 8.05, -1.5],
      [3.75, 4.9, 4.7],
      [0, 0, side * -0.055],
      1,
    );
    envelope.addBox(
      [side * 8.7, 4.7, -2.1],
      [1.05, 7.8, 5.4],
      [0, 0, side * -0.14],
      2,
    );
    addNamedAnchor(group, `GateRiftButtress:${side < 0 ? "west" : "east"}`, {
      occluder: true,
      role: "load-bearing-rift-buttress",
    });
    addNamedAnchor(group, `GateButtressFoot:${side < 0 ? "west" : "east"}`);
  }
  addNamedAnchor(group, "GateEmbeddedThreshold");
  registerBatch(envelope, group, quality, batches);
  addMergedVolumes(
    group,
    primitives,
    materials.roof,
    "GateProtectiveShells",
    [
      { size: [5.8, 0.74, 7.6], position: [-7.1, 0.72, -0.8], radius: 0.18 },
      { size: [5.8, 0.74, 7.6], position: [7.1, 0.72, -0.8], radius: 0.18 },
      { size: [11.6, 0.34, 2.7], position: [0, 10.82, -1.4], radius: 0.12 },
      { size: [4.2, 0.36, 3.5], position: [-7.05, 10.68, -1.4], rotation: [0, 0, -0.035], radius: 0.12 },
      { size: [4.2, 0.36, 3.5], position: [7.05, 10.68, -1.4], rotation: [0, 0, 0.035], radius: 0.12 },
    ],
    { role: "gate-protective-cornice" },
  );
  addNamedAnchor(group, "GateBridgeWeatherShell");
  addMergedVolumes(
    group,
    primitives,
    materials.structural,
    "GateServiceBridge",
    [
      { size: [11.4, 0.62, 2.45], position: [0, 10.02, -1.4], radius: 0.15 },
      { size: [3.25, 1.2, 3.1], position: [-6.9, 9.86, -1.4], rotation: [0, 0, -0.04], radius: 0.16 },
      { size: [3.25, 1.2, 3.1], position: [6.9, 9.86, -1.4], rotation: [0, 0, 0.04], radius: 0.16 },
    ],
    { role: "gate-servicing-bridge-and-shoulders", occluder: true },
  );

  const frames = new SeleneInstanceBatch(
    "GatePortalFrameInstances",
    primitives.unitBox,
    materials.structural,
  );
  const signal = new SeleneInstanceBatch(
    "GateSignalScaleInstances",
    primitives.unitBox,
    materials.signal,
  );
  for (let frame = 0; frame < 3; frame += 1) {
    const z = 0.5 - frame * 1.65;
    for (const side of [-1, 1]) {
      frames.addBox(
        [side * 4.8, 5.25, z],
        [0.42, 9.1, 0.42],
        [0, 0, side * -0.045],
        1,
      );
      for (let joint = 0; joint < 5; joint += 1) {
        signal.addBox(
          [side * 4.54, 2.25 + joint * 1.48, z + 0.23],
          [0.09, 0.48, 0.08],
          [0, 0, 0],
          joint < 3 ? 1 : 2,
        );
      }
    }
    frames.addBeam([-4.8, 9.62, z], [4.8, 9.62, z], [0.38, 0.42], 1);
  }
  for (let index = 0; index < 9; index += 1) {
    const x = -7.2 + index * 1.8;
    frames.addBox([x, 11.45, -0.15], [0.11, 1.05, 0.12], [0, 0, 0], 1);
    frames.addBox(
      [x, 1.2, 3.6],
      [0.16, 1.65, 0.18],
      [0, 0, 0],
      index < 5 ? 1 : 2,
    );
  }
  frames.addBox([0, 11.9, -0.15], [15.2, 0.12, 0.14], [0, 0, 0], 1);
  frames.addBeam([-8.4, 1.05, 2.2], [-5.6, 9.3, 0.2], [0.2, 0.3], 1);
  frames.addBeam([8.4, 1.05, 2.2], [5.6, 9.3, 0.2], [0.2, 0.3], 1);
  for (let step = 0; step < 4; step += 1) {
    frames.addBox(
      [0, 0.42 + step * 0.16, 5.1 - step * 0.62],
      [8.8 - step * 0.55, 0.14, 0.68],
      [0, 0, 0],
      1,
    );
  }
  signal.addBox([-3.15, 5.1, 0.72], [0.08, 3.4, 0.08], [0, 0, 0], 1);
  signal.addBox([3.15, 5.1, 0.72], [0.08, 3.4, 0.08], [0, 0, 0], 1);
  registerBatch(frames, group, quality, batches);
  registerBatch(signal, group, quality, batches);

  const lens = new THREE.Mesh(primitives.dome, materials.glass);
  lens.name = "GateCalibratedSignalLens";
  lens.position.set(0, 8.35, -1.05);
  lens.rotation.x = Math.PI * 0.5;
  lens.scale.set(1.15, 0.42, 1.15);
  markArchitecturalMesh(lens, "gate-optical-instrument", { castShadow: false });
  group.add(lens);
  animatedScales.push({
    mesh: lens,
    baseScale: lens.scale.clone(),
    phase: 0.2,
  });
  group.userData.transitionOccluders = [
    "GateRiftButtress:west",
    "GateRiftButtress:east",
    "GateServiceBridge",
  ];
  return group;
}

function createObservationHall(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
  animatedRings: THREE.Mesh[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[1];
  const group = createChapterGroup(
    "UnifiedDofObservationHall",
    "observe",
    "listening-basin",
    terrain,
    anchor.x,
    anchor.z,
  );
  group.rotation.y = -0.11;
  addMergedVolumes(
    group,
    primitives,
    materials.stone,
    "ListeningBasinFacilityMasses",
    [
      {
        size: [6.2, 3.65, 18.5],
        position: [12.8, 2.09, -2.4],
        rotation: [0, 0.03, -0.018],
        radius: 0.22,
      },
      {
        size: [4.85, 2.05, 12.8],
        position: [12.55, 4.7, -3.15],
        rotation: [0, 0.03, 0.018],
        radius: 0.2,
      },
      {
        size: [2.2, 3.1, 4.6],
        position: [9.7, 2.05, 4.25],
        rotation: [0, -0.055, -0.08],
        radius: 0.16,
      },
      {
        size: [8.7, 2.65, 7.6],
        position: [-13, 1.55, 6.2],
        rotation: [0, -0.08, 0.025],
        radius: 0.2,
      },
      {
        size: [6.1, 1.65, 5.3],
        position: [-12.55, 3.63, 5.8],
        rotation: [0, -0.08, -0.02],
        radius: 0.17,
      },
      { size: [7.2, 0.22, 2.2], position: [-10.8, 0.32, 11.2], radius: 0.08 },
      { size: [6.2, 0.22, 1.8], position: [-10.8, 0.54, 10.25], radius: 0.08 },
      { size: [5.2, 0.22, 1.4], position: [-10.8, 0.76, 9.45], radius: 0.08 },
    ],
    { role: "listening-basin-layered-facility" },
  );
  addNamedAnchor(group, "ListeningBasinControlSpine");
  addNamedAnchor(group, "ListeningBasinMaintenanceBay");
  addMergedVolumes(
    group,
    primitives,
    materials.roof,
    "ListeningBasinControlRoof",
    [
      {
        size: [5.55, 0.38, 13.55],
        position: [12.55, 5.86, -3.15],
        rotation: [0, 0.03, 0],
        radius: 0.14,
      },
      {
        size: [7.1, 0.3, 5.2],
        position: [12.75, 4.05, 4.35],
        rotation: [0, 0.03, -0.035],
        radius: 0.12,
      },
      {
        size: [7, 0.31, 6],
        position: [-12.55, 4.56, 5.8],
        rotation: [0, -0.08, 0],
        radius: 0.12,
      },
    ],
    { role: "layered-thermal-weather-shells" },
  );
  addMergedVolumes(
    group,
    primitives,
    materials.glass,
    "ListeningBasinControlWindow",
    [
      {
        size: [0.16, 0.78, 10.8],
        position: [9.69, 2.15, -2.35],
        rotation: [0, 0.03, 0],
        radius: 0.04,
      },
      {
        size: [0.16, 0.7, 8.5],
        position: [10.08, 4.68, -3.1],
        rotation: [0, 0.03, 0],
        radius: 0.04,
      },
    ],
    { role: "deep-set-control-clerestories" },
  );

  const dish = new THREE.Mesh(primitives.dish, materials.structural);
  dish.name = "ListeningBasinParabolicReflector";
  dish.position.set(-1.7, 0.48, -3.4);
  dish.rotation.set(-0.055, 0, 0.12);
  dish.scale.setScalar(10.8);
  markArchitecturalMesh(dish, "parabolic-radio-reflector");
  group.add(dish);
  const rim = addRing(
    group,
    primitives,
    materials.structural,
    "ListeningBasinDishRim",
    10.82,
    [-1.7, 3.84, -3.4],
  );
  rim.rotation.set(Math.PI * 0.5 - 0.055, 0, 0.12);
  animatedRings.push(rim);

  const truss = new SeleneInstanceBatch(
    "ListeningBasinFeedTrussInstances",
    primitives.unitBox,
    materials.structural,
  );
  truss.addBeam([-1.7, 0.8, -3.4], [-1.7, 7.8, -3.4], [0.24, 0.24], 1);
  for (let side = 0; side < 3; side += 1) {
    const angle = (side / 3) * Math.PI * 2;
    truss.addBeam(
      [-1.7 + Math.cos(angle) * 8.5, 3.05, -3.4 + Math.sin(angle) * 8.5],
      [-1.7, 7.4, -3.4],
      [0.17, 0.17],
      1,
    );
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    truss.addBeam(
      [-1.7 + Math.cos(angle) * 10.45, 3.63, -3.4 + Math.sin(angle) * 10.45],
      [-1.7 + Math.cos(angle) * 8.25, 2.4, -3.4 + Math.sin(angle) * 8.25],
      [0.12, 0.16],
      index % 2 === 0 ? 1 : 2,
    );
  }
  registerBatch(truss, group, quality, batches);
  addCylinder(
    group,
    primitives,
    materials.signal,
    "ListeningBasinFeedReceiver",
    0.48,
    1.15,
    [-1.7, 8.1, -3.4],
  );

  const rail = new SeleneInstanceBatch(
    "ListeningBasinGuardRailInstances",
    primitives.unitBox,
    materials.structural,
  );
  const windows = new SeleneInstanceBatch(
    "ListeningBasinInstrumentWindowInstances",
    primitives.unitBox,
    materials.afterlight,
  );
  for (let index = 0; index < 10; index += 1) {
    rail.addBox(
      [-15 + index * 2.8, 1.42, 10.4],
      [0.12, 1.05, 0.12],
      [0, 0, 0],
      index % 2 === 0 ? 1 : 2,
    );
    const windowZ = -8 + Math.floor(index / 2) * 3.8;
    const windowY = 1.95 + (index % 2) * 1.25;
    windows.addBox(
      [9.77, windowY, windowZ],
      [0.09, 0.62, 1.2],
      [0, 0.03, 0],
      index < 6 ? 1 : 2,
    );
    if (index < 6) {
      rail.addBox(
        [9.68, windowY, windowZ - 0.72],
        [0.2, 0.92, 0.12],
        [0, 0.03, 0],
        1,
      );
      rail.addBox(
        [9.68, windowY, windowZ + 0.72],
        [0.2, 0.92, 0.12],
        [0, 0.03, 0],
        1,
      );
      rail.addBox(
        [9.68, windowY - 0.43, windowZ],
        [0.2, 0.12, 1.55],
        [0, 0.03, 0],
        1,
      );
      rail.addBox(
        [9.68, windowY + 0.43, windowZ],
        [0.2, 0.12, 1.55],
        [0, 0.03, 0],
        1,
      );
    }
  }
  rail.addBox([-2.4, 1.86, 10.4], [26, 0.1, 0.12], [0, 0, 0], 1);
  rail.addBox([12.6, 4.96, -2.4], [7.5, 0.18, 20.2], [0, 0.03, 0], 1);
  for (let index = 0; index < 6; index += 1) {
    rail.addBox(
      [-14.4 + index * 1.45, 1.55, 7.6],
      [0.14, 1.3, 0.14],
      [0, -0.08, 0],
      1,
    );
  }
  registerBatch(rail, group, quality, batches);
  registerBatch(windows, group, quality, batches);
  group.userData.transitionOccluders = [
    "ListeningBasinDishRim",
    "ListeningBasinFeedTrussInstances",
  ];
  return group;
}

function createSignalSpire(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
  animatedRings: THREE.Mesh[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[2];
  const group = createChapterGroup(
    "UnifiedKeyframedSignalSpire",
    "structure",
    "meridian-truss-yard",
    terrain,
    anchor.x,
    anchor.z,
  );
  group.rotation.y = 0.08;
  addMergedVolumes(
    group,
    primitives,
    materials.stone,
    "MeridianYardLayeredDeck",
    [
      { size: [8.2, 0.42, 31], position: [-1.8, 0.3, 0], radius: 0.1 },
      { size: [10.4, 0.3, 5.5], position: [-1.8, 0.22, -17], radius: 0.08 },
      { size: [6.8, 0.22, 3.8], position: [-1.8, 0.52, -16.2], radius: 0.08 },
      { size: [5.4, 0.18, 2.8], position: [-1.8, 0.72, -15.5], radius: 0.07 },
    ],
    { role: "meridian-layered-bridge-deck" },
  );
  addNamedAnchor(group, "MeridianYardBridgeDeck");
  const serviceEnvelope = new SeleneInstanceBatch(
    "MeridianYardServiceEnvelopeInstances",
    primitives.taperedModule,
    materials.roof,
  );
  serviceEnvelope.addBox(
    [-11.7, 2.65, 5.8],
    [7.4, 4.65, 10.4],
    [0, -0.06, -0.025],
    1,
  );
  serviceEnvelope.addBox(
    [-10.6, 5.2, 4.8],
    [5.2, 1.4, 7.2],
    [0, -0.06, 0.035],
    1,
  );
  serviceEnvelope.addBox(
    [-15.1, 2.1, 4.5],
    [1.25, 3.2, 7.8],
    [0, -0.06, -0.11],
    2,
  );
  registerBatch(serviceEnvelope, group, quality, batches);
  addNamedAnchor(group, "MeridianYardServiceModule");
  addMergedVolumes(
    group,
    primitives,
    materials.afterlight,
    "MeridianYardServiceWindow",
    [-13.25, -11.5, -9.75].map((x, index) => ({
      size: [1.12, index === 1 ? 0.82 : 0.66, 0.14] as const,
      position: [x, 3.15 + (index === 1 ? 0.08 : 0), 11.05] as const,
      rotation: [0, -0.06, 0] as const,
      radius: 0.04,
    })),
    { role: "deep-set-service-window-rhythm" },
  );

  const bridge = new SeleneInstanceBatch(
    "MeridianBridgeTrussInstances",
    primitives.unitBox,
    materials.structural,
  );
  const stationCount = 8;
  for (let station = 0; station < stationCount; station += 1) {
    const z = -18 + station * (36 / (stationCount - 1));
    for (const side of [-1, 1]) {
      bridge.addBox([side * 4.5 - 1.8, 4.3, z], [0.3, 7.5, 0.34], [0, 0, 0], 1);
      bridge.addBox(
        [side * 4.05 - 1.8, 1.52, z],
        [0.13, 1.25, 0.14],
        [0, 0, 0],
        station < 5 ? 1 : 2,
      );
    }
    bridge.addBeam([-6.3, 8.05, z], [2.7, 8.05, z], [0.28, 0.34], 1);
    if (station < stationCount - 1) {
      const nextZ = -18 + (station + 1) * (36 / (stationCount - 1));
      for (const side of [-1, 1]) {
        const x = side * 4.5 - 1.8;
        bridge.addBeam(
          [x, station % 2 === 0 ? 1 : 7.6, z],
          [x, station % 2 === 0 ? 7.6 : 1, nextZ],
          [0.22, 0.28],
          station % 2 === 0 ? 1 : 2,
        );
      }
    }
  }
  bridge.addBeam([-6.3, 0.82, -18], [-6.3, 0.82, 18], [0.28, 0.34], 1);
  bridge.addBeam([2.7, 0.82, -18], [2.7, 0.82, 18], [0.28, 0.34], 1);
  bridge.addBeam([-5.85, 2.08, -18], [-5.85, 2.08, 18], [0.11, 0.14], 1);
  bridge.addBeam([2.25, 2.08, -18], [2.25, 2.08, 18], [0.11, 0.14], 1);
  for (let index = 0; index < 5; index += 1) {
    const x = -13.8 + index * 1.18;
    bridge.addBox([x, 3.15, 11.0], [0.12, 1.75, 0.22], [0, -0.06, 0], 1);
    bridge.addBox([x, 4.02, 11.0], [0.82, 0.12, 0.22], [0, -0.06, 0], 1);
  }
  registerBatch(bridge, group, quality, batches);

  const tower = new SeleneInstanceBatch(
    "MeridianSignalTowerInstances",
    primitives.unitBox,
    materials.structural,
  );
  const towerCenterX = 17.2;
  const towerCenterZ = -7;
  const levels = [0.8, 6.6, 12.2, 17.2, 21.4] as const;
  for (let level = 0; level < levels.length - 1; level += 1) {
    const y0 = levels[level];
    const y1 = levels[level + 1];
    const spread0 = 3.2 - level * 0.48;
    const spread1 = 3.2 - (level + 1) * 0.48;
    const corners: readonly (readonly [number, number])[] = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    corners.forEach(([sx, sz], corner) => {
      tower.addBeam(
        [towerCenterX + sx * spread0, y0, towerCenterZ + sz * spread0],
        [towerCenterX + sx * spread1, y1, towerCenterZ + sz * spread1],
        [0.24, 0.3],
        1,
      );
      const next = corners[(corner + 1) % corners.length];
      tower.addBeam(
        [towerCenterX + sx * spread0, y0, towerCenterZ + sz * spread0],
        [
          towerCenterX + next[0] * spread1,
          y1,
          towerCenterZ + next[1] * spread1,
        ],
        [0.13, 0.17],
        level < 2 ? 1 : 2,
      );
    });
    tower.addBox(
      [towerCenterX, y1 - 0.22, towerCenterZ],
      [spread1 * 2.55, 0.2, spread1 * 2.55],
      [0, level * 0.08, 0],
      level < 2 ? 1 : 2,
    );
    for (let rung = 0; rung < 4; rung += 1) {
      const y = y0 + 1 + rung * ((y1 - y0 - 1.6) / 3);
      tower.addBox(
        [towerCenterX - spread0 * 0.72, y, towerCenterZ + spread0],
        [spread0 * 0.75, 0.1, 0.12],
        [0, 0, 0],
        level < 2 ? 1 : 2,
      );
    }
  }
  for (let fin = 0; fin < 6; fin += 1) {
    const angle = (fin / 6) * Math.PI * 2;
    tower.addBox(
      [
        towerCenterX + Math.cos(angle) * 2.5,
        22.2,
        towerCenterZ + Math.sin(angle) * 2.5,
      ],
      [0.18, 2.4, 1.45],
      [0, -angle, Math.sin(angle) * 0.06],
      fin < 3 ? 1 : 2,
    );
  }
  registerBatch(tower, group, quality, batches);
  for (let index = 0; index < 3; index += 1) {
    const ring = addRing(
      group,
      primitives,
      index === 2 ? materials.signal : materials.structural,
      `SignalSpireKineticCollar:${index + 1}`,
      2.25 + index * 0.4,
      [towerCenterX, 8.4 + index * 5.2, towerCenterZ],
      [Math.PI * 0.5 + (index - 1) * 0.11, 0, 0],
    );
    animatedRings.push(ring);
  }
  addCylinder(
    group,
    primitives,
    materials.signal,
    "SignalSpireVerticalDatum",
    0.12,
    7.8,
    [towerCenterX, 25.2, towerCenterZ],
  );
  group.userData.transitionOccluders = ["MeridianBridgeTrussInstances"];
  return group;
}

function createCivicQuarter(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
  animatedScales: AnimatedScaleMesh[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[3];
  const group = createChapterGroup(
    "UnifiedArchiveCivicQuarter",
    "orchestrate",
    "orchestration-forum",
    terrain,
    anchor.x,
    anchor.z,
  );
  group.rotation.y = 0.055;
  const wings = [
    {
      name: "west",
      size: [8.6, 5.4, 20] as const,
      position: [-17.2, 3.05, -5] as const,
    },
    {
      name: "east",
      size: [8.4, 4.7, 18] as const,
      position: [17, 2.7, -2] as const,
    },
    {
      name: "north",
      size: [21, 6.2, 7.5] as const,
      position: [0, 3.5, -18] as const,
    },
  ];
  addMergedVolumes(
    group,
    primitives,
    materials.stone,
    "ForumLayeredResearchWingMasses",
    wings.flatMap((wing, index) => {
      const yaw = index === 0 ? -0.045 : 0.035;
      const roll = index === 0 ? 0.018 : -0.012;
      const lowerHeight = wing.size[1] * 0.68;
      const upperHeight = wing.size[1] * 0.42;
      return [
        {
          size: [wing.size[0], lowerHeight, wing.size[2]] as const,
          position: [
            wing.position[0],
            lowerHeight * 0.5 + 0.28,
            wing.position[2],
          ] as const,
          rotation: [0, yaw, roll] as const,
          radius: 0.28,
        },
        {
          size: [wing.size[0] * 0.76, upperHeight, wing.size[2] * 0.78] as const,
          position: [
            wing.position[0] + (index === 0 ? 0.45 : index === 1 ? -0.4 : 0),
            lowerHeight + upperHeight * 0.5 - 0.08,
            wing.position[2] - (index === 2 ? 0.15 : 0.65),
          ] as const,
          rotation: [0, yaw, -roll] as const,
          radius: 0.22,
        },
      ];
    }),
    { role: "occupied-layered-research-wings" },
  );
  addMergedVolumes(
    group,
    primitives,
    materials.roof,
    "ForumContinuousCorniceSystem",
    wings.flatMap((wing, index) => {
      const yaw = index === 0 ? -0.045 : 0.035;
      const lowerHeight = wing.size[1] * 0.68;
      const upperHeight = wing.size[1] * 0.42;
      return [
        {
          size: [wing.size[0] * 0.82, 0.34, wing.size[2] * 0.82] as const,
          position: [
            wing.position[0] + (index === 0 ? 0.45 : index === 1 ? -0.4 : 0),
            lowerHeight + upperHeight - 0.02,
            wing.position[2] - (index === 2 ? 0.15 : 0.65),
          ] as const,
          rotation: [0, yaw, 0] as const,
          radius: 0.12,
        },
        {
          size: [wing.size[0] * 0.92, 0.28, 2.25] as const,
          position: [
            wing.position[0],
            lowerHeight - 0.2,
            wing.position[2] + wing.size[2] * 0.5 + 0.46,
          ] as const,
          rotation: [0, yaw, -0.025] as const,
          radius: 0.1,
        },
      ];
    }),
    { role: "research-wing-cornice-system" },
  );
  wings.forEach((wing) => {
    addNamedAnchor(group, `ForumResearchWing:${wing.name}`, {
      role: "occupied-research-wing",
      occluder: wing.name === "west",
    });
    addNamedAnchor(group, `ForumResearchWingRoof:${wing.name}`);
  });
  addVolume(
    group,
    primitives,
    materials.structural,
    "ForumServiceBridge",
    [13.8, 0.72, 2.1],
    [0.6, 6.55, -12.1],
    [0, 0, 0],
    { radius: 0.16, role: "occupied-service-bridge", occluder: true },
  );
  addVolume(
    group,
    primitives,
    materials.glass,
    "ForumBridgeWindow",
    [9.2, 0.5, 0.13],
    [0.6, 6.55, -10.98],
    [0, 0, 0],
    { radius: 0.04 },
  );

  const facade = new SeleneInstanceBatch(
    "ForumFacadeModuleInstances",
    primitives.unitBox,
    materials.structural,
  );
  const windows = new SeleneInstanceBatch(
    "ForumWindowBandInstances",
    primitives.unitBox,
    materials.afterlight,
  );
  wings.forEach((wing, wingIndex) => {
    const facadeZ = wing.position[2] + wing.size[2] * 0.5 + 0.1;
    const count = wing.name === "north" ? 7 : 4;
    for (let index = 0; index < count; index += 1) {
      const x = wing.position[0] + (index - (count - 1) * 0.5) * 2.5;
      for (let row = 0; row < 2; row += 1) {
        const windowY = wing.position[1] - 0.3 + row * 1.55;
        windows.addBox(
          [x, windowY, facadeZ],
          [1.32, row === 0 ? 0.72 : 0.58, 0.12],
          [0, 0, 0],
          row === 0 && index < 4 ? 1 : 2,
        );
        facade.addBox(
          [x, windowY + (row === 0 ? 0.51 : 0.44), facadeZ + 0.28],
          [1.85, 0.13, 0.62],
          [-0.03, 0, 0],
          row === 0 && index < 4 ? 1 : 2,
        );
      }
      facade.addBox(
        [x - 1.1, wing.position[1] + 0.4, facadeZ + 0.12],
        [0.12, wing.size[1] * 0.72, 0.18],
        [0, 0, 0],
        wingIndex === 2 ? 1 : 2,
      );
      facade.addBox(
        [x, wing.position[1] - 0.62, facadeZ + 0.2],
        [1.85, 0.13, 0.26],
        [0, 0, 0],
        index < 4 ? 1 : 2,
      );
      facade.addBox(
        [x, wing.position[1] + 1.82, facadeZ + 0.2],
        [1.85, 0.13, 0.26],
        [0, 0, 0],
        index < 4 ? 1 : 2,
      );
      facade.addBox(
        [x + 0.82, wing.position[1] + 0.45, facadeZ + 0.2],
        [0.13, 1.35, 0.26],
        [0, 0, 0],
        index < 4 ? 1 : 2,
      );
    }
    facade.addBox(
      [
        wing.position[0],
        wing.position[1] + wing.size[1] * 0.18,
        facadeZ + 0.32,
      ],
      [wing.size[0] * 0.88, 0.18, 0.38],
      [0, 0, 0],
      1,
    );
  });
  registerBatch(facade, group, quality, batches);
  registerBatch(windows, group, quality, batches);

  const buttresses = new SeleneInstanceBatch(
    "ForumCantedButtressInstances",
    primitives.taperedModule,
    materials.stone,
  );
  for (const side of [-1, 1]) {
    buttresses.addBox(
      [side * 11.8, 2.2, -17.2],
      [2.1, 4.4, 4.1],
      [0, 0, side * -0.08],
      1,
    );
    buttresses.addBox(
      [side * 20.1, 1.75, -3.8],
      [1.35, 3.5, 5.4],
      [0, 0, side * -0.12],
      2,
    );
  }
  for (let step = 0; step < 5; step += 1) {
    buttresses.addBox(
      [0, 0.18 + step * 0.16, -7 + step * 0.72],
      [8.6 - step * 0.65, 0.15, 1.05],
      [0, 0, 0],
      1,
    );
  }
  registerBatch(buttresses, group, quality, batches);

  const court = new SeleneInstanceBatch(
    "ForumCourtyardInstrumentInstances",
    primitives.unitBox,
    materials.structural,
  );
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    court.addBox(
      [Math.cos(angle) * 6.4, 1.45, 2.4 + Math.sin(angle) * 5.1],
      [0.32, 2.6, 0.32],
      [0, -angle, 0],
      index < 4 ? 1 : 2,
    );
    court.addBeam(
      [Math.cos(angle) * 6.4, 2.7, 2.4 + Math.sin(angle) * 5.1],
      [0, 4.9, 2.4],
      [0.14, 0.18],
      index < 4 ? 1 : 2,
    );
  }
  registerBatch(court, group, quality, batches);
  const lens = new THREE.Mesh(primitives.dome, materials.glass);
  lens.name = "ForumCoordinationLens";
  lens.position.set(0, 1.72, 2.4);
  lens.scale.set(1.45, 0.82, 1.45);
  markArchitecturalMesh(lens, "forum-coordination-instrument", {
    castShadow: false,
  });
  group.add(lens);
  animatedScales.push({
    mesh: lens,
    baseScale: lens.scale.clone(),
    phase: 1.4,
  });
  group.userData.transitionOccluders = [
    "ForumServiceBridge",
    "ForumResearchWing:west",
  ];
  return group;
}

function createAfterlightHall(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[4];
  const group = createChapterGroup(
    "UnifiedAfterlightArchiveHall",
    "embodiment",
    "relay-umbra-canyon",
    terrain,
    anchor.x,
    anchor.z,
  );
  group.rotation.y = -0.16;
  addMergedVolumes(
    group,
    primitives,
    materials.stone,
    "RelayUmbraCanyonWallMasses",
    [
      {
        size: [4.8, 5.8, 31],
        position: [-9.4, 3, -2],
        rotation: [0, -0.04, -0.025],
        radius: 0.3,
      },
      {
        size: [3.5, 4.3, 25.5],
        position: [-9.05, 7.85, -3.2],
        rotation: [0, -0.04, 0.04],
        radius: 0.24,
      },
      {
        size: [4.1, 4.7, 27],
        position: [9.6, 2.4, -3.8],
        rotation: [0, 0.035, 0.03],
        radius: 0.26,
      },
      {
        size: [3, 3.4, 20.5],
        position: [9.25, 6.35, -5.2],
        rotation: [0, 0.035, -0.045],
        radius: 0.22,
      },
      {
        size: [6.5, 1.2, 7],
        position: [-7.3, 8.65, -16],
        rotation: [0, -0.04, -0.08],
        radius: 0.2,
      },
    ],
    { role: "layered-canyon-retaining-walls", occluder: true },
  );
  addNamedAnchor(group, "RelayUmbraWestRetainingWall", {
    role: "canyon-retaining-wall",
    occluder: true,
  });
  addNamedAnchor(group, "RelayUmbraEastServiceWall", {
    role: "canyon-service-wall",
    occluder: true,
  });
  addMergedVolumes(
    group,
    primitives,
    materials.roof,
    "RelayUmbraOperationsVault",
    [
      {
        size: [9.6, 5.25, 11.2],
        position: [-1, 2.96, -14.8],
        radius: 0.36,
      },
      {
        size: [4.15, 0.34, 21.2],
        position: [-9.05, 9.68, -3.2],
        rotation: [0, -0.04, 0.025],
        radius: 0.12,
      },
      {
        size: [3.6, 0.31, 18],
        position: [9.25, 8.15, -5.2],
        rotation: [0, 0.035, -0.025],
        radius: 0.12,
      },
      {
        size: [10.35, 0.36, 11.85],
        position: [-1, 5.75, -14.8],
        radius: 0.14,
      },
    ],
    { role: "embedded-vault-and-retaining-weather-caps" },
  );
  addVolume(
    group,
    primitives,
    materials.glass,
    "RelayUmbraOperationsWindow",
    [5.8, 1.2, 0.16],
    [-1, 3.35, -9.12],
    [0, 0, 0],
    { radius: 0.05 },
  );

  const ribs = new SeleneInstanceBatch(
    "RelayUmbraVaultRibInstances",
    primitives.unitBox,
    materials.structural,
  );
  const lamps = new SeleneInstanceBatch(
    "RelayUmbraPracticalLightInstances",
    primitives.unitBox,
    materials.afterlight,
  );
  for (let index = 0; index < 8; index += 1) {
    const z = 14 - index * 4.2;
    ribs.addBox([-5.2, 3.35, z], [0.3, 6.3, 0.38], [0, 0, -0.03], 1);
    ribs.addBox([5.6, 3.35, z], [0.3, 6.3, 0.38], [0, 0, 0.03], 1);
    ribs.addBeam([-5.2, 6.4, z], [5.6, 6.4, z], [0.28, 0.36], 1);
    ribs.addBeam(
      [-5.2, 2.2, z],
      [5.6, 6.4, z],
      [0.14, 0.2],
      index % 2 === 0 ? 1 : 2,
    );
    lamps.addBox(
      [5.25, 3.15, z + 0.24],
      [0.1, 0.8, 0.12],
      [0, 0, 0],
      index < 5 ? 1 : 2,
    );
  }
  for (let step = 0; step < 5; step += 1) {
    ribs.addBox(
      [-1, 0.22 + step * 0.18, -7.5 - step * 0.72],
      [6.6 - step * 0.5, 0.16, 0.95],
      [0, 0, 0],
      1,
    );
  }
  for (const side of [-1, 1]) {
    ribs.addBox(
      [side * 3.25 - 1, 3.35, -8.95],
      [0.34, 4.55, 0.38],
      [0, 0, 0],
      1,
    );
    ribs.addBeam(
      [side * 3.25 - 1, 5.5, -8.95],
      [side * 2.2 - 1, 6.3, -9.2],
      [0.28, 0.36],
      1,
    );
  }
  ribs.addBox([-1, 5.72, -8.95], [6.8, 0.34, 0.38], [0, 0, 0], 1);
  ribs.addBox([-1, 1.42, 12.8], [8.6, 0.12, 0.14], [0, 0, 0], 1);
  for (let index = 0; index < 7; index += 1) {
    ribs.addBox(
      [-5 + index * 1.35, 0.95, 12.8],
      [0.12, 1.05, 0.12],
      [0, 0, 0],
      1,
    );
  }
  registerBatch(ribs, group, quality, batches);
  registerBatch(lamps, group, quality, batches);

  const conduits = new SeleneInstanceBatch(
    "RelayUmbraConduitBracketInstances",
    primitives.unitBox,
    materials.structural,
  );
  for (let index = 0; index < 13; index += 1) {
    const z = 18 - index * 3.1;
    conduits.addBox(
      [7.0, 5.45, z],
      [2.1, 0.15, 0.18],
      [0, 0, 0],
      index % 3 === 0 ? 1 : 2,
    );
    conduits.addBox(
      [8.0, 4.8, z],
      [0.18, 1.35, 0.18],
      [0, 0, 0],
      index % 3 === 0 ? 1 : 2,
    );
  }
  registerBatch(conduits, group, quality, batches);
  const localCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(7.8, 5.55, 19),
    new THREE.Vector3(8, 5.5, 1),
    new THREE.Vector3(7.7, 5.45, -21),
  ]);
  const utilityGeometries = [0, 1].map((line) => {
    const geometry = new THREE.TubeGeometry(
      localCurve,
      34,
      0.11 + line * 0.025,
      7,
      false,
    );
    geometry.translate(line * -0.38, 0, 0);
    return geometry;
  });
  const utilityPipe = new THREE.Mesh(
    mergeGeometries(utilityGeometries, false),
    materials.structural,
  );
  utilityPipe.name = "RelayUmbraLongitudinalUtilityPair";
  markArchitecturalMesh(utilityPipe, "canyon-power-conduits", {
    castShadow: false,
  });
  group.add(utilityPipe);
  const signalGeometry = new THREE.TubeGeometry(localCurve, 34, 0.16, 7, false);
  signalGeometry.translate(-0.76, 0, 0);
  const signalPipe = new THREE.Mesh(signalGeometry, materials.signal);
  signalPipe.name = "RelayUmbraLongitudinalSignalConduit";
  markArchitecturalMesh(signalPipe, "canyon-data-conduit", {
    castShadow: false,
  });
  group.add(signalPipe);
  for (let line = 0; line < 3; line += 1) {
    addNamedAnchor(group, `RelayUmbraLongitudinalConduit:${line + 1}`);
  }
  group.userData.transitionOccluders = [
    "RelayUmbraWestRetainingWall",
    "RelayUmbraVaultRibInstances",
  ];
  return group;
}

function createDistantCivicField(
  terrain: TerrainField,
  primitives: CampusPrimitives,
  materials: SeleneCampusMaterials,
  quality: ObservatoryQualityProfile,
  batches: SeleneInstanceBatch[],
  animatedRings: THREE.Mesh[],
  qualityObjects: QualityObject[],
) {
  const anchor = OBSERVATORY_LANDMARK_PLATFORMS[5];
  const group = createChapterGroup(
    "UnifiedDistantCivicField",
    "archive-afterlight",
    "afterlight-archive-basin",
    terrain,
    anchor.x,
    anchor.z,
  );
  group.rotation.y = -0.075;
  addMergedVolumes(
    group,
    primitives,
    materials.stone,
    "AfterlightArchiveLayeredMasses",
    [
      {
        size: [12.8, 4.25, 23],
        position: [-17.8, 2.62, -7],
        rotation: [0, -0.055, 0.015],
        radius: 0.3,
      },
      {
        size: [9.4, 2.65, 17.8],
        position: [-17.25, 6.02, -8.1],
        rotation: [0, -0.055, -0.018],
        radius: 0.24,
      },
      {
        size: [12.8, 4.25, 23],
        position: [17.8, 2.62, -7],
        rotation: [0, 0.055, -0.015],
        radius: 0.3,
      },
      {
        size: [9.4, 2.65, 17.8],
        position: [17.25, 6.02, -8.1],
        rotation: [0, 0.055, 0.018],
        radius: 0.24,
      },
      {
        size: [13, 0.85, 13],
        position: [0, 0.62, -5],
        rotation: [0, Math.PI * 0.25, 0],
        radius: 0.3,
      },
      { size: [9.2, 0.22, 2], position: [0, 0.2, 11], radius: 0.08 },
      { size: [8.1, 0.22, 1.7], position: [0, 0.42, 10.1], radius: 0.08 },
      { size: [7, 0.22, 1.4], position: [0, 0.64, 9.3], radius: 0.08 },
      { size: [5.9, 0.22, 1.1], position: [0, 0.86, 8.65], radius: 0.08 },
    ],
    { role: "archive-wings-lightwell-and-arrival-stairs" },
  );
  addMergedVolumes(
    group,
    primitives,
    materials.roof,
    "AfterlightArchiveCornicePair",
    [
      {
        size: [10.4, 0.4, 18.8],
        position: [-17.25, 7.48, -8.1],
        rotation: [0, -0.055, 0],
        radius: 0.14,
      },
      {
        size: [10.4, 0.4, 18.8],
        position: [17.25, 7.48, -8.1],
        rotation: [0, 0.055, 0],
        radius: 0.14,
      },
      {
        size: [13.7, 0.3, 3.4],
        position: [-17.8, 4.72, 5.1],
        rotation: [0, -0.055, -0.025],
        radius: 0.11,
      },
      {
        size: [13.7, 0.3, 3.4],
        position: [17.8, 4.72, 5.1],
        rotation: [0, 0.055, 0.025],
        radius: 0.11,
      },
    ],
    { role: "archive-wing-cornices" },
  );
  addNamedAnchor(group, "AfterlightArchiveWestWing", { role: "archive-wing" });
  addNamedAnchor(group, "AfterlightArchiveEastWing", { role: "archive-wing" });
  addNamedAnchor(group, "AfterlightArchiveWestRoof");
  addNamedAnchor(group, "AfterlightArchiveEastRoof");
  addNamedAnchor(group, "AfterlightArchiveLightwellCollar", {
    role: "archive-lightwell-foundation",
  });

  // The archive is a civic weather shell, not a giant decorative lens.  Using
  // the shared mineral roof material keeps this chapter in the same
  // concrete/metal language as the rest of the campus and avoids the glossy
  // violet "plastic bubble" that previously dominated the closing shot.
  const dome = new THREE.Mesh(primitives.dome, materials.roof);
  dome.name = "DistantCivicFieldArchiveDome";
  dome.position.set(0, 1.15, -5);
  dome.scale.set(10.6, 7.1, 10.6);
  markArchitecturalMesh(dome, "archive-mineral-weather-shell", {
    castShadow: false,
  });
  group.add(dome);
  const crown = addRing(
    group,
    primitives,
    materials.afterlight,
    "DistantCivicFieldArchiveCrown",
    6.1,
    [0, 8.26, -5],
  );
  animatedRings.push(crown);

  const ribs = new SeleneInstanceBatch(
    "AfterlightArchiveDomeRibInstances",
    primitives.unitBox,
    materials.structural,
  );
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    ribs.addBeam(
      [Math.cos(angle) * 10.4, 1.2, -5 + Math.sin(angle) * 10.4],
      [Math.cos(angle) * 5.85, 8.18, -5 + Math.sin(angle) * 5.85],
      [0.18, 0.22],
      1,
    );
  }
  registerBatch(ribs, group, quality, batches);

  const facade = new SeleneInstanceBatch(
    "AfterlightArchiveFacadeInstances",
    primitives.unitBox,
    materials.structural,
  );
  const windows = new SeleneInstanceBatch(
    "AfterlightArchiveWindowInstances",
    primitives.unitBox,
    materials.afterlight,
  );
  for (const side of [-1, 1]) {
    for (let index = 0; index < 8; index += 1) {
      const x = side * 11.48;
      const z = 3.6 - index * 3;
      for (let row = 0; row < 2; row += 1) {
        const windowY = 2.45 + row * 2.1;
        facade.addBox(
          [x - side * 0.16, windowY, z - 1.02],
          [0.24, 1.7, 0.3],
          [0, side * 0.035, 0],
          row === 0 && index < 5 ? 1 : 2,
        );
        windows.addBox(
          [x, windowY, z],
          [0.12, row === 0 ? 0.76 : 0.62, 1.42],
          [0, side * 0.035, 0],
          row === 0 && index < 5 ? 1 : 2,
        );
        facade.addBox(
          [x - side * 0.18, windowY - 0.5, z],
          [0.28, 0.13, 1.82],
          [0, side * 0.035, 0],
          row === 0 && index < 5 ? 1 : 2,
        );
        facade.addBox(
          [x - side * 0.18, windowY + 0.5, z],
          [0.28, 0.13, 1.82],
          [0, side * 0.035, 0],
          row === 0 && index < 5 ? 1 : 2,
        );
      }
    }
    facade.addBox(
      [side * 11.35, 5.05, -7],
      [0.32, 0.22, 21.8],
      [0, side * 0.055, 0],
      1,
    );
  }
  for (let fin = 0; fin < 7; fin += 1) {
    const angle = -0.68 + fin * 0.225;
    facade.addBeam(
      [Math.sin(angle) * 9.6, 0.95, -5 + Math.cos(angle) * 9.6],
      [Math.sin(angle) * 6.15, 7.85, -5 + Math.cos(angle) * 6.15],
      [0.15, 0.2],
      fin < 4 ? 1 : 2,
    );
  }
  registerBatch(facade, group, quality, batches);
  registerBatch(windows, group, quality, batches);

  const beacon = addCylinder(
    group,
    primitives,
    materials.structural,
    "AfterlightArchiveMeridianBeacon",
    0.72,
    12.5,
    [0, 15, -14],
  );
  const beaconTip = addCylinder(
    group,
    primitives,
    materials.signal,
    "AfterlightArchiveBeaconEmitter",
    0.18,
    5.4,
    [0, 23.8, -14],
  );
  beaconTip.castShadow = false;
  const remoteQuarter = new THREE.Group();
  remoteQuarter.name = "AfterlightArchiveRemoteQuarter";
  const repositories = new SeleneInstanceBatch(
    "AfterlightRemoteRepositoryInstances",
    primitives.unitBox,
    materials.stone,
  );
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 6; column += 1) {
      const repositoryTier = (row + column) % 3;
      repositories.addBox(
        [-16 + column * 6.4, 2.1, -25 - row * 7.2],
        [4.2, 2.8 + repositoryTier * 0.9, 5.6],
        [0, ((column % 3) - 1) * 0.04, 0],
        2,
      );
      repositories.addBox(
        [-16 + column * 6.4, 3.66 + repositoryTier * 0.45, -25 - row * 7.2],
        [3.45, 0.32, 4.7],
        [0, ((column % 3) - 1) * 0.04, 0],
        2,
      );
    }
  }
  registerBatch(repositories, remoteQuarter, quality, batches);
  group.add(remoteQuarter);
  qualityObjects.push({ object: remoteQuarter, minimumDetail: 2 });
  group.userData.transitionOccluders = ["DistantCivicFieldArchiveCrown"];
  void beacon;
  return group;
}

export function createUnifiedObservatoryCampus(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  terrain: TerrainField,
  injectedMaterials?: SeleneCampusMaterials,
): UnifiedObservatoryCampus {
  const materials = injectedMaterials ?? createSeleneCampusMaterials(palette);
  const primitives = createPrimitives(quality);
  const group = new THREE.Group();
  group.name = "UnifiedObservatoryCampus";
  group.userData = {
    role: "continuous-observatory-campus",
    world: "Selene Meridian",
    composition: "single-continuous-observatory-campus",
    spatialContinuity: true,
    connectedChapters: [...CONNECTED_CHAPTERS],
    fixedWorldCoordinates: true,
    designLanguage: "inhabited-lunar-rift-research-infrastructure",
    primitiveExhibitPlatforms: false,
    constructionLogic:
      "foundations-frames-supports-joints-panels-rails-conduits",
  };

  const batches: SeleneInstanceBatch[] = [];
  const animatedRings: THREE.Mesh[] = [];
  const animatedScales: AnimatedScaleMesh[] = [];
  const qualityObjects: QualityObject[] = [];

  const deck = createCampusDeck(
    terrain,
    primitives,
    materials,
    quality,
    batches,
  );
  const terraces = createCourtyardTerraces(
    terrain,
    primitives,
    materials,
    quality,
    batches,
  );
  const colonnade = createCampusColonnade(
    terrain,
    primitives,
    materials,
    quality,
    batches,
  );
  const gate = createGateAtrium(
    terrain,
    primitives,
    materials,
    quality,
    batches,
    animatedScales,
  );
  const observation = createObservationHall(
    terrain,
    primitives,
    materials,
    quality,
    batches,
    animatedRings,
  );
  const spire = createSignalSpire(
    terrain,
    primitives,
    materials,
    quality,
    batches,
    animatedRings,
  );
  const civic = createCivicQuarter(
    terrain,
    primitives,
    materials,
    quality,
    batches,
    animatedScales,
  );
  const relay = createAfterlightHall(
    terrain,
    primitives,
    materials,
    quality,
    batches,
  );
  const archive = createDistantCivicField(
    terrain,
    primitives,
    materials,
    quality,
    batches,
    animatedRings,
    qualityObjects,
  );
  group.add(
    deck,
    terraces,
    colonnade,
    gate,
    observation,
    spire,
    civic,
    relay,
    archive,
  );
  const authoredShadowCasterNames = new Set([
    "GateLayeredEnvelopeInstances",
    "ListeningBasinFacilityMasses",
    "MeridianYardServiceEnvelopeInstances",
    "ForumLayeredResearchWingMasses",
    "RelayUmbraCanyonWallMasses",
    "AfterlightArchiveLayeredMasses",
  ]);
  const authoredShadowCasters: THREE.Mesh[] = [];
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const authoredCaster = authoredShadowCasterNames.has(object.name);
    object.userData.shadowParticipation = authoredCaster
      ? "standard-enhanced-only"
      : "receive-only";
    object.castShadow = false;
    if (authoredCaster) authoredShadowCasters.push(object);
  });

  const recolor = (nextPalette: ThreeObservatoryPalette) => {
    const light = isLightPalette(nextPalette);
    materials.stone.color
      .copy(
        light
          ? nextPalette.particleBase.clone().lerp(nextPalette.fog, 0.5)
          : campusMineralBase(nextPalette, 0.1),
      )
      .lerp(nextPalette.metal, light ? 0.1 : 0);
    materials.stone.emissive.copy(campusMineralBounce(nextPalette));
    materials.structural.color
      .copy(
        light
          ? nextPalette.particleBase.clone().lerp(nextPalette.fog, 0.32)
          : campusMineralBase(nextPalette, 0.14),
      )
      .lerp(nextPalette.metal, light ? 0.38 : 0);
    materials.structural.emissive.copy(campusMineralBounce(nextPalette));
    materials.roof.color
      .copy(
        light
          ? nextPalette.particleBase.clone().lerp(nextPalette.fog, 0.44)
          : campusMineralBase(nextPalette, 0.06),
      )
      .lerp(nextPalette.metal, light ? 0.18 : 0);
    materials.roof.emissive.copy(campusMineralBounce(nextPalette));
    materials.glass.color.copy(
      light
        ? nextPalette.particleBase
            .clone()
            .lerp(nextPalette.fog, 0.26)
            .lerp(nextPalette.orbit, 0.18)
        : nextPalette.fog
            .clone()
            .lerp(nextPalette.particleBase, 0.22)
            .lerp(nextPalette.orbit, 0.12),
    );
    materials.glass.emissive.copy(occupiedApertureColor(nextPalette));
    materials.glass.opacity = 0.78;
    materials.signal.color.copy(sparseSignalCobalt(nextPalette));
    materials.signal.emissive.copy(sparseSignalCobalt(nextPalette));
    materials.afterlight.color.copy(occupiedApertureColor(nextPalette));
    materials.afterlight.emissive.copy(occupiedApertureColor(nextPalette));
  };

  const applyQuality = (nextQuality: ObservatoryQualityProfile) => {
    batches.forEach((batch) => batch.applyDetail(nextQuality.worldDetail));
    qualityObjects.forEach(({ object, minimumDetail }) => {
      object.visible = nextQuality.worldDetail >= minimumDetail;
    });
    // Keep materials and the renderer shadow pipeline stable. Quality changes
    // only alter which already-resident large silhouettes enter the shadow
    // pass; low tier performs no campus shadow draw at all.
    const campusShadowsEnabled =
      nextQuality.tier === "standard" || nextQuality.tier === "enhanced";
    authoredShadowCasters.forEach((mesh) => {
      mesh.castShadow = campusShadowsEnabled;
    });
  };

  recolor(palette);
  applyQuality(quality);

  return {
    group,
    stoneMaterial: materials.stone,
    structuralMaterial: materials.structural,
    update(state, elapsedSeconds) {
      animatedRings.forEach((ring, index) => {
        ring.rotation.z =
          elapsedSeconds * (0.018 + index * 0.004) + index * 0.15;
      });
      animatedScales.forEach(({ mesh, baseScale, phase }, index) => {
        const pulse =
          0.985 +
          Math.sin(elapsedSeconds * (0.32 + index * 0.03) + phase) * 0.015;
        mesh.scale.copy(baseScale).multiplyScalar(pulse);
      });
      materials.signal.emissiveIntensity =
        0.34 + state.signalIntensity * 0.28 + state.ringIntensity * 0.12;
      materials.afterlight.emissiveIntensity =
        0.38 + state.afterlightIntensity * 0.36 + state.cityIntensity * 0.08;
      materials.glass.emissiveIntensity =
        0.045 + state.signalIntensity * 0.075 + state.afterlightIntensity * 0.09;
    },
    setPalette: recolor,
    setQuality: applyQuality,
  };
}
