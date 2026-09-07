import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createFishTail, createLuminousFish, createToriiLintel, createTsukuyomiRoof, roofHeight } from "./tsukuyomi-geometry";
import { createSeededRandom } from "./random";
import type { ThreeObservatoryPalette } from "./palette";
import type { ProceduralObservatoryWorld } from "./procedural-world";
import type { ObservatoryQualityProfile } from "./types";

export const TSUKUYOMI_LANDMARKS = [
  [10, 9, -26], [-23, 8, -88], [5, 4, -158],
  [18, 15, -238], [-27, 8, -312], [12, 9, -404],
] as const;

const noise = /* glsl */ `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
`;

/** A real persistent city: curved roofs, canals, bridges, lanterns and living light fish. */
export function createTsukuyomiWorld(quality: ObservatoryQualityProfile, palette: ThreeObservatoryPalette): ProceduralObservatoryWorld {
  const group = new THREE.Group();
  group.name = "TsukuyomiLanternCity";
  group.userData = { worldVersion: 8, sceneId: "tsukuyomi-water-city-v8", world: "月読 · Lanterns on the water",
    fixedWorldCoordinates: true, sceneLifetime: "persistent", livePlateDependency: false, coordinateSpan: 459,
    visualSource: "original-realtime-tsukuyomi-fan-interpretation" };
  const random = createSeededRandom(0x5453554b);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  const time = { value: 0 }, day = { value: 0 }, fogColor = { value: new THREE.Color(0x292740).convertLinearToSRGB() };
  const standard = (color: number, roughness = .75, emissive = 0x000000, intensity = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: .06, emissive, emissiveIntensity: intensity });
    materials.add(m); return m;
  };
  const timber = standard(0x492c3e), lacquer = standard(0xb74455, .43, 0x66253d, .18);
  const roof = standard(0x20344e, .64, 0x163749, .16), trim = standard(0x69939a, .48, 0x22545d, .18);
  const plaster = standard(0xc18f95, .95), stone = standard(0x41435d, .9), brass = standard(0xbf9464, .42);
  const paper = new THREE.MeshBasicMaterial({ color: 0xffd0a0, toneMapped: false });
  const gateLight = new THREE.MeshBasicMaterial({ color: 0xffdfa1, toneMapped: false });
  [paper, gateLight].forEach(m => materials.add(m));

  const lanternPixels = new Uint8Array(32 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
    const v = y / 63, roundness = Math.sin(v * Math.PI) ** .45;
    const rib = .94 + .06 * Math.cos(x / 32 * Math.PI * 16);
    const i = (y * 32 + x) * 4;
    lanternPixels.set([255 * rib, (143 + roundness * 91) * rib, (79 + roundness * 90) * rib, 255], i);
  }
  const lanternTexture = new THREE.DataTexture(lanternPixels, 32, 64);
  lanternTexture.colorSpace = THREE.SRGBColorSpace; lanternTexture.needsUpdate = true;
  lanternTexture.magFilter = THREE.LinearFilter; textures.add(lanternTexture);
  const lanternPaper = new THREE.MeshBasicMaterial({ map: lanternTexture, toneMapped: false }); materials.add(lanternPaper);

  for (const mat of [timber, lacquer, roof, trim, plaster, stone, brass, paper, lanternPaper, gateLight]) {
    const isRoof = mat === roof;
    mat.onBeforeCompile = shader => {
      shader.uniforms.uCityFog = fogColor;
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vCityPosition; varying vec2 vCityUv;")
        .replace("#include <project_vertex>", `#include <project_vertex>
        vec4 wp=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          wp=instanceMatrix*wp;
        #endif
        vCityPosition=(modelMatrix*wp).xyz; vCityUv=uv;`);
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
        varying vec3 vCityPosition; varying vec2 vCityUv; uniform vec3 uCityFog; ${noise}`)
        .replace("#include <color_fragment>", `#include <color_fragment>
          float grain=noise(vCityPosition.xz*3.+vCityPosition.y*.4);
          diffuseColor.rgb *= .86+.14*grain;
          ${isRoof ? "float tile=pow(.5+.5*cos(vCityUv.x*150.8),10.); diffuseColor.rgb*=.68+tile*.42;" : ""}
        `)
        .replace("#include <fog_fragment>", `
          float dist=length(vCityPosition-cameraPosition);
          float low=exp(-max(0.,vCityPosition.y)*.17);
          float mist=1.-exp(-dist*(.0032+low*.0025));
          gl_FragColor.rgb=mix(gl_FragColor.rgb,uCityFog,clamp(mist,0.,.97));
        `);
    };
    mat.customProgramCacheKey = () => `tsukuyomi-surface-${isRoof ? "tile" : "wood"}`;
  }
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
    x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz);
    geometries.add(geometry); parent.add(mesh); return mesh;
  };
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material,
    x = 0, y = 0, z = 0) => add(parent, new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const curveTube = (parent: THREE.Object3D, points: THREE.Vector3[], radius: number, m: THREE.Material) =>
    add(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(8, points.length), radius, 5, false), m);

  const lanterns: THREE.Vector3[] = [], glowColors: THREE.Color[] = [], glowSizes: number[] = [];
  const glow = (x: number, y: number, z: number, color = 0xffb779, size = 4) => {
    lanterns.push(new THREE.Vector3(x, y, z)); glowColors.push(new THREE.Color(color).convertLinearToSRGB()); glowSizes.push(size);
  };
  const lamp = (parent: THREE.Object3D, x: number, y: number, z: number, size = 1) => {
    const shell = add(parent, new THREE.SphereGeometry(.48, 8, 6), lanternPaper, x, y, z);
    shell.scale.set(size, size * 1.4, size);
    add(parent, new THREE.CylinderGeometry(.26 * size, .26 * size, .1, 8), timber, x, y + .66 * size, z);
    add(parent, new THREE.CylinderGeometry(.26 * size, .26 * size, .1, 8), timber, x, y - .66 * size, z);
    // World transforms are evaluated once before batching below.
    shell.userData.lantern = true; shell.userData.glowSize = size * 3.7;
  };
  const roofAt = (parent: THREE.Object3D, width: number, depth: number, rise: number, y: number, detail: boolean) => {
    add(parent, createTsukuyomiRoof(width, depth, rise), roof, 0, y, 0);
    for (const sign of [-1, 1]) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const u = i / 8 - 1;
        points.push(new THREE.Vector3(u * width / 2, y + roofHeight(u, sign, rise), sign * depth / 2));
      }
      curveTube(parent, points, .09, trim);
    }
    box(parent, width * .36, .24, .22, brass, 0, y + rise + .1, 0);
    if (detail) {
      for (const sign of [-1, 1]) for (let i = 0; i < 12; i++) {
        const x = (i / 11 - .5) * width * .88;
        box(parent, .13, .24, .9, timber, x, y - .18, sign * depth * .43);
      }
    }
  };

  const building = (parent: THREE.Object3D, x: number, z: number, w: number, d: number, levels: number, rotation = 0, detail = true) => {
    const b = new THREE.Group(); b.position.set(x, .4, z); b.rotation.y = rotation; parent.add(b);
    b.name = levels > 3 ? "LayeredPagoda" : "LanternTownhouse";
    box(b, w + .8, .6, d + .8, stone, 0, 0, 0);
    for (let floor = 0; floor < levels; floor++) {
      const taper = 1 - floor * .105;
      const fw = w * taper, fd = d * taper, y = floor * 4.5;
      box(b, fw, 3.8, fd, plaster, 0, y + 2.1, 0);
      box(b, fw + .55, .26, fd + .55, lacquer, 0, y + .38, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(b, .38, 4.1, .38, timber, sx * fw * .48, y + 2.3, sz * fd * .48);
      }
      for (const side of [-1, 1]) {
        // Luminous shoji bays and narrow timber mullions make each story legible.
        box(b, fw * .81, 2.05, .06, paper, 0, y + 2.25, side * (fd / 2 + .04));
        for (let i = 0; i <= 8; i++) box(b, .075, 2.25, .1, timber,
          (i / 8 - .5) * fw * .84, y + 2.25, side * (fd / 2 + .1));
        for (let i = 0; i < 3; i++) box(b, fw * .86, .075, .1, timber, 0, y + 1.6 + i * .65, side * (fd / 2 + .1));
        box(b, fw * .94, .12, .13, lacquer, 0, y + .86, side * (fd / 2 + .7));
        box(b, fw * .94, .12, .13, lacquer, 0, y + 1.25, side * (fd / 2 + .7));
        for (let i = 0; i < 7; i++) box(b, .1, .8, .1, lacquer,
          (i / 6 - .5) * fw * .94, y + .86, side * (fd / 2 + .7));
        if (detail) for (let i = 0; i < 4; i++) lamp(b, (i / 3 - .5) * fw * .8, y + 3.2, side * (fd / 2 + 1.2), .5);
      }
      // Side windows prevent end walls from reading as featureless cuboids.
      for (const side of [-1, 1]) {
        box(b, .07, 1.9, fd * .72, paper, side * (fw / 2 + .045), y + 2.2, 0);
        for (let j = 0; j < 6; j++) box(b, .12, 2.1, .1, timber,
          side * (fw / 2 + .08), y + 2.2, (j / 5 - .5) * fd * .75);
      }
      roofAt(b, fw + 3.8, fd + 3.4, 2.5, y + 4, detail);
    }
    add(b, new THREE.ConeGeometry(.18, 2.7, 8), brass, 0, levels * 4.5 + 1.8, 0);
    return b;
  };

  const gates: THREE.Group[] = [];
  const torii = (parent: THREE.Object3D, x: number, z: number, scale = 1) => {
    const gate = new THREE.Group(); gate.position.set(x, .3, z); gate.scale.setScalar(scale); parent.add(gate); gate.name = "GrandVermilionTorii";
    for (const side of [-1, 1]) {
      add(gate, new THREE.CylinderGeometry(.62, .86, 16.5, 16), lacquer, side * 7.4, 8.25, 0, 0, 0, side * .035);
      add(gate, new THREE.CylinderGeometry(.96, 1.05, 1.25, 16), stone, side * 7.65, .5, 0);
      add(gate, new THREE.CylinderGeometry(.83, .83, .3, 16), brass, side * 7.22, 14.2, 0);
      box(gate, 2.6, .7, 2.8, lacquer, side * 7.3, 14.8, 0);
      lamp(gate, side * 5.4, 10.7, .6, 1.05);
    }
    add(gate, createToriiLintel(23, 1.05, 1.65, 1.1), lacquer, 0, 16.1, 0);
    add(gate, createToriiLintel(24.2, .42, 2, 1.35), roof, 0, 17.15, 0);
    add(gate, createToriiLintel(24.35, .12, 2.05, 1.35), gateLight, 0, 17.55, 0);
    box(gate, 20.5, .95, 1.1, lacquer, 0, 12.25, 0);
    box(gate, .6, 3.6, .7, lacquer, 0, 14.3, 0);
    box(gate, 1.55, 2.7, .28, brass, 0, 14.5, 1.05);
    box(gate, 1.3, 2.45, .32, timber, 0, 14.5, 1.12);
    gates.push(gate); return gate;
  };

  const districts: THREE.Group[] = [];
  for (let section = 0; section < 6; section++) {
    const district = new THREE.Group(); district.position.z = -section * 72; district.name = `TsukuyomiDistrict${section}`;
    district.userData.chapter = section; districts.push(district); group.add(district);
    for (const side of [-1, 1]) {
      box(district, 22, 2.6, 74, stone, side * 36, -1.35, -40);
      box(district, 6, .5, 74, timber, side * 24.5, .35, -40);
      box(district, .18, .18, 72, lacquer, side * 21.65, 1.8, -40);
      box(district, .12, .12, 72, lacquer, side * 21.65, 1.15, -40);
      for (let post = 0; post < 14; post++) {
        const z = -5 - post * 5.2;
        box(district, .23, 1.6, .23, lacquer, side * 21.65, 1.1, z);
        if (post % 2 === 0) {
          box(district, .25, 4.4, .25, timber, side * 23, 2.5, z);
          box(district, 1.6, .17, .2, timber, side * 22.5, 4.7, z);
          lamp(district, side * 21.8, 3.95, z, .65);
        }
      }
      for (let row = 0; row < 3; row++) {
        const levels = 1 + (section + row + (side > 0 ? 1 : 0)) % 3;
        building(district, side * (33 + random() * 4), -18 - row * 23, 12 + random() * 4, 10, levels, side * .08);
      }
      // A second staggered roofline establishes the scale of a city rather than a corridor.
      for (let row = 0; row < 3; row++) building(district, side * (56 + random() * 18), -8 - row * 25,
        12 + random() * 5, 12, 2 + Math.floor(random() * 3), side * .15, false);
    }
  }
  torii(districts[0], 9, -25, 1.18);
  building(districts[0], 4, -75, 17, 14, 5, .12);
  torii(districts[5], 10, -40, .95);
  building(districts[3], 10, -24, 19, 16, 5, -.14);
  building(districts[4], -13, -26, 16, 14, 2, .25);

  // Arched footbridges: curved decks, railings and joinery across the canal.
  for (const [section, localZ] of [[2, -17], [4, -61]] as const) {
    const d = districts[section], z = localZ;
    const arcY = (x: number) => .85 + 3.2 * Math.cos(x / 22 * Math.PI / 2);
    for (let i = 0; i < 40; i++) {
      const x = -22 + (i + .5) / 40 * 44;
      const plank = box(d, 1.14, .35, 6.4, timber, x, arcY(x), z);
      plank.rotation.z = Math.atan(-3.2 * Math.PI / 44 * Math.sin(x / 22 * Math.PI / 2));
    }
    for (const side of [-1, 1]) {
      for (const rail of [1.2, 1.85]) curveTube(d, Array.from({ length: 25 }, (_, i) => {
        const x = -22 + i / 24 * 44; return new THREE.Vector3(x, arcY(x) + rail, z + side * 3);
      }), .14, lacquer);
      for (let i = 0; i < 17; i++) {
        const x = -22 + i / 16 * 44;
        box(d, .23, 2, .23, lacquer, x, arcY(x) + 1, z + side * 3);
        if (i % 4 === 0) lamp(d, x, arcY(x) + 2.6, z + side * 3, .6);
      }
    }
  }

  // Japanese typography on small, independently authored digital shop signs.
  const signTexture = (text: string, color: string) => {
    if (typeof document === "undefined") return new THREE.DataTexture(new Uint8Array([255,255,255,255]), 1, 1);
    const canvas = document.createElement("canvas"); canvas.width = 128; canvas.height = 384;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#19172e"; ctx.fillRect(0, 0, 128, 384);
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.strokeRect(6, 6, 116, 372);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.font = "64px 'Yu Mincho', 'Noto Serif JP', serif"; ctx.textAlign = "center";
    [...text].forEach((letter, i) => ctx.fillText(letter, 64, 96 + i * 102));
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture); return texture;
  };
  const signMaterials = ["月読", "夢見", "花宵", "音楽"].map((text, i) => {
    const map = signTexture(text, i % 2 ? "#ff9bda" : "#98fff0"); textures.add(map);
    const mat = new THREE.MeshBasicMaterial({ map, toneMapped: false }); materials.add(mat); return mat;
  });
  gates.forEach(gate => add(gate, new THREE.PlaneGeometry(1.27, 2.4), signMaterials[0], 0, 14.5, 1.3));
  districts.forEach((d, k) => {
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? -1 : 1, x = side * 25.5, z = -14 - i * 15;
      add(d, new THREE.PlaneGeometry(1.7, 5.1), signMaterials[(k + i) % 4], x, 7 + i % 2 * 3, z, 0, side * -.25);
    }
    // Catenary festoon strings cross over the water, with enough open sky between them.
    if (k % 2 === 0) for (let string = 0; string < 2; string++) {
      const z = -38 - string * 15;
      const points = Array.from({ length: 17 }, (_, i) => {
        const x = -24 + i * 3; return new THREE.Vector3(x, 15 + (x / 24) ** 2 * 4, z);
      });
      curveTube(d, points, .035, timber);
      for (let i = 0; i < 13; i++) { const x = -23 + i / 12 * 46; lamp(d, x, 14.35 + (x / 24) ** 2 * 4, z, .5); }
    }
  });

  // Thousands of individual five-petal flowers give the canopy a fine silhouette.
  // Point sprites preserve depth while avoiding a mesh per flower or faceted pink boulders.
  const canopyPositions: number[] = [], canopyColors: number[] = [], canopySizes: number[] = [];
  const dummy = new THREE.Object3D();
  const pinks = [0xe6a5cb, 0xc989b9, 0x997bba, 0xf0c8df].map(c => new THREE.Color(c).convertLinearToSRGB());
  const treePositions = [
    [-23, -4], [31, -17], [-28, -45], [25, -82], [-22, -104],
    [27, -150], [-29, -178], [24, -244], [-25, -294], [27, -322], [-26, -379], [29, -403],
  ];
  for (const [x, z] of treePositions) {
    const d = districts[Math.min(5, Math.floor(Math.abs(z) / 72))];
    const localZ = z - d.position.z;
    add(d, new THREE.CylinderGeometry(.22, .65, 6.5, 7), timber, x, 3.4, localZ, .05, 0, x > 0 ? -.16 : .15);
    for (let branch = 0; branch < 6; branch++) {
      const a = branch / 6 * Math.PI * 2 + random() * .4;
      const cx = x + Math.cos(a) * (2.4 + random() * 2), cy = 6.2 + random() * 3;
      const cz = localZ + Math.sin(a) * (2.4 + random() * 2);
      curveTube(d, [new THREE.Vector3(x, 3.6, localZ), new THREE.Vector3((x + cx) / 2, 6, (localZ + cz) / 2), new THREE.Vector3(cx, cy, cz)], .14, timber);
      for (let j = 0; j < 110; j++) {
        const theta = random() * Math.PI * 2, phi = Math.acos(random() * 2 - 1), r = random() ** .33 * 2.4;
        canopyPositions.push(cx + Math.cos(theta) * Math.sin(phi) * r,
          cy + Math.cos(phi) * r * .55, cz + d.position.z + Math.sin(theta) * Math.sin(phi) * r);
        canopyColors.push(...pinks[Math.floor(random() * pinks.length)].toArray()); canopySizes.push(.42 + random() * .4);
      }
    }
  }
  const canopyGeometry = new THREE.BufferGeometry();
  canopyGeometry.setAttribute("position", new THREE.Float32BufferAttribute(canopyPositions, 3));
  canopyGeometry.setAttribute("color", new THREE.Float32BufferAttribute(canopyColors, 3));
  canopyGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(canopySizes, 1)); geometries.add(canopyGeometry);
  const canopyMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: true,
    uniforms: { uCityFog: fogColor },
    vertexShader: `attribute vec3 color;attribute float aSize;varying vec3 vColor;varying float vFog;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(aSize*1050./max(1.,-mv.z),1.,32.);vColor=color;vFog=1.-exp(-length(mv.xyz)*.0045);}`,
    fragmentShader: `varying vec3 vColor;varying float vFog;uniform vec3 uCityFog;
      void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float edge=.34+.055*cos(atan(p.y,p.x)*5.);
      if(r>edge)discard;float a=1.-smoothstep(edge-.04,edge,r);
      vec3 c=vColor*(.82+p.y*.24)+vec3(.08,.045,.035)*exp(-r*18.);
      gl_FragColor=vec4(mix(c,uCityFog,vFog),a);}`,
  }); materials.add(canopyMaterial);
  const blossoms = new THREE.Points(canopyGeometry, canopyMaterial); blossoms.name = "SakuraCanopies"; group.add(blossoms);

  // Batch all static city geometry per district/material. Repetition does not multiply draws.
  group.updateMatrixWorld(true);
  gates.forEach(gate => {
    for (let i = 0; i <= 24; i++) {
      const u = i / 12 - 1;
      const p = new THREE.Vector3(u * 12.15, 17.65 + 1.35 * u ** 4, 1.04).applyMatrix4(gate.matrixWorld);
      glow(p.x, p.y, p.z, 0xffd797, 1.05);
    }
  });
  districts.forEach(d => {
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>(), remove: THREE.Mesh[] = [];
    const inverse = d.matrixWorld.clone().invert();
    d.traverse(o => {
      if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
      if (o.userData.lantern) {
        const p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
        glow(p.x, p.y, p.z, 0xffbb87, o.userData.glowSize);
      }
      const geom = o.geometry.clone();
      if (!geom.index) geom.setIndex(Array.from({ length: geom.getAttribute("position").count }, (_, i) => i));
      geom.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
      // Every static primitive uses the same compact vertex contract.
      if (!geom.getAttribute("uv")) geom.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geom.getAttribute("position").count * 2), 2));
      const entries = batches.get(o.material) ?? []; entries.push(geom); batches.set(o.material, entries); remove.push(o);
    });
    remove.forEach(o => { o.removeFromParent(); o.geometry.dispose(); geometries.delete(o.geometry); });
    batches.forEach((parts, material) => {
      const merged = mergeGeometries(parts, false); parts.forEach(p => p.dispose());
      if (merged) add(d, merged, material);
    });
  });

  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
    uniforms: { uTime: time, uDay: day },
    vertexShader: `varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: /* glsl */ `varying vec3 vDirection;uniform float uTime;uniform float uDay;${noise}
      void main(){vec3 d=normalize(vDirection); float h=smoothstep(-.1,.8,d.y);
        vec3 c=mix(mix(vec3(.17,.14,.26),vec3(.62,.57,.72),uDay),mix(vec3(.018,.035,.095),vec3(.23,.31,.51),uDay),h);
        float a=atan(d.z,d.x);
        float cloud=sin(a*3.2+sin(d.y*8.)*.7+uTime*.003)*sin(d.y*12.+sin(a*2.3)*.8);
        cloud+=sin(a*8.1-d.y*16.+sin(a*3.9+d.y*18.))*.22;
        c+=vec3(.035,.045,.075)*smoothstep(-.3,1.,cloud)*exp(-pow((d.y-.18)/.2,2.));
        vec3 moon=normalize(vec3(.42,.29,-.88)); float md=length(d-moon);
        float disc=1.-smoothstep(.07,.0715,md);
        float craters=(sin(d.x*140.+sin(d.y*165.)*1.5)*sin(d.y*170.)*.5+.5)*.025;
        craters+=(sin(d.x*54.+d.y*90.)*.5+.5)*.03;
        c+=vec3(.13,.13,.2)*exp(-md*17.)*(1.-uDay*.4);
        c=mix(c,vec3(.91,.87,.89)-craters,disc);
        vec2 st=vec2(a*105.,asin(d.y)*105.);float star=step(.994,hash(floor(st)))*(1.-smoothstep(.015,.09,length(fract(st)-.5)));
        c+=star*smoothstep(.12,.45,d.y)*.5*(1.-uDay);
        c+=(hash(gl_FragCoord.xy)-.5)/255.;gl_FragColor=vec4(c,1.);
      }`,
  });
  materials.add(skyMaterial);
  const sky = add(group, new THREE.SphereGeometry(780, 32, 24), skyMaterial, 0, 0, -200); sky.renderOrder = -10; sky.frustumCulled = false;

  // Actual planar reflection, intentionally softly rippled rather than a second decorative image.
  const waterGeometry = new THREE.PlaneGeometry(720, 980); geometries.add(waterGeometry);
  const water = new Reflector(waterGeometry, { textureWidth: quality.tier === "low" ? 384 : 768,
    textureHeight: quality.tier === "low" ? 384 : 768, clipBias: .003, multisample: 0,
    shader: {
      name: "TsukuyomiCanal", uniforms: { color: { value: new THREE.Color(0x172437) }, tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() }, uTime: time, uDay: day },
      vertexShader: `uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vWorld;
        void main(){vUv=textureMatrix*vec4(position,1.); vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime;uniform float uDay;varying vec4 vUv;varying vec3 vWorld;
        void main(){vec2 uv=vUv.xy/vUv.w;
          float wave=sin(vWorld.z*1.8+uTime*.65+sin(vWorld.x*.7))* .0008;
          uv.x+=wave+sin(vWorld.z*4.-uTime*.4)*.0003;
          vec3 reflected=texture2D(tDiffuse,uv).rgb;
          float fresnel=.53+.18*clamp(length(vWorld-cameraPosition)/90.,0.,1.);
          vec3 base=mix(vec3(.011,.019,.042),vec3(.16,.18,.26),uDay);
          gl_FragColor=vec4(mix(base,reflected,fresnel),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  water.name = "ReflectingCanal"; water.rotation.x = -Math.PI / 2; water.position.set(0, -1, -220); group.add(water);
  // Reflector clones uniforms, so update its copies in the world tick.
  const waterMaterial = water.material as THREE.ShaderMaterial;
  let lowTier = quality.tier === "low", reflectionFrame = 0;
  const renderReflection = water.onBeforeRender.bind(water);
  water.onBeforeRender = (...args) => { if (!lowTier || reflectionFrame++ % 2 === 0) renderReflection(...args); };

  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lanterns.flatMap(p => p.toArray()), 3));
  glowGeometry.setAttribute("color", new THREE.Float32BufferAttribute(glowColors.flatMap(c => c.toArray()), 3));
  glowGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(glowSizes, 1)); geometries.add(glowGeometry);
  const glowMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uDay: day },
    vertexShader: `attribute float aSize;attribute vec3 color;varying vec3 vColor;varying float vFade;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(aSize*1400./max(1.,-mv.z),1.,128.);vColor=color;vFade=exp(-length(mv.xyz)*.002);}`,
    fragmentShader: `uniform float uDay;varying vec3 vColor;varying float vFade;
      void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.)*pow(max(0.,1.-d),1.5);
      gl_FragColor=vec4(vColor,a*vFade*(.46-uDay*.26));}`,
  }); materials.add(glowMaterial);
  const halos = new THREE.Points(glowGeometry, glowMaterial); halos.name = "LanternHalos"; group.add(halos);

  const fishBody = createLuminousFish(), fishTail = createFishTail(); geometries.add(fishBody); geometries.add(fishTail);
  const fishMaterials = [0x8ae9e0, 0xd9abea, 0xffdfa0].map(color => {
    const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: .4, side: THREE.DoubleSide, toneMapped: false, forceSinglePass: true });
    m.onBeforeCompile = shader => {
      shader.uniforms.uCityFog = fogColor;
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec3 uCityFog;")
        .replace("#include <fog_fragment>", `
          #ifdef USE_FOG
            gl_FragColor.rgb=mix(gl_FragColor.rgb,uCityFog,1.-exp(-vFogDepth*.0045));
          #endif
        `);
    };
    m.customProgramCacheKey = () => "tsukuyomi-light-fish";
    materials.add(m); return m;
  });
  const fishGroups = fishMaterials.map(m => {
    const body = new THREE.InstancedMesh(fishBody, m, 48), tail = new THREE.InstancedMesh(fishTail, m, 48);
    body.frustumCulled = tail.frustumCulled = false;
    body.instanceMatrix.setUsage(THREE.DynamicDrawUsage); tail.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(body, tail); return { body, tail };
  });
  const fishSeeds = Array.from({ length: 144 }, () => ({ phase: random() * Math.PI * 2, speed: .035 + random() * .025,
    z: 10 - random() * 460, height: 13 + random() * 18, scale: .3 + random() * .55 }));

  const petalGeometry = new THREE.BufferGeometry();
  const petalPositions = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) petalPositions.set([(random() - .5) * 68, 3 + random() * 19, 20 - random() * 465], i * 3);
  petalGeometry.setAttribute("position", new THREE.BufferAttribute(petalPositions, 3)); geometries.add(petalGeometry);
  const petalMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: time },
    vertexShader: `uniform float uTime;varying float vFade;void main(){vec3 p=position;
      p.x+=sin(uTime*.19+p.z)*1.2;p.y=mod(position.y-uTime*.12,23.);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(78./max(1.,-mv.z),1.,4.);
      vFade=exp(-length(mv.xyz)*.012);}`,
    fragmentShader: `varying float vFade;void main(){vec2 p=gl_PointCoord-.5;
      float a=1.-smoothstep(.12,.48,length(p*vec2(1.,1.5)));gl_FragColor=vec4(.96,.68,.84,a*vFade*.65);}`,
  }); materials.add(petalMaterial); group.add(new THREE.Points(petalGeometry, petalMaterial));

  const key = new THREE.DirectionalLight(0xaaaee9, 2.3); key.position.set(-30, 65, 10);
  const fill = new THREE.HemisphereLight(0x7589c6, 0x4c2337, 1.6);
  const warmLight = new THREE.PointLight(0xffac77, 160, 70, 1.4); warmLight.position.set(8, 9, -19);
  const pinkLight = new THREE.PointLight(0xf184cd, 110, 70, 1.4); pinkLight.position.set(-19, 7, -46);
  const lights = [key, fill, warmLight, pinkLight];
  let disposed = false;
  const setPalette = (p: ThreeObservatoryPalette) => {
    const light = p.fog.r * .2126 + p.fog.g * .7152 + p.fog.b * .0722 > .45;
    day.value = light ? 1 : 0;
    fogColor.value.set(light ? 0xa1a0bb : 0x292740).convertLinearToSRGB();
    key.intensity = light ? 3.3 : 2.3; fill.intensity = light ? 2.2 : 1.6;
    paper.color.set(light ? 0xffe0b8 : 0xffc38f);
  };
  const setQuality = (q: ObservatoryQualityProfile) => {
    lowTier = q.tier === "low";
    fishGroups.forEach(f => { f.body.count = f.tail.count = lowTier ? 16 : 32; });
    const reflectionSize = lowTier ? 384 : 768;
    if (water.getRenderTarget().width !== reflectionSize) water.getRenderTarget().setSize(reflectionSize, reflectionSize);
    petalGeometry.setDrawRange(0, lowTier ? 180 : 360);
  };
  setPalette(palette); setQuality(quality);
  return {
    group, lights, ready: Promise.resolve(),
    get environmentStatus() { return disposed ? "disposed" : "ready"; },
    update(state, elapsedSeconds) {
      if (disposed) return;
      time.value = elapsedSeconds; waterMaterial.uniforms.uTime.value = elapsedSeconds; waterMaterial.uniforms.uDay.value = day.value;
      const cameraZ = 29 - state.routeProgress * 390;
      districts.forEach(d => { d.visible = d.position.z < cameraZ + 88 && d.position.z > cameraZ - 230; });
      const index = Math.min(5, Math.floor(state.absoluteProgress));
      const next = Math.min(5, index + 1), mix = state.absoluteProgress - index;
      const x = THREE.MathUtils.lerp(TSUKUYOMI_LANDMARKS[index][0], TSUKUYOMI_LANDMARKS[next][0], mix);
      const z = THREE.MathUtils.lerp(TSUKUYOMI_LANDMARKS[index][2], TSUKUYOMI_LANDMARKS[next][2], mix);
      warmLight.position.set(x, 9, z + 8); pinkLight.position.set(-x, 7, z - 22);
      fishGroups.forEach((f, color) => {
        for (let i = 0; i < f.body.count; i++) {
          const seed = fishSeeds[color * 48 + i], a = elapsedSeconds * seed.speed + seed.phase;
          dummy.position.set(Math.sin(a) * 24, seed.height + Math.sin(a * 1.7) * 2, seed.z + Math.cos(a) * 10);
          dummy.rotation.set(0, Math.atan2(Math.sin(a) * 10, Math.cos(a) * 24), Math.sin(a * 2) * .1);
          dummy.scale.setScalar(seed.scale); dummy.updateMatrix(); f.body.setMatrixAt(i, dummy.matrix);
          dummy.rotation.y += Math.sin(elapsedSeconds * 1.7 + seed.phase) * .16; dummy.updateMatrix(); f.tail.setMatrixAt(i, dummy.matrix);
        }
        f.body.instanceMatrix.needsUpdate = f.tail.instanceMatrix.needsUpdate = true;
      });
    }, setPalette, setQuality,
    dispose() {
      if (disposed) return; disposed = true;
      group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      water.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      group.clear(); lights.forEach(l => l.dispose());
    },
  };
}
