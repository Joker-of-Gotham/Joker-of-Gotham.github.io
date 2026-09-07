import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { createSeleneAtmosphere } from "../../src/lib/observatory/selene-atmosphere";
import { createSeleneLightRig } from "../../src/lib/observatory/selene-lighting";
import { createSeleneNaturalAssetLayer } from "../../src/lib/observatory/selene-natural-assets";
import {
  createSelenePbrMaterialSystem,
  SELENE_PBR_ASSET_MANIFEST,
} from "../../src/lib/observatory/selene-materials";
import { getQualityProfile } from "../../src/lib/observatory/quality-tier";
import { createProceduralObservatoryWorld } from "../../src/lib/observatory/procedural-world";
import { interpolateObservatoryTimeline } from "../../src/lib/observatory/timeline";

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

describe("Selene Meridian PBR environment", () => {
  it("declares sRGB/base, OpenGL normal and packed ARM production paths", () => {
    expect(SELENE_PBR_ASSET_MANIFEST.regolith).toEqual({
      baseColor: "materials/regolith/basecolor-1k.jpg",
      normal: "materials/regolith/normal-gl-1k.jpg",
      arm: "materials/regolith/arm-1k.jpg",
    });
    expect(SELENE_PBR_ASSET_MANIFEST.environment.dark).toBe(
      "environment/rogland-clear-night-1k.hdr",
    );
  });

  it("builds physically distinct fallback materials before async hydration", async () => {
    const system = createSelenePbrMaterialSystem(palette, getQualityProfile("standard"));
    expect(system.status.state).toBe("disabled");
    expect(system.terrainMaterial.metalness).toBe(0);
    expect(system.terrainMaterial.roughness).toBeGreaterThan(0.8);
    expect(system.terrainMaterial.userData.textureProjection).toBe("world-space-triplanar");
    expect(system.campusMaterials.stone.userData.textureProjection).toBe("world-space-triplanar");
    // Brushed structural metal keeps enough diffuse response to read in
    // moonlit shadow instead of collapsing to a black mirror.
    expect(system.campusMaterials.structural.metalness).toBeGreaterThan(0.6);
    expect(system.campusMaterials.structural.metalness).toBeLessThan(0.8);
    expect(system.campusMaterials.glass).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    expect(system.campusMaterials.glass.transmission).toBe(0);
    expect(system.campusMaterials.glass.userData.reflectionOnly).toBe(true);
    expect(system.campusMaterials.signal.toneMapped).toBe(true);
    expect(system.campusMaterials.signal.userData.colorScriptRole).toBe("sparse-signal-cobalt");
    expect(system.campusMaterials.afterlight.userData.colorScriptRole).toBe("warm-occupied-aperture");
    await expect(system.ready).resolves.toBeUndefined();
    system.dispose();
    expect(system.status.state).toBe("disposed");
  });

  it("gates tiny palette changes instead of uploading changes every RAF", () => {
    const system = createSelenePbrMaterialSystem(palette, getQualityProfile("low"));
    expect(system.setPalette(palette)).toBe(false);
    const changed = { ...palette, signal: palette.signal.clone().offsetHSL(0.08, 0, 0) };
    expect(system.setPalette(changed)).toBe(true);
    expect(system.setPalette(changed)).toBe(false);
    system.dispose();
  });

  it("changes quality through uniforms without recompiling material variants", () => {
    const system = createSelenePbrMaterialSystem(palette, getQualityProfile("standard"));
    const materials = [
      system.terrainMaterial,
      system.campusMaterials.stone,
      system.campusMaterials.structural,
      system.campusMaterials.roof,
      system.campusMaterials.glass,
      system.campusMaterials.signal,
      system.campusMaterials.afterlight,
    ];
    const versions = materials.map((material) => material.version);
    system.setQuality(getQualityProfile("low"));
    system.setQuality(getQualityProfile("enhanced"));
    expect(materials.map((material) => material.version)).toEqual(versions);
    expect(system.campusMaterials.glass.transmission).toBe(0);
    expect(system.campusMaterials.glass.userData.reflectionOnly).toBe(true);
    system.dispose();
  });

  it("keeps the terrain macro colour buffer immutable across theme changes", () => {
    const world = createProceduralObservatoryWorld(getQualityProfile("low"), palette);
    const terrain = world.group.getObjectByName("TerrainFieldSurface") as THREE.Mesh;
    const colour = terrain.geometry.getAttribute("color") as THREE.BufferAttribute;
    const initialVersion = colour.version;
    world.setPalette({
      ...palette,
      fog: new THREE.Color("#eae6e0"),
      signal: new THREE.Color("#4f46b8"),
      orbit: new THREE.Color("#345eaa"),
      metal: new THREE.Color("#8d7138"),
      particleBase: new THREE.Color("#212536"),
    });
    expect(colour.version).toBe(initialVersion);
    expect(terrain.userData.paletteUploadPolicy).toBe("construction-only-static-vertex-mask");
    const normals = terrain.geometry.getAttribute("normal") as THREE.BufferAttribute;
    const upwardNormals = Array.from({ length: normals.count }, (_, index) => normals.getY(index))
      .filter((normalY) => normalY > 0.05).length;
    expect(upwardNormals / normals.count).toBeGreaterThan(0.98);
    world.dispose();
  });

  it("keeps detailed sky rendering inside the resident dome draw call", () => {
    const world = createProceduralObservatoryWorld(getQualityProfile("standard"), palette);
    const dome = world.group.getObjectByName("AtmosphericLunarSkyDome") as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >;
    const childCount = world.group.children.length;
    expect(dome.material.uniforms.uSkyDetail.value).toBeCloseTo(0.78);
    expect(dome.material.fragmentShader).toContain("lunarTexture");
    expect(dome.material.fragmentShader).toContain("starLayer");
    world.setQuality(getQualityProfile("low"));
    expect(world.group.children).toHaveLength(childCount);
    expect(dome.material.uniforms.uSkyDetail.value).toBeCloseTo(0.42);
    world.dispose();
  });
});

