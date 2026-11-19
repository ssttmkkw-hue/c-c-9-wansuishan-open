import * as THREE from 'three';
import { Puppet, type Drive, type Gesture } from '../puppet/Puppet';
import { WALK_LOOP, LOTS, localToWorld, type LotDef } from '../park/layout';
import { resolve, type Aabb, type Ellipse } from '../park/collide';
import { wrapAngle } from '../util';

const ROBES = [0x8c3b3b, 0x2f5d50, 0x3d4f7c, 0xc4893d, 0x6d4a6a, 0x3f6b3a, 0xa35b3a, 0x245c62, 0x7a3e4a, 0x4a5568, 0x8a4a2a, 0x35586a];

interface Guest {
  puppet: Puppet;
  x: number;
  z: number;
  yaw: number;
  mode: 'walk' | 'watch' | 'vendor';
  pathI: number;
  lotId: string | null;
  slot: number;
  timer: number;
  burst: number;
  look: THREE.Vector3 | null;
}

interface Slot {
  lot: LotDef;
  x: number;
  z: number;
  taken: boolean;
}

const SHOW_LOTS = ['stage', 'tea', 'market'];

export class Crowd {
  private readonly guests: Guest[] = [];
  private readonly slots: Slot[] = [];
  private readonly boxes: Aabb[];
  private readonly ellipses: Ellipse[];
  private readonly focus = new Map<string, THREE.Vector3>();

  constructor(scene: THREE.Scene, boxes: Aabb[], ellipses: Ellipse[]) {
    this.boxes = boxes;
    this.ellipses = ellipses;
    for (const id of SHOW_LOTS) {
      const lot = LOTS.find((l) => l.id === id)!;
      let s = 0;
      for (const lz of [3.5, 4.7]) {
        for (const lx of [-1.7, -0.55, 0.55, 1.7]) {
          const p = localToWorld(lot, lx, lz);
          this.slots.push({ lot, x: p.x, z: p.z, taken: false });
          s++;
        }
      }
      this.focus.set(id, new THREE.Vector3(lot.x, 1.4, lot.z));
    }

    const vendors: [number, number, number][] = [
      [-8.2, 22, 0],
      [-8.2, 16, Math.PI],
      [10.5, 19, Math.PI],
    ];
    vendors.forEach((v, i) => {
      this.guests.push(this.make(scene, v[0], v[1], v[2], 'vendor', i));
    });

    for (let i = 0; i < 12; i++) {
      const along = (i / 12) * WALK_LOOP.length;
      const idx = Math.floor(along) % WALK_LOOP.length;
      const p = WALK_LOOP[idx];
      const g = this.make(scene, p[0], p[1], 0, 'walk', i + 3);
      g.pathI = (idx + 1) % WALK_LOOP.length;
      this.guests.push(g);
    }

    // A few guests already gathered, so a show is never playing to empty ground.
    for (const id of SHOW_LOTS) {
      this.takeSlot(this.guests.find((g) => g.mode === 'walk' && !g.lotId)!, id);
      this.takeSlot(this.guests.find((g) => g.mode === 'walk' && !g.lotId)!, id);
    }
  }

  setFocus(lotId: string, point: THREE.Vector3) {
    const f = this.focus.get(lotId);
    if (f) f.copy(point);
  }

  react(lotId: string, _kind: string) {
    for (const g of this.guests) {
      if (g.lotId === lotId && g.mode === 'watch') g.burst = 1.6;
    }
  }

  update(dt: number, player: THREE.Vector3, showsHot: Map<string, boolean>) {
    for (const g of this.guests) {
      if (g.mode === 'walk' && Math.random() < dt * 0.12) {
        const lot = this.nearestShow(g.x, g.z, 9);
        if (lot && showsHot.get(lot.id) !== false) this.takeSlot(g, lot.id);
      }
      if (g.mode === 'watch') {
        g.timer -= dt;
        if (g.timer <= 0) this.release(g);
      }
    }

    for (const g of this.guests) {
      let vx = 0;
      let vz = 0;
      let gesture: Gesture = 'idle';
      let look: THREE.Vector3 | null = null;
      if (g.mode === 'walk') {
        const wp = WALK_LOOP[g.pathI];
        const dx = wp[0] - g.x;
        const dz = wp[1] - g.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.7) g.pathI = (g.pathI + 1) % WALK_LOOP.length;
        else {
          vx = (dx / dist) * 1.25;
          vz = (dz / dist) * 1.25;
        }
      } else if (g.mode === 'watch' && g.slot >= 0) {
        const slot = this.slots[g.slot];
        const dx = slot.x - g.x;
        const dz = slot.z - g.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.35) {
          vx = (dx / dist) * 1.35;
          vz = (dz / dist) * 1.35;
        } else {
          look = this.focus.get(slot.lot.id) ?? null;
          gesture = g.burst > 0 ? 'clap' : 'listen';
          g.burst = Math.max(0, g.burst - dt);
          const face = look ?? new THREE.Vector3(slot.lot.x, 1, slot.lot.z);
          const desired = Math.atan2(face.x - g.x, face.z - g.z);
          g.yaw += wrapAngle(desired - g.yaw) * Math.min(1, dt * 5);
        }
      } else if (g.mode === 'vendor') {
        gesture = Math.sin(g.puppet.seed + performance.now() / 900) > 0.2 ? 'talk' : 'idle';
        const dx = player.x - g.x;
        const dz = player.z - g.z;
        if (dx * dx + dz * dz < 36) {
          look = new THREE.Vector3(player.x, 1.4, player.z);
          const desired = Math.atan2(dx, dz);
          g.yaw += wrapAngle(desired - g.yaw) * Math.min(1, dt * 3);
        }
      }

