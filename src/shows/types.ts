import type { Emotion, Gesture, PropName } from '../puppet/Puppet';

export interface RoleDef {
  id: string;
  name: string;
  robe: number;
  pants?: number;
  hair?: number;
  hat?: 'none' | 'scholar' | 'cap' | 'ribbon';
  prop?: PropName;
  home: [number, number];
}

export interface LineCue {
  t: number;
  role: string;
  text: string;
  en: string;
  gesture: Gesture;
  emotion: Emotion;
  x?: number;
  z?: number;
  sfx?: 'drum' | 'wood' | 'clap';
  react?: 'clap' | 'cheer';
  look?: string;
}

export interface LineAlt {
  /** Index into lines that may be replaced each loop. */
  line: number;
  options: Pick<LineCue, 'text' | 'en' | 'gesture' | 'emotion'>[];
}

export interface Score {
  id: string;
  title: string;
  titleEn: string;
  lotId: string;
  duration: number;
  /** Seconds added to park-time so neighbouring shows do not speak in unison. */
  phase: number;
  lookMode: 'audience' | 'group';
  groundY: number;
  roles: RoleDef[];
  lines: LineCue[];
  alts: LineAlt[];
}
