import * as THREE from "three";
import type { ThreeObservatoryPalette } from "./palette";
import type { ObservatoryQualityProfile } from "./types";

export interface VolumetricAvatarPose {
  presence: number;
  yaw: number;
  lean: number;
  energy: number;
  absoluteProgress: number;
  scrollDirection: -1 | 0 | 1;
}

export interface ObservatoryVolumetricAvatar {
  group: THREE.Group;
  primaryMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  setPointer(x: number, y: number, strength: number): void;
  setPose(pose: VolumetricAvatarPose): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
  update(elapsedSeconds: number, deltaSeconds: number): void;
  dispose(): void;
}

type MaterialRole =
  | "hair"
  | "skin"
  | "uniform"
  | "uniformSecondary"
  | "eye"
  | "shoe"
  | "signal"
  | "orbit"
  | "afterlight"
  | "metal"
  | "paper";

const CHARACTER_HEIGHT = 5.35;

function damp(current: number, target: number, lambda: number, deltaSeconds: number) {
  return THREE.MathUtils.damp(current, target, lambda, deltaSeconds);
}

function chapterPulse(progress: number, center: number, radius = 0.82) {
  return THREE.MathUtils.clamp(1 - Math.abs(progress - center) / radius, 0, 1);
}

function segmentCount(quality: ObservatoryQualityProfile) {
  return THREE.MathUtils.clamp(Math.round(quality.avatarSegments * 0.42), 10, 24);
}

function createMaterial(name: string, color: THREE.Color, roughness: number, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    name,
    color: color.clone(),
    emissive: color.clone().multiplyScalar(0.015),
    emissiveIntensity: 0.06,
    roughness,
    metalness,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    dithering: true
  });
}

function capsuleGeometry(radius: number, straightLength: number, segments: number) {
  return new THREE.CapsuleGeometry(radius, straightLength, Math.max(4, Math.round(segments * 0.3)), segments);
}

