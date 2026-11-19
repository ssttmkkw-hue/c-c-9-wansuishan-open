import * as THREE from 'three';
import { clamp, damp } from '../util';
import { lambert } from './materials';

export type Emotion = 'neutral' | 'happy' | 'angry' | 'sad' | 'surprise' | 'listen';
export type Gesture =
  | 'idle'
  | 'talk'
  | 'point'
  | 'bow'
  | 'clap'
  | 'raise'
  | 'slash'
  | 'guard'
  | 'drum'
  | 'listen'
  | 'think'
  | 'offer'
  | 'wave'
  | 'juggle'
  | 'lunge'
  | 'block'
  | 'kneel'
  | 'present'
  | 'hush'
  | 'stamp'
  | 'flourish'
  | 'nod'
  | 'sway';
export type PropName = 'none' | 'sword' | 'stick' | 'fan';

export interface Drive {
  speed: number;
  gesture: Gesture;
  emotion: Emotion;
  /** 0..1 how strongly the mouth is in a speaking phrase. */
  speaking: number;
  lookAt: THREE.Vector3 | null;
  prop: PropName;
}

interface Joint {
  pivot: THREE.Group;
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  tz: number;
}

const GEO = {
  chest: new THREE.BoxGeometry(0.34, 0.36, 0.2),
  pelvis: new THREE.BoxGeometry(0.3, 0.18, 0.18),
  upperArm: new THREE.BoxGeometry(0.09, 0.28, 0.09),
  lowerArm: new THREE.BoxGeometry(0.08, 0.24, 0.08),
  hand: new THREE.SphereGeometry(0.055, 8, 6),
  upperLeg: new THREE.BoxGeometry(0.12, 0.36, 0.12),
  lowerLeg: new THREE.BoxGeometry(0.1, 0.34, 0.1),
  foot: new THREE.BoxGeometry(0.1, 0.06, 0.18),
  head: new THREE.SphereGeometry(0.175, 14, 12),
  eye: new THREE.SphereGeometry(0.038, 10, 8),
  pupil: new THREE.SphereGeometry(0.018, 8, 6),
  brow: new THREE.BoxGeometry(0.078, 0.018, 0.02),
  mouth: new THREE.BoxGeometry(0.078, 0.02, 0.024),
  hair: new THREE.SphereGeometry(0.18, 12, 10),
  sash: new THREE.BoxGeometry(0.36, 0.06, 0.22),
  blob: new THREE.CircleGeometry(0.42, 14),
  sword: new THREE.BoxGeometry(0.04, 0.62, 0.015),
  guard: new THREE.BoxGeometry(0.16, 0.03, 0.04),
  stick: new THREE.CylinderGeometry(0.012, 0.012, 0.38, 5),
  fan: new THREE.BoxGeometry(0.22, 0.16, 0.012),
  ball: new THREE.SphereGeometry(0.07, 8, 6),
  hatBrim: new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10),
  hatCap: new THREE.CylinderGeometry(0.1, 0.12, 0.1, 8),
  ribbon: new THREE.BoxGeometry(0.05, 0.22, 0.02),
};

const SKIN = 0xf0c3a0;
const BLOB = lambert(0x000000, 0.22);

function joint(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  parent.add(pivot);
  const j: Joint = { pivot, x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };
  return j;
}

function hang(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, length: number) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -length / 2;
  parent.add(mesh);
  return mesh;
}

export interface PuppetOptions {
  robe: number;
  pants?: number;
  hair?: number;
  skin?: number;
  sash?: number;
  hat?: 'none' | 'scholar' | 'cap' | 'ribbon';
  scale?: number;
  seed?: number;
}

