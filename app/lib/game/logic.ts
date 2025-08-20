import { HP_BY_LEVEL, ZONES, type Zone } from './constants';
import type { Fighter } from './types';
import { damagePercent } from './utils';

export function makeFighter(name: string, level: keyof typeof HP_BY_LEVEL): Fighter {
  const hp = HP_BY_LEVEL[level];
  return { name, level, hpMax: hp, hp, dealt: 0 } as Fighter;
}

export function damageFor(attack: Zone, defenderBlocks: Zone[], attacker: Fighter): number {
  if (defenderBlocks.includes(attack)) return 0;
  const pct = damagePercent();
  const roll = attacker.hpMax * pct;
  return Math.max(1, Math.floor(roll));
}

export function zoneCenterPct(z: Zone){
  const map: Record<Zone,[number,number]> = {
    Head:[50,15], Chest:[50,50], Torso:[50,72], Knees:[50,102], Feet:[50,128]
  };
  const [x,y] = map[z];
  return { xPct: x, yPct: (y/140)*100 };
}

export function labelY(z: Zone){
  return ({Head:18, Chest:52, Torso:76, Knees:104, Feet:130} as Record<Zone, number>)[z];
}

export const ZONES_SVG: Record<Zone,string> = {
  Head: "M50 5 L65 20 L50 35 L35 20 Z",
  Chest: "M35 40 L65 40 L70 60 L30 60 Z",
  Torso: "M30 60 L70 60 L65 85 L35 85 Z",
  Knees: "M38 95 L62 95 L62 110 L38 110 Z",
  Feet: "M35 120 L65 120 L60 135 L40 135 Z",
};

export { ZONES };