function setBodySurface(mesh: THREE.Mesh) {
  mesh.userData.avatarSurface = "body";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createObservatoryVolumetricAvatar(
  quality: ObservatoryQualityProfile,
  initialPalette: ThreeObservatoryPalette
): ObservatoryVolumetricAvatar {
  const segments = segmentCount(quality);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const roleMaterials = new Map<MaterialRole, THREE.MeshStandardMaterial>();

  const material = (role: MaterialRole, name: string, color: THREE.Color, roughness: number, metalness = 0) => {
    const value = createMaterial(name, color, roughness, metalness);
    roleMaterials.set(role, value);
    materials.add(value);
    return value;
  };

  const hairMaterial = material("hair", "AvatarHairMaterial", initialPalette.avatarHair, 0.83);
  const skinMaterial = material("skin", "AvatarSkinMaterial", initialPalette.avatarSkin, 0.9);
  const uniformMaterial = material("uniform", "AvatarUniformMaterial", initialPalette.avatarUniform, 0.72, 0.04);
  const uniformSecondaryMaterial = material(
    "uniformSecondary",
    "AvatarUniformSecondaryMaterial",
    initialPalette.avatarUniformSecondary,
    0.76,
    0.03
  );
  const eyeMaterial = material("eye", "AvatarEyeMaterial", initialPalette.avatarEye, 0.34, 0.04);
  const shoeMaterial = material("shoe", "AvatarShoeMaterial", initialPalette.avatarShoe, 0.38, 0.14);
  const signalMaterial = material("signal", "AvatarSignalMaterial", initialPalette.signal, 0.3, 0.08);
  const orbitMaterial = material("orbit", "AvatarOrbitMaterial", initialPalette.orbit, 0.34, 0.1);
  const afterlightMaterial = material("afterlight", "AvatarAfterlightMaterial", initialPalette.afterlight, 0.58);
  const metalMaterial = material("metal", "AvatarMetalMaterial", initialPalette.metal, 0.28, 0.66);
  const paperMaterial = material("paper", "AvatarPaperMaterial", initialPalette.particleBase, 0.92);

  signalMaterial.emissive.copy(initialPalette.signal);
  signalMaterial.emissiveIntensity = 1.1;
  orbitMaterial.emissive.copy(initialPalette.orbit);
  orbitMaterial.emissiveIntensity = 0.48;
  eyeMaterial.emissive.copy(initialPalette.avatarEye);
  eyeMaterial.emissiveIntensity = 0.18;

  const createMesh = <TGeometry extends THREE.BufferGeometry, TMaterial extends THREE.Material>(
    name: string,
    geometry: TGeometry,
    meshMaterial: TMaterial,
    bodySurface = true
  ) => {
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.name = name;
    if (bodySurface) setBodySurface(mesh);
    return mesh;
  };

  const createJoint = (name: string, x = 0, y = 0, z = 0) => {
    const joint = new THREE.Group();
    joint.name = name;
    joint.position.set(x, y, z);
    return joint;
  };

  const group = createJoint("ObservatoryVolumetricCharacterRigV2");
  group.userData = {
    representation: "procedural-threejs-articulated-volume",
    identity: "adult-lunar-observatory-guide",
    nominalHeight: CHARACTER_HEIGHT
  };

  const bodyRoot = createJoint("AvatarBodyRoot");
  const hipsJoint = createJoint("AvatarHipsJoint", 0, -0.72, 0);
  const spineJoint = createJoint("AvatarSpineJoint", 0, 0.28, 0);
  const chestJoint = createJoint("AvatarChestJoint", 0, 0.76, 0);
  const neckJoint = createJoint("AvatarNeckJoint", 0, 0.68, 0);
  const headJoint = createJoint("AvatarHeadJoint", 0, 0.32, 0.015);
  const eyeAimJoint = createJoint("AvatarEyeAimJoint", 0, 0, 0);
  group.add(bodyRoot);

  const portraitKeyLight = new THREE.PointLight(initialPalette.particleBase.clone(), 9.5, 15, 1.7);
  portraitKeyLight.name = "AvatarPortraitKeyLight";
  portraitKeyLight.position.set(-2.4, 3.2, 4.5);
  const portraitRimLight = new THREE.PointLight(initialPalette.signal.clone(), 4.2, 11, 2);
  portraitRimLight.name = "AvatarPortraitRimLight";
  portraitRimLight.position.set(2.2, 1.5, -2.4);
  group.add(portraitKeyLight, portraitRimLight);
  bodyRoot.add(hipsJoint);
  hipsJoint.add(spineJoint);
  spineJoint.add(chestJoint);
  chestJoint.add(neckJoint);
  neckJoint.add(headJoint);
  headJoint.add(eyeAimJoint);

  const pelvis = createMesh(
    "AvatarPelvisVolume",
    capsuleGeometry(0.34, 0.18, segments),
    uniformMaterial
  );
  pelvis.scale.set(1.2, 0.72, 0.74);
  hipsJoint.add(pelvis);

  const torso = createMesh(
    "AvatarUniformTorso",
    capsuleGeometry(0.42, 0.78, segments),
    uniformMaterial
  );
  torso.position.set(0, 0.18, 0);
  torso.scale.set(0.9, 1, 0.64);
  spineJoint.add(torso);

  const collar = createMesh(
    "AvatarSailorCollar",
    new THREE.CylinderGeometry(0.43, 0.5, 0.14, segments, 1, false),
    uniformSecondaryMaterial
  );
  collar.position.set(0, 0.4, 0.02);
  collar.scale.z = 0.72;
  chestJoint.add(collar);

  const neck = createMesh(
    "AvatarNeckVolume",
    new THREE.CylinderGeometry(0.12, 0.14, 0.24, Math.max(10, segments), 1),
    skinMaterial
  );
  neck.position.y = 0.08;
  neckJoint.add(neck);

  const skirt = createMesh(
    "AvatarPleatedSkirtVolume",
    new THREE.CylinderGeometry(0.48, 0.78, 0.7, Math.max(16, segments), 2, false),
    uniformMaterial
  );
  skirt.position.set(0, -0.52, 0);
  skirt.scale.z = 0.72;
  hipsJoint.add(skirt);

  const pleatGroup = createJoint("AvatarSkirtPleats");
  pleatGroup.position.copy(skirt.position);
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const pleat = createMesh(
      `AvatarSkirtPleat${index + 1}`,
      new THREE.BoxGeometry(0.095, 0.54, 0.045),
      uniformSecondaryMaterial
    );
    pleat.position.set(Math.sin(angle) * 0.57, -0.02, Math.cos(angle) * 0.43);
    pleat.rotation.y = angle;
    pleatGroup.add(pleat);
  }
  hipsJoint.add(pleatGroup);

  const head = createMesh(
    "AvatarFaceVolume",
    new THREE.SphereGeometry(0.46, segments, Math.max(10, Math.round(segments * 0.72))),
    skinMaterial
  );
  head.scale.set(0.88, 1.04, 0.82);
  head.position.z = 0.015;
  headJoint.add(head);

  const hairBack = createMesh(
    "AvatarHairBackVolume",
    new THREE.SphereGeometry(0.55, segments, Math.max(10, Math.round(segments * 0.72))),
    hairMaterial
  );
  hairBack.position.set(0, -0.06, -0.28);
  hairBack.scale.set(0.98, 1.25, 0.62);
  headJoint.add(hairBack);

  const hairCrown = createMesh(
    "AvatarHairCrownVolume",
    new THREE.SphereGeometry(0.48, segments, Math.max(8, Math.round(segments * 0.6)), 0, Math.PI * 2, 0, Math.PI * 0.42),
    hairMaterial
  );
  hairCrown.position.set(0, 0.06, 0.055);
  hairCrown.scale.set(1, 1.06, 0.9);
  headJoint.add(hairCrown);

  const hairSwayJoint = createJoint("AvatarHairSwayJoint", 0, -0.08, -0.06);
  headJoint.add(hairSwayJoint);
  for (const [index, side] of [-1, 1].entries()) {
    const sideJoint = createJoint(side < 0 ? "AvatarLeftHairJoint" : "AvatarRightHairJoint", side * 0.38, -0.12, 0);
    const lock = createMesh(
      side < 0 ? "AvatarLeftHairLock" : "AvatarRightHairLock",
      capsuleGeometry(0.11, 1.45, Math.max(10, segments - 4)),
      hairMaterial
    );
    lock.position.y = -0.72;
    lock.scale.set(0.9, 1, 0.62);
    sideJoint.rotation.z = side * (0.11 + index * 0.005);
    sideJoint.add(lock);
    hairSwayJoint.add(sideJoint);
  }

  const fringeOffsets = [-0.3, -0.15, 0, 0.15, 0.3];
  fringeOffsets.forEach((x, index) => {
    const fringe = createMesh(
      `AvatarFringeLock${index + 1}`,
      new THREE.ConeGeometry(0.095, 0.46 + Math.abs(x) * 0.24, Math.max(8, Math.round(segments * 0.45))),
      hairMaterial
    );
    fringe.position.set(x, 0.4 - Math.abs(x) * 0.08, 0.35 - Math.abs(x) * 0.1);
    fringe.rotation.z = -x * 0.42;
    headJoint.add(fringe);
  });

  const leftEyeWhite = createMesh(
    "AvatarLeftEyeWhite",
    new THREE.SphereGeometry(0.078, Math.max(10, segments), 8),
    paperMaterial
  );
  const rightEyeWhite = createMesh(
    "AvatarRightEyeWhite",
    new THREE.SphereGeometry(0.078, Math.max(10, segments), 8),
    paperMaterial
  );
  leftEyeWhite.position.set(-0.17, 0.04, 0.385);
  rightEyeWhite.position.set(0.17, 0.04, 0.385);
  leftEyeWhite.scale.set(0.82, 1.3, 0.38);
  rightEyeWhite.scale.copy(leftEyeWhite.scale);

  const leftEye = createMesh(
    "AvatarLeftEye",
    new THREE.SphereGeometry(0.05, Math.max(10, segments), 8),
    eyeMaterial
  );
  const rightEye = createMesh(
    "AvatarRightEye",
    new THREE.SphereGeometry(0.05, Math.max(10, segments), 8),
    eyeMaterial
  );
  leftEye.position.set(-0.17, 0.04, 0.423);
  rightEye.position.set(0.17, 0.04, 0.423);
  leftEye.scale.set(0.72, 1.22, 0.42);
  rightEye.scale.copy(leftEye.scale);
  eyeAimJoint.add(leftEyeWhite, rightEyeWhite, leftEye, rightEye);

  const nose = createMesh(
    "AvatarNose",
    new THREE.SphereGeometry(0.035, 8, 6),
    skinMaterial
  );
  nose.position.set(0, -0.055, 0.425);
  nose.scale.set(0.75, 0.9, 0.65);
  const mouth = createMesh(
    "AvatarMouth",
    new THREE.TorusGeometry(0.055, 0.008, 4, 12, Math.PI * 0.9),
    afterlightMaterial
  );
  mouth.position.set(0, -0.17, 0.423);
  mouth.rotation.z = Math.PI * 0.05;
  headJoint.add(nose, mouth);

  const createArm = (side: -1 | 1) => {
    const sideName = side < 0 ? "Left" : "Right";
    const shoulder = createJoint(`Avatar${sideName}ShoulderJoint`, side * 0.53, 0.42, 0);
    const upperArm = createMesh(
      `Avatar${sideName}UpperArm`,
      capsuleGeometry(0.115, 0.64, Math.max(10, segments - 4)),
      uniformMaterial
    );
    upperArm.position.y = -0.43;
    const elbow = createJoint(`Avatar${sideName}ElbowJoint`, 0, -0.85, 0);
    const forearm = createMesh(
      `Avatar${sideName}Forearm`,
      capsuleGeometry(0.095, 0.56, Math.max(10, segments - 4)),
      uniformSecondaryMaterial
    );
    forearm.position.y = -0.39;
    const wrist = createJoint(`Avatar${sideName}WristJoint`, 0, -0.76, 0);
    const hand = createMesh(
      `Avatar${sideName}Hand`,
      new THREE.SphereGeometry(0.13, Math.max(10, segments - 4), 8),
      skinMaterial
    );
    hand.position.y = -0.09;
    hand.scale.set(0.82, 1.18, 0.7);
    shoulder.add(upperArm, elbow);
    elbow.add(forearm, wrist);
    wrist.add(hand);
    chestJoint.add(shoulder);
    return { shoulder, elbow, wrist };
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  const createLeg = (side: -1 | 1) => {
    const sideName = side < 0 ? "Left" : "Right";
    const hip = createJoint(`Avatar${sideName}HipJoint`, side * 0.24, -0.2, 0);
    const thigh = createMesh(
      `Avatar${sideName}Thigh`,
      capsuleGeometry(0.15, 0.76, Math.max(10, segments - 4)),
      skinMaterial
    );
    thigh.position.y = -0.49;
    const knee = createJoint(`Avatar${sideName}KneeJoint`, 0, -0.98, 0);
    const stocking = createMesh(
      `Avatar${sideName}Stocking`,
      capsuleGeometry(0.13, 0.76, Math.max(10, segments - 4)),
      uniformSecondaryMaterial
    );
    stocking.position.y = -0.49;
    const ankle = createJoint(`Avatar${sideName}AnkleJoint`, 0, -0.98, 0.025);
    const shoe = createMesh(
      `Avatar${sideName}Shoe`,
      capsuleGeometry(0.15, 0.28, Math.max(10, segments - 4)),
      shoeMaterial
    );
    shoe.position.set(0, -0.15, 0.12);
    shoe.rotation.x = Math.PI * 0.42;
    shoe.scale.set(1, 0.8, 1.25);
    hip.add(thigh, knee);
    knee.add(stocking, ankle);
    ankle.add(shoe);
    hipsJoint.add(hip);
    return { hip, knee, ankle };
  };

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  const bow = createJoint("AvatarSignalBow", 0, 0.3, 0.38);
  const leftBow = createMesh(
    "AvatarSignalBowLeft",
    new THREE.SphereGeometry(0.16, Math.max(10, segments - 4), 8),
    afterlightMaterial
  );
  const rightBow = createMesh(
    "AvatarSignalBowRight",
    new THREE.SphereGeometry(0.16, Math.max(10, segments - 4), 8),
    afterlightMaterial
  );
  leftBow.position.x = -0.15;
  rightBow.position.x = 0.15;
  leftBow.scale.set(1.25, 0.58, 0.42);
  rightBow.scale.copy(leftBow.scale);
  const bowKnot = createMesh(
    "AvatarSignalBowKnot",
    new THREE.SphereGeometry(0.085, 10, 8),
    metalMaterial
  );
  bow.add(leftBow, rightBow, bowKnot);
  chestJoint.add(bow);

  const badge = createMesh(
    "AvatarCrescentBadge",
    new THREE.TorusGeometry(0.13, 0.025, 6, 28, Math.PI * 1.46),
    signalMaterial,
    false
  );
  badge.position.set(-0.27, 0.04, 0.42);
  badge.rotation.z = -0.48;
  chestJoint.add(badge);

  const highDetail = createJoint("AvatarHighDetailAccessories");
  const halo = createMesh(
    "AvatarSignalHalo",
    new THREE.TorusGeometry(0.68, 0.014, 6, Math.max(32, segments * 3)),
    signalMaterial,
    false
  );
  halo.position.set(0, 2.08, -0.28);
  halo.rotation.x = Math.PI * 0.43;
  const haloNode = createMesh(
    "AvatarHaloTelemetryNode",
    new THREE.OctahedronGeometry(0.075, 1),
    orbitMaterial,
    false
  );
  haloNode.position.set(0.68, 2.08, -0.28);
  highDetail.add(halo, haloNode);
  bodyRoot.add(highDetail);

  const signalOrb = createMesh(
    "AvatarSignalOrb",
    new THREE.IcosahedronGeometry(0.14, quality.tier === "enhanced" ? 2 : 1),
    signalMaterial,
    false
  );
  signalOrb.position.set(0, -0.31, 0.13);
  rightArm.wrist.add(signalOrb);

  const orbitRing = createMesh(
    "AvatarSignalOrbOrbit",
    new THREE.TorusGeometry(0.22, 0.012, 5, Math.max(20, segments * 2)),
    orbitMaterial,
    false
  );
  orbitRing.position.copy(signalOrb.position);
  orbitRing.rotation.x = Math.PI * 0.38;
  rightArm.wrist.add(orbitRing);

  const groundingShadowMaterial = new THREE.MeshBasicMaterial({
    name: "AvatarGroundingShadowMaterial",
    color: initialPalette.avatarShoe.clone(),
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    depthTest: true
  });
  materials.add(groundingShadowMaterial);
  const groundingShadow = createMesh(
    "AvatarGroundingShadow",
    new THREE.CircleGeometry(0.78, Math.max(20, segments * 2)),
    groundingShadowMaterial,
    false
  );
  groundingShadow.position.set(0, -2.64, -0.08);
  groundingShadow.rotation.x = -Math.PI / 2;
  groundingShadow.scale.y = 0.34;
  bodyRoot.add(groundingShadow);

  let currentQuality = { ...quality };
  let pose: VolumetricAvatarPose = {
    presence: 1,
    yaw: 0,
    lean: 0,
    energy: 0.4,
    absoluteProgress: 0,
    scrollDirection: 0
  };
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let pointerStrengthTarget = 0;
  let pointerStrength = 0;
  let currentPresence = 1;
  let currentYaw = 0;
  let currentLean = 0;
  let currentEnergy = 0.4;

  const setPalette = (palette: ThreeObservatoryPalette) => {
    const roleColors: Record<MaterialRole, THREE.Color> = {
      hair: palette.avatarHair,
      skin: palette.avatarSkin,
      uniform: palette.avatarUniform,
      uniformSecondary: palette.avatarUniformSecondary,
      eye: palette.avatarEye,
      shoe: palette.avatarShoe,
      signal: palette.signal,
      orbit: palette.orbit,
      afterlight: palette.afterlight,
      metal: palette.metal,
      paper: palette.particleBase
    };
    for (const [role, meshMaterial] of roleMaterials) {
      meshMaterial.color.copy(roleColors[role]);
      meshMaterial.emissive.copy(roleColors[role]);
      meshMaterial.emissiveIntensity = role === "signal" ? 1.1 : role === "orbit" ? 0.48 : role === "eye" ? 0.18 : 0.06;
    }
    groundingShadowMaterial.color.copy(palette.avatarShoe);
    portraitKeyLight.color.copy(palette.particleBase);
    portraitRimLight.color.copy(palette.signal);
  };

  const setQuality = (nextQuality: ObservatoryQualityProfile) => {
    currentQuality = { ...nextQuality };
    highDetail.visible = nextQuality.tier === "enhanced" || nextQuality.tier === "standard";
    orbitRing.visible = nextQuality.tier !== "low";
    roleMaterials.forEach((meshMaterial) => {
      meshMaterial.dithering = nextQuality.tier !== "low";
      meshMaterial.needsUpdate = true;
    });
  };

  setQuality(currentQuality);

  return {
    group,
    primaryMesh: torso,
    setPointer(x, y, strength) {
      pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
      pointerStrengthTarget = currentQuality.pointerInteraction ? THREE.MathUtils.clamp(strength, 0, 1) : 0;
    },
    setPose(nextPose) {
      pose = {
        presence: THREE.MathUtils.clamp(nextPose.presence, 0, 1),
        yaw: THREE.MathUtils.clamp(nextPose.yaw, -0.22, 0.22),
        lean: THREE.MathUtils.clamp(nextPose.lean, -0.12, 0.12),
        energy: THREE.MathUtils.clamp(nextPose.energy, 0, 1),
        absoluteProgress: THREE.MathUtils.clamp(nextPose.absoluteProgress, 0, 5),
        scrollDirection: nextPose.scrollDirection
      };
    },
    setPalette,
    setQuality,
    update(elapsedSeconds, deltaSeconds) {
      pointerStrength = damp(pointerStrength, pointerStrengthTarget, 6.2, deltaSeconds);
      pointerCurrent.x = damp(pointerCurrent.x, pointerTarget.x, 7.2, deltaSeconds);
      pointerCurrent.y = damp(pointerCurrent.y, pointerTarget.y, 7.2, deltaSeconds);
      currentPresence = damp(currentPresence, pose.presence, 5.8, deltaSeconds);
      currentYaw = damp(currentYaw, pose.yaw, 4.6, deltaSeconds);
      currentLean = damp(currentLean, pose.lean, 4.2, deltaSeconds);
      currentEnergy = damp(currentEnergy, pose.energy, 3.2, deltaSeconds);

      const detail = currentQuality.tier === "low" ? 0.46 : currentQuality.tier === "standard" ? 0.78 : 1;
      const gait = Math.sin(elapsedSeconds * (1.35 + currentEnergy * 1.2)) * currentEnergy * detail;
      const breath = Math.sin(elapsedSeconds * 0.86) * (0.5 + currentEnergy * 0.5) * detail;
      const point = chapterPulse(pose.absoluteProgress, 2.05, 0.8);
      const present = chapterPulse(pose.absoluteProgress, 3.12, 0.9);
      const embodiment = chapterPulse(pose.absoluteProgress, 4.06, 0.8);
      const settle = chapterPulse(pose.absoluteProgress, 5, 0.72);
      const direction = pose.scrollDirection === 0 ? 1 : pose.scrollDirection;

      bodyRoot.visible = currentPresence > 0.01;
      bodyRoot.scale.setScalar(0.92 + currentPresence * 0.08);
      bodyRoot.position.y = breath * 0.018;
      hipsJoint.rotation.y = damp(hipsJoint.rotation.y, currentYaw * 1.8 + embodiment * direction * 0.16, 5.2, deltaSeconds);
      hipsJoint.rotation.z = damp(hipsJoint.rotation.z, currentLean * 0.45, 4.2, deltaSeconds);
      spineJoint.rotation.z = damp(spineJoint.rotation.z, currentLean * 1.35 - present * 0.025, 4.6, deltaSeconds);
      chestJoint.rotation.y = damp(chestJoint.rotation.y, currentYaw * 0.72, 4.8, deltaSeconds);
      chestJoint.scale.y = 1 + breath * 0.006;

      headJoint.rotation.y = damp(
        headJoint.rotation.y,
        -currentYaw * 0.5 + pointerCurrent.x * pointerStrength * 0.18,
        6.8,
        deltaSeconds
      );
      headJoint.rotation.x = damp(
        headJoint.rotation.x,
        -pointerCurrent.y * pointerStrength * 0.1 + settle * 0.025,
        6.8,
        deltaSeconds
      );
      eyeAimJoint.rotation.y = pointerCurrent.x * pointerStrength * 0.16;
      eyeAimJoint.rotation.x = -pointerCurrent.y * pointerStrength * 0.1;

      leftArm.shoulder.rotation.z = damp(
        leftArm.shoulder.rotation.z,
        0.18 + currentLean * 0.8 + present * 0.62 + gait * 0.05,
        5.4,
        deltaSeconds
      );
      rightArm.shoulder.rotation.z = damp(
        rightArm.shoulder.rotation.z,
        -0.18 + currentLean * 0.65 - point * 1.35 - present * 0.54 - embodiment * 0.2,
        5.4,
        deltaSeconds
      );
      leftArm.shoulder.rotation.x = damp(leftArm.shoulder.rotation.x, -present * 0.3 + gait * 0.08, 5, deltaSeconds);
      rightArm.shoulder.rotation.x = damp(rightArm.shoulder.rotation.x, point * 0.18 - gait * 0.08, 5, deltaSeconds);
      leftArm.elbow.rotation.z = damp(leftArm.elbow.rotation.z, -0.18 - present * 0.3, 5.8, deltaSeconds);
      rightArm.elbow.rotation.z = damp(rightArm.elbow.rotation.z, 0.16 - point * 0.58 + present * 0.24, 5.8, deltaSeconds);
      rightArm.wrist.rotation.y = damp(rightArm.wrist.rotation.y, point * 0.82 + present * 0.36, 6.2, deltaSeconds);

      leftLeg.hip.rotation.x = damp(leftLeg.hip.rotation.x, gait * 0.13, 4.8, deltaSeconds);
      rightLeg.hip.rotation.x = damp(rightLeg.hip.rotation.x, -gait * 0.13, 4.8, deltaSeconds);
      leftLeg.knee.rotation.x = damp(leftLeg.knee.rotation.x, Math.max(0, -gait) * 0.12, 5.2, deltaSeconds);
      rightLeg.knee.rotation.x = damp(rightLeg.knee.rotation.x, Math.max(0, gait) * 0.12, 5.2, deltaSeconds);

      hairSwayJoint.rotation.z = damp(
        hairSwayJoint.rotation.z,
        -currentYaw * 0.22 - currentLean * 0.42 + Math.sin(elapsedSeconds * 0.72) * currentEnergy * 0.025,
        2.1,
        deltaSeconds
      );
      skirt.rotation.z = damp(skirt.rotation.z, -currentLean * 0.34 + gait * 0.012, 2.4, deltaSeconds);
      pleatGroup.rotation.y = damp(pleatGroup.rotation.y, currentYaw * 0.08, 2.6, deltaSeconds);

      halo.rotation.z = elapsedSeconds * 0.12;
      haloNode.position.x = Math.cos(elapsedSeconds * 0.55) * 0.68;
      haloNode.position.y = 2.08 + Math.sin(elapsedSeconds * 0.55) * 0.19;
      signalOrb.rotation.y = elapsedSeconds * 0.8;
      orbitRing.rotation.z = elapsedSeconds * 0.72;
      const signalPulse = 0.88 + Math.sin(elapsedSeconds * 2.1) * 0.12;
      signalOrb.scale.setScalar(signalPulse);
      signalMaterial.emissiveIntensity = 0.72 + point * 0.65 + present * 0.35;

      groundingShadowMaterial.opacity = 0.12 + currentPresence * 0.12;
      groundingShadow.scale.x = 1 + Math.abs(gait) * 0.12;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((meshMaterial) => meshMaterial.dispose());
      group.clear();
    }
  };
}