export class Puppet {
  readonly group = new THREE.Group();
  private readonly rig = new THREE.Group();
  private readonly joints: Joint[] = [];
  private readonly pelvis: Joint;
  private readonly spine: Joint;
  private readonly chest: Joint;
  private readonly neck: Joint;
  private readonly head: Joint;
  private readonly armUL: Joint;
  private readonly armUR: Joint;
  private readonly armLL: Joint;
  private readonly armLR: Joint;
  private readonly legUL: Joint;
  private readonly legUR: Joint;
  private readonly legLL: Joint;
  private readonly legLR: Joint;
  private readonly headMesh: THREE.Object3D;
  private readonly eyeL: THREE.Mesh;
  private readonly eyeR: THREE.Mesh;
  private readonly pupilL: THREE.Mesh;
  private readonly pupilR: THREE.Mesh;
  private readonly browL: THREE.Mesh;
  private readonly browR: THREE.Mesh;
  private readonly lipU: THREE.Mesh;
  private readonly lipD: THREE.Mesh;
  private readonly cavity: THREE.Mesh;
  private readonly cheekL: THREE.Mesh;
  private readonly cheekR: THREE.Mesh;
  private readonly props: Record<PropName, THREE.Object3D | null>;
  private readonly ball: THREE.Mesh;
  private readonly footL: THREE.Mesh;
  private readonly footR: THREE.Mesh;
  private gesture: Gesture = 'idle';
  private gestureTime = 10;
  private phase = 0;
  private blinkIn = 1;
  private blinking = 0;
  private saccade = 0;
  private saccadeX = 0;
  private saccadeY = 0;
  private time = 0;
  private booted = false;
  readonly seed: number;

