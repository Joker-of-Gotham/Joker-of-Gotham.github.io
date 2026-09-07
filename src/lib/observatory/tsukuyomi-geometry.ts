import * as THREE from "three";

/** Curved hipped roof with a long ridge, lifted eaves and a solid fascia. */
export function createTsukuyomiRoof(width: number, depth: number, rise: number) {
  const nx = 16, nz = 12;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const stride = (nx + 1) * (nz + 1);
  for (let layer = 0; layer < 2; layer++) {
    for (let z = 0; z <= nz; z++) for (let x = 0; x <= nx; x++) {
      const u = x / nx * 2 - 1, v = z / nz * 2 - 1;
      positions.push(u * width / 2, roofHeight(u, v, rise) - layer * .2, v * depth / 2);
      uv.push(x / nx, z / nz);
      if (z < nz && x < nx) {
        const a = layer * stride + z * (nx + 1) + x, b = a + 1, c = a + nx + 1, d = c + 1;
        if (layer === 0) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    }
  }
  const perimeter: number[] = [];
  for (let x = 0; x < nx; x++) perimeter.push(x);
  for (let z = 0; z < nz; z++) perimeter.push(z * (nx + 1) + nx);
  for (let x = nx; x > 0; x--) perimeter.push(nz * (nx + 1) + x);
  for (let z = nz; z > 0; z--) perimeter.push(z * (nx + 1));
  perimeter.forEach((a, i) => { const b = perimeter[(i + 1) % perimeter.length]; indices.push(a, b, a + stride, b, b + stride, a + stride); });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

export function roofHeight(u: number, v: number, rise: number) {
  const t = Math.max(Math.abs(v), Math.max(0, Math.abs(u) - .34) / .66);
  const edge = Math.max(Math.abs(u), Math.abs(v));
  return rise * Math.pow(Math.max(0, 1 - t), 1.55) + Math.pow(edge, 8) * (.36 + Math.abs(u * v) * .48);
}

/** Rounded curved lintel, used for the torii's characteristic upturned silhouette. */
export function createToriiLintel(width: number, height: number, depth: number, curvature: number) {
  const shape = new THREE.Shape();
  const y = (x: number) => curvature * (x / (width / 2)) ** 4;
  shape.moveTo(-width / 2, y(-width / 2));
  for (let i = 1; i <= 32; i++) { const x = -width / 2 + i / 32 * width; shape.lineTo(x, y(x)); }
  for (let i = 32; i >= 0; i--) { const x = -width / 2 + i / 32 * width; shape.lineTo(x, y(x) + height); }
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: true, bevelSegments: 2, bevelSize: .07, bevelThickness: .07, curveSegments: 16 });
  g.translate(0, 0, -depth / 2);
  return g;
}

export function createLuminousFish() {
  const geometry = new THREE.SphereGeometry(1, 12, 8);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    position.setXYZ(i, x * 1.35, y * .42 * (1 - x * .25), z * .24);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createFishTail() {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([
    -1.1, 0, 0, -2.1, .72, 0, -1.85, 0, 0,
    -1.1, 0, 0, -1.85, 0, 0, -2.1, -.72, 0,
    -.6, .3, 0, -.05, .8, 0, .4, .3, 0,
  ], 3));
  g.computeVertexNormals();
  return g;
}
