import * as THREE from 'three';
import type { LineCue, Score } from './types';
import { resolveLines } from './improv';
import { Puppet, type Drive, type PropName } from '../puppet/Puppet';
import { PARADE_ROUTE } from '../park/layout';
import { lambert } from '../puppet/materials';
import { clamp, wrapAngle } from '../util';
import { paradeAt } from './paradeSchedule';

interface Actor {
  roleId: string;
  name: string;
  puppet: Puppet;
  x: number;
  z: number;
  yaw: number;
  home: [number, number];
  prop: PropName;
}

const SCORE: Score = {
  id: 'river-lamps',
  title: '河灯巡游',
  titleEn: 'River-Lamp Parade',
  lotId: 'parade',
  duration: 18,
  phase: 0,
  lookMode: 'audience',
  groundY: 0.42,
  roles: [
    { id: 'ling', name: '领游', robe: 0xc23a2e, pants: 0x3a1814, hair: 0x1a100c, hat: 'cap', prop: 'fan', home: [0.15, 0.35] },
    { id: 'he', name: '河灯', robe: 0xe2b15a, pants: 0x4a3018, hair: 0x2a1c12, hat: 'ribbon', home: [-0.55, -0.45] },
    { id: 'gu', name: '行鼓', robe: 0x2f5d50, pants: 0x1c2820, hair: 0x24180f, prop: 'stick', home: [0.55, -0.55] },
  ],
  lines: [
    { t: 0, role: 'ling', text: '让一让，河灯过街。灯不认路，人来认。', en: 'Make way — the river lamps are crossing. The lamps do not know the road. People do.', gesture: 'wave', emotion: 'happy' },
    { t: 4, role: 'he', text: '这一盏写着“慢走”。你若跟上，就算同游。', en: 'This one says “walk slowly”. Keep up, and you are in the parade.', gesture: 'present', emotion: 'happy', look: 'ling' },
    { t: 8, role: 'gu', text: '（行鼓贴着石板，一步一响。）', en: '(The walking drum kisses the stones, one step, one beat.)', gesture: 'drum', emotion: 'neutral', sfx: 'drum', react: 'clap' },
    { t: 12, role: 'ling', text: '别只看花车。看你身边那个也站住的人。', en: 'Do not only watch the float. Watch the person who stopped beside you.', gesture: 'point', emotion: 'listen', react: 'cheer' },
    { t: 16, role: 'he', text: '灯会回来。路还在原来的地方。', en: 'The lamps come back. The road stays where it was.', gesture: 'bow', emotion: 'happy' },
  ],
  alts: [
    {
      line: 0,
      options: [
        { text: '让一让，河灯过街。灯不认路，人来认。', en: 'Make way — the river lamps are crossing. The lamps do not know the road. People do.', gesture: 'wave', emotion: 'happy' },
        { text: '午时的灯比早上客气。它只照站住的人。', en: 'The noon lamps are politer than the morning. They only light whoever has stopped.', gesture: 'flourish', emotion: 'happy' },
        { text: '巡游不卖票。你的脚就是座位。', en: 'The parade does not sell tickets. Your feet are the seat.', gesture: 'talk', emotion: 'neutral' },
      ],
    },
    {
      line: 3,
      options: [
        { text: '别只看花车。看你身边那个也站住的人。', en: 'Do not only watch the float. Watch the person who stopped beside you.', gesture: 'point', emotion: 'listen' },
        { text: '鼓若停了，你就鼓掌。把路再点亮一寸。', en: 'If the drum stops, you clap. Light one more cun of the road.', gesture: 'raise', emotion: 'happy' },
        { text: '花车过完，街还是街。只是灯记住了你。', en: 'After the float, the street is still a street. Only the lamps remember you.', gesture: 'hush', emotion: 'listen' },
      ],
    },
  ],
};

export class ParadeShow {
  readonly id = SCORE.id;
  readonly title = SCORE.title;
  readonly titleEn = SCORE.titleEn;
  readonly lotId = 'parade';
  readonly group = new THREE.Group();
  readonly origin = new THREE.Vector3();
  readonly score = SCORE;
  heading = Math.PI;
  billLive = false;
  billState = '午时';
  current: LineCue | null = null;
  speakerName = '';
  private readonly actors: Actor[] = [];
  private lines: LineCue[] = [];
  private loop = -1;
  private lineSerial = '';
  private showTime = 0;
  private readonly audience = new THREE.Vector3();
  private viewer: THREE.Vector3 | null = null;
  private readonly spot: THREE.SpotLight;
  private readonly spotTarget: THREE.Object3D;