  constructor(opts: PuppetOptions) {
    this.seed = opts.seed ?? Math.random() * 10;
    const robe = lambert(opts.robe);
    const pants = lambert(opts.pants ?? 0x2a3142);
    const skin = lambert(opts.skin ?? SKIN);
    const hairMat = lambert(opts.hair ?? 0x24180f);
    const shoe = lambert(0x2a211c);
    const sash = lambert(opts.sash ?? 0xe2b15a);
    this.phase = this.seed;

    this.group.add(this.rig);
    this.pelvis = joint(this.rig, 0, 0.92, 0);
    hang(this.pelvis.pivot, GEO.pelvis, robe, 0);

    this.legUL = joint(this.pelvis.pivot, -0.09, -0.06, 0);
    hang(this.legUL.pivot, GEO.upperLeg, pants, 0.36);
    this.legLL = joint(this.legUL.pivot, 0, -0.36, 0);
    hang(this.legLL.pivot, GEO.lowerLeg, pants, 0.34);
    this.footL = hang(this.legLL.pivot, GEO.foot, shoe, 0);
    this.footL.position.set(0, -0.36, 0.03);

    this.legUR = joint(this.pelvis.pivot, 0.09, -0.06, 0);
    hang(this.legUR.pivot, GEO.upperLeg, pants, 0.36);
    this.legLR = joint(this.legUR.pivot, 0, -0.36, 0);
    hang(this.legLR.pivot, GEO.lowerLeg, pants, 0.34);
    this.footR = hang(this.legLR.pivot, GEO.foot, shoe, 0);
    this.footR.position.set(0, -0.36, 0.03);

    this.spine = joint(this.pelvis.pivot, 0, 0.08, 0);
    this.chest = joint(this.spine.pivot, 0, 0.2, 0);
    hang(this.chest.pivot, GEO.chest, robe, 0);
    const sashMesh = new THREE.Mesh(GEO.sash, sash);
    sashMesh.position.y = -0.08;
    this.chest.pivot.add(sashMesh);

    this.armUL = joint(this.chest.pivot, -0.22, 0.12, 0);
    hang(this.armUL.pivot, GEO.upperArm, robe, 0.28);
    this.armLL = joint(this.armUL.pivot, 0, -0.28, 0);
    hang(this.armLL.pivot, GEO.lowerArm, skin, 0.24);
    const handL = joint(this.armLL.pivot, 0, -0.26, 0);
    hang(handL.pivot, GEO.hand, skin, 0);

    this.armUR = joint(this.chest.pivot, 0.22, 0.12, 0);
    hang(this.armUR.pivot, GEO.upperArm, robe, 0.28);
    this.armLR = joint(this.armUR.pivot, 0, -0.28, 0);
    hang(this.armLR.pivot, GEO.lowerArm, skin, 0.24);
    const handR = joint(this.armLR.pivot, 0, -0.26, 0);
    hang(handR.pivot, GEO.hand, skin, 0);

    this.neck = joint(this.chest.pivot, 0, 0.2, 0);
    this.head = joint(this.neck.pivot, 0, 0.1, 0);
    this.headMesh = hang(this.head.pivot, GEO.head, skin, 0);
    this.headMesh.position.y = 0.06;

    const hair = new THREE.Mesh(GEO.hair, hairMat);
    hair.scale.set(0.96, 0.55, 0.92);
    hair.position.set(0, 0.2, -0.03);
    this.head.pivot.add(hair);

    this.eyeL = new THREE.Mesh(GEO.eye, lambert(0xfff8ee));
    this.eyeR = new THREE.Mesh(GEO.eye, lambert(0xfff8ee));
    this.eyeL.position.set(-0.058, 0.078, 0.162);
    this.eyeR.position.set(0.058, 0.078, 0.162);
    this.head.pivot.add(this.eyeL, this.eyeR);
    this.pupilL = new THREE.Mesh(GEO.pupil, lambert(0x1a120c));
    this.pupilR = new THREE.Mesh(GEO.pupil, lambert(0x1a120c));
    this.pupilL.position.set(0, 0, 0.03);
    this.pupilR.position.set(0, 0, 0.03);
    this.eyeL.add(this.pupilL);
    this.eyeR.add(this.pupilR);

    this.browL = new THREE.Mesh(GEO.brow, lambert(0x2a1c14));
    this.browR = new THREE.Mesh(GEO.brow, lambert(0x2a1c14));
    this.browL.position.set(-0.058, 0.122, 0.168);
    this.browR.position.set(0.058, 0.122, 0.168);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.04, 0.04), skin);
    nose.position.set(0, 0.028, 0.178);
    this.head.pivot.add(nose);
    this.head.pivot.add(this.browL, this.browR);

    this.cavity = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.02, 0.015), lambert(0x4a2030));
    this.cavity.position.set(0, -0.04, 0.168);
    this.lipU = new THREE.Mesh(GEO.mouth, lambert(0x9a3d48));
    this.lipD = new THREE.Mesh(GEO.mouth, lambert(0x9a3d48));
    this.lipU.position.set(0, -0.028, 0.176);
    this.lipD.position.set(0, -0.05, 0.17);
    this.head.pivot.add(this.cavity, this.lipU, this.lipD);

    this.cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), lambert(0xe07a78));
    this.cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), lambert(0xe07a78));
    this.cheekL.position.set(-0.11, 0.02, 0.15);
    this.cheekR.position.set(0.11, 0.02, 0.15);
    this.cheekL.scale.setScalar(0.3);
    this.cheekR.scale.setScalar(0.3);
    this.head.pivot.add(this.cheekL, this.cheekR);

    this.addHat(opts.hat ?? 'none', hairMat);

    const sword = new THREE.Group();
    const blade = new THREE.Mesh(GEO.sword, lambert(0xd9dde6));
    blade.position.y = -0.32;
    const guard = new THREE.Mesh(GEO.guard, lambert(0xc9a227));
    guard.position.y = -0.04;
    sword.add(blade, guard);
    handR.pivot.add(sword);

    const stickR = new THREE.Mesh(GEO.stick, lambert(0x6b4226));
    stickR.position.y = -0.16;
    handR.pivot.add(stickR);
    const stickL = new THREE.Mesh(GEO.stick, lambert(0x6b4226));
    stickL.position.y = -0.16;
    handL.pivot.add(stickL);
    const sticks = new THREE.Group();
    sticks.add(stickL, stickR);

    const fan = new THREE.Mesh(GEO.fan, lambert(0xf2e2c4));
    fan.position.set(0, -0.08, 0.04);
    const fanRib = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.014), lambert(0x6b4226));
    fanRib.position.set(0, -0.15, 0.04);
    const fanG = new THREE.Group();
    fanG.add(fan, fanRib);
    handR.pivot.add(fanG);

    this.props = { none: null, sword, stick: sticks, fan: fanG };
    for (const k of ['sword', 'stick', 'fan'] as PropName[]) this.props[k]!.visible = false;

    this.ball = new THREE.Mesh(GEO.ball, lambert(0xc23a2e));
    this.ball.visible = false;
    this.chest.pivot.add(this.ball);

    const blob = new THREE.Mesh(GEO.blob, BLOB);
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.025;
    this.group.add(blob);

    this.joints.push(
      this.pelvis,
      this.spine,
      this.chest,
      this.neck,
      this.head,
      this.armUL,
      this.armUR,
      this.armLL,
      this.armLR,
      this.legUL,
      this.legUR,
      this.legLL,
      this.legLR,
      handL,
      handR,
    );

    this.alignFeet();
    if (opts.scale && opts.scale !== 1) this.group.scale.setScalar(opts.scale);
  }

  private addHat(kind: NonNullable<PuppetOptions['hat']>, hair: THREE.Material) {
    if (kind === 'none') return;
    if (kind === 'scholar') {
      const brim = new THREE.Mesh(GEO.hatBrim, lambert(0x1c2430));
      brim.position.y = 0.22;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.16), lambert(0x1c2430));
      fin.position.set(0, 0.28, 0);
      this.head.pivot.add(brim, fin);
    } else if (kind === 'cap') {
      const cap = new THREE.Mesh(GEO.hatCap, lambert(0x7a1f24));
      cap.position.y = 0.22;
      this.head.pivot.add(cap);
    } else {
      const a = new THREE.Mesh(GEO.ribbon, hair);
      const b = new THREE.Mesh(GEO.ribbon, lambert(0xc23a2e));
      a.position.set(-0.08, 0.02, -0.12);
      b.position.set(0.08, 0.0, -0.12);
      this.head.pivot.add(a, b);
    }
  }

  private alignFeet() {
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();
    tmp.setFromObject(this.footL);
    box.copy(tmp);
    tmp.setFromObject(this.footR);
    box.union(tmp);
    if (Number.isFinite(box.min.y)) this.rig.position.y -= box.min.y;
  }

  getHeadWorld(out: THREE.Vector3) {
    return this.head.pivot.getWorldPosition(out);
  }

  update(dt: number, drive: Drive) {
    this.time += dt;
    if (drive.gesture !== this.gesture) {
      this.gesture = drive.gesture;
      this.gestureTime = 0;
    } else {
      this.gestureTime += dt;
    }
    const speed = drive.speed;
    if (speed > 0.2) this.phase += dt * (3.2 + speed * 1.4);
    else this.phase += dt * 1.2;

    for (const j of this.joints) {
      j.tx = 0;
      j.ty = 0;
      j.tz = 0;
    }

    const stepping = speed > 0.28;
    const swing = Math.sin(this.phase);
    this.legUL.tx = stepping ? swing * 0.75 : 0;
    this.legUR.tx = stepping ? -swing * 0.75 : 0;
    this.legLL.tx = stepping ? Math.max(0, -swing) * 1.2 : 0.05;
    this.legLR.tx = stepping ? Math.max(0, swing) * 1.2 : 0.05;
    this.pelvis.pivot.position.y = 0.92 + (stepping ? Math.abs(swing) * 0.045 : Math.sin(this.time * 1.6 + this.seed) * 0.012);
    this.pelvis.tz = Math.sin(this.time * 0.8 + this.seed) * 0.04;
    this.spine.ty = stepping ? swing * 0.12 : Math.sin(this.time * 0.7 + this.seed) * 0.05;
    this.chest.tx = Math.sin(this.time * 1.8 + this.seed) * 0.035;

    const g = drive.gesture;
    const performing = g !== 'idle';
    if (!performing && stepping) {
      this.armUL.tx = -swing * 0.65;
      this.armUR.tx = swing * 0.65;
      this.armLL.tx = -0.35;
      this.armLR.tx = -0.35;
      this.armUL.tz = 0.18;
      this.armUR.tz = -0.18;
    } else if (!performing) {
      this.idleArms();
    } else {
      this.applyGesture(g, drive);
    }

    this.applyLook(drive.lookAt);
    this.applyFace(dt, drive);

    const attack = this.gestureTime < 0.22;
    const rate = attack ? 16 : 8;
    for (const j of this.joints) {
      if (!this.booted) {
        j.x = j.tx;
        j.y = j.ty;
        j.z = j.tz;
      } else {
        j.x = damp(j.x, j.tx, rate, dt);
        j.y = damp(j.y, j.ty, rate, dt);
        j.z = damp(j.z, j.tz, rate, dt);
      }
      j.pivot.rotation.set(j.x, j.y, j.z);
    }
    this.booted = true;

    for (const key of ['sword', 'stick', 'fan'] as PropName[]) {
      const obj = this.props[key];
      if (obj) obj.visible = drive.prop === key;
    }
    this.ball.visible = g === 'juggle';
    if (g === 'juggle') {
      const s = this.time * 6 + this.seed;
      this.ball.position.set(Math.sin(s) * 0.22, 0.35 + Math.abs(Math.sin(s * 1.3)) * 0.28, 0.18);
    }
    this.placePupils(drive.lookAt);
  }

  private idleArms() {
    const breathe = Math.sin(this.time * 1.5 + this.seed) * 0.05;
    this.armUL.tx = 0.12 + breathe;
    this.armUR.tx = 0.12 + breathe;
    this.armUL.tz = 0.28;
    this.armUR.tz = -0.28;
    this.armLL.tx = -0.4;
    this.armLR.tx = -0.4;
  }

  private applyGesture(g: Gesture, drive: Drive) {
    const t = this.time + this.seed;
    const sway = Math.sin(t * 2.4) * 0.08;
    const u = clamp(this.gestureTime / 0.42, 0, 1);
    switch (g) {
      case 'talk':
        this.idleArms();
        this.armUR.tx = -0.95;
        this.armUR.ty = -0.25;
        this.armUR.tz = -0.15;
        this.armLR.tx = -1.25 + sway;
        this.spine.tx += 0.06;
        break;
      case 'point':
        this.idleArms();
        this.armUR.tx = -1.4;
        this.armUR.ty = -0.2;
        this.armUR.tz = -0.05;
        this.armLR.tx = -0.2;
        this.spine.ty = -0.15;
        break;
      case 'bow':
        this.idleArms();
        this.spine.tx = 0.75;
        this.head.tx = 0.35;
        this.armUL.tx = 0.4;
        this.armUR.tx = 0.4;
        break;
      case 'clap': {
        const p = 0.55 + 0.45 * Math.sin(t * 14);
        this.armUL.tx = -1.05;
        this.armUR.tx = -1.05;
        this.armUL.tz = 0.15 + p * 0.35;
        this.armUR.tz = -0.15 - p * 0.35;
        this.armLL.tx = -1.15;
        this.armLR.tx = -1.15;
        break;
      }
      case 'raise':
        this.armUL.tx = -2.35;
        this.armUR.tx = -2.35;
        this.armUL.tz = 0.55;
        this.armUR.tz = -0.55;
        this.armLL.tx = -0.25;
        this.armLR.tx = -0.25;
        this.spine.tx = -0.08;
        break;
      case 'slash': {
        const k = u < 1 ? u : 1;
        this.armUR.tx = -0.5 + -1.15 * Math.sin(k * Math.PI);
        this.armUR.ty = 1.1 - 2.2 * k;
        this.armUR.tz = -0.2;
        this.armLR.tx = -0.35;
        this.armUL.tx = -0.4;
        this.armUL.tz = 0.4;
        this.armLL.tx = -0.8;
        this.spine.ty = 0.5 - k;
        this.spine.tx = 0.1;
        break;
      }
      case 'guard':
        this.armUL.tx = -0.85;
        this.armUR.tx = -0.85;
        this.armUL.tz = 0.55;
        this.armUR.tz = -0.55;
        this.armLL.tx = -1.45;
        this.armLR.tx = -1.45;
        this.spine.tx = 0.08;
        break;
      case 'drum': {
        const d = Math.sin(t * 9);
        this.armUL.tx = -0.55 - Math.max(0, d) * 0.7;
        this.armUR.tx = -0.55 - Math.max(0, -d) * 0.7;
        this.armUL.tz = 0.25;
        this.armUR.tz = -0.25;
        this.armLL.tx = -0.9;
        this.armLR.tx = -0.9;
        this.spine.tx = 0.18;
        break;
      }
      case 'listen': {
        const variant = Math.floor(this.seed * 10) % 3;
        const nod = Math.sin(t * (1.15 + (this.seed % 1) * 0.4)) > 0.84 ? 0.22 : 0;
        this.spine.ty = Math.sin(t * 0.55 + this.seed) * 0.07;
        this.spine.tx = 0.08;
        if (variant === 0) {
          this.armUL.tx = -0.5;
          this.armUL.tz = 0.5;
          this.armLL.tx = -1.6;
          this.armUR.tx = 0.18;
          this.armUR.tz = -0.32;
          this.armLR.tx = -0.45;
          this.head.tz = 0.2;
        } else if (variant === 1) {
          this.armUL.tx = -0.95;
          this.armUR.tx = -0.95;
          this.armUL.tz = 0.38;
          this.armUR.tz = -0.38;
          this.armLL.tx = -1.4;
          this.armLR.tx = -1.4;
          this.head.tz = -0.12;
        } else {
          this.idleArms();
          this.head.tz = 0.2;
          this.head.ty = Math.sin(t * 0.45 + this.seed) * 0.14;
        }
        this.head.tx += nod;
        break;
      }
      case 'think':
        this.idleArms();
        this.armUR.tx = -0.7;
        this.armUR.tz = -0.35;
        this.armLR.tx = -1.65;
        this.head.tz = -0.08;
        this.head.tx = 0.12;
        break;
      case 'offer':
        this.armUL.tx = -0.85;
        this.armUR.tx = -0.85;
        this.armUL.tz = 0.25;
        this.armUR.tz = -0.25;
        this.armLL.tx = -0.45;
        this.armLR.tx = -0.45;
        this.spine.tx = 0.08;
        break;
      case 'wave':
        this.idleArms();
        this.armUR.tx = -2.4;
        this.armUR.tz = -0.25;
        this.armLR.tx = -0.2;
        this.armLR.tz = Math.sin(t * 6) * 0.4;
        break;
      case 'juggle': {
        const s = Math.sin(t * 6);
        this.armUL.tx = -1.15 - Math.max(0, s) * 0.7;
        this.armUR.tx = -1.15 - Math.max(0, -s) * 0.7;
        this.armUL.tz = 0.35;
        this.armUR.tz = -0.35;
        this.armLL.tx = -0.4;
        this.armLR.tx = -0.4;
        break;
      }
      case 'lunge': {
        const k = Math.sin(Math.min(u, 1) * Math.PI);
        this.legUL.tx = -0.7 * k;
        this.legLL.tx = 0.35 * k;
        this.spine.tx = 0.28 * k;
        this.spine.ty = -0.25 * k;
        this.armUR.tx = -1.55;
        this.armUR.ty = -0.35;
        this.armLR.tx = -0.25;
        this.armUL.tx = -0.35;
        this.armUL.tz = 0.55;
        this.armLL.tx = -1.1;
        break;
      }
      case 'block':
        this.armUL.tx = -1.15;
        this.armUR.tx = -1.25;
        this.armUL.tz = 0.15;
        this.armUR.tz = -0.95;
        this.armLL.tx = -1.35;
        this.armLR.tx = -0.35;
        this.spine.ty = -0.28;
        this.spine.tx = 0.06;
        this.head.ty = -0.12;
        break;
      case 'kneel':
        this.spine.tx = 0.85;
        this.head.tx = 0.32;
        this.legUL.tx = 0.5;
        this.legLL.tx = 1.05;
        this.legUR.tx = 0.15;
        this.armUL.tx = 0.45;
        this.armUR.tx = 0.45;
        this.armLL.tx = -0.3;
        this.armLR.tx = -0.3;
        break;
      case 'present':
        this.armUL.tx = -0.55;
        this.armUR.tx = -1.55;
        this.armUR.tz = -0.35;
        this.armUL.tz = 0.2;
        this.armLR.tx = -0.15;
        this.armLL.tx = -0.7;
        this.spine.ty = -0.18;
        this.spine.tx = 0.05;
        break;
      case 'hush':
        this.idleArms();
        this.armUR.tx = -1.35;
        this.armLR.tx = -2.15;
        this.armUR.tz = -0.15;
        this.head.tx = 0.1;
        this.spine.tx = 0.08;
        break;
      case 'stamp':
        this.armUL.tx = -0.35;
        this.armUR.tx = -2.15;
        this.armUR.tz = -0.2;
        this.armLR.tx = -0.2;
        this.armLL.tx = -0.5;
        this.legUR.tx = Math.sin(t * 7) > 0 ? -0.35 : 0.15;
        this.spine.tx = 0.1;
        break;
      case 'flourish':
        this.idleArms();
        this.armUR.tx = -1.15 + Math.sin(t * 4) * 0.55;
        this.armUR.tz = -0.55;
        this.armLR.tx = -0.55;
        this.armLR.tz = Math.sin(t * 4) * 0.55;
        this.spine.ty = Math.sin(t * 2) * 0.08;
        break;
      case 'nod':
        this.idleArms();
        this.head.tx = 0.32 * Math.max(0, Math.sin(t * 4.2));
        this.spine.tx = 0.06;
        break;
      case 'sway':
        this.idleArms();
        this.spine.ty = Math.sin(t * 1.6) * 0.22;
        this.chest.tz = Math.sin(t * 1.6) * 0.08;
        this.armUL.tz = 0.42;
        this.armUR.tz = -0.42;
        break;
      default:
        this.idleArms();
    }
    // Keep the unused drive reference honest for emotion-specific posture.
    if (drive.emotion === 'surprise' && g !== 'bow') this.spine.tx -= 0.06;
  }

  private applyLook(target: THREE.Vector3 | null) {
    if (!target) return;
    const headPos = new THREE.Vector3();
    this.head.pivot.getWorldPosition(headPos);
    const dir = target.clone().sub(headPos);
    if (dir.lengthSq() < 1e-5) return;
    dir.normalize();
    const q = new THREE.Quaternion();
    this.group.getWorldQuaternion(q);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const charYaw = Math.atan2(fwd.x, fwd.z);
    const desired = Math.atan2(dir.x, dir.z);
    let dy = desired - charYaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    dy = clamp(dy, -1.05, 1.05);
    const dp = clamp(-Math.asin(clamp(dir.y, -1, 1)), -0.45, 0.45);
    this.neck.ty += dy * 0.35;
    this.head.ty += dy * 0.7;
    this.head.tx += dp;
  }

  private applyFace(dt: number, drive: Drive) {
    this.blinkIn -= dt;
    if (this.blinking > 0) this.blinking -= dt;
    if (this.blinkIn <= 0) {
      this.blinking = 0.14;
      this.blinkIn = 2.1 + ((this.seed * 13) % 1) * 2.4 + Math.random() * 0.4;
    }
    const k = this.blinking > 0 ? Math.sin((1 - this.blinking / 0.14) * Math.PI) : 0;
    const lid = 1 - 0.92 * k;
    this.eyeL.scale.y = lid;
    this.eyeR.scale.y = lid;

    const viseme = [0.2, 0.95, 0.4, 1, 0.25, 0.72, 0.5, 0.88];
    const step = viseme[Math.floor(this.time * 10.5 + this.seed) % viseme.length];
    const open = drive.speaking > 0.05 ? drive.speaking * step : 0.05;
    this.cavity.scale.y = 0.35 + open * 3.4;
    this.cavity.scale.x = 0.8 + open * 0.55;
    this.lipU.position.y = -0.026 + open * 0.016;
    this.lipD.position.y = -0.048 - open * 0.02;
    this.lipD.scale.y = 1 + open * 1.6;
    const smile = drive.emotion === 'happy' ? 1.45 : drive.emotion === 'sad' ? 0.62 : drive.emotion === 'angry' ? 0.72 : 1;
    this.lipU.scale.x = smile;
    this.lipD.scale.x = smile * (drive.emotion === 'sad' ? 0.85 : 1);

    const brows: Record<Emotion, { y: number; rot: number }> = {
      neutral: { y: 0.138, rot: 0.06 },
      happy: { y: 0.158, rot: -0.55 },
      angry: { y: 0.112, rot: 0.85 },
      sad: { y: 0.124, rot: -0.62 },
      surprise: { y: 0.188, rot: 0.02 },
      listen: { y: 0.156, rot: -0.28 },
    };
    const b = brows[drive.emotion];
    this.browL.position.y = b.y;
    this.browR.position.y = b.y;
    this.browL.rotation.z = b.rot;
    this.browR.rotation.z = -b.rot;

    const cheek = drive.emotion === 'happy' ? 1.15 : drive.emotion === 'listen' ? 0.7 : drive.emotion === 'surprise' ? 0.45 : 0.22;
    this.cheekL.scale.setScalar(cheek);
    this.cheekR.scale.setScalar(cheek);

    this.saccade -= dt;
    if (this.saccade <= 0) {
      this.saccade = 0.7 + Math.random() * 1.5;
      this.saccadeX = (Math.random() - 0.5) * 0.014;
      this.saccadeY = (Math.random() - 0.5) * 0.01;
    }
    if (drive.lookAt) {
      this.saccadeX *= 0.35;
      this.saccadeY *= 0.35;
    }
  }

  private placePupils(target: THREE.Vector3 | null) {
    let ox = this.saccadeX;
    let oy = this.saccadeY;
    if (target) {
      const local = target.clone();
      this.head.pivot.worldToLocal(local);
      const len = local.length() || 1;
      ox += clamp((local.x / len) * 0.034, -0.02, 0.02);
      oy += clamp((local.y / len) * 0.026, -0.014, 0.014);
    }
    this.pupilL.position.set(ox, oy, 0.032);
    this.pupilR.position.set(ox, oy, 0.032);
  }
}
