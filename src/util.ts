export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const damp = (a: number, b: number, rate: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-rate * dt));

export function wrapAngle(d: number) {
  return Math.atan2(Math.sin(d), Math.cos(d));
}

export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function formatParkTime(t: number) {
  const day = ((t % 86400) + 86400) % 86400;
  const h = Math.floor(day / 3600);
  const m = Math.floor((day % 3600) / 60);
  const names = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const idx = Math.floor(((h + 1) % 24) / 2);
  return `${names[idx]}时 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
