import * as THREE from "three";
import type { ObservatoryPalette } from "./types";

export interface ThreeObservatoryPalette {
  fog: THREE.Color;
  signal: THREE.Color;
  orbit: THREE.Color;
  afterlight: THREE.Color;
  metal: THREE.Color;
  particleBase: THREE.Color;
  avatarHair: THREE.Color;
  avatarSkin: THREE.Color;
  avatarUniform: THREE.Color;
  avatarUniformSecondary: THREE.Color;
  avatarEye: THREE.Color;
  avatarShoe: THREE.Color;
}

const PALETTE_PROPERTIES: Record<keyof ObservatoryPalette, string> = {
  fog: "--scene-fog-color",
  signal: "--scene-signal-color",
  orbit: "--scene-orbit-color",
  afterlight: "--scene-afterlight-color",
  metal: "--scene-metal-color",
  particleBase: "--scene-particle-base",
  avatarHair: "--scene-avatar-hair-color",
  avatarSkin: "--scene-avatar-skin-color",
  avatarUniform: "--scene-avatar-uniform-color",
  avatarUniformSecondary: "--scene-avatar-uniform-secondary-color",
  avatarEye: "--scene-avatar-eye-color",
  avatarShoe: "--scene-avatar-shoe-color"
};

export function readObservatoryPalette(element: Element): ObservatoryPalette {
  const styles = getComputedStyle(element);
  const result = {} as ObservatoryPalette;

  for (const [key, property] of Object.entries(PALETTE_PROPERTIES) as Array<[keyof ObservatoryPalette, string]>) {
    const value = styles.getPropertyValue(property).trim();
    if (!value) throw new Error(`Missing required scene token: ${property}`);
    result[key] = value;
  }

  return result;
}

function resolveCssColor(value: string, context: CanvasRenderingContext2D): THREE.Color {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  if (alpha === 0) throw new Error(`Unable to resolve scene color token: ${value}`);
  return new THREE.Color().setRGB(red / 255, green / 255, blue / 255, THREE.SRGBColorSpace);
}

export function createThreeObservatoryPalette(palette: ObservatoryPalette): ThreeObservatoryPalette {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to create scene color bridge");

  return {
    fog: resolveCssColor(palette.fog, context),
    signal: resolveCssColor(palette.signal, context),
    orbit: resolveCssColor(palette.orbit, context),
    afterlight: resolveCssColor(palette.afterlight, context),
    metal: resolveCssColor(palette.metal, context),
    particleBase: resolveCssColor(palette.particleBase, context),
    avatarHair: resolveCssColor(palette.avatarHair, context),
    avatarSkin: resolveCssColor(palette.avatarSkin, context),
    avatarUniform: resolveCssColor(palette.avatarUniform, context),
    avatarUniformSecondary: resolveCssColor(palette.avatarUniformSecondary, context),
    avatarEye: resolveCssColor(palette.avatarEye, context),
    avatarShoe: resolveCssColor(palette.avatarShoe, context)
  };
}
