import * as THREE from 'three';
import type { Score, LineCue } from './types';
import { resolveLines } from './improv';
import { Puppet, type Drive, type Emotion, type Gesture, type PropName } from '../puppet/Puppet';
import { lotById, localToWorld } from '../park/layout';
import { clamp, wrapAngle } from '../util';

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

export class ActorShow {
  readonly id: string;
  readonly title: string;
  readonly titleEn: string;
  readonly lotId: string;
  readonly group = new THREE.Group();
  readonly origin = new THREE.Vector3();
  private readonly score: Score;
  private readonly actors: Actor[] = [];
  private lines: LineCue[] = [];
  private loop = -1;
  private lineSerial = '';
  private showTime = 0;
  private readonly spot: THREE.SpotLight;
  private readonly spotTarget: THREE.Object3D;
  private readonly audience = new THREE.Vector3();
  current: LineCue | null = null;
  speakerName = '';

  constructor(score: Score) {
    this.score = score;
    this.id = score.id;
    this.title = score.title;
    this.titleEn = score.titleEn;
    this.lotId = score.lotId;
    const lot = lotById(score.lotId);
    this.group.position.set(lot.x, 0, lot.z);
    this.group.rotation.y = lot.yaw;
    this.origin.set(lot.x, 0, lot.z);

    const aud = localToWorld(lot, 0, 5.5);
    this.audience.set(aud.x, 1.45, aud.z);

    for (const role of score.roles) {
      const puppet = new Puppet({
        robe: role.robe,
        pants: role.pants,
        hair: role.hair,
        hat: role.hat,
        seed: role.name.length + role.home[0],
      });
      puppet.group.position.set(role.home[0], score.groundY, role.home[1]);
      this.group.add(puppet.group);
      this.actors.push({
        roleId: role.id,
        name: role.name,
        puppet,
        x: role.home[0],
        z: role.home[1],
        yaw: 0,
        home: role.home,
        prop: role.prop ?? 'none',
      });
    }

    this.spot = new THREE.SpotLight(0xffe2b8, 0, 16, 0.55, 0.5, 1);
    this.spot.position.set(0.4, 5.4, 1.2);
    this.spotTarget = new THREE.Object3D();
    this.spotTarget.position.set(0, 1.5, 0.4);
    this.spot.target = this.spotTarget;
    this.group.add(this.spot, this.spotTarget);
    const fill = new THREE.PointLight(0xffc48a, 0.35, 8, 1.4);
    fill.position.set(0, 2.2, 1.4);
    this.group.add(fill);
  }

  get showT() {
    return this.showTime;
  }

  focusWorld(out: THREE.Vector3) {
    const speaker = this.actors.find((a) => a.roleId === this.current?.role);
    if (speaker) speaker.puppet.getHeadWorld(out);
    else out.set(this.origin.x, 1.5, this.origin.z);
    return out;
  }

  /** World-space direction the current speaker's face points. */
  speakerForward(out: THREE.Vector3) {
    const speaker = this.actors.find((a) => a.roleId === this.current?.role) ?? this.actors[0];
    if (!speaker) return out.set(0, 0, 1);
    const q = new THREE.Quaternion();
    speaker.puppet.group.getWorldQuaternion(q);
    return out.set(0, 0, 1).applyQuaternion(q);
  }

  actorTags() {
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

  update(dt: number, parkTime: number, onCue: (cue: LineCue) => void) {
    this.group.updateMatrixWorld(true);
    const abs = parkTime / 60 + this.score.phase;
    const loop = Math.floor(abs / this.score.duration);
    this.showTime = ((abs % this.score.duration) + this.score.duration) % this.score.duration;
    if (loop !== this.loop) {
      this.loop = loop;
      this.lines = resolveLines(this.score, loop);
      this.lineSerial = '';
    }
    if (this.lines.length === 0) this.lines = resolveLines(this.score, 0);

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
    for (const actor of this.actors) {
      const markX = line && line.role === actor.roleId && line.x !== undefined ? line.x : actor.home[0];
      const markZ = line && line.role === actor.roleId && line.z !== undefined ? line.z : actor.home[1];
      const dx = markX - actor.x;
      const dz = markZ - actor.z;
      const dist = Math.hypot(dx, dz);
      let speed = 0;
      if (dist > 0.05) {
        const step = Math.min(dist, dt * 1.15);
        actor.x += (dx / dist) * step;
        actor.z += (dz / dist) * step;
        speed = step / Math.max(dt, 1e-4);
        actor.yaw = Math.atan2(dx, dz);
      }
      actor.puppet.group.position.set(actor.x, this.score.groundY, actor.z);

      const speaking = line?.role === actor.roleId;
      const look = this.lookTarget(actor, speaker, line);
      if (speed < 0.2) {
        const at = this.worldOf(actor);
        const desiredWorld = Math.atan2(look.x - at.x, look.z - at.z);
        const desiredLocal = desiredWorld - this.group.rotation.y;
        actor.yaw += wrapAngle(desiredLocal - actor.yaw) * clamp(dt * 4, 0, 1);
      }
      actor.puppet.group.rotation.y = actor.yaw;

      const span = this.lineSpan(line);
      const since = line ? this.showTime - line.t : 0;
      const talkWindow = Math.min(2.6, span * 0.72);
      const speakingAmt = speaking && since < talkWindow ? 1 - since / talkWindow * 0.25 : 0;

      const gesture: Gesture = speaking && line ? line.gesture : 'listen';
      const emotion: Emotion = speaking && line ? line.emotion : 'listen';
      const drive: Drive = {
        speed,
        gesture,
        emotion,
        speaking: speakingAmt,
        lookAt: look,
        prop: actor.prop,
      };
      actor.puppet.update(dt, drive);
    }

    if (speaker) {
      this.spotTarget.position.set(speaker.x, this.score.groundY + 1.45, speaker.z);
      const want = 18;
      this.spot.intensity += (want - this.spot.intensity) * clamp(dt * 3, 0, 1);
      this.spot.color.set(line?.emotion === 'angry' ? 0xffb090 : 0xffe2b8);
    } else {
      this.spot.intensity += (4 - this.spot.intensity) * clamp(dt * 2, 0, 1);
    }
  }

  private lineSpan(line: LineCue | null) {
    if (!line) return 3;
    const idx = this.lines.indexOf(line);
    const next = this.lines[idx + 1];
    return next ? next.t - line.t : this.score.duration - line.t;
  }

  private worldOf(actor: Actor) {
    return this.group.localToWorld(new THREE.Vector3(actor.x, this.score.groundY, actor.z));
  }

  private lookTarget(actor: Actor, speaker: Actor | null, line: LineCue | null) {
    const mode = line?.look;
    if (mode && mode !== 'audience') {
      const other = this.actors.find((a) => a.roleId === mode);
      if (other && other !== actor) {
        const p = this.worldOf(other);
        p.y = 1.45;
        return p;
      }
    }
    if (mode === 'audience' || (this.score.lookMode === 'audience' && speaker === actor)) {
      return this.audience.clone();
    }
    if (speaker && speaker !== actor) {
      const p = this.worldOf(speaker);
      p.y = 1.45;
      return p;
    }
    if (this.score.lookMode === 'group') {
      const other = this.actors.find((a) => a !== actor);
      if (other) {
        const p = this.worldOf(other);
        p.y = 1.45;
        return p;
      }
    }
    return this.audience.clone();
  }
}
