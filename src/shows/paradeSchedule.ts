/** Parade windows in park-seconds from midnight. 36 park minutes ≈ 36 real seconds. */
export const PARADE_WINDOWS = [
  { start: 11 * 3600, length: 36 * 60, label: '午时' },
  { start: 15 * 3600, length: 36 * 60, label: '申时' },
];

export function paradeAt(parkTime: number) {
  const day = ((parkTime % 86400) + 86400) % 86400;
  const dayIndex = Math.floor(parkTime / 86400);
  for (const w of PARADE_WINDOWS) {
    if (day >= w.start && day < w.start + w.length) {
      const u = (day - w.start) / w.length;
      return { active: true as const, u, day, dayIndex, label: '巡游中', nextLabel: w.label };
    }
  }
  let next = PARADE_WINDOWS[0];
  let wait = PARADE_WINDOWS[0].start + 86400 - day;
  for (const w of PARADE_WINDOWS) {
    const delta = day < w.start ? w.start - day : w.start + 86400 - day;
    if (delta < wait) {
      wait = delta;
      next = w;
    }
  }
  return { active: false as const, u: 0, day, dayIndex, label: next.label, nextLabel: next.label };
}
