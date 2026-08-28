import * as THREE from "three";
import {
  getObservatoryPoseAtlasFrame,
  getObservatoryPoseTransitionDuration,
  resolveObservatoryAvatarPose
} from "./pose-director";
import type { ObservatoryScrollDirection } from "./pose-director";
import type {
  ObservatoryAvatarPose,
  ObservatoryQualityProfile,
  ObservatoryTheme
} from "./types";

export interface AvatarRigPose {
  presence: number;
  yaw: number;
  lean: number;
  energy: number;
  absoluteProgress: number;
  scrollDirection: ObservatoryScrollDirection;
}

export interface ObservatoryAvatarRig {
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly atlasMode: boolean;
  setPointer(x: number, y: number, strength: number): void;
  setPose(pose: AvatarRigPose): void;
  setTheme(theme: ObservatoryTheme, immediate?: boolean): void;
  setQuality(quality: ObservatoryQualityProfile): void;
  update(elapsedSeconds: number, deltaSeconds: number): void;
  dispose(): void;
}

const CHARACTER_HEIGHT = 5.35;
const ATLAS_CHARACTER_ASPECT = 3 / 4;
const FALLBACK_CHARACTER_ASPECT = 2 / 3;

const vertexShader = /* glsl */ `
  uniform float uBreath;
  uniform float uWeightShift;
  uniform float uTurn;
  uniform float uHairLag;
  uniform float uSkirtLag;
  uniform float uMotionDetail;
  uniform vec2 uLook;

  varying vec2 vUv;

  float rangeMask(float value, float startValue, float endValue, float feather) {
    return smoothstep(startValue - feather, startValue + feather, value)
      * (1.0 - smoothstep(endValue - feather, endValue + feather, value));
  }

  void main() {
    vUv = uv;
    vec3 rigged = position;
    float centeredX = uv.x - 0.5;
    float upperBody = smoothstep(0.12, 0.86, uv.y);
    float torso = rangeMask(uv.y, 0.34, 0.72, 0.09);
    float head = smoothstep(0.61, 0.82, uv.y);
    float sideHair = rangeMask(uv.y, 0.38, 0.91, 0.08)
      * smoothstep(0.17, 0.38, abs(centeredX));
    float crownHair = smoothstep(0.74, 0.94, uv.y);
    float hair = max(sideHair, crownHair * 0.7);
    float skirt = rangeMask(uv.y, 0.22, 0.5, 0.075)
      * smoothstep(0.08, 0.36, abs(centeredX));

    rigged.x += uWeightShift * upperBody * 0.12;
    rigged.y += abs(uWeightShift) * upperBody * 0.018;
    rigged.x *= 1.0 + uBreath * torso * 0.008;
    rigged.y += uBreath * torso * 0.014;
    rigged.z += uBreath * torso * 0.012;
    rigged.x += uLook.x * head * 0.045;
    rigged.y += uLook.y * head * 0.032;
    rigged.z += abs(uLook.x) * head * 0.012;
    rigged.x += uHairLag * hair * (0.022 + abs(centeredX) * 0.085) * uMotionDetail;
    rigged.z += abs(uHairLag) * hair * 0.055 * uMotionDetail;
    rigged.x += uSkirtLag * skirt * (0.03 + abs(centeredX) * 0.11) * uMotionDetail;
    rigged.z += abs(uSkirtLag) * skirt * 0.045 * uMotionDetail;
    rigged.z += centeredX * uTurn * upperBody * 0.34;
    rigged.x *= 1.0 - abs(uTurn) * upperBody * 0.025;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(rigged, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uDarkMap;
  uniform sampler2D uLightMap;
  uniform vec4 uCurrentFrame;
  uniform vec4 uNextFrame;
  uniform float uPoseMix;
  uniform float uThemeMix;
  uniform float uPresence;

  varying vec2 vUv;

  vec4 themedFrameAt(vec4 frame, vec2 localUv) {
    vec2 atlasUv = frame.xy + clamp(localUv, 0.0, 1.0) * frame.zw;
    vec4 darkTexel = texture2D(uDarkMap, atlasUv);
    vec4 lightTexel = texture2D(uLightMap, atlasUv);
    return mix(darkTexel, lightTexel, clamp(uThemeMix, 0.0, 1.0));
  }

  vec4 posedTexelAt(vec2 localUv) {
    vec4 currentTexel = themedFrameAt(uCurrentFrame, localUv);
    vec4 nextTexel = themedFrameAt(uNextFrame, localUv);
    float diagonal = clamp(1.0 - localUv.y + (localUv.x - 0.5) * 0.12 + sin(localUv.y * 15.0) * 0.012, 0.02, 0.98);
    float poseWeight = smoothstep(diagonal - 0.045, diagonal + 0.045, clamp(uPoseMix, 0.0, 1.0));
    return mix(currentTexel, nextTexel, poseWeight);
  }

  void main() {
    vec4 texel = posedTexelAt(vUv);
    float presence = clamp(uPresence, 0.0, 1.0);
    float alpha = texel.a * presence;
    if (alpha < 0.012) discard;
    // The silhouette rim is baked into the runtime atlases. Keeping the
    // outline out of this fragment shader avoids four additional posed atlas
    // samples (sixteen texture fetches during pose/theme cross-fades).
    gl_FragColor = vec4(texel.rgb, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

function motionDetailForQuality(quality: ObservatoryQualityProfile): number {
  if (quality.tier === "low") return 0.4;
  if (quality.tier === "standard") return 0.76;
  if (quality.tier === "enhanced") return 1;
  return 0;
}

async function loadCharacterTexture(source: string): Promise<THREE.Texture> {
  const texture = await new THREE.TextureLoader().loadAsync(source);
  const image = texture.image as { width?: number; height?: number } | undefined;
  if (!image?.width || !image.height) {
    texture.dispose();
    throw new Error(`Unable to decode observatory character texture: ${source}`);
  }
  texture.name = `ObservatoryCharacter:${source}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