      const sep = this.separate(g, player);
      vx += sep.x;
      vz += sep.z;
      g.x += vx * dt;
      g.z += vz * dt;
      const resolved = resolve(g.x, g.z, 0.32, this.boxes, this.ellipses);
      g.x = resolved.x;
      g.z = resolved.z;
      const speed = Math.hypot(vx, vz);
      if (speed > 0.25 && g.mode !== 'vendor') {
        const desired = Math.atan2(vx, vz);
        g.yaw += wrapAngle(desired - g.yaw) * Math.min(1, dt * 6);
      }
      g.puppet.group.position.set(g.x, 0, g.z);
      g.puppet.group.rotation.y = g.yaw;
      const drive: Drive = {
        speed: g.mode === 'vendor' ? 0 : speed,
        gesture,
        emotion: gesture === 'listen' || gesture === 'clap' ? 'listen' : 'neutral',
        speaking: gesture === 'talk' ? 0.4 : 0,
        lookAt: look,
        prop: 'none',
      };
      g.puppet.update(dt, drive);
    }
  }

  private make(scene: THREE.Scene, x: number, z: number, yaw: number, mode: Guest['mode'], i: number): Guest {
    const puppet = new Puppet({
      robe: ROBES[i % ROBES.length],
      pants: 0x2c3138,
      hair: i % 2 === 0 ? 0x24180f : 0x3a2a22,
      hat: i % 5 === 0 ? 'cap' : 'none',
      scale: 0.94 + (i % 4) * 0.02,
      seed: i * 1.7,
    });
    puppet.group.position.set(x, 0, z);
    puppet.group.rotation.y = yaw;
    scene.add(puppet.group);
    return {
      puppet,
      x,
      z,
      yaw,
      mode,
      pathI: 0,
      lotId: null,
      slot: -1,
      timer: 0,
      burst: 0,
      look: null,
    };
  }

  private nearestShow(x: number, z: number, max: number) {
    let best: LotDef | null = null;
    let bestD = max;
    for (const id of SHOW_LOTS) {
      const lot = LOTS.find((l) => l.id === id)!;
      const d = Math.hypot(lot.x - x, lot.z - z);
      if (d < bestD) {
        bestD = d;
        best = lot;
      }
    }
    return best;
  }

  private takeSlot(g: Guest, lotId: string) {
    const slot = this.slots.findIndex((s) => s.lot.id === lotId && !s.taken);
    if (slot < 0) return;
    if (g.slot >= 0) this.slots[g.slot].taken = false;
    this.slots[slot].taken = true;
    g.slot = slot;
    g.lotId = lotId;
    g.mode = 'watch';
    g.timer = 18 + Math.random() * 16;
  }

  private release(g: Guest) {
    if (g.slot >= 0) this.slots[g.slot].taken = false;
    g.slot = -1;
    g.lotId = null;
    g.mode = 'walk';
    // Resume from the closest waypoint without popping.
    let best = 0;
    let bestD = Infinity;
    WALK_LOOP.forEach((p, i) => {
      const d = (p[0] - g.x) ** 2 + (p[1] - g.z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    g.pathI = best;
  }

  private separate(g: Guest, player: THREE.Vector3) {
    let x = 0;
    let z = 0;
    const push = (ox: number, oz: number) => {
      const dx = g.x - ox;
      const dz = g.z - oz;
      const d2 = dx * dx + dz * dz;
      if (d2 > 0.0001 && d2 < 0.85) {
        const d = Math.sqrt(d2);
        const s = (0.92 - d) / d;
        x += dx * s;
        z += dz * s;
      }
    };
    for (const o of this.guests) {
      if (o !== g) push(o.x, o.z);
    }
    push(player.x, player.z);
    return { x: x * 1.6, z: z * 1.6 };
  }
}
