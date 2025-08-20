import type { Level, Zone } from './constants';

export interface Fighter {
  name: string;
  level: Level;
  hpMax: number;
  hp: number;
  dealt: number;
  lastAttack?: Zone;
  lastBlocks?: Zone[];
}

export interface TurnChoices {
  attack: Zone | null;
  blocks: Zone[]; // exactly 2 when resolving
}


