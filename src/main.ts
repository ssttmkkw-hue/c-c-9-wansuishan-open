import * as THREE from 'three';
import './style.css';
import { Puppet, type Drive } from './puppet/Puppet';
import { buildWorld } from './world/buildWorld';
import { resolve } from './park/collide';
import { LOTS, lotById, lotForward, lotRight, seatWorld } from './park/layout';
import { SCORES } from './shows/scores';
import { ActorShow } from './shows/ActorShow';
import { Crowd } from './crowd/Crowd';
import { AudioBus } from './audio/AudioBus';
import { Hud, type TagView } from './ui/Hud';
import type { ParkHook, ShotKind } from './vite-env';
import { clamp } from './util';

const PARK_START = 9 * 3600;

const app = document.getElementById('app');
if (!app) throw new Error('app');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3d2a6);
scene.fog = new THREE.Fog(0xf3d2a6, 32, 92);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.12, 180);
const camLook = new THREE.Vector3();

scene.add(new THREE.HemisphereLight(0xffe6c4, 0x6a7a48, 0.85));
scene.add(new THREE.AmbientLight(0xfff2e0, 0.28));
const sun = new THREE.DirectionalLight(0xfff4dd, 1.45);
sun.position.set(18, 28, 12);
scene.add(sun);

const world = buildWorld(scene);
const shows = SCORES.map((score) => {
  const show = new ActorShow(score);
  scene.add(show.group);
  return show;
});
const crowd = new Crowd(scene, world.boxes, world.ellipses);
const audio = new AudioBus();

const player = new Puppet({ robe: 0x2e4a7a, pants: 0x1d2430, hair: 0x3a2a22, sash: 0xf0d7a4, scale: 1, seed: 2 });
const playerPos = new THREE.Vector3(0, 0, 35);
let playerYaw = Math.PI;
player.group.position.copy(playerPos);
player.group.rotation.y = playerYaw;
scene.add(player.group);

const keys = new Set<string>();
let camYaw = Math.PI;
let pitch = 0.42;
let pointerDown = false;
let watchId: string | null = null;
let watchShot: ShotKind | 'cycle' = 'cycle';
let watchLock = false;
let linger = 0;
let lingerLot: string | null = null;
let camOverride: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
let snapCam = true;
let parkTime = PARK_START;
let fps = 60;
const head = new THREE.Vector3();
const ahead = new THREE.Vector3();
const tmp = new THREE.Vector3();

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDown = true;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointerup', () => {
  pointerDown = false;
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!pointerDown) return;
  camYaw -= e.movementX * 0.005;
  pitch = clamp(pitch + e.movementY * 0.003, 0.18, 1.15);
  if (Math.abs(e.movementX) + Math.abs(e.movementY) > 4) cancelWatch();
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function movingInput() {
  return ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some((k) => keys.has(k));
}

function cancelWatch() {
  watchId = null;
  watchLock = false;
  linger = 0;
}

function showByLot(id: string) {
  return shows.find((s) => s.lotId === id) ?? null;
}

const hud = new Hud((muted) => {
  audio.unlock();
  audio.setMuted(muted);
});

const playerInfo = { x: playerPos.x, y: playerPos.y, z: playerPos.z, yaw: playerYaw };
const lotsInfo = LOTS.map((lot) => ({
  id: lot.id,
  name: lot.name,
  x: lot.x,
  z: lot.z,
  show: null as string | null,
}));