async function loadTexturePair(
  darkSource: string,
  lightSource: string
): Promise<readonly [THREE.Texture, THREE.Texture]> {
  const [darkResult, lightResult] = await Promise.allSettled([
    loadCharacterTexture(darkSource),
    loadCharacterTexture(lightSource)
  ]);
  if (darkResult.status === "rejected") {
    if (lightResult.status === "fulfilled") lightResult.value.dispose();
    throw darkResult.reason;
  }
  if (lightResult.status === "rejected") {
    darkResult.value.dispose();
    throw lightResult.reason;
  }
  return [darkResult.value, lightResult.value] as const;
}

function frameVector(pose: ObservatoryAvatarPose, atlasMode: boolean): THREE.Vector4 {
  if (!atlasMode) return new THREE.Vector4(0, 0, 1, 1);
  const frame = getObservatoryPoseAtlasFrame(pose);
  return new THREE.Vector4(frame.offsetX, frame.offsetY, frame.scaleX, frame.scaleY);
}

export async function createObservatoryAvatarRig(
  darkAtlasSource: string,
  lightAtlasSource: string,
  darkFallbackSource: string,
  lightFallbackSource: string,
  quality: ObservatoryQualityProfile,
  initialTheme: ObservatoryTheme
): Promise<ObservatoryAvatarRig> {
  let atlasMode = true;
  let textures: readonly [THREE.Texture, THREE.Texture];
  try {
    textures = await loadTexturePair(darkAtlasSource, lightAtlasSource);
    const darkImage = textures[0].image as { width: number; height: number };
    const lightImage = textures[1].image as { width: number; height: number };
    const validAtlas =
      darkImage.width / darkImage.height > 1.45 &&
      darkImage.width / darkImage.height < 1.55 &&
      lightImage.width === darkImage.width &&
      lightImage.height === darkImage.height;
    if (!validAtlas) {
      textures.forEach((texture) => texture.dispose());
      throw new Error("Observatory pose atlas must be a matching 4x2 image pair");
    }
  } catch {
    atlasMode = false;
    textures = await loadTexturePair(darkFallbackSource, lightFallbackSource);
  }
  const [darkTexture, lightTexture] = textures;
  if (quality.tier === "low") {
    for (const texture of textures) {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.anisotropy = 2;
      texture.needsUpdate = true;
    }
  }

  const currentQuality = { ...quality };
  const characterAspect = atlasMode ? ATLAS_CHARACTER_ASPECT : FALLBACK_CHARACTER_ASPECT;
  const verticalSegments = Math.max(12, quality.avatarSegments);
  const horizontalSegments = Math.max(8, Math.round(verticalSegments * characterAspect));
  const geometry = new THREE.PlaneGeometry(
    CHARACTER_HEIGHT * characterAspect,
    CHARACTER_HEIGHT,
    horizontalSegments,
    verticalSegments
  );

  let currentPose: ObservatoryAvatarPose = "idle";
  let nextPose: ObservatoryAvatarPose = "idle";
  const uniforms = {
    uDarkMap: { value: darkTexture },
    uLightMap: { value: lightTexture },
    uCurrentFrame: { value: frameVector(currentPose, atlasMode) },
    uNextFrame: { value: frameVector(nextPose, atlasMode) },
    uPoseMix: { value: 0 },
    uThemeMix: { value: initialTheme === "light" ? 1 : 0 },
    uPresence: { value: 0 },
    uBreath: { value: 0 },
    uWeightShift: { value: 0 },
    uTurn: { value: 0 },
    uHairLag: { value: 0 },
    uSkirtLag: { value: 0 },
    uMotionDetail: { value: motionDetailForQuality(quality) },
    uLook: { value: new THREE.Vector2() }
  };

  const material = new THREE.ShaderMaterial({
    name: "ObservatoryMultiPoseAtlas2_5DMaterial",
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    // The actor is a screen-space guide inside the world, not terrain geometry.
    // Render it after the transparent environment so bright theme plates cannot
    // erase the light silhouette through depth ordering.
    depthTest: false,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
    premultipliedAlpha: true,
    toneMapped: true
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "ObservatoryMultiPoseAtlasMesh";
  mesh.frustumCulled = false;
  mesh.renderOrder = 8;
  mesh.userData = {
    rigType: "multi-pose-atlas-subdivided-plane-2.5d",
    atlasMode,
    atlasColumns: atlasMode ? 4 : 1,
    atlasRows: atlasMode ? 2 : 1
  };

  const posePivot = new THREE.Group();
  posePivot.name = "AvatarSecondaryMotionPivot";
  posePivot.add(mesh);

  const shadowGeometry = new THREE.CircleGeometry(0.82, quality.tier === "low" ? 20 : 32);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x02040a,
    transparent: true,
    opacity: 0.18,
    depthTest: true,
    depthWrite: false
  });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.name = "AvatarScreenGroundingEllipse";
  shadow.scale.set(1, 0.18, 1);
  shadow.position.set(0, -CHARACTER_HEIGHT * 0.49, -0.06);
  shadow.renderOrder = 7;

  const group = new THREE.Group();
  group.name = "ObservatoryMultiPoseCharacterRig2_5D";
  group.userData = { representation: "2.5d-texture-atlas", poseCount: atlasMode ? 8 : 1 };
  group.add(shadow, posePivot);

  let themeTarget = uniforms.uThemeMix.value;
  let pointerStrengthTarget = 0;
  let pointerStrength = 0;
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();
  let qualityDetailTarget = uniforms.uMotionDetail.value;
  let poseTarget: AvatarRigPose = {
    presence: 1,
    yaw: 0,
    lean: 0,
    energy: 0.4,
    absoluteProgress: 0,
    scrollDirection: 0
  };
  let transitionElapsed = 0;
  let transitionDuration = 0.46;
  let currentYaw = 0;
  let currentLean = 0;
  let currentEnergy = 0.4;
  let hairLag = 0;
  let skirtLag = 0;
  let turnDirection: ObservatoryScrollDirection = 1;

  const requestPose = (requested: ObservatoryAvatarPose, direction: ObservatoryScrollDirection) => {
    if (!atlasMode || requested === nextPose) return;
    if (currentPose !== nextPose) currentPose = uniforms.uPoseMix.value >= 0.5 ? nextPose : currentPose;
    nextPose = requested;
    turnDirection = direction === 0 ? 1 : direction;
    transitionElapsed = 0;
    transitionDuration = getObservatoryPoseTransitionDuration(currentPose, nextPose, currentQuality.tier);
    uniforms.uCurrentFrame.value.copy(frameVector(currentPose, true));
    uniforms.uNextFrame.value.copy(frameVector(nextPose, true));
    uniforms.uPoseMix.value = 0;
    mesh.userData.currentPose = currentPose;
    mesh.userData.nextPose = nextPose;
  };

  return {
    group,
    mesh,
    atlasMode,
    setPointer(x, y, strength) {
      pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
      pointerStrengthTarget = currentQuality.pointerInteraction ? THREE.MathUtils.clamp(strength, 0, 1) : 0;
    },
    setPose(pose) {
      poseTarget = {
        presence: THREE.MathUtils.clamp(pose.presence, 0, 1),
        yaw: THREE.MathUtils.clamp(pose.yaw, -0.22, 0.22),
        lean: THREE.MathUtils.clamp(pose.lean, -0.12, 0.12),
        energy: THREE.MathUtils.clamp(pose.energy, 0, 1),
        absoluteProgress: THREE.MathUtils.clamp(pose.absoluteProgress, 0, 5),
        scrollDirection: pose.scrollDirection
      };
      const requested = resolveObservatoryAvatarPose(
        poseTarget.absoluteProgress,
        nextPose,
        poseTarget.scrollDirection,
        currentQuality.tier
      );
      requestPose(requested, poseTarget.scrollDirection);
    },
    setTheme(theme, immediate = false) {
      themeTarget = theme === "light" ? 1 : 0;
      if (immediate) uniforms.uThemeMix.value = themeTarget;
    },
    setQuality(nextQuality) {
      Object.assign(currentQuality, nextQuality);
      qualityDetailTarget = motionDetailForQuality(nextQuality);
      if (!nextQuality.pointerInteraction) pointerStrengthTarget = 0;
      if (nextQuality.tier === "low") {
        for (const texture of textures) {
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;
          texture.anisotropy = 2;
          texture.needsUpdate = true;
        }
      }
    },
    update(elapsedSeconds, deltaSeconds) {
      if (currentPose !== nextPose) {
        transitionElapsed += deltaSeconds;
        uniforms.uPoseMix.value = Math.min(1, transitionElapsed / Math.max(0.12, transitionDuration));
        if (uniforms.uPoseMix.value >= 1) {
          currentPose = nextPose;
          uniforms.uCurrentFrame.value.copy(uniforms.uNextFrame.value);
          uniforms.uPoseMix.value = 0;
          mesh.userData.currentPose = currentPose;
          mesh.userData.nextPose = currentPose;
        }
      }

      pointerStrength = THREE.MathUtils.damp(pointerStrength, pointerStrengthTarget, 5.2, deltaSeconds);
      pointerCurrent.x = THREE.MathUtils.damp(pointerCurrent.x, pointerTarget.x, 5.4, deltaSeconds);
      pointerCurrent.y = THREE.MathUtils.damp(pointerCurrent.y, pointerTarget.y, 5.4, deltaSeconds);
      uniforms.uLook.value.set(pointerCurrent.x * pointerStrength, pointerCurrent.y * pointerStrength);

      const transitionImpulse = currentPose === nextPose
        ? 0
        : Math.sin(uniforms.uPoseMix.value * Math.PI) * turnDirection * 0.075;
      currentYaw = THREE.MathUtils.damp(
        currentYaw,
        poseTarget.yaw + pointerCurrent.x * pointerStrength * 0.032 + transitionImpulse,
        4.1,
        deltaSeconds
      );
      currentLean = THREE.MathUtils.damp(currentLean, poseTarget.lean, 3.6, deltaSeconds);
      currentEnergy = THREE.MathUtils.damp(currentEnergy, poseTarget.energy, 2.8, deltaSeconds);
      const weightShift = currentLean * 1.8 + Math.sin(elapsedSeconds * 0.43) * (0.018 + currentEnergy * 0.024);
      const hairTarget = -currentYaw * 1.15 - weightShift * 0.45 + Math.sin(elapsedSeconds * 0.74) * currentEnergy * 0.07;
      const skirtTarget = -weightShift * 0.82 + Math.sin(elapsedSeconds * 0.58 + 1.4) * currentEnergy * 0.055;
      hairLag = THREE.MathUtils.damp(hairLag, hairTarget, 1.55, deltaSeconds);
      skirtLag = THREE.MathUtils.damp(skirtLag, skirtTarget, 1.08, deltaSeconds);

      uniforms.uThemeMix.value = THREE.MathUtils.damp(uniforms.uThemeMix.value, themeTarget, 2.8, deltaSeconds);
      uniforms.uPresence.value = THREE.MathUtils.damp(uniforms.uPresence.value, poseTarget.presence, 4.6, deltaSeconds);
      uniforms.uMotionDetail.value = THREE.MathUtils.damp(uniforms.uMotionDetail.value, qualityDetailTarget, 3.2, deltaSeconds);
      uniforms.uBreath.value = Math.sin(elapsedSeconds * (0.82 + currentEnergy * 0.12)) * (0.45 + currentEnergy * 0.55);
      uniforms.uWeightShift.value = weightShift;
      uniforms.uTurn.value = currentYaw;
      uniforms.uHairLag.value = hairLag;
      uniforms.uSkirtLag.value = skirtLag;

      posePivot.rotation.y = currentYaw;
      posePivot.rotation.z = currentLean + Math.sin(elapsedSeconds * 0.43) * 0.004;
      posePivot.position.x = weightShift * 0.08;
      shadowMaterial.opacity = 0.1 + uniforms.uPresence.value * 0.1;
      shadow.scale.x = 0.92 + Math.abs(weightShift) * 0.5;
    },
    dispose() {
      darkTexture.dispose();
      lightTexture.dispose();
      geometry.dispose();
      material.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      group.clear();
    }
  };
}
