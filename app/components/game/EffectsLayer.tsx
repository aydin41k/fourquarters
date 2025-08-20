"use client";

import React from 'react';

export type Fx = { id:number; kind:"dmg"|"slash"|"parry"; xPct:number; yPct:number; text?:string; ttl:number; side?: 'you' | 'opponent' };

export function EffectsLayer({fx}:{fx:Fx[]}){
  return (
    <div className="pointer-events-none absolute inset-0">
      {fx.map(f => f.kind==="dmg" ? (
        <div key={f.id} style={{left:`${f.xPct}%`, top:`${f.yPct}%`, transform:"translate(-50%,-50%)"}} className="absolute animate-[float_1.2s_ease-out_forwards] text-rose-300 font-extrabold drop-shadow text-lg md:text-2xl">{f.text}</div>
      ) : f.kind==="slash" ? (
        <div key={f.id} style={{left:`${f.xPct}%`, top:`${f.yPct}%`, transform:"translate(-50%,-50%) rotate(45deg)"}} className="absolute w-16 h-0.5 bg-rose-300/80 animate-[slash_.35s_ease-out_forwards]" />
      ) : (
        <div key={f.id} style={{left:`${f.xPct}%`, top:`${f.yPct}%`, transform:"translate(-50%,-50%)"}} className="absolute w-8 h-8 rounded-full bg-sky-300/60 animate-[parry_.25s_ease-out_forwards]" />
      ))}
    </div>
  );
}