const hook: ParkHook = {
  ready: false,
  get time() {
    return parkTime;
  },
  setTime(t: number) {
    parkTime = t;
  },
  lots: lotsInfo,
  teleport(x: number, y: number, z: number) {
    playerPos.set(x, y, z);
    camOverride = null;
    cancelWatch();
    snapCam = true;
    camYaw = playerYaw;
  },
  face(yaw: number) {
    playerYaw = yaw;
    camYaw = yaw;
    snapCam = true;
  },
  inspect() {
    const show = showByLot(watchId ?? 'stage');
    const focus = new THREE.Vector3();
    const face = new THREE.Vector3();
    show?.focusWorld(focus);
    show?.speakerForward(face);
    return {
      focus: [focus.x, focus.y, focus.z],
      face: [face.x, face.y, face.z],
      cam: [camera.position.x, camera.position.y, camera.position.z],
      look: [camLook.x, camLook.y, camLook.z],
      shot: String(watchShot),
      speaker: show?.speakerName ?? '',
    };
  },
  watch(lotId: string, shot?: ShotKind) {
    if (!LOTS.some((l) => l.id === lotId)) return;
    const seat = seatWorld(lotById(lotId));
    playerPos.set(seat.x, 0, seat.z);
    const lot = lotById(lotId);
    const f = lotForward(lot);
    playerYaw = Math.atan2(-f.x, -f.z);
    watchId = lotId;
    watchShot = shot ?? 'cycle';
    watchLock = true;
    camOverride = null;
    linger = 2;
    snapCam = true;
  },
  listShows() {
    return shows.map((s) => ({ id: s.id, title: s.title, titleEn: s.titleEn, lotId: s.lotId }));
  },
  get fps() {
    return fps;
  },
  player: playerInfo,
  setMuted(muted: boolean) {
    audio.setMuted(muted);
  },
  frame(which: string) {
    if (which === 'overview') {
      camOverride = {
        pos: new THREE.Vector3(24, 28, 40),
        target: new THREE.Vector3(0, 1, 6),
      };
      cancelWatch();
      return;
    }
    hook.watch(which, 'wide');
  },
};
window.__park = hook;

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  fps += (1 / Math.max(dt, 1e-4) - fps) * 0.08;
  parkTime += dt * 60;

  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = sprint ? 5.1 : 2.7;
  const fx = Math.sin(camYaw);
  const fz = Math.cos(camYaw);
  const rx = -fz;
  const rz = fx;
  let mx = 0;
  let mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) {
    mx += fx;
    mz += fz;
  }
  if (keys.has('KeyS') || keys.has('ArrowDown')) {
    mx -= fx;
    mz -= fz;
  }
  if (keys.has('KeyD') || keys.has('ArrowRight')) {
    mx += rx;
    mz += rz;
  }
  if (keys.has('KeyA') || keys.has('ArrowLeft')) {
    mx -= rx;
    mz -= rz;
  }
  const mag = Math.hypot(mx, mz);
  if (mag > 0) {
    mx = (mx / mag) * speed;
    mz = (mz / mag) * speed;
    cancelWatch();
    camOverride = null;
    const desired = Math.atan2(mx, mz);
    playerYaw += Math.atan2(Math.sin(desired - playerYaw), Math.cos(desired - playerYaw)) * Math.min(1, dt * 8);
  }
  playerPos.x += mx * dt;
  playerPos.z += mz * dt;
  if (playerPos.y < 1.2) {
    const resolved = resolve(playerPos.x, playerPos.z, 0.38, world.boxes, world.ellipses);
    playerPos.x = resolved.x;
    playerPos.z = resolved.z;
    playerPos.y = 0;
  }
  player.group.position.copy(playerPos);
  player.group.rotation.y = playerYaw;

  const nearest = nearestLot(playerPos.x, playerPos.z);
  if (movingInput()) {
    /* watch already cancelled */
  } else if (!watchLock) {
    if (nearest && nearest.d < nearest.lot.radius && showByLot(nearest.lot.id)) {
      if (lingerLot !== nearest.lot.id) {
        lingerLot = nearest.lot.id;
        linger = 0;
      }
      linger += dt;
      if (linger > 1.05) {
        watchId = nearest.lot.id;
        watchShot = 'cycle';
      }
    } else {
      linger = 0;
      lingerLot = null;
      watchId = null;
    }
  }

  for (const show of shows) {
    show.update(dt, parkTime, (cue) => {
      if (cue.sfx) audio.hit(cue.sfx);
      if (cue.react) crowd.react(show.lotId, cue.react);
    });
    show.focusWorld(head);
    crowd.setFocus(show.lotId, head);
  }
  const hot = new Map<string, boolean>();
  for (const show of shows) hot.set(show.lotId, true);
  crowd.update(dt, playerPos, hot);

  let lookTarget: THREE.Vector3 | null = null;
  let bestLook = 64;
  for (const show of shows) {
    const d = playerPos.distanceToSquared(show.origin);
    if (d < bestLook) {
      bestLook = d;
      show.focusWorld(tmp);
      lookTarget = tmp.clone();
    }
  }
  ahead.set(Math.sin(playerYaw), 0, Math.cos(playerYaw)).multiplyScalar(5).add(playerPos);
  ahead.y = 1.35;
  const drive: Drive = {
    speed: mag,
    gesture: 'idle',
    emotion: 'neutral',
    speaking: 0,
    lookAt: bestLook < 36 ? lookTarget : ahead,
    prop: 'none',
  };
  player.update(dt, drive);

  const watched = watchId ? showByLot(watchId) : null;
  let desiredPos = new THREE.Vector3();
  let desiredLook = new THREE.Vector3(playerPos.x, playerPos.y + 1.35, playerPos.z);
  if (camOverride) {
    desiredPos.copy(camOverride.pos);
    desiredLook.copy(camOverride.target);
  } else if (watched) {
    const shot = resolveShot(watchShot, now);
    const framed = frameShow(watched, shot);
    desiredPos.copy(framed.pos);
    desiredLook.copy(framed.look);
  } else {
    const horiz = 5.3 * Math.cos(pitch * 0.85);
    desiredPos.set(
      desiredLook.x - Math.sin(camYaw) * horiz,
      desiredLook.y + Math.sin(pitch) * 3.4,
      desiredLook.z - Math.cos(camYaw) * horiz,
    );
  }
  const k = snapCam ? 1 : 1 - Math.exp(-dt * (watched || camOverride ? 3.2 : 6));
  camera.position.lerp(desiredPos, k);
  camLook.lerp(desiredLook, k);
  camera.lookAt(camLook);
  snapCam = false;

  const t = now / 1000;
  world.flags.forEach((flag, i) => {
    flag.rotation.y = Math.sin(t * 1.6 + i) * 0.35;
  });

  const active = watched ?? (nearest && nearest.d < nearest.lot.radius + 2 ? showByLot(nearest.lot.id) : null);
  const line = active?.current ?? null;
  const rows = [
    ...shows.map((s) => ({
      name: lotById(s.lotId).name,
      title: s.title,
      state: '演出中',
      live: true,
      here: nearest?.lot.id === s.lotId,
    })),
    { name: '皮影棚', title: '待灯', state: '午后', live: false, here: false },
    { name: '校场', title: '试刃', state: '申时', live: false, here: false },
    { name: '巡游道', title: '河灯巡游', state: '午时·筹备', live: false, here: false },
  ];
  const tags: TagView[] = [];
  for (const show of shows) {
    const near = playerPos.distanceTo(show.origin) < 16 || watchId === show.lotId;
    if (!near) continue;
    for (const tag of show.actorTags()) {
      tag.head(head);
      tags.push({ text: tag.name, world: head.clone(), emphasis: tag.speaking });
    }
  }
  if (watchShot !== 'close') {
    for (const lot of LOTS) {
      if (playerPos.distanceToSquared(new THREE.Vector3(lot.x, 0, lot.z)) > 38 * 38) continue;
      tags.push({
        text: lot.name,
        world: new THREE.Vector3(lot.x, 3.3, lot.z),
      });
    }
  }
  hud.update({
    parkTime,
    rows,
    watching: !!watched,
    title: watched?.title ?? active?.title ?? '',
    titleEn: watched?.titleEn ?? active?.titleEn ?? '',
    place: watched ? lotById(watched.lotId).name : '',
    speaker: line ? active?.speakerName ?? '' : '',
    zh: line?.text ?? (nearest ? '' : ''),
    en: line?.en ?? '',
    tags,
    camera,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const distGate = Math.hypot(playerPos.x, playerPos.z - 16);
  audio.setMurmur(clamp(1 - distGate / 28, 0, 1) * 0.5 + (nearest && nearest.d < 10 ? 0.4 : 0));

  for (const row of lotsInfo) {
    row.show = showByLot(row.id)?.title ?? null;
  }
  playerInfo.x = playerPos.x;
  playerInfo.y = playerPos.y;
  playerInfo.z = playerPos.z;
  playerInfo.yaw = playerYaw;

  renderer.render(scene, camera);
  hook.ready = true;
});

