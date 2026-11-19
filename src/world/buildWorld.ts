import * as THREE from 'three';
import { lambert, makeSpeckle } from '../puppet/materials';
import { LOTS, localToWorld, type LotDef } from '../park/layout';
import type { Aabb, Ellipse } from '../park/collide';

export interface ParkWorld {
  boxes: Aabb[];
  ellipses: Ellipse[];
  flags: THREE.Mesh[];
  water: THREE.Mesh;
}

function board(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function collider(boxes: Aabb[], lot: LotDef, lx: number, lz: number, hx: number, hz: number) {
  const corners = [
    localToWorld(lot, lx - hx, lz - hz),
    localToWorld(lot, lx + hx, lz - hz),
    localToWorld(lot, lx - hx, lz + hz),
    localToWorld(lot, lx + hx, lz + hz),
  ];
  boxes.push({
    minX: Math.min(...corners.map((c) => c.x)),
    maxX: Math.max(...corners.map((c) => c.x)),
    minZ: Math.min(...corners.map((c) => c.z)),
    maxZ: Math.max(...corners.map((c) => c.z)),
  });
}

function nightCloth() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const g = c.getContext('2d');
  if (!g) throw new Error('canvas');
  const sky = g.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#1b2744');
  sky.addColorStop(0.55, '#3a3148');
  sky.addColorStop(1, '#6a5340');
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#f6e7bf';
  g.beginPath();
  g.arc(390, 68, 26, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.28)';
  g.lineWidth = 2;
  for (let i = 0; i < 28; i++) {
    const x = (i * 53) % 512;
    g.beginPath();
    g.moveTo(x, (i * 17) % 90);
    g.lineTo(x - 24, 150 + ((i * 19) % 140));
    g.stroke();
  }
  g.strokeStyle = '#e2c48a';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(30, 250);
  g.quadraticCurveTo(180, 170, 340, 252);
  g.stroke();
  g.fillStyle = '#141820';
  g.fillRect(0, 268, 512, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildWorld(scene: THREE.Scene): ParkWorld {
  const boxes: Aabb[] = [];
  const grassTex = makeSpeckle('#6d914c', '#3f5a30', 700, 0.45);
  grassTex.repeat.set(18, 18);
  const groundMat = new THREE.MeshLambertMaterial({ map: grassTex });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const sandTex = makeSpeckle('#d2c0a0', '#8a7050', 400, 0.4);
  sandTex.repeat.set(8, 8);
  const sand = new THREE.MeshLambertMaterial({ map: sandTex });
  const stones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.05, 0.46), sand, 220);
  const dummy = new THREE.Object3D();
  let n = 0;
  const lay = (x1: number, z1: number, x2: number, z2: number, step = 1.15) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.max(1, Math.floor(len / step));
    for (let i = 0; i <= count && n < 220; i++) {
      const t = i / count;
      dummy.position.set(x1 + (x2 - x1) * t, 0.03, z1 + (z2 - z1) * t);
      dummy.rotation.y = Math.atan2(x2 - x1, z2 - z1);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stones.setMatrixAt(n++, dummy.matrix);
    }
  };
  lay(0, 38, 0, -12);
  lay(0, 2, -12, -2);
  lay(0, 4, 12, 1);
  lay(0, 18, 6, 16);
  lay(2, 0, 16, -2);
  lay(16, -2, 16, -16);
  lay(-4, -8, -14, -20);
  stones.count = n;
  scene.add(stones);

  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 5), lambert(0x6b4632), 16);
  const tops = new THREE.InstancedMesh(new THREE.ConeGeometry(1.05, 2.1, 6), lambert(0x2f6a3c), 16);
  const trees: [number, number, number][] = [
    [-22, 24, 1], [20, 26, 0.8], [-24, 8, 1.1], [24, 10, 0.9], [-26, -8, 1],
    [26, -6, 0.85], [-22, -28, 1.2], [22, -28, 1], [-8, 28, 0.7], [10, 30, 0.75],
    [24, -16, 0.9], [-28, 16, 1], [18, 18, 0.6], [-18, 18, 0.7], [6, -26, 1], [-6, 22, 0.55],
  ];
  const leaf = new THREE.Color();
  trees.forEach((t, i) => {
    dummy.position.set(t[0], 0.45, t[1]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 0.8 + t[2] * 0.4, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(t[0], 1.55 + t[2] * 0.35, t[1]);
    dummy.scale.set(0.75 + t[2] * 0.35, 0.85 + t[2] * 0.4, 0.75 + t[2] * 0.35);
    dummy.updateMatrix();
    tops.setMatrixAt(i, dummy.matrix);
    leaf.setHSL(0.28 + (i % 4) * 0.02, 0.45, 0.28 + (i % 3) * 0.04);
    tops.setColorAt(i, leaf);
    boxes.push({ minX: t[0] - 0.3, maxX: t[0] + 0.3, minZ: t[1] - 0.3, maxZ: t[1] + 0.3 });
  });
  scene.add(trunks, tops);

  // Boundary walls, low, with a gap nowhere — the park is a courtyard.
  const wallH = 1.1;
  const wallT = 0.45;
  const addWall = (x: number, z: number, w: number, d: number) => {
    board(scene, w, wallH, d, x, wallH / 2, z, 0x8d5a4a);
    boxes.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  };
  addWall(0, -40, 78, wallT);
  addWall(-40, -2, wallT, 76);
  addWall(40, -2, wallT, 76);
  addWall(-22, 40, 36, wallT);
  addWall(22, 40, 36, wallT);

  buildGate(scene, boxes);
  buildStalls(scene, boxes);
  buildStage(scene, boxes);
  buildTea(scene, boxes);
  buildShadowBooth(scene, boxes);
  buildField(scene, boxes);

  const water = new THREE.Mesh(new THREE.CircleGeometry(4.4, 22), lambert(0x2a6e78, 0.92));
  water.rotation.x = -Math.PI / 2;
  water.position.set(7.2, 0.04, -9.2);
  scene.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.55, 0.18, 6, 18), lambert(0xb7aa96));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(7.2, 0.08, -9.2);
  scene.add(rim);
  const ellipses: Ellipse[] = [{ x: 7.2, z: -9.2, rx: 4.15, rz: 4.15 }];

  const flags: THREE.Mesh[] = [];
  const bannerColors = [0xc23a2e, 0xe2b15a, 0x2f6d62, 0x3d4f7c, 0xa32d2d];
  const poles: [number, number][] = [[-3.2, 26], [3.2, 22], [-3.2, 12], [3.2, 6], [-3.4, -6], [3.4, -4], [-8, 8], [11, 14]];
  poles.forEach((p, i) => {
    board(scene, 0.08, 3.2, 0.08, p[0], 1.6, p[1], 0x6b4226);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.55), new THREE.MeshLambertMaterial({
      color: bannerColors[i % bannerColors.length],
      side: THREE.DoubleSide,
    }));
    flag.position.set(p[0] + 0.45, 2.85, p[1]);
    scene.add(flag);
    flags.push(flag);
  });

  // Lanterns along the avenue.
  for (let i = 0; i < 8; i++) {
    const z = 28 - i * 5;
    const x = i % 2 === 0 ? -2.6 : 2.6;
    board(scene, 0.06, 2.4, 0.06, x, 1.2, z, 0x4a3428);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xffb15a, emissive: 0xff7a2a, emissiveIntensity: 0.7 }),
    );
    lamp.position.set(x, 2.45, z);
    scene.add(lamp);
  }

  return { boxes, ellipses, flags, water };
}

