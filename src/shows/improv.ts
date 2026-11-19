import type { LineCue, Score } from './types';
import { hashStr } from '../util';

export function resolveLines(score: Score, loopIndex: number): LineCue[] {
  const lines = score.lines.map((line) => ({ ...line }));
  for (const alt of score.alts) {
    const line = lines[alt.line];
    if (!line || alt.options.length === 0) continue;
    const pick = hashStr(`${score.id}|${loopIndex}|${alt.line}`) % alt.options.length;
    Object.assign(line, alt.options[pick]);
  }
  return lines;
}