  constructor() {
    this.buildFloat();
    for (const role of SCORE.roles) {
      const puppet = new Puppet({
        robe: role.robe,
        pants: role.pants,
        hair: role.hair,
        hat: role.hat,
        seed: role.name.length * 2.1,
      });
      puppet.group.position.set(role.home[0], SCORE.groundY, role.home[1]);
      this.group.add(puppet.group);
      this.actors.push({
        roleId: role.id,
        name: role.name,
        puppet,
        x: role.home[0],
        z: role.home[1],
        yaw: Math.PI / 2,
        home: role.home,
        prop: role.prop ?? 'none',
      });
    }
    this.spot = new THREE.SpotLight(0xffc56a, 0, 14, 0.6, 0.5, 1);
    this.spot.position.set(0, 3.4, 0.2);
    this.spotTarget = new THREE.Object3D();
    this.spot.target = this.spotTarget;
    this.group.add(this.spot, this.spotTarget);
    this.group.visible = false;
    this.parkAtStart();
  }

  private buildFloat() {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 3.1), lambert(0x6b4226));
    deck.position.y = 0.2;
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 3.3), lambert(0x9e2b2b));
    skirt.position.y = 0.22;
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 2.2), lambert(0xe2b15a));
    cloth.position.set(0, 2.35, -0.1);
    const poles: [number, number][] = [[-0.5, -0.9], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]];
    this.group.add(skirt, deck, cloth);
    for (const p of poles) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.15, 5), lambert(0x4a3428));
      pole.position.set(p[0], 1.25, p[1]);
      this.group.add(pole);
    }
    for (const z of [-0.7, 0.15, 0.9]) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0xffb15a, emissive: 0xff6a20, emissiveIntensity: 0.9 }),
      );
      lamp.position.set(0.72, 1.55, z);
      this.group.add(lamp);
    }
    const fish = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), lambert(0xc23a2e));
    fish.scale.set(1.4, 0.7, 0.55);
    fish.position.set(-0.78, 1.15, 1.15);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), lambert(0xe2b15a));
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.78, 1.15, 1.42);
    this.group.add(fish, tail);
  }

  private parkAtStart() {
    const a = PARADE_ROUTE[0];
    const b = PARADE_ROUTE[1];
    this.heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
    this.group.position.set(a[0], 0, a[1]);
    this.group.rotation.y = this.heading;
    this.origin.set(a[0], 0, a[1]);
  }

  focusWorld(out: THREE.Vector3) {
    const speaker = this.actors.find((a) => a.roleId === this.current?.role);
    if (speaker) speaker.puppet.getHeadWorld(out);
    else out.set(this.origin.x, 1.5, this.origin.z);
    return out;
  }

  speakerForward(out: THREE.Vector3) {
    const speaker = this.actors.find((a) => a.roleId === this.current?.role) ?? this.actors[0];
    if (!speaker) return out.set(1, 0, 0);
    const q = new THREE.Quaternion();
    speaker.puppet.group.getWorldQuaternion(q);
    return out.set(0, 0, 1).applyQuaternion(q);
  }

  actorTags() {
    if (!this.billLive) return [];
    return this.actors.map((a) => ({
      name: a.name,
      head: (out: THREE.Vector3) => {
        a.puppet.getHeadWorld(out);
        out.y += 0.42;
        return out;
      },
      speaking: this.current?.role === a.roleId,
    }));
  }

  update(dt: number, parkTime: number, onCue: (cue: LineCue) => void, viewer: THREE.Vector3 | null = null) {
    this.viewer = viewer;
    const slot = paradeAt(parkTime);
    this.billLive = slot.active;
    this.billState = slot.label;
    this.group.visible = slot.active;
    if (!slot.active) {
      this.current = null;
      this.speakerName = '';
      this.parkAtStart();
      return;
    }

    const sample = routeSample(slot.u);
    this.heading = sample.yaw;
    this.group.position.set(sample.x, 0, sample.z);
    this.group.rotation.y = sample.yaw;
    this.origin.set(sample.x, 0, sample.z);
    const rightX = Math.cos(sample.yaw);
    const rightZ = -Math.sin(sample.yaw);
    this.audience.set(sample.x + rightX * 3.1, 1.5, sample.z + rightZ * 3.1);

    const showSpan = 36;
    const local = slot.u * showSpan;
    this.showTime = local % SCORE.duration;
    const loop = slot.dayIndex * 4 + Math.floor(local / SCORE.duration);
    if (loop !== this.loop) {
      this.loop = loop;
      this.lines = resolveLines(SCORE, loop);
      this.lineSerial = '';
    }
    if (this.lines.length === 0) this.lines = resolveLines(SCORE, 0);

    let line: LineCue | null = this.lines[0] ?? null;
    for (const candidate of this.lines) {
      if (candidate.t <= this.showTime) line = candidate;
    }
    this.current = line;
    const key = line ? `${this.loop}:${line.t}:${line.role}:${line.text}` : '';
    if (key !== this.lineSerial) {
      this.lineSerial = key;
      if (line) onCue(line);
    }
    this.speakerName = this.actors.find((a) => a.roleId === line?.role)?.name ?? '';
    const speaker = this.actors.find((a) => a.roleId === line?.role) ?? null;

    this.group.updateMatrixWorld(true);
    for (const actor of this.actors) {
      const speaking = line?.role === actor.roleId;
      const look = this.lookTarget(actor, speaker, line);
      const at = this.group.localToWorld(new THREE.Vector3(actor.x, SCORE.groundY, actor.z));
      const desiredWorld = Math.atan2(look.x - at.x, look.z - at.z);
      const desiredLocal = desiredWorld - this.group.rotation.y;
      actor.yaw += wrapAngle(desiredLocal - actor.yaw) * clamp(dt * 4, 0, 1);
      actor.puppet.group.position.set(actor.x, SCORE.groundY, actor.z);
      actor.puppet.group.rotation.y = actor.yaw;
      const span = this.lineSpan(line);
      const since = line ? this.showTime - line.t : 0;
      const talkWindow = Math.min(span * 0.86, Math.max(1.4, span - 0.2));
      const speakingAmt = speaking && since < talkWindow ? 1 : 0;
      const drive: Drive = {
        speed: 0,
        gesture: speaking && line ? line.gesture : 'sway',
        emotion: speaking && line ? line.emotion : 'listen',
        speaking: speakingAmt,
        lookAt: look,
        prop: actor.prop,
      };
      actor.puppet.update(dt, drive);
    }

    if (speaker) {
      this.spotTarget.position.set(speaker.x, 1.5, speaker.z);
      this.spot.intensity += (16 - this.spot.intensity) * clamp(dt * 3, 0, 1);
    }
  }

  private lineSpan(line: LineCue | null) {
    if (!line) return 3;
    const idx = this.lines.indexOf(line);
    const next = this.lines[idx + 1];
    return next ? next.t - line.t : SCORE.duration - line.t;
  }

  private lookTarget(actor: Actor, speaker: Actor | null, line: LineCue | null) {
    if (this.viewer && (!line?.look || line.look === 'audience') && speaker === actor) {
      const dx = this.viewer.x - this.origin.x;
      const dz = this.viewer.z - this.origin.z;
      if (dx * dx + dz * dz < 36 && Math.sin(this.showTime * 0.8) > 0) {
        const at = this.viewer.clone();
        at.y = 1.5;
        return at;
      }
    }
    if (line?.look && line.look !== 'audience') {
      const other = this.actors.find((a) => a.roleId === line.look);
      if (other && other !== actor) {
        const p = this.group.localToWorld(new THREE.Vector3(other.x, 1.5, other.z));
        return p;
      }
    }
    if (speaker && speaker !== actor) {
      return this.group.localToWorld(new THREE.Vector3(speaker.x, 1.5, speaker.z));
    }
    return this.audience.clone();
  }
}

function routeSample(u: number) {
  const route = PARADE_ROUTE;
  const segments = route.length - 1;
  const f = clamp(u, 0, 0.999) * segments;
  const i = Math.min(segments - 1, Math.floor(f));
  const t = f - i;
  const a = route[i];
  const b = route[i + 1];
  return {
    x: a[0] + (b[0] - a[0]) * t,
    z: a[1] + (b[1] - a[1]) * t,
    yaw: Math.atan2(b[0] - a[0], b[1] - a[1]),
  };
}
