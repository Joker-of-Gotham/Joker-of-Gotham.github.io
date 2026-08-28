import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  getLowerQualityProfile,
  getQualityProfile,
} from "../../src/lib/observatory/quality-tier";
import {
  OBSERVATORY_TIMELINE,
  calculateAbsoluteScrollProgress,
  getChapterId,
  interpolateObservatoryTimeline,
} from "../../src/lib/observatory/timeline";
import {
  calculateObservatoryAspectFraming,
  getObservatoryCameraRouteLength,
  sampleObservatoryCameraRoute,
} from "../../src/lib/observatory/camera-director";
import {
  getObservatoryPoseAtlasFrame,
  resolveObservatoryAvatarPose,
} from "../../src/lib/observatory/pose-director";
import { createObservatoryTerrainField } from "../../src/lib/observatory/terrain-field";
import { createProceduralObservatoryWorld } from "../../src/lib/observatory/procedural-world";

describe("observatory quality profiles", () => {
  it("keeps the static poster tier free of continuous GPU work", () => {
    expect(getQualityProfile("poster")).toMatchObject({
      frameRateCap: 0,
      avatarSegments: 0,
      worldDetail: 0,
      starCount: 0,
      pointerInteraction: false,
    });
  });

  it("returns defensive profile copies", () => {
    const first = getQualityProfile("standard");
    first.avatarSegments = 1;
    expect(getQualityProfile("standard").avatarSegments).toBe(44);
  });

  it("degrades one tier at a time without escaping the low tier", () => {
    expect(getLowerQualityProfile("enhanced").tier).toBe("standard");
    expect(getLowerQualityProfile("standard").tier).toBe("low");
    expect(getLowerQualityProfile("low").tier).toBe("low");
  });

  it("uses mesh subdivision and concrete-world detail budgets instead of avatar particles", () => {
    const low = getQualityProfile("low");
    const standard = getQualityProfile("standard");
    const enhanced = getQualityProfile("enhanced");

    expect(low.avatarSegments).toBeLessThan(standard.avatarSegments);
    expect(standard.avatarSegments).toBeLessThan(enhanced.avatarSegments);
    expect([low.worldDetail, standard.worldDetail, enhanced.worldDetail]).toEqual([1, 2, 3]);
    expect([low.terrainSegments, standard.terrainSegments, enhanced.terrainSegments]).toEqual([56, 88, 120]);
    expect(low.cityInstanceCount).toBeLessThan(enhanced.cityInstanceCount);
    expect(low).not.toHaveProperty("particleCount");
  });
});

describe("observatory chapter timeline", () => {
  it("clamps progress to the six authored chapters", () => {
    expect(interpolateObservatoryTimeline(-2).chapter).toBe("signal-gate");
    expect(interpolateObservatoryTimeline(99).chapter).toBe("archive-afterlight");
    expect(interpolateObservatoryTimeline(99).absoluteProgress).toBe(OBSERVATORY_TIMELINE.length - 1);
  });

  it("interpolates between adjacent authored keyframes", () => {
    const start = interpolateObservatoryTimeline(0);
    const middle = interpolateObservatoryTimeline(0.5);
    const end = interpolateObservatoryTimeline(1);

    expect(middle.routeProgress).toBeCloseTo((start.routeProgress + end.routeProgress) / 2);
    expect(middle.avatarOffset[2]).toBeCloseTo((start.avatarOffset[2] + end.avatarOffset[2]) / 2);
    expect(middle.chapter).toBe("signal-gate");
    expect(end.chapter).toBe("observe");
    expect(middle).not.toHaveProperty("worldPosition");
    expect(middle).not.toHaveProperty("worldRotation");
  });

  it("maps viewport centers monotonically across chapter centers", () => {
    const centers = [100, 500, 900, 1_300, 1_700, 2_100];
    const samples = [0, 300, 700, 1_100, 1_500, 1_900, 2_400].map((center) =>
      calculateAbsoluteScrollProgress(centers, center),
    );

    expect(samples).toEqual([...samples].sort((a, b) => a - b));
    expect(samples[0]).toBe(0);
    expect(samples.at(-1)).toBe(5);
  });

  it("clamps rounded chapter lookups", () => {
    expect(getChapterId(-10)).toBe("signal-gate");
    expect(getChapterId(2.4)).toBe("structure");
    expect(getChapterId(10)).toBe("archive-afterlight");
  });

  it("hands emphasis continuously between the moon, city, megastructure, and canyon", () => {
    const states = OBSERVATORY_TIMELINE.map((_, index) => interpolateObservatoryTimeline(index));
    expect(states[0].moonIntensity).toBeGreaterThan(states[0].cityIntensity);
    expect(states[2].ringIntensity).toBe(1);
    expect(states[3].cityIntensity).toBe(1);
    expect(states[4].canyonIntensity).toBe(1);
    expect(states.every((state) => state.avatarPresence >= 0.9)).toBe(true);
  });
});

