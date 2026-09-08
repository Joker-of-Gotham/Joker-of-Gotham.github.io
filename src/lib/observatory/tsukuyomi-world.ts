import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createFishTail, createLuminousFish, createToriiLintel, createTsukuyomiRoof, roofHeight } from "./tsukuyomi-geometry";
import { createSeededRandom } from "./random";
import { sampleObservatoryCameraRoute } from "./camera-director";
import { createCityAtmosphere } from "./city-atmosphere";
import type { ThreeObservatoryPalette } from "./palette";
import type { ProceduralObservatoryWorld } from "./procedural-world";
import type { ObservatoryQualityProfile } from "./types";

export const TSUKUYOMI_LANDMARKS = [
  [10, 9, -26], [30, 8, -88], [5, 4, -158],
  [31, 15, -238], [-30, 8, -312], [12, 9, -404],
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
  group.userData = { worldVersion: 12, sceneId: "tsukuyomi-water-city-v12", world: "月読 · Lanterns on the water",
    gateFoundations: [] as { center: number[]; radius: number }[],
    fixedWorldCoordinates: true, sceneLifetime: "persistent", livePlateDependency: false, coordinateSpan: 459,
    visualSource: "original-realtime-tsukuyomi-fan-interpretation" };
  const random = createSeededRandom(0x5453554b);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  const time = { value: 0 }, day = { value: 0 }, fogColor = { value: new THREE.Color(0x292740).convertLinearToSRGB() };
  const weatherCloud = { value: 0 }, distantLightning = { value: 0 };
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
    const isWindow = mat === paper;
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
          ${isWindow ? "float room=hash(floor(vCityPosition.xz*.27)+floor(vCityPosition.y*.22)); diffuseColor.rgb*=.55+.45*smoothstep(.08,.4,room); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.,.7,.79),step(.78,room)*.3);" : ""}
        `)
        .replace("#include <fog_fragment>", `
          float dist=length(vCityPosition-cameraPosition);
          float low=exp(-max(0.,vCityPosition.y)*.17);
          float mist=1.-exp(-dist*(.0018+low*.0018));
          gl_FragColor.rgb=mix(gl_FragColor.rgb,uCityFog,clamp(mist,0.,.97));
        `);
    };
    mat.customProgramCacheKey = () => `tsukuyomi-surface-${isRoof ? "tile" : isWindow ? "window" : "wood"}`;
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
    // Solid plinth reaches below the canal surface; no floating footprints.
    box(b, w + 2, 3.2, d + 2, stone, 0, -1.3, 0);
    box(b, w + 2.8, .22, d + 2.8, trim, 0, .3, 0);
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
      add(gate, new THREE.CylinderGeometry(1.05, 1.35, 2.8, 16), stone, side * 7.65, -.8, 0);
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
    for (const side of [-1, 1]) {
      group.userData.gateFoundations.push({ center: [x + side * 7.65 * scale, .3 - .8 * scale, z + parent.position.z], radius: 1.35 * scale });
    }
    gates.push(gate); return gate;
  };

  const districts: THREE.Group[] = [];
  for (let section = 0; section < 6; section++) {
    const district = new THREE.Group(); district.position.z = -section * 72; district.name = `TsukuyomiDistrict${section}`;
    district.userData.chapter = section; districts.push(district); group.add(district);
    for (const side of [-1, 1]) {
      box(district, 22, 2.6, section === 5 ? 160 : 74, stone, side * 36, -1.35, section === 5 ? -83 : -40);
      box(district, 12, .5, section === 5 ? 160 : 74, timber, side * 21.5, .35, section === 5 ? -83 : -40);
      box(district, .18, .18, 72, lacquer, side * 15.65, 1.8, -40);
      box(district, .12, .12, 72, lacquer, side * 15.65, 1.15, -40);
      for (let post = 0; post < 14; post++) {
        const z = -5 - post * 5.2;
        box(district, .23, 1.6, .23, lacquer, side * 15.65, 1.1, z);
        if (post % 2 === 0) {
          box(district, .25, 4.4, .25, timber, side * 17, 2.5, z);
          box(district, 1.6, .17, .2, timber, side * 16.5, 4.7, z);
          lamp(district, side * 15.8, 3.95, z, .65);
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
  torii(districts[0], 0, -25, 1.18);
  building(districts[0], 36, -75, 17, 14, 5, .12);
  torii(districts[5], 0, -40, 1.05);
  building(districts[3], 36, -24, 19, 16, 5, -.14);
  building(districts[4], -34, -26, 16, 14, 2, .25);
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    building(districts[5], side * (35 + i % 2 * 14), -87 - i * 23, 13, 12, 2 + i % 3, side * .1, false);
  }

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
        const x = -24 + i * 3; return new THREE.Vector3(x, 26 + (x / 24) ** 2 * 4, z);
      });
      curveTube(d, points, .035, timber);
      for (let i = 0; i < 13; i++) { const x = -23 + i / 12 * 46; lamp(d, x, 25.35 + (x / 24) ** 2 * 4, z, .5); }
    }
  });

  // Sewn canvas, exposed joinery, ceramic vessels and trays replace box-like stalls.
  const marketCanvas = standard(0xffffff, .98); marketCanvas.vertexColors = true;
  const canvasColors = [new THREE.Color(0xb66f82), new THREE.Color(0xe1c5a2)];
  const tintCanvas = (geometry: THREE.BufferGeometry, color: THREE.Color) => {
    const count = geometry.getAttribute("position").count, colors = new Float32Array(count * 3);
    for(let i=0;i<count;i++) color.toArray(colors,i*3);
    geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  };
  for (const cloth of [marketCanvas]) {
    cloth.side = THREE.DoubleSide;
    cloth.onBeforeCompile = shader => {
      shader.uniforms.uMarketTime = time;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uMarketTime;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += sin(uMarketTime*.9+position.x*2.+position.z)*.035;');
    };
    cloth.customProgramCacheKey = () => 'market-fabric';
  }
  districts.forEach((district) => {
    for (let stall = 0; stall < 6; stall++) {
      const x = (stall % 2 ? -1 : 1) * 23.5, z = -9 - stall * 10;
      if (Math.min(Math.abs(district.position.z + z + 161), Math.abs(district.position.z + z + 349)) < 18) continue;
      for (const dx of [-1.7, 1.7]) for (const dz of [-.95,.95]) {
        box(district,.12,3.05,.12,timber,x+dx,2.125,z+dz);
        box(district,.2,.12,.22,brass,x+dx,3.38,z+dz);
      }
      box(district,3.7,.16,2.1,timber,x,1.45,z);
      box(district,3.65,.14,.14,timber,x,3.5,z-.95);
      for (let slat=0;slat<12;slat++) box(district,.26,.73,.08,timber,x-1.62+slat*.295,1,z+1.01);
      for (let stripe=0;stripe<8;stripe++) {
        const cloth = marketCanvas, tint = canvasColors[stripe%2];
        const canopy = new THREE.PlaneGeometry(.55,2.8,2,10).rotateX(-Math.PI/2);
        const vertices = canopy.getAttribute('position');
        for(let v=0;v<vertices.count;v++) {
          const depth = vertices.getZ(v);
          vertices.setY(v,3.8-(depth+1.4)*.16-Math.sin((depth+1.4)/2.8*Math.PI)*.12);
        }
        canopy.computeVertexNormals(); tintCanvas(canopy,tint);
        add(district,canopy,cloth,x-1.925+stripe*.55,0,z);
        const valance = new THREE.PlaneGeometry(.55,.35,4,1);
        const edge = valance.getAttribute('position');
        for(let v=0;v<edge.count;v++) if(edge.getY(v)<0) edge.setY(v,edge.getY(v)-.1*Math.cos(edge.getX(v)/.55*Math.PI));
        valance.computeVertexNormals(); tintCanvas(valance,tint); add(district,valance,cloth,x-1.925+stripe*.55,3.18,z+1.4);
      }
      for(let tray=0;tray<3;tray++) {
        const tx=x-1.15+tray*1.12;
        box(district,.96,.08,.7,brass,tx,1.58,z+.35);
        if(stall%2===0) {
          for(let item=0;item<6;item++) add(district,new THREE.SphereGeometry(.14,8,6),item%2?plaster:brass,tx-.27+item%3*.27,1.75,z+.18+Math.floor(item/3)*.28);
        } else {
          const profile=[new THREE.Vector2(.13,0),new THREE.Vector2(.24,.09),new THREE.Vector2(.26,.32),new THREE.Vector2(.17,.44),new THREE.Vector2(.15,.5)];
          add(district,new THREE.LatheGeometry(profile,12),tray%2?plaster:trim,tx,1.62,z+.25);
          add(district,new THREE.TorusGeometry(.16,.025,4,12),brass,tx,2.12,z+.25,Math.PI/2);
        }
      }
      box(district,1.25,.6,.8,timber,x+1.05,.9,z-.5);
      for(let line=0;line<4;line++) box(district,1.3,.05,.84,brass,x+1.05,.66+line*.16,z-.5);
      lamp(district,x-1.4,2.78,z+.85,.55); lamp(district,x+1.4,2.78,z+.85,.55);
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
    uniforms: { uCityFog: fogColor, uTime: time },
    vertexShader: `uniform float uTime;attribute vec3 color;attribute float aSize;varying vec3 vColor;varying float vFog;
      void main(){vec3 p=position;p.x+=sin(uTime*.65+p.z*.15)*.16;p.z+=cos(uTime*.4+p.x*.3)*.1;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
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
  const buildingBounds: { min: number[]; max: number[] }[] = [];
  group.traverse(object => {
    if (object.name !== "LayeredPagoda" && object.name !== "LanternTownhouse") return;
    const bounds = new THREE.Box3().setFromObject(object);
    buildingBounds.push({ min: bounds.min.toArray(), max: bounds.max.toArray() });
  });
  group.userData.buildingBounds = buildingBounds;
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

  // Small inhabited details stay out of the camera corridor. Instancing keeps
  // the moving population inexpensive; lantern boats carry visible warm light.
  const boats: THREE.Group[] = [];
  for (let i = 0; i < 12; i++) {
    const boat = new THREE.Group(); boat.name = "LanternBoat";
    box(boat, 1.8, .24, 3.8, timber);
    for (const side of [-1, 1]) box(boat, .13, .35, 3.8, lacquer, side * .87, .2);
    box(boat, .1, 2.5, .1, timber, 0, 1.2, -.5);
    lamp(boat, 0, 2.1, -.5, .62);
    boat.position.set((i % 2 ? -1 : 1) * (13 + i % 3 * 2), -.65, -12 - i * 35);
    // Merge each boat into two draws, preserving its independent bobbing.
    boat.updateMatrixWorld(true);
    const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const inverseBoat = boat.matrixWorld.clone().invert();
    const shells: THREE.Mesh[] = [];
    boat.traverse(o => {
      if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
      const g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseBoat, o.matrixWorld));
      const m = o.material === lanternPaper ? lanternPaper : timber;
      const list = parts.get(m) ?? []; list.push(g); parts.set(m, list); shells.push(o);
    });
    shells.forEach(o => { o.removeFromParent(); geometries.delete(o.geometry); o.geometry.dispose(); });
    parts.forEach((list, material) => {
      const merged = mergeGeometries(list, false); list.forEach(g => g.dispose());
      if (merged) add(boat, merged, material);
    });
    boats.push(boat); group.add(boat);
  }
  const boatInstances = [timber, lanternPaper].map(material => {
    const sources = boats.flatMap(boat => boat.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh && o.material === material));
    const instances = new THREE.InstancedMesh(sources[0].geometry, material, boats.length);
    instances.frustumCulled = false;
    sources.forEach((mesh, i) => {
      mesh.removeFromParent();
      if (i > 0) { geometries.delete(mesh.geometry); mesh.geometry.dispose(); }
    });
    group.add(instances); return instances;
  });
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
    uniforms: { uTime: time, uDay: day, uCloud: weatherCloud, uLightning: distantLightning },
    vertexShader: `varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: /* glsl */ `varying vec3 vDirection;uniform float uTime,uDay,uCloud,uLightning;${noise}
      void main(){vec3 d=normalize(vDirection); float h=smoothstep(-.1,.8,d.y);
        vec3 c=mix(mix(vec3(.058,.041,.082),vec3(.96,.80,.73),uDay),mix(vec3(.012,.009,.022),vec3(.48,.76,.79),uDay),h);
        float a=atan(d.z,d.x);
        float cloud=sin(a*3.2+sin(d.y*8.)*.7+uTime*.003)*sin(d.y*12.+sin(a*2.3)*.8);
        cloud+=sin(a*8.1-d.y*16.+sin(a*3.9+d.y*18.))*.22;
        vec2 flow=vec2(a*2.6,d.y*5.)+vec2(uTime*.012,uTime*.002);
        float billow=noise(flow)*.57+noise(flow*2.1)*.28+noise(flow*4.3)*.15;
        float cover=smoothstep(.30,.68,billow)*smoothstep(.01,.14,d.y)*(1.-smoothstep(.55,.82,d.y));
        c=mix(c,mix(vec3(.16,.13,.20),vec3(.70,.73,.75),uDay),cover*(.65+uCloud*.3));
        c+=uLightning*cover*vec3(.55,.47,.7);
        float ribbon=exp(-pow((d.y-.38-.035*sin(a*4.+uTime*.035))/.035,2.));
        c+=vec3(.035,.02,.05)*ribbon*(1.-uDay)*(.5+.5*sin(a*2.));
        vec3 moon=normalize(vec3(.42,.22,-.88)); float md=length(d-moon);
        float disc=1.-smoothstep(.055,.0565,md);
        float craters=(sin(d.x*140.+sin(d.y*165.)*1.5)*sin(d.y*170.)*.5+.5)*.025;
        craters+=(sin(d.x*54.+d.y*90.)*.5+.5)*.03;
        c+=vec3(.13,.13,.2)*exp(-md*17.)*(1.-uDay*.4);
        c=mix(c,vec3(.91,.87,.89)-craters,disc*(1.-cover*.65));
        vec2 st=vec2(a*105.,asin(d.y)*105.);float star=step(.994,hash(floor(st)))*(1.-smoothstep(.015,.09,length(fract(st)-.5)));
        c+=star*smoothstep(.12,.45,d.y)*.5*(1.-uDay);
        c+=(hash(gl_FragCoord.xy)-.5)/255.;gl_FragColor=vec4(c,1.);
      }`,
  });
  materials.add(skyMaterial);
  const sky = add(group, new THREE.SphereGeometry(780, 32, 24), skyMaterial, 0, 0, -200); sky.renderOrder = -10; sky.frustumCulled = false;

  // Actual planar reflection, intentionally softly rippled rather than a second decorative image.
  const waterGeometry = new THREE.PlaneGeometry(6800, 6800); geometries.add(waterGeometry);
  const water = new Reflector(waterGeometry, { textureWidth: quality.tier === "low" ? 384 : 768,
    textureHeight: quality.tier === "low" ? 384 : 768, clipBias: .003, multisample: 0,
    shader: {
      name: "TsukuyomiCanal", uniforms: { color: { value: new THREE.Color(0x172437) }, tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() }, uTime: time, uDay: day, uRain: {value: 0} },
      vertexShader: `uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vWorld;
        void main(){vUv=textureMatrix*vec4(position,1.); vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime;uniform float uDay;uniform float uRain;varying vec4 vUv;varying vec3 vWorld;
        void main(){vec2 uv=vUv.xy/vUv.w;
          float wave=sin(vWorld.z*1.8+uTime*.65+sin(vWorld.x*.7))* .0008;
          uv.x+=wave+sin(vWorld.z*4.-uTime*.4)*.0003;
          vec3 reflected=texture2D(tDiffuse,uv).rgb;
          float fresnel=.53+.18*clamp(length(vWorld-cameraPosition)/90.,0.,1.);
          vec3 base=mix(vec3(.008,.005,.016),vec3(.09,.23,.22),uDay);
          gl_FragColor=vec4(mix(base,reflected,fresnel),1.);
          vec2 cell=floor(vWorld.xz*.8), drop=fract(vWorld.xz*.8)-.5;
          float phase=fract(uTime*.85+fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453));
          float ring=exp(-pow((length(drop)-phase*.48)*55.,2.))*(1.-phase);
          gl_FragColor.rgb+=ring*uRain*vec3(.13,.10,.15)*exp(-length(vWorld-cameraPosition)*.012);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          vec3 horizon=mix(vec3(.057,.040,.080),vec3(.943,.799,.732),uDay);
          gl_FragColor.rgb=mix(gl_FragColor.rgb,horizon,smoothstep(160.,700.,length(vWorld-cameraPosition)));
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
            gl_FragColor.a*=smoothstep(6.,18.,vFogDepth);
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

  const atmosphere = createCityAtmosphere(quality.tier === "low"); group.add(atmosphere.group);
  const key = new THREE.DirectionalLight(0xaaaee9, 2.3); key.position.set(-30, 65, 10);
  const fill = new THREE.HemisphereLight(0x7589c6, 0x4c2337, 1.6);
  const warmLight = new THREE.PointLight(0xffac77, 160, 70, 1.4); warmLight.position.set(8, 9, -19);
  const pinkLight = new THREE.PointLight(0xf184cd, 110, 70, 1.4); pinkLight.position.set(-19, 7, -46);
  const lights = [key, fill, warmLight, pinkLight];
  let disposed = false;
  const setPalette = (p: ThreeObservatoryPalette) => {
    const light = p.fog.r * .2126 + p.fog.g * .7152 + p.fog.b * .0722 > .45;
    day.value = light ? 1 : 0;
    fogColor.value.set(light ? 0xb3c6c2 : 0x100c19).convertLinearToSRGB();
    key.color.set(light ? 0xffd5ae : 0xb4a5dc);
    fill.color.set(light ? 0xc7ede3 : 0x66567f);
    key.intensity = light ? 3.0 : .85; fill.intensity = light ? 2.5 : .48;
    paper.color.set(light ? 0xf2ca99 : 0xdca56c);
    plaster.color.set(light ? 0xe8baac : 0xc18f95);
    roof.color.set(light ? 0x427778 : 0x252132);
    trim.color.set(light ? 0x739e8f : 0x827688);
  };
  const setQuality = (q: ObservatoryQualityProfile) => {
    lowTier = q.tier === "low";
    atmosphere.setQuality(lowTier);
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
      const cameraPosition = sampleObservatoryCameraRoute(state.routeProgress).position;
      sky.position.set(...cameraPosition);
      const cameraZ = cameraPosition[2];
      const weather = atmosphere.update(elapsedSeconds, state.absoluteProgress, day.value, cameraZ);
      weatherCloud.value = weather.rain; distantLightning.value = weather.lightning;
      waterMaterial.uniforms.uRain.value = weather.rain;
      group.userData.weather = weather;
      key.intensity = (day.value ? 3 : .85) * (1 - weather.rain * .35) + weather.lightning;
      warmLight.intensity = 160 * (1 + Math.sin(elapsedSeconds * 1.3) * .025);
      districts.forEach(d => { d.visible = d.position.z < cameraZ + 88 && d.position.z > cameraZ - 230; });
      const index = Math.min(5, Math.floor(state.absoluteProgress));
      const next = Math.min(5, index + 1), mix = state.absoluteProgress - index;
      const x = THREE.MathUtils.lerp(TSUKUYOMI_LANDMARKS[index][0], TSUKUYOMI_LANDMARKS[next][0], mix);
      const z = THREE.MathUtils.lerp(TSUKUYOMI_LANDMARKS[index][2], TSUKUYOMI_LANDMARKS[next][2], mix);
      warmLight.position.set(x, 9, z + 8); pinkLight.position.set(-x, 7, z - 22);
      boats.forEach((boat, i) => {
        boat.position.y = -.65 + Math.sin(elapsedSeconds * .8 + i) * .075;
        boat.position.z = 18 - ((i * 35 + elapsedSeconds * (i % 2 ? .8 : -.65) + 460) % 460);
        boat.rotation.z = Math.sin(elapsedSeconds * .6 + i) * .035;
        boat.rotation.y = Math.sin(elapsedSeconds * .1 + i) * .12;
        boat.updateMatrix(); boatInstances.forEach(mesh => mesh.setMatrixAt(i, boat.matrix));
      });
      boatInstances.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
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
      atmosphere.dispose();
      group.clear(); lights.forEach(l => l.dispose());
    },
  };
}
