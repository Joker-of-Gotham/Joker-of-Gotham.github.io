import * as THREE from "three";
import type { ThreeObservatoryPalette } from "./palette";
import type { ObservatoryQualityProfile, ObservatoryTimelineState } from "./types";

export interface SeleneLightRig {
  group: THREE.Group;
  lights: THREE.Light[];
  update(state: ObservatoryTimelineState): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
  dispose(): void;
}

const PRACTICAL_POSITIONS = [
  [-11, 4.8, -18],
  [14, 5.4, -73],
  [-18, 6.2, -157],
  [17, 4.6, -214],
  [-12, 3.8, -291],
  [10, 5.8, -389],
] as const;

function isLightWorldPalette(palette: ThreeObservatoryPalette) {
  const { r, g, b } = palette.fog;
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.45;
}

function smoothChapterWeight(chapterIndex: number, lightIndex: number) {
  const distance = Math.abs(chapterIndex - lightIndex);
  return 1 - THREE.MathUtils.smoothstep(distance, 0.7, 2.25);
}

/**
 * Selene's light colours are deliberately derived from the site tokens rather
 * than introducing another set of brand hex values. The hierarchy is:
 * cool mineral moon/sky, warm occupied apertures, sparse cobalt signal light.
 */
function coolMineralLight(palette: ThreeObservatoryPalette) {
  return palette.particleBase.clone().lerp(palette.orbit, 0.11);
}

function occupiedApertureLight(palette: ThreeObservatoryPalette) {
  return palette.metal
    .clone()
    .lerp(palette.afterlight, 0.28)
    .lerp(palette.particleBase, 0.06);
}

export function createSeleneLightRig(
  quality: ObservatoryQualityProfile,
  palette: ThreeObservatoryPalette,
  renderer?: THREE.WebGLRenderer | null,
): SeleneLightRig {
  // Shadow participation is a shader-level decision in Three.js. Keep it
  // immutable for the lifetime of this persistent scene: changing the number
  // of shadow-casting lights while scrolling forces every receiving material
  // through a new program variant and was the source of multi-second hitches.
  const shadowPipelineEnabled = quality.tier === "standard" || quality.tier === "enhanced";
  const shadowMapSize = quality.tier === "enhanced" ? 2048 : 1024;
  const group = new THREE.Group();
  group.name = "SeleneLightRig";
  group.userData = {
    shadowCastingLights: 1,
    practicalPoolSize: PRACTICAL_POSITIONS.length,
    fixedCelestialDirection: true,
    stableShadowPipeline: true,
    colorScript: "cool-mineral / warm-occupied-aperture / sparse-signal-cobalt",
  };

  const hemisphere = new THREE.HemisphereLight(
    coolMineralLight(palette),
    palette.fog.clone().lerp(palette.metal, 0.28),
    1.12,
  );
  hemisphere.name = "WorldSkyFill";
  hemisphere.userData.role = "ibl-companion-fill";

  const celestialTarget = new THREE.Object3D();
  celestialTarget.name = "CelestialKeyTarget";
  const celestial = new THREE.DirectionalLight(coolMineralLight(palette), 3.35);
  celestial.name = "CelestialKeyLight";
  celestial.target = celestialTarget;
  celestial.castShadow = shadowPipelineEnabled;
  celestial.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  celestial.shadow.bias = -0.00018;
  celestial.shadow.normalBias = 0.045;
  celestial.shadow.camera.left = -72;
  celestial.shadow.camera.right = 72;
  celestial.shadow.camera.top = 68;
  celestial.shadow.camera.bottom = -42;
  celestial.shadow.camera.near = 8;
  celestial.shadow.camera.far = 410;
  celestial.shadow.radius = 1.4;
  celestial.userData = {
    role: "single-celestial-shadow-key",
    stableDirection: [-0.46, 0.68, -0.57],
  };
  group.add(celestialTarget);

  const practicals = PRACTICAL_POSITIONS.map((position, index) => {
    // At campus scale the old 2-4 cd values contributed almost no illuminance.
    // A shorter 26 m range and physically useful candela values create local
    // pools around authored windows without flattening the whole district.
    const light = new THREE.PointLight(occupiedApertureLight(palette), 0, 32, 2);
    light.name = `PracticalLight:${index + 1}`;
    light.position.set(position[0], position[1], position[2]);
    light.castShadow = false;
    light.userData = {
      role: "pooled-non-shadow-practical",
      districtIndex: index,
      attachment: "occupied-aperture",
      colorScriptRole: index === 5 ? "afterlight-warmth" : "occupied-warmth",
    };
    return light;
  });
  const lights: THREE.Light[] = [hemisphere, celestial, ...practicals];
  let practicalQualityScale = 1;
  let lightTheme = isLightWorldPalette(palette);

  if (renderer) {
    renderer.shadowMap.enabled = shadowPipelineEnabled;
    // Three r185 deprecated PCFSoftShadowMap; the maintained PCF path keeps
    // the single-key shadow stable without emitting production warnings.
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  const setQuality = (nextQuality: ObservatoryQualityProfile) => {
    // Runtime quality changes are deliberately limited to uniform/intensity
    // work. The immutable shadow pipeline above avoids shader recompilation.
    practicalQualityScale = nextQuality.tier === "low" ? 0.72 : 1;
  };
  setQuality(quality);

  return {
    group,
    lights,
    update(state) {
      // The key follows the camera district while retaining one immutable sun
      // direction. That concentrates one shadow map on the visible architecture
      // without introducing a second shadow-casting light.
      const targetZ = THREE.MathUtils.lerp(-8, -405, state.routeProgress);
      celestialTarget.position.set(0, 2.5, targetZ);
      celestial.position.set(-138, 206, targetZ - 171);
      celestial.target.updateMatrixWorld();
      celestial.intensity =
        (lightTheme ? 0.82 : 3.32) +
        state.moonIntensity * (lightTheme ? 0.24 : 0.92) +
        state.afterlightIntensity * (lightTheme ? 0.06 : 0.12);
      hemisphere.intensity =
        (lightTheme ? 0.27 : 1.18) +
        state.cityIntensity * (lightTheme ? 0.05 : 0.16) +
        state.afterlightIntensity * (lightTheme ? 0.03 : 0.08);
      for (let index = 0; index < practicals.length; index += 1) {
        const light = practicals[index];
        const weight = smoothChapterWeight(state.chapterIndex + state.chapterProgress, index);
        const narrative = index === 5 ? state.afterlightIntensity : state.signalIntensity;
        light.intensity =
          weight *
          ((lightTheme ? 4.2 : 22) + narrative * (lightTheme ? 5.4 : 16)) *
          practicalQualityScale;
      }
    },
    setPalette(nextPalette) {
      lightTheme = isLightWorldPalette(nextPalette);
      hemisphere.color.copy(coolMineralLight(nextPalette));
      hemisphere.groundColor.copy(nextPalette.fog).lerp(nextPalette.metal, 0.28);
      celestial.color.copy(coolMineralLight(nextPalette));
      const occupiedLight = occupiedApertureLight(nextPalette);
      practicals.forEach((light) => {
        light.color.copy(occupiedLight);
      });
    },
    setQuality,
    dispose() {
      celestial.shadow.map?.dispose();
      celestial.shadow.map = null;
      group.clear();
    },
  };
}
