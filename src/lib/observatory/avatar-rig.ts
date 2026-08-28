import * as THREE from "three";
import type { ThreeObservatoryPalette } from "./palette";
import type { ObservatoryScrollDirection } from "./pose-director";
import type { ObservatoryQualityProfile, ObservatoryTheme } from "./types";
import {
  createObservatoryVolumetricAvatar,
  type ObservatoryVolumetricAvatar,
  type VolumetricAvatarPose,
} from "./volumetric-avatar";

export interface AvatarRigPose extends VolumetricAvatarPose {
  scrollDirection: ObservatoryScrollDirection;
}

export interface ObservatoryAvatarRig {
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  readonly atlasMode: false;
  setPointer(x: number, y: number, strength: number): void;
  setPose(pose: AvatarRigPose): void;
  setTheme(theme: ObservatoryTheme, immediate?: boolean): void;
  setPalette(palette: ThreeObservatoryPalette): void;
  setQuality(quality: ObservatoryQualityProfile): void;
  update(elapsedSeconds: number, deltaSeconds: number): void;
  dispose(): void;
}

/**
 * Desktop live mode uses the project-authored articulated Three.js volume.
 *
 * The image arguments remain only because bootstrap still uses those assets for
 * poster and portrait fallbacks outside the live canvas path.
 */
export async function createObservatoryAvatarRig(
  _darkAtlasSource: string,
  _lightAtlasSource: string,
  _darkFallbackSource: string,
  _lightFallbackSource: string,
  quality: ObservatoryQualityProfile,
  _initialTheme: ObservatoryTheme,
  palette: ThreeObservatoryPalette
): Promise<ObservatoryAvatarRig> {
  const volume: ObservatoryVolumetricAvatar = createObservatoryVolumetricAvatar(quality, palette);
  volume.group.userData.fallback = "dom-poster-or-portrait-atlas-only";
  volume.group.userData.poseSystem = "continuous-articulated-chapter-choreography";

  return {
    group: volume.group,
    mesh: volume.primaryMesh,
    atlasMode: false,
    setPointer: volume.setPointer,
    setPose: volume.setPose,
    setTheme() {
      // Theme colors arrive through setPalette so every PBR material follows
      // the same semantic-token interpolation as the environment.
    },
    setPalette: volume.setPalette,
    setQuality: volume.setQuality,
    update: volume.update,
    dispose: volume.dispose,
  };
}
