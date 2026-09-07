import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import type { ThreeObservatoryPalette } from "./palette";
import type { ObservatoryQualityProfile } from "./types";

export const SELENE_ASSET_BASE_URL = "/assets/three/selene-meridian";

export const SELENE_PBR_ASSET_MANIFEST = {
  regolith: {
    baseColor: "materials/regolith/basecolor-1k.jpg",
    normal: "materials/regolith/normal-gl-1k.jpg",
    arm: "materials/regolith/arm-1k.jpg",
  },
  concrete: {
    baseColor: "materials/concrete/basecolor-1k.jpg",
    normal: "materials/concrete/normal-gl-1k.jpg",
    arm: "materials/concrete/arm-1k.jpg",
  },
  metal: {
    baseColor: "materials/metal/basecolor-1k.jpg",
    normal: "materials/metal/normal-gl-1k.jpg",
    arm: "materials/metal/arm-1k.jpg",
  },
  environment: {
    dark: "environment/rogland-clear-night-1k.hdr",
  },
} as const;

export type SeleneEnvironmentState = "disabled" | "idle" | "loading" | "ready" | "partial" | "disposed";

export interface SeleneEnvironmentStatus {
  state: SeleneEnvironmentState;
  loadedTextures: number;
  expectedTextures: number;
  hdrReady: boolean;
}

export interface SeleneCampusPbrMaterials {
  stone: THREE.MeshStandardMaterial;
  structural: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  signal: THREE.MeshStandardMaterial;
  afterlight: THREE.MeshStandardMaterial;
}

export interface SelenePbrMaterialSystem {
  campusMaterials: SeleneCampusPbrMaterials;
  terrainMaterial: THREE.MeshStandardMaterial;
  status: SeleneEnvironmentStatus;
  ready: Promise<void>;
  setPalette(palette: ThreeObservatoryPalette, force?: boolean): boolean;
  setQuality(quality: ObservatoryQualityProfile): void;
  dispose(): void;
}

export interface SelenePbrMaterialSystemOptions {
  renderer?: THREE.WebGLRenderer | null;
  signal?: AbortSignal;
  assetBaseUrl?: string;
}

interface LoadedTextureSet {
  baseColor: THREE.Texture | null;
  normal: THREE.Texture | null;
  arm: THREE.Texture | null;
}

interface SeleneTextureSetManifest {
  baseColor: string;
  normal: string;
  arm: string;
}

const MAX_TEXTURE_ANISOTROPY = 8;
const PALETTE_UPDATE_EPSILON = 1 / 255;

function isLightWorldPalette(palette: ThreeObservatoryPalette) {
  const { r, g, b } = palette.fog;
  return r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.45;
}