describe("observatory world-v3 director", () => {
  it("travels a fixed macro world on independent camera and look splines", () => {
    const length = getObservatoryCameraRouteLength();
    const start = sampleObservatoryCameraRoute(0);
    const finish = sampleObservatoryCameraRoute(1);

    expect(length).toBeGreaterThan(300);
    expect(length).toBeLessThan(500);
    expect(start.position[2]).toBeGreaterThan(finish.position[2]);
    expect(start.lookAt).not.toEqual(start.position);
    expect(finish.lookAt).not.toEqual(finish.position);
  });

  it("uses aspect-aware framing without changing route coordinates", () => {
    const narrowPortrait = calculateObservatoryAspectFraming(0.46);
    const tabletPortrait = calculateObservatoryAspectFraming(0.75);
    expect(narrowPortrait.lateralScale).toBeLessThan(0.3);
    expect(narrowPortrait.avatarScale).toBeLessThan(0.3);
    expect(tabletPortrait.lateralScale).toBeGreaterThan(narrowPortrait.lateralScale);
    expect(tabletPortrait.avatarScale).toBeGreaterThan(narrowPortrait.avatarScale);
    expect(calculateObservatoryAspectFraming(1.4)).toEqual({
      lateralScale: 1,
      verticalOffset: 0,
      avatarScale: 1,
    });
  });

  it("keeps a named landmark world fixed while only animating its internals", () => {
    const palette = {
      fog: new THREE.Color("#070b18"),
      signal: new THREE.Color("#7de6ff"),
      orbit: new THREE.Color("#9caeff"),
      afterlight: new THREE.Color("#f0a8cf"),
      metal: new THREE.Color("#8390a8"),
      particleBase: new THREE.Color("#d8e1ff"),
      avatarHair: new THREE.Color("#090a10"),
      avatarSkin: new THREE.Color("#f0c9bd"),
      avatarUniform: new THREE.Color("#161925"),
      avatarUniformSecondary: new THREE.Color("#292e42"),
      avatarEye: new THREE.Color("#6ca6ff"),
      avatarShoe: new THREE.Color("#0b0d14"),
    };
    const world = createProceduralObservatoryWorld(getQualityProfile("low"), palette);
    const initialPosition = world.group.position.clone();
    const initialQuaternion = world.group.quaternion.clone();

    world.update(interpolateObservatoryTimeline(4.2), 9, 1 / 30);
    expect(world.group.name).toBe("ObservatoryWorldV4FullRealtime");
    expect(world.group.userData.fixedWorldCoordinates).toBe(true);
    expect(world.group.userData.livePlateDependency).toBe(false);
    expect(world.group.position).toEqual(initialPosition);
    expect(world.group.quaternion.angleTo(initialQuaternion)).toBeCloseTo(0);
    expect(world.group.getObjectByName("TerrainFieldSurface")).toBeTruthy();
    expect(world.group.getObjectByName("AtmosphericLunarSkyDome")).toBeTruthy();
    expect(world.group.getObjectByName("AtmosphericHorizonGlowBand")).toBeTruthy();
    expect(world.group.getObjectByName("TerrainContourAtmosphericLines")).toBeTruthy();
    expect(world.group.getObjectByName("PeriapsisHeroDishAssembly")).toBeTruthy();
    expect(world.group.getObjectByName("OrbitalLatticeMegastructure")).toBeTruthy();
    expect(world.group.getObjectByName("TerracedObservatoryCity")).toBeTruthy();
    expect(world.group.getObjectByName("FarHorizonObservatoryCity")).toBeTruthy();
    expect(world.group.getObjectByName("RelayCanyonInfrastructure")).toBeTruthy();
    expect(world.group.getObjectByName("ArchiveAfterlightBasin")).toBeTruthy();

    const terrain = world.group.getObjectByName("TerrainFieldSurface") as THREE.Mesh;
    const terrainMaterial = terrain.material as THREE.MeshStandardMaterial;
    expect(terrainMaterial.transparent).toBe(false);
    expect(terrainMaterial.depthWrite).toBe(true);
    expect(terrainMaterial.opacity).toBe(1);

    const kitMaterials = new Set<THREE.Material>();
    world.group.getObjectByName("RecognizableObservatoryKit")?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => kitMaterials.add(material));
    });
    expect(kitMaterials.size).toBeGreaterThanOrEqual(5);
    const structuralMaterials = [...kitMaterials].filter((material) =>
      ["ObservatoryKitMetal", "ObservatoryKitStructuralVeil", "ObservatoryKitSolarMembrane"].includes(material.name),
    );
    expect(structuralMaterials).toHaveLength(3);
    structuralMaterials.forEach((material) => {
      expect(material.transparent).toBe(false);
      expect(material.depthWrite).toBe(true);
      expect(material.opacity).toBe(1);
    });
    world.setPalette({
      fog: new THREE.Color("#eae6e0"),
      signal: new THREE.Color("#4f46b8"),
      orbit: new THREE.Color("#345eaa"),
      afterlight: new THREE.Color("#9e4266"),
      metal: new THREE.Color("#8d7138"),
      particleBase: new THREE.Color("#212536"),
      avatarHair: new THREE.Color("#161925"),
      avatarSkin: new THREE.Color("#f0c9bd"),
      avatarUniform: new THREE.Color("#f5f2ec"),
      avatarUniformSecondary: new THREE.Color("#cdd2df"),
      avatarEye: new THREE.Color("#345eaa"),
      avatarShoe: new THREE.Color("#212536"),
    });
    expect(terrainMaterial.opacity).toBe(1);
    structuralMaterials.forEach((material) => expect(material.opacity).toBe(1));
    world.dispose();
  });
});

