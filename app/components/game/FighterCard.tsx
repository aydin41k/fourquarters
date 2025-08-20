"use client";

import React from 'react';
import { getThemeColours } from '@/app/lib/ui/theme';
import { useTelegramSDK } from '@/app/hooks/useTelegramSDK';
import type { Zone } from '@/app/lib/game/constants';

export function FighterCard({ title, hp, hpMax, hpBar, lastAttack, lastBlocks, right }: { title: string; hp: number; hpMax: number; hpBar: number; lastAttack?: Zone; lastBlocks?: Zone[]; right?: boolean }) {
  const { theme } = useTelegramSDK();
  const colours = getThemeColours(theme);
  return (
    <div className={`rounded-3xl ${colours.card} p-3 sm:p-4 ${right ? "md:text-right" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        <span className={`text-xs sm:text-sm ${colours.textSecondary}`}>HP {hp}/{hpMax}</span>
      </div>
      <div className="h-2 sm:h-3 bg-neutral-800 rounded-xl overflow-hidden">
        <div className="h-full bg-emerald-600" style={{ width: `${hpBar}%` }} />
      </div>
      <div className={`mt-2 sm:mt-3 grid gap-1 text-xs sm:text-sm ${colours.textSecondary} ${right ? "md:justify-items-end" : ""}`}>
        <div><span className="text-neutral-500">Last attack:</span> {lastAttack ?? "—"}</div>
        <div><span className="text-neutral-500">Last blocks:</span> {lastBlocks?.length ? lastBlocks.join(" + ") : "—"}</div>
      </div>
    </div>
  );
}