function buildGate(scene: THREE.Scene, boxes: Aabb[]) {
  const z = 30;
  const red = 0x9e2b2b;
  const gold = 0xe2b15a;
  for (const x of [-2.5, 2.5]) {
    board(scene, 0.55, 4.2, 0.55, x, 2.1, z, red);
    boxes.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4 });
  }
  board(scene, 6.4, 0.38, 0.7, 0, 4.15, z, red);
  board(scene, 5.4, 0.28, 0.9, 0, 4.55, z, gold);
  board(scene, 3.2, 0.7, 0.12, 0, 3.5, z + 0.34, 0xf3e2c4);
}

function buildStalls(scene: THREE.Scene, boxes: Aabb[]) {
  const spots: [number, number, number][] = [
    [-8.2, 22, 0], [-8.2, 16, 0], [-8.2, 11, 0],
    [10.5, 24, Math.PI], [10.5, 19, Math.PI],
  ];
  const awnings = [0xc23a2e, 0x2f6d62, 0x3d4f7c, 0xe2b15a, 0xa34b3a];
  spots.forEach((s, i) => {
    const g = new THREE.Group();
    g.position.set(s[0], 0, s[1]);
    g.rotation.y = s[2];
    board(g, 2.4, 0.9, 0.9, 0, 0.45, 0, 0x8a5a3c);
    board(g, 2.8, 0.08, 1.5, 0, 1.55, 0.2, awnings[i]);
    board(g, 0.08, 1.5, 0.08, -1.2, 0.75, -0.3, 0x5a3a28);
    board(g, 0.08, 1.5, 0.08, 1.2, 0.75, -0.3, 0x5a3a28);
    scene.add(g);
    boxes.push({ minX: s[0] - 1.3, maxX: s[0] + 1.3, minZ: s[1] - 0.7, maxZ: s[1] + 0.7 });
  });
  // Storyteller rug.
  const lot = LOTS.find((l) => l.id === 'market')!;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.55, 16), lambert(0x6b3038));
  const p = localToWorld(lot, 0, -0.2);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(p.x, 0.03, p.z);
  scene.add(rug);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 10), lambert(0x8a3a32));
  const dp = localToWorld(lot, -0.15, 0.45);
  drum.position.set(dp.x, 0.28, dp.z);
  scene.add(drum);
}

