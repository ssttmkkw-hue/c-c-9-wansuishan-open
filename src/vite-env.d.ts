/// <reference types="vite/client" />

export interface LotInfo {
  id: string;
  name: string;
  x: number;
  z: number;
  show: string | null;
}

export interface ShowInfo {
  id: string;
  title: string;
  titleEn: string;
  lotId: string;
}

export type ShotKind = 'wide' | 'three' | 'close';

export interface ParkHook {
  ready: boolean;
  readonly time: number;
  setTime: (t: number) => void;
  lots: LotInfo[];
  teleport: (x: number, y: number, z: number) => void;
  watch: (lotId: string, shot?: ShotKind) => void;
  listShows: () => ShowInfo[];
  fps: number;
  quality: string;
  draws: number;
  tris: number;
  lod: { full: number; far: number };
  player: { x: number; y: number; z: number; yaw: number };
  setMuted: (muted: boolean) => void;
  frame: (which: string) => void;
  face: (yaw: number) => void;
  inspect: () => {
    focus: number[];
    face: number[];
    cam: number[];
    look: number[];
    shot: string;
    speaker: string;
  };
}

declare global {
  interface Window {
    __park?: ParkHook;
  }
}

export {};
