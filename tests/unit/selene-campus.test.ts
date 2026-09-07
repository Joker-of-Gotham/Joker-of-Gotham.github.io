import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { getQualityProfile } from "../../src/lib/observatory/quality-tier";
import {
  createObservatoryTerrainField,
  SELENE_MERIDIAN_ROUTE,
} from "../../src/lib/observatory/terrain-field";
import {
  createSeleneCampusMaterials,
  createUnifiedObservatoryCampus,
} from "../../src/lib/observatory/unified-campus";

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

function countVisibleGeometry(root: THREE.Object3D) {
  let drawables = 0;
  let triangles = 0;
  let instances = 0;
  const visit = (object: THREE.Object3D, parentVisible: boolean) => {
    const visible = parentVisible && object.visible;
    if (visible && object instanceof THREE.Mesh) {
      drawables += 1;
      const multiplier =
        object instanceof THREE.InstancedMesh ? object.count : 1;
      instances += multiplier;
      const geometryTriangles = object.geometry.index
        ? object.geometry.index.count / 3
        : object.geometry.getAttribute("position").count / 3;
      triangles += geometryTriangles * multiplier;
    }
    object.children.forEach((child) => visit(child, visible));
  };
  visit(root, true);
  return { drawables, triangles, instances };
}

function countShadowCasters(root: THREE.Object3D) {
  let count = 0;
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.castShadow) count += 1;
  });
  return count;
}

describe("Selene Meridian campus geometry", () => {
  it("keeps the non-hydrated fallback in the same restrained material grammar", () => {
    const materials = createSeleneCampusMaterials(palette);
    const glass = materials.glass as THREE.MeshPhysicalMaterial;

    expect(glass.roughness).toBeGreaterThanOrEqual(0.3);
    expect(glass.transmission).toBe(0);
    expect(glass.clearcoat).toBe(0);
    expect(materials.signal.toneMapped).toBe(true);
    expect(materials.signal.roughness).toBeGreaterThanOrEqual(0.5);
    expect(materials.afterlight.toneMapped).toBe(true);
    expect(materials.afterlight.roughness).toBeGreaterThanOrEqual(0.6);

    Object.values(materials).forEach((material) => material.dispose());
  });

  it("keeps one physical datum through all six inhabited districts", () => {
    const terrain = createObservatoryTerrainField();
    const campus = createUnifiedObservatoryCampus(
      getQualityProfile("standard"),
      palette,
      terrain,
    );

    expect(campus.group.userData).toMatchObject({
      world: "Selene Meridian",
      spatialContinuity: true,
      primitiveExhibitPlatforms: false,
    });
    expect(
      campus.group.getObjectByName("CampusContinuousStoneDeck"),
    ).toBeTruthy();
    expect(
      campus.group.getObjectByName("CampusContinuousAfterlightDatum"),
    ).toBeTruthy();
    expect(campus.group.getObjectByName("CampusPowerConduit")).toBeTruthy();
    expect(
      campus.group.getObjectByName("ListeningBasinParabolicReflector"),
    ).toBeTruthy();
    expect(
      campus.group.getObjectByName("ListeningBasinFacilityMasses"),
    ).toBeTruthy();
    expect(
      campus.group.getObjectByName("MeridianBridgeTrussInstances"),
    ).toBeTruthy();
    expect(
      campus.group.getObjectByName("ForumLayeredResearchWingMasses"),
    ).toBeTruthy();
    expect(
      campus.group.getObjectByName("ForumServiceBridge")?.userData
        .transitionOccluder,
    ).toBe(true);
    expect(
      campus.group.getObjectByName("RelayUmbraWestRetainingWall")?.userData
        .transitionOccluder,
    ).toBe(true);

    SELENE_MERIDIAN_ROUTE.forEach(([x, z]) => {
      expect(terrain.sample(x, z).regions.path).toBeGreaterThan(0.95);
    });
  });

  it("uses deterministic batching and degrades detail without deleting landmarks", () => {
    const terrain = createObservatoryTerrainField();
    const campus = createUnifiedObservatoryCampus(
      getQualityProfile("enhanced"),
      palette,
      terrain,
    );
    const enhanced = countVisibleGeometry(campus.group);
    const enhancedShadowCasters = countShadowCasters(campus.group);
    campus.setQuality(getQualityProfile("low"));
    const low = countVisibleGeometry(campus.group);
    const lowShadowCasters = countShadowCasters(campus.group);

    expect(enhanced.instances).toBeGreaterThan(low.instances);
    expect(low.instances).toBeGreaterThan(180);
    expect(low.drawables).toBeLessThanOrEqual(70);
    expect(low.triangles).toBeLessThan(250_000);
    expect(enhancedShadowCasters).toBeGreaterThan(0);
    expect(enhancedShadowCasters).toBeLessThanOrEqual(6);
    expect(lowShadowCasters).toBe(0);
    expect(
      campus.group.getObjectByName("UnifiedDistantCivicField"),
    ).toBeTruthy();
  });

  it("articulates occupied shells without returning to monolithic district slabs", () => {
    const terrain = createObservatoryTerrainField();
    const campus = createUnifiedObservatoryCampus(
      getQualityProfile("standard"),
      palette,
      terrain,
    );
    const foundations = campus.group.getObjectByName(
      "CampusDistrictFoundationInstances",
    ) as THREE.InstancedMesh;
    const forumWindows = campus.group.getObjectByName(
      "ForumWindowBandInstances",
    ) as THREE.InstancedMesh;
    const archiveWindows = campus.group.getObjectByName(
      "AfterlightArchiveWindowInstances",
    ) as THREE.InstancedMesh;

    expect(foundations.userData.detailCounts).toEqual([14, 19, 19]);
    expect(forumWindows.userData.detailCounts[1]).toBeGreaterThan(20);
    expect(archiveWindows.userData.detailCounts[1]).toBeGreaterThan(20);
    expect(
      campus.group.getObjectByName("ListeningBasinControlRoof")?.userData
        .role,
    ).toBe("layered-thermal-weather-shells");
    expect(
      campus.group.getObjectByName("GateServiceBridge")?.userData
        .transitionOccluder,
    ).toBe(true);
    const archiveShell = campus.group.getObjectByName(
      "DistantCivicFieldArchiveDome",
    ) as THREE.Mesh;
    expect(archiveShell.userData.role).toBe("archive-mineral-weather-shell");
    expect((archiveShell.material as THREE.Material).name).toBe(
      "CampusRoofMaterial",
    );
  });
});
