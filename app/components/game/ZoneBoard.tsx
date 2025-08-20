"use client";

import React from 'react';
import { labelY, ZONES_SVG } from '@/app/lib/game/logic';
import type { Zone } from '@/app/lib/game/constants';

export function ZoneBoard({ attack, blocks, onAttack, onToggleBlock, hitZone, blockedZone, mode = 'auto' }:{
  attack: Zone | null; blocks: Zone[]; onAttack?:(z:Zone|null)=>void; onToggleBlock?:(z:Zone)=>void; hitZone?: Zone|null; blockedZone?: Zone|null; mode?: 'attack'|'blocks'|'auto';
}){
  const zones = Object.keys(ZONES_SVG) as Zone[];
  const isBlock = (z:Zone)=> blocks.includes(z);
  const handle = (z:Zone)=>{
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    const zoneElement = document.querySelector(`[data-zone="${z}"]`) as HTMLElement;
    if (zoneElement && typeof window !== 'undefined' && window.Telegram?.WebApp) {
      zoneElement.style.transform = 'scale(1.1)';
      zoneElement.style.transition = 'transform 0.15s ease-out';
      setTimeout(() => {
        zoneElement.style.transform = 'scale(1)';
      }, 150);
    }
    if (mode === 'blocks') { onToggleBlock?.(z); return; }
    if (mode === 'attack') { onAttack?.(attack===z ? null : z); return; }
    if (attack===null) onAttack?.(z); else onToggleBlock?.(z);
  };
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 140" className="w-full max-w-[120px] sm:max-w-xs mx-auto select-none">
        {zones.map(z => (
          <g key={z} onClick={()=>handle(z)} data-zone={z} className="transition-transform active:scale-95">
            <path d={ZONES_SVG[z]}
              className={["transition-colors duration-150 cursor-pointer",
                (hitZone===z) ? "fill-rose-600/50 stroke-rose-400" :
                (blockedZone===z) ? "fill-sky-600/40 stroke-sky-400" :
                (isBlock(z)) ? "fill-sky-500/20 stroke-sky-300" :
                (attack===z) ? "fill-amber-500/30 stroke-amber-400" : "fill-neutral-700/60 stroke-neutral-500"
              ].join(" ")}
              strokeWidth={1.5}
            />
            {/* Invisible oversized hitbox to increase tap target */}
            <path d={ZONES_SVG[z]} fill="transparent" stroke="black" strokeOpacity={0} strokeWidth={22} pointerEvents="stroke" />
            {isBlock(z) && (
              <text x="50" y={labelY(z)} textAnchor="middle" className="fill-sky-300 text-[8px] sm:text-[10px]">🛡</text>
            )}
            <title>{z}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}