describe("observatory terrain field", () => {
  it("is deterministic and exposes normalized terrain semantics", () => {
    const field = createObservatoryTerrainField();
    const first = field.sample(-20, -276);
    const repeated = field.sample(-20, -276);
    const normalLength = Math.hypot(...first.normal);

    expect(repeated).toEqual(first);
    expect(normalLength).toBeCloseTo(1, 5);
    expect(first.regions.canyon).toBeGreaterThan(0.5);
    expect(Object.values(first.regions).every((weight) => weight >= 0 && weight <= 1)).toBe(true);
  });

  it("flattens authored landmark platforms while retaining the continuous field", () => {
    const field = createObservatoryTerrainField();
    const platform = field.sample(27, -198);
    const ridge = field.sample(92, -188);

    expect(platform.regions.platform).toBeGreaterThan(0.95);
    expect(platform.buildable).toBeGreaterThan(0.8);
    expect(platform.height).not.toBe(ridge.height);
  });
});

describe("observatory multi-pose atlas director", () => {
  it("maps the eight authored poses into a 4x2 atlas", () => {
    expect(getObservatoryPoseAtlasFrame("idle")).toMatchObject({ index: 0, offsetX: 0, offsetY: 0.5 });
    expect(getObservatoryPoseAtlasFrame("settle")).toMatchObject({ index: 7, offsetX: 0.75, offsetY: 0 });
  });

  it("uses forward and reverse hysteresis around quick turns", () => {
    expect(resolveObservatoryAvatarPose(3.95, "present", 1)).toBe("quick-turn");
    expect(resolveObservatoryAvatarPose(4.21, "back-look", -1)).toBe("back-look");
    expect(resolveObservatoryAvatarPose(4.12, "back-look", -1)).toBe("quick-turn");
    expect(resolveObservatoryAvatarPose(3.95, "present", 1, "low")).toBe("back-look");
  });
});