function nearestLot(x: number, z: number) {
  let best: { lot: (typeof LOTS)[number]; d: number } | null = null;
  for (const lot of LOTS) {
    const d = Math.hypot(lot.x - x, lot.z - z);
    if (!best || d < best.d) best = { lot, d };
  }
  return best;
}

function resolveShot(shot: ShotKind | 'cycle', now: number): ShotKind {
  if (shot !== 'cycle') return shot;
  const order: ShotKind[] = ['three', 'wide', 'close'];
  return order[Math.floor(now / 7000) % order.length];
}

function frameShow(show: ActorShow, shot: ShotKind) {
  const lot = lotById(show.lotId);
  const fwd = lotForward(lot);
  const right = lotRight(lot);
  const focus = show.focusWorld(new THREE.Vector3());
  if (shot === 'close') {
    const face = show.speakerForward(new THREE.Vector3());
    const side = new THREE.Vector3(-face.z, 0, face.x);
    const pos = focus.clone().addScaledVector(face, 1.15).addScaledVector(side, 0.22);
    pos.y += 0.04;
    return { pos, look: focus };
  }
  const seat = seatWorld(lot);
  if (shot === 'three') {
    const pos = new THREE.Vector3(seat.x + right.x * 1.8, 1.9, seat.z + right.z * 1.8);
    return { pos, look: focus };
  }
  const pos = new THREE.Vector3(seat.x + fwd.x * 1.4, 2.55, seat.z + fwd.z * 1.4);
  return { pos, look: new THREE.Vector3(lot.x, 1.35, lot.z) };
}
