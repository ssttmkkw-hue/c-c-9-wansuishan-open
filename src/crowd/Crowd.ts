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
  mode: 'walk' | 'watch' | 'vendor' | 'trail' | 'paradeWatch';
  pathI: number;
  lotId: string | null;
  slot: number;
  timer: number;
  burst: number;
  burstKind: 'clap' | 'raise';
  look: THREE.Vector3 | null;
  crew: boolean;
  lane: number;
  paradeIndex: number;
}

interface Slot {
  lot: LotDef;
  x: number;
  z: number;
  taken: boolean;
}

const SHOW_LOTS = ['stage', 'tea', 'market', 'shadow', 'field'];

export class Crowd {
  private readonly guests: Guest[] = [];
  private readonly slots: Slot[] = [];
  private readonly boxes: Aabb[];
  private readonly ellipses: Ellipse[];
  private readonly focus = new Map<string, THREE.Vector3>();
  private parade = { active: false, x: 0, z: 0, yaw: 0 };

  constructor(scene: THREE.Scene, boxes: Aabb[], ellipses: Ellipse[]) {
    this.boxes = boxes;
    this.ellipses = ellipses;
    for (const id of SHOW_LOTS) {
      const lot = LOTS.find((l) => l.id === id)!;
      for (const lz of [3.9, 5.45]) {
        for (const lx of [-2.35, -0.8, 0.8, 2.35]) {
          const p = localToWorld(lot, lx, lz);
          this.slots.push({ lot, x: p.x, z: p.z, taken: false });
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

    const audience: Guest[] = [];
    for (let i = 0; i < 12; i++) {
      const along = (i / 12) * WALK_LOOP.length;
      const idx = Math.floor(along) % WALK_LOOP.length;
      const p = WALK_LOOP[idx];
      const g = this.make(scene, p[0], p[1], 0, 'walk', i + 3, false);
      g.pathI = (idx + 1) % WALK_LOOP.length;
      this.guests.push(g);
      audience.push(g);
    }
    for (let i = 0; i < 5; i++) {
      const idx = (i * 2) % WALK_LOOP.length;
      const p = WALK_LOOP[idx];
      const g = this.make(scene, p[0] + 0.8, p[1], 0, 'walk', i + 20, true);
      g.pathI = (idx + 1) % WALK_LOOP.length;
      this.guests.push(g);
    }

    const plan: [string, number][] = [
      ['stage', 4],
      ['tea', 2],
      ['market', 2],
      ['shadow', 2],
      ['field', 2],
    ];
    let cursor = 0;
    for (const [id, count] of plan) {
      for (let k = 0; k < count; k++) {
        const g = audience[cursor++];
        this.takeSlot(g, id);
        this.snapSlot(g);
      }
    }
  }

  setParade(active: boolean, x: number, z: number, yaw: number) {
    this.parade.active = active;
    this.parade.x = x;
    this.parade.z = z;
    this.parade.yaw = yaw;
  }

  setFocus(lotId: string, point: THREE.Vector3) {
    const f = this.focus.get(lotId);
    if (f) f.copy(point);
  }

  react(lotId: string, kind: string) {
    const burstKind = kind === 'cheer' ? 'raise' : 'clap';
    for (const g of this.guests) {
      const atShow = g.lotId === lotId && g.mode === 'watch';
      const atParade = lotId === 'parade' && (g.mode === 'trail' || g.mode === 'paradeWatch');
      if (atShow || atParade) {
        g.burst = 1.8;
        g.burstKind = burstKind;
      }
    }
  }

  update(dt: number, player: THREE.Vector3, showsHot: Map<string, boolean>) {
    this.syncParade();
    for (const g of this.guests) {
      if (g.mode === 'walk' && !g.crew && Math.random() < dt * 0.08) {
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
        const next = WALK_LOOP[(g.pathI + 1) % WALK_LOOP.length];
        const hx = next[0] - wp[0];
        const hz = next[1] - wp[1];
        const hlen = Math.hypot(hx, hz) || 1;
        const tx = wp[0] + (-hz / hlen) * g.lane;
        const tz = wp[1] + (hx / hlen) * g.lane;
        const dx = tx - g.x;
        const dz = tz - g.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.85) g.pathI = (g.pathI + 1) % WALK_LOOP.length;
        else {
          vx = (dx / dist) * 1.25;
          vz = (dz / dist) * 1.25;
        }
      } else if (g.mode === 'trail' || g.mode === 'paradeWatch') {
        const mark = this.paradeMark(g);
        const dx = mark.x - g.x;
        const dz = mark.z - g.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 5.5) {
          g.x = mark.x;
          g.z = mark.z;
          g.yaw = Math.atan2(this.parade.x - mark.x, this.parade.z - mark.z);
        } else if (dist > 0.45) {
          const catchup = dist > 1.6 ? 3.4 : 1.8;
          vx = (dx / dist) * catchup;
          vz = (dz / dist) * catchup;
        } else {
          look = new THREE.Vector3(this.parade.x, 1.4, this.parade.z);
          gesture = g.burst > 0 ? g.burstKind : g.mode === 'trail' ? 'sway' : 'listen';
          g.burst = Math.max(0, g.burst - dt);
          const desired = Math.atan2(this.parade.x - g.x, this.parade.z - g.z);
          g.yaw += wrapAngle(desired - g.yaw) * Math.min(1, dt * 5);
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
          gesture = g.burst > 0 ? g.burstKind : 'listen';
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
      const resolved = resolve(g.x, g.z, 0.4, this.boxes, this.ellipses);
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
        emotion: gesture === 'listen' || gesture === 'clap' || gesture === 'sway' || gesture === 'raise' ? 'listen' : 'neutral',
        speaking: gesture === 'talk' ? 0.4 : 0,
        lookAt: look,
        prop: 'none',
      };
      g.puppet.update(dt, drive);
    }
    this.relax();
  }

  private make(scene: THREE.Scene, x: number, z: number, yaw: number, mode: Guest['mode'], i: number, crew = false): Guest {
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
      burstKind: 'clap',
      look: null,
      crew,
      lane: ((i % 5) - 2) * 0.55,
      paradeIndex: -1,
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

  private snapSlot(g: Guest) {
    if (g.slot < 0) return;
    const slot = this.slots[g.slot];
    g.x = slot.x;
    g.z = slot.z;
    const face = this.focus.get(slot.lot.id) ?? new THREE.Vector3(slot.lot.x, 1, slot.lot.z);
    g.yaw = Math.atan2(face.x - g.x, face.z - g.z);
    g.puppet.group.position.set(g.x, 0, g.z);
    g.puppet.group.rotation.y = g.yaw;
  }

  private syncParade() {
    if (!this.parade.active) {
      for (const g of this.guests) {
        if (g.mode === 'trail' || g.mode === 'paradeWatch') this.release(g);
      }
      return;
    }
    const crew = this.guests.filter((g) => g.crew);
    crew.forEach((g, i) => {
      if (g.mode === 'watch') this.release(g);
      g.mode = i < 3 ? 'trail' : 'paradeWatch';
      g.paradeIndex = i;
      g.lotId = 'parade';
    });
  }

  private paradeMark(g: Guest) {
    const yaw = this.parade.yaw;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    const i = Math.max(0, g.paradeIndex);
    if (g.mode === 'trail') {
      return {
        x: this.parade.x - fx * (1.9 + i * 1.05) + rx * (i % 2 === 0 ? 0.55 : -0.55),
        z: this.parade.z - fz * (1.9 + i * 1.05) + rz * (i % 2 === 0 ? 0.55 : -0.55),
      };
    }
    const side = i - 3;
    return {
      x: this.parade.x + rx * 2.5 - fx * (side * 1.35),
      z: this.parade.z + rz * 2.5 - fz * (side * 1.35),
    };
  }

  private relax() {
    for (let pass = 0; pass < 2; pass++) {
      for (const g of this.guests) {
        for (const o of this.guests) {
          if (o === g) continue;
          const dx = g.x - o.x;
          const dz = g.z - o.z;
          const d = Math.hypot(dx, dz) || 0.0001;
          if (d < 0.98) {
            const push = (0.98 - d) * 0.45;
            g.x += (dx / d) * push;
            g.z += (dz / d) * push;
          }
        }
        const resolved = resolve(g.x, g.z, 0.4, this.boxes, this.ellipses);
        g.x = resolved.x;
        g.z = resolved.z;
        g.puppet.group.position.set(g.x, 0, g.z);
      }
    }
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
      if (d2 > 0.0001 && d2 < 1.2 * 1.2) {
        const d = Math.sqrt(d2);
        const s = Math.min(2.2, (1.2 - d) / d);
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
