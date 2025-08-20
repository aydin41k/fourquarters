export const ZONES = ["Head", "Chest", "Torso", "Knees", "Feet"] as const;
export type Zone = typeof ZONES[number];

export type Level = 1 | 2;
export const HP_BY_LEVEL: Record<Level, number> = { 1: 50, 2: 120 };

// Damage model bonus thresholds
export const BONUS_THRESHOLDS = [0.64, 0.84, 0.94, 0.99] as const;


