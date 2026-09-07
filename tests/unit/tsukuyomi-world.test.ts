import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { createTsukuyomiWorld } from "../../src/lib/observatory/tsukuyomi-world";
import { createTsukuyomiRoof, createToriiLintel } from "../../src/lib/observatory/tsukuyomi-geometry";
import { getQualityProfile } from "../../src/lib/observatory/quality-tier";
import { interpolateObservatoryTimeline } from "../../src/lib/observatory/timeline";
import type { ThreeObservatoryPalette } from "../../src/lib/observatory/palette";

const palette: ThreeObservatoryPalette = {
  fog: new THREE.Color("#070b18"), signal: new THREE.Color("#8d7cff"), orbit: new THREE.Color("#6ca6ff"),
  afterlight: new THREE.Color("#e58aa8"), metal: new THREE.Color("#c6aa70"), particleBase: new THREE.Color("#d8e1ff"),
  avatarHair: new THREE.Color(), avatarSkin: new THREE.Color(), avatarUniform: new THREE.Color(),
  avatarUniformSecondary: new THREE.Color(), avatarEye: new THREE.Color(), avatarShoe: new THREE.Color(),
};

describe("Tsukuyomi canal city", () => {
  it("builds finite curved architecture with outward roof normals", () => {
    const roof = createTsukuyomiRoof(18, 14, 2.5), lintel = createToriiLintel(24, 1, 2, 1.2);
    for (const geometry of [roof, lintel]) {
      expect([...geometry.getAttribute("position").array].every(Number.isFinite)).toBe(true);
      expect([...geometry.getAttribute("normal").array].every(Number.isFinite)).toBe(true);
    }
    const center = 6 * 17 + 8;
    expect(roof.getAttribute("normal").getY(center)).toBeGreaterThan(.9);
    expect(roof.getAttribute("normal").getY(center + 17 * 13)).toBeLessThan(-.9);
    expect(roof.boundingSphere?.radius).toBeGreaterThan(9);
    roof.dispose(); lintel.dispose();
  });

  it("keeps six districts stable through reverse travel and quality changes without network assets", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const world = createTsukuyomiWorld(getQualityProfile("standard"), palette);
    await world.ready;
    expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
    const districts = world.group.children.filter(o => o.userData.chapter !== undefined);
    expect(districts).toHaveLength(6);
    const original = districts.map(o => ({ uuid: o.uuid, position: o.position.toArray() }));
    let meshCount = 0;
    world.group.traverse(o => { if (o instanceof THREE.Mesh) meshCount++; });
    expect(meshCount).toBeLessThan(100);
    for (const progress of [0, 1, 2, 3, 4, 5, 3, 0]) {
      world.update(interpolateObservatoryTimeline(progress), 4, .016);
      expect(districts.map(o => ({ uuid: o.uuid, position: o.position.toArray() }))).toEqual(original);
      expect(districts[Math.round(progress)].visible).toBe(true);
    }
    world.setQuality(getQualityProfile("low"));
    expect(world.group.children.filter(o => o.userData.chapter !== undefined)).toEqual(districts);
    world.setPalette({ ...palette, fog: new THREE.Color("#e9eaf5") });
    expect(world.environmentStatus).toBe("ready"); world.dispose();
  });

  it("releases GPU geometry, materials, maps and instance buffers exactly once", () => {
    const world = createTsukuyomiWorld(getQualityProfile("standard"), palette);
    const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.InstancedMesh>();
    world.group.traverse(o => {
      if (!(o instanceof THREE.Mesh || o instanceof THREE.Points)) return;
      resources.add(o.geometry);
      if (o instanceof THREE.InstancedMesh) resources.add(o);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        resources.add(m);
        if (m instanceof THREE.MeshBasicMaterial && m.map) resources.add(m.map);
      }
    });
    const spies = [...resources].map(r => vi.spyOn(r, "dispose"));
    world.dispose(); world.dispose();
    spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    expect(world.environmentStatus).toBe("disposed"); expect(world.group.children).toHaveLength(0);
  });
});
