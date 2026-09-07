import * as THREE from "three";

export type SeleneGeometryDetail = 1 | 2 | 3;

interface InstanceRecord {
  matrix: THREE.Matrix4;
  detail: SeleneGeometryDetail;
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Batches repeated architectural members into one draw call while preserving a
 * deterministic detail ladder. Records are sorted once during construction;
 * quality changes only alter InstancedMesh.count and never allocate geometry.
 */
export class SeleneInstanceBatch {
  private readonly records: InstanceRecord[] = [];
  private readonly position = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private readonly quaternion = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly direction = new THREE.Vector3();
  private readonly midpoint = new THREE.Vector3();
  private mesh: THREE.InstancedMesh | null = null;
  private counts: readonly [number, number, number] = [0, 0, 0];

  constructor(
    readonly name: string,
    readonly geometry: THREE.BufferGeometry,
    readonly material: THREE.Material,
  ) {}

  addBox(
    position: readonly [number, number, number],
    size: readonly [number, number, number],
    rotation: readonly [number, number, number] = [0, 0, 0],
    detail: SeleneGeometryDetail = 1,
  ) {
    this.position.set(...position);
    this.scale.set(...size);
    this.euler.set(...rotation);
    this.quaternion.setFromEuler(this.euler);
    this.records.push({
      matrix: new THREE.Matrix4().compose(
        this.position,
        this.quaternion,
        this.scale,
      ),
      detail,
    });
    return this;
  }

  addBeam(
    start: readonly [number, number, number],
    end: readonly [number, number, number],
    thickness: number | readonly [number, number],
    detail: SeleneGeometryDetail = 1,
  ) {
    this.position.set(...start);
    this.direction.set(...end).sub(this.position);
    const length = Math.max(0.001, this.direction.length());
    this.midpoint.copy(this.position).addScaledVector(this.direction, 0.5);
    this.quaternion.setFromUnitVectors(UP, this.direction.normalize());
    const width = typeof thickness === "number" ? thickness : thickness[0];
    const depth = typeof thickness === "number" ? thickness : thickness[1];
    this.scale.set(width, length, depth);
    this.records.push({
      matrix: new THREE.Matrix4().compose(
        this.midpoint,
        this.quaternion,
        this.scale,
      ),
      detail,
    });
    return this;
  }

  build(initialDetail: 0 | SeleneGeometryDetail) {
    if (this.mesh) return this.mesh;
    this.records.sort((a, b) => a.detail - b.detail);
    const capacity = Math.max(1, this.records.length);
    const mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      capacity,
    );
    mesh.name = this.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.records.forEach((record, index) =>
      mesh.setMatrixAt(index, record.matrix),
    );
    mesh.instanceMatrix.needsUpdate = true;
    const detailOne = this.records.filter(
      (record) => record.detail <= 1,
    ).length;
    const detailTwo = this.records.filter(
      (record) => record.detail <= 2,
    ).length;
    this.counts = [detailOne, detailTwo, this.records.length];
    mesh.userData = {
      role: "batched-modular-architecture",
      detailCounts: [...this.counts],
      deterministic: true,
    };
    this.mesh = mesh;
    this.applyDetail(initialDetail);
    return mesh;
  }

  applyDetail(detail: 0 | SeleneGeometryDetail) {
    if (!this.mesh) return;
    this.mesh.count = detail === 0 ? 0 : this.counts[detail - 1];
  }
}

/** Unit parabolic reflector opening toward +Y. */
export function createParabolicDishGeometry(
  radialSegments = 32,
  rings = 9,
  depth = 0.32,
) {
  const radial = Math.max(12, Math.floor(radialSegments));
  const ringCount = Math.max(4, Math.floor(rings));
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring <= ringCount; ring += 1) {
    const radius = ring / ringCount;
    for (let segment = 0; segment <= radial; segment += 1) {
      const angle = (segment / radial) * Math.PI * 2;
      vertices.push(
        Math.cos(angle) * radius,
        depth * radius * radius,
        Math.sin(angle) * radius,
      );
      uvs.push(segment / radial, radius);
    }
  }

  const stride = radial + 1;
  for (let ring = 0; ring < ringCount; ring += 1) {
    for (let segment = 0; segment < radial; segment += 1) {
      const a = ring * stride + segment;
      const b = (ring + 1) * stride + segment;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.name = "SeleneParabolicReflectorGeometry";
  return geometry;
}

export function createEllipticalDomeGeometry(
  radialSegments = 36,
  heightSegments = 12,
) {
  const geometry = new THREE.SphereGeometry(
    1,
    Math.max(16, radialSegments),
    Math.max(8, heightSegments),
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5,
  );
  geometry.name = "SeleneEllipticalDomeGeometry";
  return geometry;
}

/**
 * Shared unit envelope with a restrained upward taper and lateral cant. It
 * preserves BoxGeometry UVs, so the same PBR trim/material can cover every
 * district without bespoke assets or additional material slots.
 */
export function createTaperedModuleGeometry(inset = 0.12, cant = 0.08) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const progress = y + 0.5;
    const taperX = 1 - inset * progress;
    const taperZ = 1 - inset * 0.42 * progress;
    positions.setXYZ(
      index,
      positions.getX(index) * taperX + cant * progress,
      y,
      positions.getZ(index) * taperZ,
    );
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name = "SeleneTaperedEnvelopeModuleGeometry";
  return geometry;
}

export function markArchitecturalMesh(
  mesh: THREE.Mesh,
  role: string,
  options: {
    castShadow?: boolean;
    receiveShadow?: boolean;
    occluder?: boolean;
  } = {},
) {
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  mesh.userData = {
    ...mesh.userData,
    role,
    fixedWorldCoordinates: true,
    physicallyConstructed: true,
    ...(options.occluder ? { transitionOccluder: true } : {}),
  };
  return mesh;
}
