import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { getQualityProfile } from "../../src/lib/observatory/quality-tier";
import { createObservatoryVolumetricAvatar } from "../../src/lib/observatory/volumetric-avatar";
import type { ThreeObservatoryPalette } from "../../src/lib/observatory/palette";

const palette = (): ThreeObservatoryPalette => ({
  fog: new THREE.Color("#05060a"),
  signal: new THREE.Color("#8d7cff"),
  orbit: new THREE.Color("#6ca6ff"),
  afterlight: new THREE.Color("#e58aa8"),
  metal: new THREE.Color("#c6aa70"),
  particleBase: new THREE.Color("#cdd2df"),
  avatarHair: new THREE.Color("#090a10"),
  avatarSkin: new THREE.Color("#f0c9bd"),
  avatarUniform: new THREE.Color("#161925"),
  avatarUniformSecondary: new THREE.Color("#292e42"),
  avatarEye: new THREE.Color("#6ca6ff"),
  avatarShoe: new THREE.Color("#0b0d14")
});

describe("observatory volumetric avatar", () => {
  it("builds an articulated, opaque Three.js character instead of a visible image plane", () => {
    const rig = createObservatoryVolumetricAvatar(getQualityProfile("enhanced"), palette());
    const visiblePlanes: THREE.Mesh[] = [];
    const bodyMaterials: THREE.MeshStandardMaterial[] = [];
    let meshCount = 0;

    rig.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.visible) return;
      meshCount += 1;
      if (object.geometry instanceof THREE.PlaneGeometry) visiblePlanes.push(object);
      if (object.userData.avatarSurface === "body" && object.material instanceof THREE.MeshStandardMaterial) {
        bodyMaterials.push(object.material);
      }
    });

    expect(rig.group.name).toBe("ObservatoryVolumetricCharacterRigV2");
    expect(rig.group.userData.representation).toBe("procedural-threejs-articulated-volume");
    expect(meshCount).toBeGreaterThanOrEqual(32);
    expect(visiblePlanes).toHaveLength(0);
    expect(bodyMaterials.length).toBeGreaterThan(12);
    expect(bodyMaterials.every((material) => !material.transparent && material.depthWrite)).toBe(true);

    [
      "AvatarHipsJoint",
      "AvatarSpineJoint",
      "AvatarHeadJoint",
      "AvatarLeftShoulderJoint",
      "AvatarLeftElbowJoint",
      "AvatarRightShoulderJoint",
      "AvatarRightElbowJoint",
      "AvatarLeftHipJoint",
      "AvatarLeftKneeJoint",
      "AvatarRightHipJoint",
      "AvatarRightKneeJoint",
      "AvatarCrescentBadge",
      "AvatarSignalOrb"
    ].forEach((name) => expect(rig.group.getObjectByName(name), name).toBeTruthy());

    rig.dispose();
  });

  it("drives joints, gaze and quality detail through the compatible pose API", () => {
    const rig = createObservatoryVolumetricAvatar(getQualityProfile("enhanced"), palette());
    const shoulder = rig.group.getObjectByName("AvatarRightShoulderJoint") as THREE.Group;
    const eyeTarget = rig.group.getObjectByName("AvatarEyeAimJoint") as THREE.Group;
    const detail = rig.group.getObjectByName("AvatarHighDetailAccessories") as THREE.Group;
    const shoulderBefore = shoulder.rotation.z;

    rig.setPointer(0.8, -0.4, 1);
    rig.setPose({
      presence: 0.92,
      yaw: 0.16,
      lean: -0.08,
      energy: 0.9,
      absoluteProgress: 2.5,
      scrollDirection: 1
    });
    for (let frame = 0; frame < 24; frame += 1) rig.update(frame / 60, 1 / 60);

    expect(shoulder.rotation.z).not.toBeCloseTo(shoulderBefore, 3);
    expect(Math.abs(eyeTarget.rotation.y)).toBeGreaterThan(0.005);
    expect(rig.group.scale.y).toBeGreaterThan(0.9);

    rig.setQuality(getQualityProfile("low"));
    expect(detail.visible).toBe(false);

    rig.dispose();
  });

  it("recolors from semantic scene tokens and disposes each owned resource once", () => {
    const initial = palette();
    const rig = createObservatoryVolumetricAvatar(getQualityProfile("standard"), initial);
    const uniform = rig.group.getObjectByName("AvatarUniformTorso") as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshStandardMaterial
    >;
    const originalColor = uniform.material.color.clone();
    const next = palette();
    next.avatarUniform.set("#f5f2ec");
    rig.setPalette(next);

    expect(uniform.material.color.equals(originalColor)).toBe(false);
    expect(uniform.material.color.equals(next.avatarUniform)).toBe(true);

    const geometryDispose = vi.spyOn(uniform.geometry, "dispose");
    const materialDispose = vi.spyOn(uniform.material, "dispose");
    rig.dispose();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
  });
});
