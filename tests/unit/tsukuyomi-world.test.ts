import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { createTsukuyomiWorld } from "../../src/lib/observatory/tsukuyomi-world";
import { createTsukuyomiRoof, createToriiLintel } from "../../src/lib/observatory/tsukuyomi-geometry";
import { getQualityProfile } from "../../src/lib/observatory/quality-tier";
import { interpolateObservatoryTimeline } from "../../src/lib/observatory/timeline";
import type { ThreeObservatoryPalette } from "../../src/lib/observatory/palette";
import { sampleObservatoryCameraRoute } from "../../src/lib/observatory/camera-director";

const palette: ThreeObservatoryPalette = {
  fog: new THREE.Color("#070b18"), signal: new THREE.Color("#8d7cff"), orbit: new THREE.Color("#6ca6ff"),
  afterlight: new THREE.Color("#e58aa8"), metal: new THREE.Color("#c6aa70"), particleBase: new THREE.Color("#d8e1ff"),
  avatarHair: new THREE.Color(), avatarSkin: new THREE.Color(), avatarUniform: new THREE.Color(),
  avatarUniformSecondary: new THREE.Color(), avatarEye: new THREE.Color(), avatarShoe: new THREE.Color(),
};

describe("Tsukuyomi canal city", () => {
  it('centers both gates over water with symmetric foundations clear of both banks', () => {
    const world = createTsukuyomiWorld(getQualityProfile('standard'), palette);
    const foundations = world.group.userData.gateFoundations as {center:number[];radius:number}[];
    expect(foundations).toHaveLength(4);
    for(let i=0;i<4;i+=2) {
      expect(foundations[i].center[0] + foundations[i+1].center[0]).toBeCloseTo(0);
      for(const foot of foundations.slice(i,i+2)) expect(Math.abs(foot.center[0])+foot.radius).toBeLessThan(15.5);
    }
    const names:string[]=[];world.group.traverse(o=>names.push(o.name));
    expect(names.some(name=>/Quayside(Walker|Cart|FestivalCart)/.test(name))).toBe(false);
    world.dispose();
  });
  it("keeps the whole camera spline clear of actual building envelopes and grounds every building", () => {
    const world = createTsukuyomiWorld(getQualityProfile("standard"), palette);
    const bounds = world.group.userData.buildingBounds.map((b: { min: number[]; max: number[] }) =>
      new THREE.Box3(new THREE.Vector3().fromArray(b.min), new THREE.Vector3().fromArray(b.max)));
    expect(bounds.length).toBeGreaterThan(60);
    bounds.forEach((box: THREE.Box3) => expect(box.min.y).toBeLessThan(-1));
    for (let step = 0; step <= 500; step++) {
      const position = new THREE.Vector3().fromArray(sampleObservatoryCameraRoute(step / 500).position);
      bounds.forEach((box: THREE.Box3) => expect(box.distanceToPoint(position)).toBeGreaterThan(8));
    }
    world.dispose();
  });
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
