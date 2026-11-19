export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Ellipse {
  x: number;
  z: number;
  rx: number;
  rz: number;
}

export function resolve(x: number, z: number, radius: number, boxes: Aabb[], ellipses: Ellipse[]) {
  let px = x;
  let pz = z;
  for (let iter = 0; iter < 3; iter++) {
    for (const b of boxes) {
      const minX = b.minX - radius;
      const maxX = b.maxX + radius;
      const minZ = b.minZ - radius;
      const maxZ = b.maxZ + radius;
      if (px > minX && px < maxX && pz > minZ && pz < maxZ) {
        const dl = px - minX;
        const dr = maxX - px;
        const dt = pz - minZ;
        const db = maxZ - pz;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) px = minX;
        else if (m === dr) px = maxX;
        else if (m === dt) pz = minZ;
        else pz = maxZ;
      }
    }
    for (const e of ellipses) {
      const dx = (px - e.x) / e.rx;
      const dz = (pz - e.z) / e.rz;
      const d2 = dx * dx + dz * dz;
      if (d2 < 1) {
        const d = Math.sqrt(d2) || 0.0001;
        px = e.x + (dx / d) * e.rx;
        pz = e.z + (dz / d) * e.rz;
      }
    }
  }
  return { x: px, z: pz };
}
