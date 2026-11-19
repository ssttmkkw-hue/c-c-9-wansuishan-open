export interface LotDef {
  id: string;
  name: string;
  /** World position of the lot anchor. Performers face local +Z (toward the audience). */
  x: number;
  z: number;
  /** Rotation of local +Z into the world. yaw 0 => +Z. */
  yaw: number;
  radius: number;
  /** Where a watcher stands, in local metres (x right, z forward). */
  seatLx: number;
  seatLz: number;
}

export const LOTS: LotDef[] = [
  { id: 'gate', name: '山门', x: 0, z: 30, yaw: Math.PI, radius: 7, seatLx: 0, seatLz: 4.5 },
  { id: 'market', name: '市井街', x: 7.4, z: 16, yaw: -Math.PI / 2, radius: 8.5, seatLx: 0, seatLz: 5.2 },
  { id: 'stage', name: '戏台', x: -15, z: -2, yaw: Math.PI / 2, radius: 10, seatLx: 0.4, seatLz: 7.2 },
  { id: 'tea', name: '茶棚', x: 15.2, z: 0.5, yaw: -Math.PI / 2, radius: 8, seatLx: 0, seatLz: 5.6 },
  { id: 'shadow', name: '皮影棚', x: 13.5, z: -18, yaw: Math.PI, radius: 7, seatLx: 0, seatLz: 5.2 },
  { id: 'field', name: '校场', x: -14, z: -22, yaw: 0, radius: 9, seatLx: 0, seatLz: 6.4 },
  { id: 'parade', name: '巡游道', x: 0, z: 8, yaw: Math.PI, radius: 7, seatLx: 2.4, seatLz: 0.2 },
];

export function lotById(id: string) {
  const lot = LOTS.find((l) => l.id === id);
  if (!lot) throw new Error(`unknown lot ${id}`);
  return lot;
}

export function lotForward(lot: LotDef) {
  return { x: Math.sin(lot.yaw), z: Math.cos(lot.yaw) };
}

/** Local +X of a yaw-rotated Object3D. Matches three.js rotation.y. */
export function lotRight(lot: LotDef) {
  return { x: Math.cos(lot.yaw), z: -Math.sin(lot.yaw) };
}

export function localToWorld(lot: LotDef, lx: number, lz: number) {
  const f = lotForward(lot);
  const r = lotRight(lot);
  return {
    x: lot.x + r.x * lx + f.x * lz,
    z: lot.z + r.z * lx + f.z * lz,
  };
}

export function seatWorld(lot: LotDef) {
  return localToWorld(lot, lot.seatLx, lot.seatLz);
}

/** Main visitor loop. Kept in the open so steering does not have to solve the pond. */
export const WALK_LOOP: [number, number][] = [
  [0, 34],
  [-1.2, 26],
  [-1.4, 18],
  [-2.2, 10],
  [-4, 4],
  [-9, -1],
  [-6, 5],
  [0, 7],
  [5, 3],
  [9.5, 8],
  [8, 16],
  [3, 22],
  [0, 28],
];

export const PARADE_ROUTE: [number, number][] = [
  [0, 32],
  [0, 22],
  [0, 12],
  [0, 2],
  [0, -8],
  [2, -14],
  [0, -8],
  [0, 6],
  [0, 20],
  [0, 32],
];