function resolveAssetUrl(baseUrl: string, relativePath: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${relativePath}`;
}

function configureSurfaceTexture(
  texture: THREE.Texture,
  colorSpace: THREE.ColorSpace,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
) {
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
}

function assignTextureSet(
  material: THREE.MeshStandardMaterial,
  textures: LoadedTextureSet,
  normalStrength: number,
  aoIntensity: number,
) {
  material.map = textures.baseColor;
  material.normalMap = textures.normal;
  material.normalScale.setScalar(normalStrength);
  // Poly Haven ARM packing: R=ambient occlusion, G=roughness, B=metalness.
  material.aoMap = textures.arm;
  material.roughnessMap = textures.arm;
  material.metalnessMap = textures.arm;
  // Preserve crevice information without multiplying the already dark lunar
  // albedo into black silhouettes. Each surface gets a calibrated value.
  material.aoMapIntensity = aoIntensity;
  material.needsUpdate = true;
}

/**
 * The campus kit intentionally reuses scaled unit geometries. UV-space maps on
 * those meshes would stretch one texel field across an entire building. This
 * shader hook samples the shared maps in world space instead, preserving one
 * stable physical texel scale across terrain, walls, roofs and instanced parts.
 */
function installWorldSpaceTriplanar(material: THREE.MeshStandardMaterial, samplesPerMetre: number) {
  material.userData.textureProjection = "world-space-triplanar";
  material.userData.samplesPerMetre = samplesPerMetre;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSeleneTexelScale = { value: samplesPerMetre };
    shader.vertexShader = shader.vertexShader
      .replace(
        "void main() {",
        `varying vec3 vSeleneWorldPosition;
varying vec3 vSeleneWorldNormal;

void main() {`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vec4 selenePosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  selenePosition = instanceMatrix * selenePosition;
#endif
vSeleneWorldPosition = ( modelMatrix * selenePosition ).xyz;
vSeleneWorldNormal = normalize( transpose( mat3( viewMatrix ) ) * transformedNormal );`,
      );

    const triplanarFunctions = `
varying vec3 vSeleneWorldPosition;
varying vec3 vSeleneWorldNormal;
uniform float uSeleneTexelScale;

vec3 seleneTriplanarWeights() {
  vec3 weights = pow( abs( normalize( vSeleneWorldNormal ) ), vec3( 5.0 ) );
  return weights / max( weights.x + weights.y + weights.z, 0.0001 );
}

vec4 seleneTriplanarSample( sampler2D surfaceMap ) {
  vec3 weights = seleneTriplanarWeights();
  vec3 position = vSeleneWorldPosition * uSeleneTexelScale;
  vec4 sampleX = texture2D( surfaceMap, position.zy );
  vec4 sampleY = texture2D( surfaceMap, position.xz );
  vec4 sampleZ = texture2D( surfaceMap, position.xy );
  return sampleX * weights.x + sampleY * weights.y + sampleZ * weights.z;
}
`;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${triplanarFunctions}\nvoid main() {`)
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  vec4 sampledDiffuseColor = seleneTriplanarSample( map );
  diffuseColor *= sampledDiffuseColor;
#endif`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  roughnessFactor *= seleneTriplanarSample( roughnessMap ).g;
#endif`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
  metalnessFactor *= seleneTriplanarSample( metalnessMap ).b;
#endif`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#ifdef USE_NORMALMAP_TANGENTSPACE
  vec3 seleneWeights = seleneTriplanarWeights();
  vec3 selenePosition = vSeleneWorldPosition * uSeleneTexelScale;
  vec3 seleneX = texture2D( normalMap, selenePosition.zy ).xyz * 2.0 - 1.0;
  vec3 seleneY = texture2D( normalMap, selenePosition.xz ).xyz * 2.0 - 1.0;
  vec3 seleneZ = texture2D( normalMap, selenePosition.xy ).xyz * 2.0 - 1.0;
  seleneX.xy *= normalScale;
  seleneY.xy *= normalScale;
  seleneZ.xy *= normalScale;
  vec3 seleneMappedNormal = normalize(
    vec3( seleneX.z * sign( vSeleneWorldNormal.x ), seleneX.y, seleneX.x ) * seleneWeights.x +
    vec3( seleneY.x, seleneY.z * sign( vSeleneWorldNormal.y ), seleneY.y ) * seleneWeights.y +
    vec3( seleneZ.x, seleneZ.y, seleneZ.z * sign( vSeleneWorldNormal.z ) ) * seleneWeights.z
  );
  normal = normalize( mat3( viewMatrix ) * seleneMappedNormal );
#endif`,
      )
      .replace(
        "#include <aomap_fragment>",
        `#ifdef USE_AOMAP
  float ambientOcclusion = ( seleneTriplanarSample( aoMap ).r - 1.0 ) * aoMapIntensity + 1.0;
  reflectedLight.indirectDiffuse *= ambientOcclusion;
  #if defined( USE_CLEARCOAT )
    clearcoatSpecularIndirect *= ambientOcclusion;
  #endif
  #if defined( USE_SHEEN )
    sheenSpecularIndirect *= ambientOcclusion;
  #endif
  #if defined( USE_ENVMAP ) && defined( STANDARD )
    float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
    reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
  #endif
#endif`,
      );
  };
  material.customProgramCacheKey = () => `selene-triplanar-${samplesPerMetre}`;
}