describe("Selene Meridian lunar atmosphere and light rig", () => {
  it("merges CC0 moon-rock LODs into one quality-gated batch", async () => {
    const gltf = readFileSync(
      "public/assets/three/selene-meridian/models/moon-rock-01/moon-rock-01.gltf",
      "utf8",
    );
    const binary = readFileSync(
      "public/assets/three/selene-meridian/models/moon-rock-01/moon-rock-01.bin",
    );
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      return url.endsWith(".gltf")
        ? new Response(gltf, { status: 200 })
        : new Response(binary, { status: 200 });
    });
    const layer = createSeleneNaturalAssetLayer(getQualityProfile("standard"), {
      assetBaseUrl: "https://selene.test/assets/three/selene-meridian",
      material: new THREE.MeshStandardMaterial({ vertexColors: true }),
      sampleHeight: () => 1.5,
    });

    await layer.ready;
    const rocks = layer.group.getObjectByName("BatchedCc0MoonRocks") as THREE.Mesh;
    expect(layer.state).toBe("ready");
    expect(rocks.userData.sourceLods).toEqual([2, 3]);
    expect(rocks.userData.mergedDrawCalls).toBe(1);
    expect(rocks.userData.visibleRockCount).toBe(30);
    const standardCount = rocks.geometry.drawRange.count;
    layer.setQuality(getQualityProfile("low"));
    expect(rocks.visible).toBe(true);
    expect(rocks.userData.visibleRockCount).toBe(18);
    expect(rocks.geometry.drawRange.count).toBeLessThan(standardCount);
    layer.setQuality(getQualityProfile("enhanced"));
    expect(rocks.geometry.drawRange.count).toBeGreaterThan(standardCount);
    layer.setQuality(getQualityProfile("poster"));
    expect(rocks.visible).toBe(false);
    expect(rocks.geometry.drawRange.count).toBe(0);
    layer.dispose();
    expect(layer.state).toBe("disposed");
    fetchMock.mockRestore();
  });

  it("preallocates lunar dust/vapour and degrades them only through draw ranges", () => {
    const atmosphere = createSeleneAtmosphere(getQualityProfile("enhanced"), palette, {
      sampleHeight: () => 0,
    });
    const dust = atmosphere.group.getObjectByName("PooledElectrostaticDust") as THREE.Points;
    const vapour = atmosphere.group.getObjectByName("LocalServiceVapour") as THREE.Points;
    const ridges = atmosphere.group.getObjectByName(
      "LayeredDistantRegolithRidges",
    ) as THREE.Mesh;
    const dustCapacity = dust.geometry.getAttribute("position").count;
    const vapourCapacity = vapour.geometry.getAttribute("position").count;
    const ridgeCapacity = ridges.geometry.getAttribute("position").count;
    expect(dust.userData.weatherType).toBe("electrostatic-lunar-dust");
    expect(atmosphere.group.userData.precipitation).toBe("none");
    expect(dust.geometry.drawRange.count).toBe(16_000);
    expect(ridges.userData.role).toBe("batched-distant-depth-ridges");
    expect(ridges.geometry.drawRange.count).toBe(ridgeCapacity);
    atmosphere.setQuality(getQualityProfile("low"));
    expect(dust.geometry.getAttribute("position").count).toBe(dustCapacity);
    expect(vapour.geometry.getAttribute("position").count).toBe(vapourCapacity);
    expect(ridges.geometry.getAttribute("position").count).toBe(ridgeCapacity);
    expect(dust.geometry.drawRange.count).toBe(3_200);
    expect(vapour.geometry.drawRange.count).toBe(96);
    expect(ridges.geometry.drawRange.count).toBe(ridgeCapacity);
    expect(ridges.userData.visibleLayers).toBe(3);
    expect(ridges.userData.integratedHorizonVeil).toBe(true);
  });

  it("uses one shadow key and a bounded non-shadow practical pool", () => {
    const rig = createSeleneLightRig(getQualityProfile("standard"), palette);
    const shadowLights = rig.lights.filter((light) => light.castShadow);
    const practicals = rig.lights.filter((light) => light.userData.role === "pooled-non-shadow-practical");
    expect(shadowLights.map((light) => light.name)).toEqual(["CelestialKeyLight"]);
    expect(practicals).toHaveLength(6);
    expect(practicals.every((light) => !light.castShadow)).toBe(true);
    expect(practicals.every((light) => light.userData.attachment === "occupied-aperture")).toBe(true);
    expect(rig.group.userData.colorScript).toContain("warm-occupied-aperture");
    rig.update(interpolateObservatoryTimeline(3.2));
    expect(practicals.some((light) => light.intensity > 0)).toBe(true);
    rig.setQuality(getQualityProfile("low"));
    // The shadow shader pipeline is immutable after scene construction. A
    // runtime tier change may tune intensities and object participation, but
    // must not change the light-shadow define and trigger a full recompile.
    expect(rig.lights.find((light) => light.name === "CelestialKeyLight")?.castShadow).toBe(true);
    expect(rig.group.userData.stableShadowPipeline).toBe(true);
  });
});