function buildStage(scene: THREE.Scene, boxes: Aabb[]) {
  const lot = LOTS.find((l) => l.id === 'stage')!;
  const g = new THREE.Group();
  g.position.set(lot.x, 0, lot.z);
  g.rotation.y = lot.yaw;
  board(g, 8.2, 0.5, 5.2, 0, 0.25, -0.7, 0x7a4a32);
  board(g, 8.6, 0.18, 0.4, 0, 0.58, 1.85, 0xc23a2e);
  board(g, 0.28, 3.2, 0.28, -3.7, 2.1, -1.6, 0x9e2b2b);
  board(g, 0.28, 3.2, 0.28, 3.7, 2.1, -1.6, 0x9e2b2b);
  board(g, 8.4, 0.28, 2.4, 0, 3.7, -1.5, 0x2f5d50);
  board(g, 7.2, 0.18, 1.6, 0, 3.95, -1.5, 0xe2b15a);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.1), new THREE.MeshLambertMaterial({ map: nightCloth() }));
  cloth.position.set(0, 2.15, -2.55);
  g.add(cloth);
  const lampL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffb15a, emissive: 0xff6a20, emissiveIntensity: 0.8 }));
  const lampR = lampL.clone();
  lampL.position.set(-2.4, 3.15, -1.2);
  lampR.position.set(2.4, 3.15, -1.2);
  g.add(lampL, lampR);
  scene.add(g);
  collider(boxes, lot, 0, -0.7, 4.1, 2.6);
}

function buildTea(scene: THREE.Scene, boxes: Aabb[]) {
  const lot = LOTS.find((l) => l.id === 'tea')!;
  const g = new THREE.Group();
  g.position.set(lot.x, 0, lot.z);
  g.rotation.y = lot.yaw;
  const posts: [number, number][] = [[-2.3, -1.6], [2.3, -1.6], [-2.3, 1.8], [2.3, 1.8]];
  for (const p of posts) {
    board(g, 0.16, 2.6, 0.16, p[0], 1.3, p[1], 0x8a3a32);
    collider(boxes, lot, p[0], p[1], 0.18, 0.18);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.15, 4), lambert(0x2f6d62));
  roof.position.y = 2.85;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  board(g, 1.5, 0.1, 1.5, 0, 0.72, 0.1, 0xc4a574);
  board(g, 0.12, 0.7, 0.12, 0, 0.35, 0.1, 0x6b4226);
  collider(boxes, lot, 0, 0.1, 0.7, 0.7);
  for (const c of [[-0.45, 0.15], [0.4, -0.15], [0.1, 0.4]]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.07, 6), lambert(0xf3e2c4));
    cup.position.set(c[0], 0.82, c[1]);
    g.add(cup);
  }
  scene.add(g);
}

function buildShadowBooth(scene: THREE.Scene, boxes: Aabb[]) {
  const lot = LOTS.find((l) => l.id === 'shadow')!;
  const g = new THREE.Group();
  g.position.set(lot.x, 0, lot.z);
  g.rotation.y = lot.yaw;
  board(g, 3.4, 2.4, 2.2, 0, 1.2, -0.4, 0x4a342c);
  board(g, 3.8, 0.2, 2.6, 0, 2.5, -0.4, 0x2a2428);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshLambertMaterial({ color: 0xf4e2b0, emissive: 0x6a3a18, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
  );
  screen.position.set(0, 1.45, 0.72);
  g.add(screen);
  const lamp = new THREE.PointLight(0xff9944, 0.6, 6, 1.5);
  lamp.position.set(0, 1.6, 0.2);
  g.add(lamp);
  scene.add(g);
  collider(boxes, lot, 0, -0.4, 1.7, 1.1);
}

function buildField(scene: THREE.Scene, boxes: Aabb[]) {
  const lot = LOTS.find((l) => l.id === 'field')!;
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(6.2, 20), lambert(0xb08960));
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.set(lot.x, 0.02, lot.z);
  scene.add(dirt);
  const g = new THREE.Group();
  g.position.set(lot.x, 0, lot.z);
  g.rotation.y = lot.yaw;
  board(g, 2.4, 1.1, 0.4, -4.2, 0.55, -1, 0x6b4226);
  board(g, 0.08, 1.6, 0.08, -4.6, 1.5, -0.7, 0xd0d4dc);
  board(g, 0.08, 1.6, 0.08, -3.8, 1.4, -0.7, 0xd0d4dc);
  // Training posts.
  for (const x of [-1.2, 1.3]) {
    board(g, 0.16, 1.7, 0.16, x, 0.85, 0.4, 0x8a5a3c);
    board(g, 0.7, 0.1, 0.1, x, 1.35, 0.4, 0x8a5a3c);
  }
  scene.add(g);
  collider(boxes, lot, -4.2, -1, 1.2, 0.35);
}