function maxColorDelta(a: THREE.Color, b: THREE.Color): number {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

function copyPalette(target: ThreeObservatoryPalette, source: ThreeObservatoryPalette) {
  target.fog.copy(source.fog);
  target.signal.copy(source.signal);
  target.orbit.copy(source.orbit);
  target.afterlight.copy(source.afterlight);
  target.metal.copy(source.metal);
  target.particleBase.copy(source.particleBase);
  target.avatarHair.copy(source.avatarHair);
  target.avatarSkin.copy(source.avatarSkin);
  target.avatarUniform.copy(source.avatarUniform);
  target.avatarUniformSecondary.copy(source.avatarUniformSecondary);
  target.avatarEye.copy(source.avatarEye);
  target.avatarShoe.copy(source.avatarShoe);
}

function lightSurfaceBase(palette: ThreeObservatoryPalette, fogMix: number) {
  return palette.particleBase.clone().lerp(palette.fog, fogMix);
}

function coolMineralBase(palette: ThreeObservatoryPalette, metalMix: number) {
  return palette.particleBase
    .clone()
    .lerp(palette.orbit, 0.08)
    .lerp(palette.metal, metalMix);
}

function coolMineralBounce(palette: ThreeObservatoryPalette) {
  return palette.particleBase.clone().lerp(palette.orbit, 0.14);
}

function occupiedApertureColor(palette: ThreeObservatoryPalette) {
  return palette.metal
    .clone()
    .lerp(palette.afterlight, 0.28)
    .lerp(palette.particleBase, 0.08);
}

function signalCobalt(palette: ThreeObservatoryPalette) {
  return palette.orbit.clone().lerp(palette.signal, 0.18).lerp(palette.particleBase, 0.08);
}

function clonePalette(source: ThreeObservatoryPalette): ThreeObservatoryPalette {
  return {
    fog: source.fog.clone(),
    signal: source.signal.clone(),
    orbit: source.orbit.clone(),
    afterlight: source.afterlight.clone(),
    metal: source.metal.clone(),
    particleBase: source.particleBase.clone(),
    avatarHair: source.avatarHair.clone(),
    avatarSkin: source.avatarSkin.clone(),
    avatarUniform: source.avatarUniform.clone(),
    avatarUniformSecondary: source.avatarUniformSecondary.clone(),
    avatarEye: source.avatarEye.clone(),
    avatarShoe: source.avatarShoe.clone(),
  };
}

function paletteHasMeaningfullyChanged(previous: ThreeObservatoryPalette, next: ThreeObservatoryPalette) {
  return (
    maxColorDelta(previous.fog, next.fog) > PALETTE_UPDATE_EPSILON ||
    maxColorDelta(previous.signal, next.signal) > PALETTE_UPDATE_EPSILON ||
    maxColorDelta(previous.orbit, next.orbit) > PALETTE_UPDATE_EPSILON ||
    maxColorDelta(previous.afterlight, next.afterlight) > PALETTE_UPDATE_EPSILON ||
    maxColorDelta(previous.metal, next.metal) > PALETTE_UPDATE_EPSILON ||
    maxColorDelta(previous.particleBase, next.particleBase) > PALETTE_UPDATE_EPSILON
  );
}

async function loadTextureSet(
  loader: THREE.TextureLoader,
  baseUrl: string,
  manifest: SeleneTextureSetManifest,
  repeatX: number,
  repeatY: number,
  anisotropy: number,
  ownedTextures: Set<THREE.Texture>,
): Promise<LoadedTextureSet> {
  const settled = await Promise.allSettled([
    loader.loadAsync(resolveAssetUrl(baseUrl, manifest.baseColor)),
    loader.loadAsync(resolveAssetUrl(baseUrl, manifest.normal)),
    loader.loadAsync(resolveAssetUrl(baseUrl, manifest.arm)),
  ]);
  const values = settled.map((entry, index) => {
    if (entry.status !== "fulfilled") return null;
    const texture = entry.value;
    configureSurfaceTexture(
      texture,
      index === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace,
      repeatX,
      repeatY,
      anisotropy,
    );
    ownedTextures.add(texture);
    return texture;
  });
  return { baseColor: values[0], normal: values[1], arm: values[2] };
}

function createFallbackMaterials(palette: ThreeObservatoryPalette) {
  const light = isLightWorldPalette(palette);
  const terrainMaterial = new THREE.MeshStandardMaterial({
    name: "SeleneRegolithTerrainMaterial",
    color: light ? lightSurfaceBase(palette, 0.58).lerp(palette.metal, 0.08) : coolMineralBase(palette, 0.08),
    emissive: coolMineralBounce(palette),
    emissiveIntensity: light ? 0.003 : 0.026,
    metalness: 0,
    roughness: 0.86,
    vertexColors: true,
    dithering: true,
  });
  terrainMaterial.userData = {
    surfaceRole: "regolith-basalt",
    colorScriptRole: "cool-mineral-ground",
  };

  const stone = new THREE.MeshStandardMaterial({
    name: "CampusStoneMaterial",
    color: light ? lightSurfaceBase(palette, 0.5).lerp(palette.metal, 0.1) : coolMineralBase(palette, 0.1),
    emissive: coolMineralBounce(palette),
    emissiveIntensity: light ? 0.008 : 0.07,
    metalness: 0,
    roughness: 0.72,
    dithering: true,
  });
  stone.userData = {
    surfaceRole: "regolith-stone",
    colorScriptRole: "cool-mineral-concrete",
  };

  const structural = new THREE.MeshStandardMaterial({
    name: "CampusStructuralMetalMaterial",
    color: light ? lightSurfaceBase(palette, 0.32).lerp(palette.metal, 0.38) : coolMineralBase(palette, 0.14),
    emissive: coolMineralBounce(palette),
    emissiveIntensity: light ? 0.006 : 0.028,
    metalness: 0.68,
    roughness: 0.4,
    dithering: true,
  });
  structural.userData = {
    surfaceRole: "structural-metal",
    colorScriptRole: "cool-brushed-structure",
  };

  const roof = new THREE.MeshStandardMaterial({
    name: "CampusRoofMaterial",
    color: light ? lightSurfaceBase(palette, 0.44).lerp(palette.metal, 0.18) : coolMineralBase(palette, 0.06),
    emissive: coolMineralBounce(palette),
    emissiveIntensity: light ? 0.005 : 0.04,
    metalness: 0.12,
    roughness: 0.62,
    dithering: true,
  });
  roof.userData = {
    surfaceRole: "thermal-roof",
    colorScriptRole: "cool-thermal-roof",
  };

  const glass = new THREE.MeshPhysicalMaterial({
    name: "CampusGlassMaterial",
    color: light
      ? lightSurfaceBase(palette, 0.26).lerp(palette.orbit, 0.18)
      : palette.fog.clone().lerp(palette.particleBase, 0.22).lerp(palette.orbit, 0.12),
    emissive: occupiedApertureColor(palette),
    emissiveIntensity: light ? 0.035 : 0.08,
    metalness: 0,
    roughness: 0.34,
    // Keep the architectural glazing reflective rather than refractive. A
    // non-zero transmission value makes Three render a full scene pre-pass
    // for every frame; the HDR environment, low roughness and alpha provide
    // the same cold optical read without doubling the persistent world cost.
    transmission: 0,
    thickness: 0.42,
    ior: 1.46,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  glass.userData = {
    surfaceRole: "optical-glass",
    colorScriptRole: "cool-glass-warm-interior",
    reflectionOnly: true,
  };

  const signal = new THREE.MeshStandardMaterial({
    name: "CampusSignalMaterial",
    color: signalCobalt(palette),
    emissive: signalCobalt(palette),
    emissiveIntensity: 0.42,
    metalness: 0.42,
    roughness: 0.5,
    toneMapped: true,
  });
  signal.userData = {
    surfaceRole: "signal-emissive",
    colorScriptRole: "sparse-signal-cobalt",
  };

  const afterlight = new THREE.MeshStandardMaterial({
    name: "CampusAfterlightMaterial",
    color: occupiedApertureColor(palette),
    emissive: occupiedApertureColor(palette),
    emissiveIntensity: 0.42,
    metalness: 0.02,
    roughness: 0.64,
    toneMapped: true,
  });
  afterlight.userData = {
    surfaceRole: "afterlight-emissive",
    colorScriptRole: "warm-occupied-aperture",
  };

  installWorldSpaceTriplanar(terrainMaterial, 0.16);
  installWorldSpaceTriplanar(stone, 0.12);
  installWorldSpaceTriplanar(roof, 0.16);
  installWorldSpaceTriplanar(structural, 0.42);

  return {
    terrainMaterial,
    campusMaterials: { stone, structural, roof, glass, signal, afterlight },
  };
}

export function createSelenePbrMaterialSystem(
  palette: ThreeObservatoryPalette,
  quality: ObservatoryQualityProfile,
  options: SelenePbrMaterialSystemOptions = {},
): SelenePbrMaterialSystem {
  const baseUrl = options.assetBaseUrl ?? SELENE_ASSET_BASE_URL;
  const renderer = options.renderer ?? null;
  const status: SeleneEnvironmentStatus = {
    state: renderer ? "idle" : "disabled",
    loadedTextures: 0,
    expectedTextures: 9,
    hdrReady: false,
  };
  const ownedTextures = new Set<THREE.Texture>();
  let environmentTarget: THREE.WebGLRenderTarget | null = null;
  let disposed = false;
  const lastPalette = clonePalette(palette);
  const { terrainMaterial, campusMaterials } = createFallbackMaterials(palette);
  const environmentMaterials: THREE.MeshStandardMaterial[] = [
    terrainMaterial,
    campusMaterials.stone,
    campusMaterials.structural,
    campusMaterials.roof,
    campusMaterials.glass,
  ];

  const setQuality = (nextQuality: ObservatoryQualityProfile) => {
    const low = nextQuality.tier === "low" || nextQuality.tier === "poster";
    campusMaterials.glass.opacity = low ? 0.82 : 0.74;
    campusMaterials.glass.envMapIntensity = low ? 0.86 : 1.16;
    terrainMaterial.envMapIntensity = low ? 0.68 : 0.9;
    campusMaterials.stone.envMapIntensity = low ? 0.74 : 1.02;
    campusMaterials.structural.envMapIntensity = low ? 0.92 : 1.24;
    campusMaterials.roof.envMapIntensity = low ? 0.7 : 0.94;
  };

  const setPalette = (nextPalette: ThreeObservatoryPalette, force = false): boolean => {
    if (!force && !paletteHasMeaningfullyChanged(lastPalette, nextPalette)) return false;
    copyPalette(lastPalette, nextPalette);
    const light = isLightWorldPalette(nextPalette);
    terrainMaterial.color
      .copy(light ? lightSurfaceBase(nextPalette, 0.58) : nextPalette.particleBase)
      .lerp(nextPalette.metal, light ? 0.08 : 0.08);
    terrainMaterial.emissive.copy(coolMineralBounce(nextPalette));
    terrainMaterial.emissiveIntensity = light ? 0.003 : 0.026;
    campusMaterials.stone.color
      .copy(light ? lightSurfaceBase(nextPalette, 0.5) : nextPalette.particleBase)
      .lerp(nextPalette.metal, light ? 0.1 : 0.1);
    campusMaterials.stone.emissive.copy(coolMineralBounce(nextPalette));
    campusMaterials.stone.emissiveIntensity = light ? 0.008 : 0.07;
    campusMaterials.structural.color
      .copy(light ? lightSurfaceBase(nextPalette, 0.32) : nextPalette.particleBase)
      .lerp(nextPalette.metal, light ? 0.38 : 0.14);
    campusMaterials.structural.emissive.copy(coolMineralBounce(nextPalette));
    campusMaterials.structural.emissiveIntensity = light ? 0.006 : 0.028;
    campusMaterials.roof.color
      .copy(light ? lightSurfaceBase(nextPalette, 0.44) : nextPalette.particleBase)
      .lerp(nextPalette.metal, light ? 0.18 : 0.06);
    campusMaterials.roof.emissive.copy(coolMineralBounce(nextPalette));
    campusMaterials.roof.emissiveIntensity = light ? 0.005 : 0.04;
    campusMaterials.glass.color.copy(
      light
        ? lightSurfaceBase(nextPalette, 0.26).lerp(nextPalette.orbit, 0.18)
        : nextPalette.fog.clone().lerp(nextPalette.particleBase, 0.22).lerp(nextPalette.orbit, 0.12),
    );
    campusMaterials.glass.emissive.copy(occupiedApertureColor(nextPalette));
    campusMaterials.glass.emissiveIntensity = light ? 0.035 : 0.08;
    campusMaterials.signal.color.copy(signalCobalt(nextPalette));
    campusMaterials.signal.emissive.copy(signalCobalt(nextPalette));
    campusMaterials.afterlight.color.copy(occupiedApertureColor(nextPalette));
    campusMaterials.afterlight.emissive.copy(occupiedApertureColor(nextPalette));
    campusMaterials.afterlight.emissiveIntensity = 0.42;
    return true;
  };

  setQuality(quality);

  const ready = (async () => {
    if (!renderer || typeof document === "undefined" || options.signal?.aborted) return;
    status.state = "loading";
    const textureLoader = new THREE.TextureLoader();
    const anisotropy = Math.min(MAX_TEXTURE_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());
    const [regolith, concrete, metal, hdr] = await Promise.all([
      loadTextureSet(textureLoader, baseUrl, SELENE_PBR_ASSET_MANIFEST.regolith, 18, 72, anisotropy, ownedTextures),
      loadTextureSet(textureLoader, baseUrl, SELENE_PBR_ASSET_MANIFEST.concrete, 2.5, 2.5, anisotropy, ownedTextures),
      loadTextureSet(textureLoader, baseUrl, SELENE_PBR_ASSET_MANIFEST.metal, 1.5, 1.5, anisotropy, ownedTextures),
      // Three r185 renamed the RGBE implementation to HDRLoader; the legacy
      // RGBELoader subclass only adds a console deprecation warning.
      new HDRLoader()
        .setDataType(THREE.HalfFloatType)
        .loadAsync(resolveAssetUrl(baseUrl, SELENE_PBR_ASSET_MANIFEST.environment.dark))
        .catch(() => null),
    ]);

    const loadedSets = [regolith, concrete, metal];
    status.loadedTextures = loadedSets.reduce(
      (total, set) => total + Number(Boolean(set.baseColor)) + Number(Boolean(set.normal)) + Number(Boolean(set.arm)),
      0,
    );
    if (disposed || options.signal?.aborted) {
      hdr?.dispose();
      ownedTextures.forEach((texture) => texture.dispose());
      ownedTextures.clear();
      status.state = "disposed";
      return;
    }

    assignTextureSet(terrainMaterial, regolith, 0.62, 0.46);
    assignTextureSet(campusMaterials.stone, concrete, 0.58, 0.56);
    assignTextureSet(campusMaterials.roof, concrete, 0.38, 0.5);
    assignTextureSet(campusMaterials.structural, metal, 0.46, 0.58);

    if (hdr) {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      environmentTarget = pmrem.fromEquirectangular(hdr);
      pmrem.dispose();
      hdr.dispose();
      if (disposed || options.signal?.aborted) {
        environmentTarget.dispose();
        environmentTarget = null;
        status.state = "disposed";
        return;
      }
      environmentMaterials.forEach((material) => {
        material.envMap = environmentTarget?.texture ?? null;
        material.needsUpdate = true;
      });
      status.hdrReady = true;
    }
    status.state = status.loadedTextures === status.expectedTextures && status.hdrReady ? "ready" : "partial";
  })().catch(() => {
    if (!disposed) status.state = "partial";
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ownedTextures.forEach((texture) => texture.dispose());
    ownedTextures.clear();
    environmentTarget?.dispose();
    environmentTarget = null;
    status.state = "disposed";
  };

  options.signal?.addEventListener("abort", dispose, { once: true });

  return {
    campusMaterials,
    terrainMaterial,
    status,
    ready,
    setPalette,
    setQuality,
    dispose,
  };
}
