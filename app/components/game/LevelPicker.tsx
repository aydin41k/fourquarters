"use client";

import React from 'react';
import { useTelegramSDK } from '@/app/hooks/useTelegramSDK';
import { getThemeColours } from '@/app/lib/ui/theme';
import type { Level } from '@/app/lib/game/constants';

export function LevelPicker({ label, value, onChange }: { label: string; value: Level; onChange: (l: Level) => void }) {
  const { theme } = useTelegramSDK();
  const colours = getThemeColours(theme);
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs sm:text-sm ${colours.textSecondary}`}>{label}</span>
      <select
        className={`${colours.card} border rounded-xl px-2 py-1 text-xs sm:text-sm`}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) as Level)}
      >
        <option value={1}>Lv 1 (50 HP)</option>
        <option value={2}>Lv 2 (120 HP)</option>
      </select>
    </div>
  );
}


