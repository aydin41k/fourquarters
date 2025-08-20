import { BONUS_THRESHOLDS } from './constants';

export function pickTwoDistinct<T>(arr: readonly T[]): [T, T] {
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * arr.length);
  while (j === i) j = Math.floor(Math.random() * arr.length);
  const a = i < j ? i : j;
  const b = i < j ? j : i;
  return [arr[a], arr[b]] as [T, T];
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function damagePercent(): number {
  const u = Math.random();
  const steps = BONUS_THRESHOLDS.reduce((acc, t) => acc + (u >= t ? 1 : 0), 0);
  return 0.18 + 0.02 * steps;
}

export function hpBarPercent(hp: number, hpMax: number) {
  return Math.round((hp / hpMax) * 100);
}

export function formatBlocks(blocks: readonly string[]) {
  return blocks.length ? blocks.join(' + ') : '(none)';
}


