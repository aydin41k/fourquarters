"use client";

import React, { useMemo, useState, useRef } from "react";

// --- Minimal, single-file battle playground (NO SPRITES) ---
// Zones per your instruction
const ZONES = ["Head", "Chest", "Torso", "Knees", "Feet"] as const;
type Zone = typeof ZONES[number];

type Level = 1 | 2;
const HP_BY_LEVEL: Record<Level, number> = { 1: 50, 2: 120 };

// Damage model: base 18% of attacker's HP with discrete bonus steps (branch-light)
// Probabilities: +0% (64%), +2% (20%), +4% (10%), +6% (5%), +8% (1%)
const BONUS_THRESHOLDS = [0.64, 0.84, 0.94, 0.99] as const;

// Helpers
function pickTwoDistinct<T>(arr: readonly T[]): [T, T] {
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * arr.length);
  while (j === i) j = Math.floor(Math.random() * arr.length);
  const a = i < j ? i : j;
  const b = i < j ? j : i;
  return [arr[a], arr[b]];
}

function formatBlocks(blocks: Zone[]) {
  return blocks.length ? blocks.join(" + ") : "(none)";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Branch-light helper to compute damage percent using cumulative thresholds
function damagePercent(): number {
  const u = Math.random();
  const steps = BONUS_THRESHOLDS.reduce((acc, t) => acc + (u >= t ? 1 : 0), 0);
  return 0.18 + 0.02 * steps; // 18% base + 2% per passed threshold
}

// Types
interface Fighter {
  name: string;
  level: Level;
  hpMax: number;
  hp: number;
  dealt: number; // total damage dealt across the duel
  lastAttack?: Zone;
  lastBlocks?: Zone[];
}

interface TurnChoices {
  attack: Zone | null;
  blocks: Zone[]; // exactly 2 when resolving
}

// === Cinematic Zone Board + Effects ===
function zoneCenterPct(z: Zone){
  const map: Record<Zone,[number,number]> = {
    Head:[50,15], Chest:[50,50], Torso:[50,72], Knees:[50,102], Feet:[50,128]
  };
  const [x,y] = map[z];
  return { xPct: x, yPct: (y/140)*100 };
}

function ZoneBoard({ attack, blocks, onAttack, onToggleBlock, hitZone, blockedZone, mode = 'auto' }:{
  attack: Zone | null; blocks: Zone[]; onAttack?:(z:Zone|null)=>void; onToggleBlock?:(z:Zone)=>void; hitZone?: Zone|null; blockedZone?: Zone|null; mode?: 'attack'|'blocks'|'auto';
}){
  const Z: Record<Zone,string> = {
    Head: "M50 5 L65 20 L50 35 L35 20 Z",
    Chest: "M35 40 L65 40 L70 60 L30 60 Z",
    Torso: "M30 60 L70 60 L65 85 L35 85 Z",
    Knees: "M38 95 L62 95 L62 110 L38 110 Z",
    Feet: "M35 120 L65 120 L60 135 L40 135 Z",
  };
  const zones = Object.keys(Z) as Zone[];
  const isBlock = (z:Zone)=> blocks.includes(z);
  const handle = (z:Zone)=>{
    if (mode === 'blocks') { onToggleBlock?.(z); return; }
    if (mode === 'attack') { onAttack?.(attack===z ? null : z); return; }
    if (attack===null) onAttack?.(z); else onToggleBlock?.(z);
  };
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 140" className="w-full max-w-xs mx-auto select-none">
        {zones.map(z => (
          <g key={z} onClick={()=>handle(z)}>
            <path d={Z[z]}
              className={["transition-all duration-150 cursor-pointer",
                (hitZone===z) ? "fill-rose-600/50 stroke-rose-400" :
                (blockedZone===z) ? "fill-sky-600/40 stroke-sky-400" :
                (isBlock(z)) ? "fill-sky-500/20 stroke-sky-300" :
                (attack===z) ? "fill-amber-500/30 stroke-amber-400" : "fill-neutral-700/60 stroke-neutral-500"
              ].join(" ")}
              strokeWidth={1.5}
            />
            {isBlock(z) && (
              <text x="50" y={labelY(z)} textAnchor="middle" className="fill-sky-300 text-[10px]">🛡</text>
            )}
            <title>{z}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
function labelY(z:Zone){ return ({Head:18, Chest:52, Torso:76, Knees:104, Feet:130} as Record<Zone, number>)[z]; }

type Fx = { id:number; kind:"dmg"|"slash"|"parry"; xPct:number; yPct:number; text?:string; ttl:number };
function EffectsLayer({fx}:{fx:Fx[]}){
  return (
    <div className="pointer-events-none absolute inset-0">
      {fx.map(f => f.kind==="dmg" ? (
        <div key={f.id} style={{left:`${f.xPct}%`, top:`${f.yPct}%`, transform:"translate(-50%,-50%)"}} className="absolute animate-[float_.8s_ease-out_forwards] text-rose-300 font-bold drop-shadow">{f.text}</div>
      ) : f.kind==="slash" ? (
        <div key={f.id} style={{left:`${f.xPct}%`, top:`${f.yPct}%`, transform:"translate(-50%,-50%) rotate(45deg)"}} className="absolute w-16 h-0.5 bg-rose-300/80 animate-[slash_.35s_ease-out_forwards]" />
      ) : (
        <div key={f.id} style={{left:`${f.xPct}%`, top:`${f.yPct}%`, transform:"translate(-50%,-50%)"}} className="absolute w-8 h-8 rounded-full bg-sky-300/60 animate-[parry_.25s_ease-out_forwards]" />
      ))}
    </div>
  );
}

const FX_CSS = `
  @keyframes float { 0%{transform:translate(-50%,-50%) translateY(0);opacity:1} 100%{transform:translate(-50%,-50%) translateY(-24px);opacity:0} }
  @keyframes slash { 0%{opacity:.9} 100%{opacity:0; transform:translate(-50%,-50%) rotate(45deg) translate(24px,-24px)} }
  @keyframes parry { 0%{transform:translate(-50%,-50%) scale(.4); opacity:.9} 100%{transform:translate(-50%,-50%) scale(1.6); opacity:0} }
  @keyframes shake { 0%{transform:translateX(0)} 25%{transform:translateX(2px)} 50%{transform:translateX(-2px)} 75%{transform:translateX(1px)} 100%{transform:translateX(0)} }
  .shake { animation: shake .12s linear 1 }
`;

export default function BattlePrototype() {
  const [p1, setP1] = useState<Fighter>(() => makeFighter("You", 1));
  const [bot, setBot] = useState<Fighter>(() => makeFighter("Bot", 1));

  const [choicesP1, setChoicesP1] = useState<TurnChoices>({ attack: null, blocks: [] });
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<string[]>(["Battle started. Make your choices and click Resolve Turn."]);
  const [isOver, setIsOver] = useState(false);
  const [finalRewards, setFinalRewards] = useState<{you:number; bot:number} | null>(null);
  const [finalOutcome, setFinalOutcome] = useState<"You win"|"Bot wins"|"Draw"|null>(null);

  // FX state
  const [fx, setFx] = useState<Fx[]>([]);
  const fxId = useRef(1);

  // Last outcome markers on your board
  const [lastHitZone, setLastHitZone] = useState<Zone|null>(null);
  const [lastBlockedZone, setLastBlockedZone] = useState<Zone|null>(null);
  const [lastBotHitZone, setLastBotHitZone] = useState<Zone|null>(null);
  const [lastBotBlockedZone, setLastBotBlockedZone] = useState<Zone|null>(null);
  // Removed unused noop function
  const [showBotBlocks, setShowBotBlocks] = useState(false);
  function spawnFx(f: Omit<Fx,"id">){ const id = fxId.current++; setFx(s=>[...s,{...f,id}]); setTimeout(()=> setFx(s=>s.filter(x=>x.id!==id)), f.ttl); }

  // --- Audio (hit/block) ---
  const audioRef = useRef<AudioContext | null>(null);
  function ensureAudio(){
    try{
      if(!audioRef.current){
        // @ts-expect-error - AudioContext types may vary by browser
        const C = ((window as Record<string, unknown>).AudioContext || (window as Record<string, unknown>).webkitAudioContext) as typeof AudioContext;
        audioRef.current = new C();
      }
      // Resume if suspended (autoplay policy)
      if(audioRef.current?.state === 'suspended') audioRef.current.resume();
    }catch{ /* ignore */ }
    return audioRef.current;
  }
  function beep(ctx: AudioContext, freq: number, duration=0.16, type: OscillatorType='sine', gain=0.2){
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now+duration);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(now+duration+0.02);
  }
  function playHit(ctx: AudioContext){
    beep(ctx, 180, 0.12, 'triangle', 0.25);
    setTimeout(()=> beep(ctx, 120, 0.08, 'sawtooth', 0.18), 60);
  }
  function playBlock(ctx: AudioContext){
    beep(ctx, 800, 0.06, 'square', 0.12);
    setTimeout(()=> beep(ctx, 500, 0.08, 'square', 0.10), 40);
  }

  function makeNew(p: Level, b: Level) {
    setP1(makeFighter("You", p));
    setBot(makeFighter("Bot", b));
    setRound(1);
    setLog(["Battle started. Make your choices and click Resolve Turn."]);
    setIsOver(false);
    setChoicesP1({ attack: null, blocks: [] });
    setLastBlockedZone(null); setLastHitZone(null);
    setLastBotBlockedZone(null); setLastBotHitZone(null);
    setShowBotBlocks(false);
    setFinalRewards(null);
    setFinalOutcome(null);
  }

  function resolveTurn() {
    if (isOver) return;
    // Guard: require exactly 1 attack and 2 blocks
    if (!choicesP1.attack || choicesP1.blocks.length !== 2) {
      alert("Pick one attack zone and exactly two block zones.");
      return;
    }

    // Bot picks randomly each turn
    const [b1, b2] = pickTwoDistinct(ZONES);
    const botBlocks: Zone[] = [b1, b2];
    const botAttack: Zone = ZONES[Math.floor(Math.random() * ZONES.length)];

    // Compute damage (blocked = 0)
    const dmgToBot = damageFor(choicesP1.attack, botBlocks, p1);
    const dmgToP1 = damageFor(botAttack, choicesP1.blocks, bot);

    // Cap applied damage to remaining HP (no overkill for rewards/log)
    const appliedToBot = Math.min(dmgToBot, bot.hp);
    const appliedToP1 = Math.min(dmgToP1, p1.hp);

    // Visual FX on the board
    const pBlocked = botBlocks.includes(choicesP1.attack!);
    const bBlocked = choicesP1.blocks.includes(botAttack);

    // Sounds: play YOUR outcome first, then opponent's
    const _ctx = ensureAudio();
    if (_ctx) {
      (pBlocked ? playBlock : playHit)(_ctx);
      setTimeout(() => (bBlocked ? playBlock : playHit)(_ctx), 350);
    }

    // Persist markers: YOU (incoming) and BOT (outgoing)
    setLastBlockedZone(bBlocked ? botAttack : null);
    setLastHitZone(!bBlocked ? botAttack : null);
    setLastBotBlockedZone(pBlocked ? choicesP1.attack! : null);
    setLastBotHitZone(!pBlocked ? choicesP1.attack! : null);
    setTimeout(() => {
      setLastBlockedZone(null); setLastHitZone(null);
      setLastBotBlockedZone(null); setLastBotHitZone(null);
      setShowBotBlocks(false);
    }, 2200);
    const posPlayer = zoneCenterPct(choicesP1.attack!);
    const posBot = zoneCenterPct(botAttack);
    spawnFx({ kind: pBlocked ? "parry" : "slash", xPct: posPlayer.xPct, yPct: posPlayer.yPct, ttl: pBlocked ? 250 : 350 });
    if (!pBlocked && appliedToBot>0) spawnFx({ kind:"dmg", xPct: posPlayer.xPct, yPct: Math.max(0,posPlayer.yPct-6), text:`-${appliedToBot}`, ttl: 900 });
    spawnFx({ kind: bBlocked ? "parry" : "slash", xPct: posBot.xPct, yPct: posBot.yPct, ttl: bBlocked ? 250 : 350 });
    if (!bBlocked && appliedToP1>0) spawnFx({ kind:"dmg", xPct: posBot.xPct, yPct: Math.max(0,posBot.yPct-6), text:`-${appliedToP1}`, ttl: 900 });
    const card = document.getElementById("controlsCard");
    if (card){ card.classList.add("shake"); setTimeout(()=> card.classList.remove("shake"), 140); }

    // Apply
    setBot(prev => ({
      ...prev,
      hp: clamp(prev.hp - dmgToBot, 0, prev.hpMax),
      dealt: prev.dealt + appliedToP1,
      lastAttack: botAttack,
      lastBlocks: botBlocks,
    }));
    setShowBotBlocks(true);

    setP1(prev => ({
      ...prev,
      hp: clamp(prev.hp - dmgToP1, 0, prev.hpMax),
      dealt: prev.dealt + appliedToBot,
      lastAttack: choicesP1.attack || undefined,
      lastBlocks: choicesP1.blocks,
    }));

    const turnLines: string[] = [];
    turnLines.push(`Round ${round}: You attack ${choicesP1.attack}${botBlocks.includes(choicesP1.attack!) ? " (blocked)" : ""}, block ${formatBlocks(choicesP1.blocks)}. You deal ${appliedToBot} damage.`);
    turnLines.push(`          Bot attacks ${botAttack}${choicesP1.blocks.includes(botAttack) ? " (blocked)" : ""}, blocks ${formatBlocks(botBlocks)}. Bot deals ${appliedToP1} damage.`);

    // Determine end state after state updates by reading next values via compute
    const nextBotHp = clamp(bot.hp - dmgToBot, 0, bot.hpMax);
    const nextP1Hp = clamp(p1.hp - dmgToP1, 0, p1.hpMax);

    let outcome: string | null = null;
    if (nextBotHp <= 0 && nextP1Hp <= 0) outcome = "Draw";
    else if (nextBotHp <= 0) outcome = "You win";
    else if (nextP1Hp <= 0) outcome = "Bot wins";

    if (outcome) {
      // Rewards: winner gets 100% of HP done, loser gets 50%
      const youDealt = p1.dealt + appliedToBot;
      const botDealt = bot.dealt + appliedToP1;

      let youReward = 0, botReward = 0;
      if (outcome === "Draw") { youReward = Math.floor(youDealt * 0.5); botReward = Math.floor(botDealt * 0.5); }
      else if (outcome === "You win") { youReward = youDealt; botReward = Math.floor(botDealt * 0.5); }
      else { youReward = Math.floor(youDealt * 0.5); botReward = botDealt; }
      setFinalRewards({ you: youReward, bot: botReward });
      setFinalOutcome(outcome as "You win"|"Bot wins"|"Draw");

      if (outcome === "Draw") {
        turnLines.push(`Result: Draw. Rewards — You: ${Math.floor(youDealt * 0.5)}, Bot: ${Math.floor(botDealt * 0.5)}.`);
      } else if (outcome === "You win") {
        turnLines.push(`Result: You win. Rewards — You: ${youDealt}, Bot: ${Math.floor(botDealt * 0.5)}.`);
      } else {
        turnLines.push(`Result: Bot wins. Rewards — Bot: ${botDealt}, You: ${Math.floor(youDealt * 0.5)}.`);
      }
      setIsOver(true);
    }

    setRound(r => r + 1);
    setLog(prev => [...turnLines, ...prev]);
    setChoicesP1({ attack: null, blocks: [] }); // reset selections after resolve
  }

  const hpBarP1 = useMemo(() => hpBarPercent(p1.hp, p1.hpMax), [p1.hp, p1.hpMax]);
  const hpBarBot = useMemo(() => hpBarPercent(bot.hp, bot.hpMax), [bot.hp, bot.hpMax]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 p-6">
      <style>{FX_CSS}</style>
      <div className="max-w-4xl mx-auto grid gap-4">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">FOUR QUARTERS · Battleground</h1>
          <div className="flex items-center gap-2 text-sm">
            <LevelPicker label="You" value={p1.level} onChange={(lvl) => makeNew(lvl, bot.level)} />
            <LevelPicker label="Bot" value={bot.level} onChange={(lvl) => makeNew(p1.level, lvl)} />
            <button className="ml-2 rounded-2xl px-3 py-1 bg-neutral-800 hover:bg-neutral-700" onClick={() => makeNew(p1.level, bot.level)}>Restart</button>
          </div>
        </header>

        {/* Fighters */}
        <div className="grid md:grid-cols-2 gap-4">
          <FighterCard title="You" hp={p1.hp} hpMax={p1.hpMax} hpBar={hpBarP1} lastAttack={p1.lastAttack} lastBlocks={p1.lastBlocks} />
          <FighterCard title="Bot" hp={bot.hp} hpMax={bot.hpMax} hpBar={hpBarBot} lastAttack={bot.lastAttack} lastBlocks={bot.lastBlocks} right />
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4">
          {!isOver && (
          <div id="controlsCard" className="md:col-span-3 rounded-3xl bg-neutral-900 border border-neutral-800 p-4 relative overflow-hidden">
            <h2 className="text-lg font-semibold mb-3">Your turn · Round {round}</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <div className="text-xs text-neutral-400 mb-1">You</div>
                <ZoneBoard attack={null} blocks={choicesP1.blocks}
                  mode="blocks"
                  onToggleBlock={(z)=> toggleBlock(z, choicesP1, setChoicesP1)}
                  hitZone={lastHitZone} blockedZone={lastBlockedZone} />
                <EffectsLayer fx={fx} />
              </div>
              <div className="relative">
                <div className="text-xs text-neutral-400 mb-1 text-right">Opponent</div>
                <ZoneBoard attack={choicesP1.attack} blocks={showBotBlocks ? (bot.lastBlocks ?? []) : []}
                  mode="attack"
                  onAttack={(z)=> setChoicesP1(c=>({...c, attack: z}))}
                  hitZone={lastBotHitZone}
                  blockedZone={lastBotBlockedZone} />
              </div>
            </div>
            <div className="text-xs text-neutral-400 mt-2">Tip: Click the <span className="text-neutral-200">opponent</span> to choose your <span className="text-neutral-200">attack</span>, and click your <span className="text-neutral-200">body</span> to toggle up to two <span className="text-neutral-200">blocks</span>.</div>
            {/* Buttons (redundant controls) */}
            <div className="grid sm:grid-cols-2 gap-6 mt-3">
              {/* LEFT: Block (pick 2) */}
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-2">Block (pick 2)</h3>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((z) => {
                    const selected = choicesP1.blocks.includes(z);
                    const disabled = !selected && choicesP1.blocks.length >= 2;
                    return (
                      <button
                        key={z}
                        onClick={() => toggleBlock(z, choicesP1, setChoicesP1)}
                        disabled={disabled}
                        className={
                          "px-3 py-2 rounded-2xl border " +
                          (selected
                            ? "bg-sky-600 border-sky-500"
                            : disabled
                              ? "bg-neutral-900 border-neutral-800 opacity-60 cursor-not-allowed"
                              : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700")
                        }
                      >{z}</button>
                    );
                  })}
                </div>
              </div>
              {/* RIGHT: Attack */}
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-2">Attack</h3>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((z) => (
                    <button
                      key={z}
                      onClick={() => setChoicesP1((c) => ({ ...c, attack: c.attack === z ? null : z }))}
                      className={
                        "px-3 py-2 rounded-2xl border " +
                        (choicesP1.attack === z
                          ? "bg-emerald-600 border-emerald-500"
                          : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700")
                      }
                    >{z}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={resolveTurn}
                disabled={isOver}
                className="rounded-2xl px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              >Make your move 👊</button>
              <button
                onClick={() => {
                setChoicesP1({ attack: null, blocks: [] });
                setLastBlockedZone(null); setLastHitZone(null);
                setLastBotBlockedZone(null); setLastBotHitZone(null);
                setShowBotBlocks(false);
                setBot(prev=>({...prev, lastBlocks: []}));
              }}
                disabled={isOver}
                className="rounded-2xl px-3 py-2 bg-neutral-800 hover:bg-neutral-700"
              >Reset</button>
            </div>
          </div>

          )}

          {isOver && (
            <div className="md:col-span-3 rounded-3xl bg-neutral-900 border border-neutral-800 p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Battle complete</h2>
              <p className="text-lg"><span className="font-semibold">{finalOutcome}</span> — you obtained {finalRewards?.you ?? 0} HP and bot obtained {finalRewards?.bot ?? 0} HP</p>
              <div className="mt-4">
                <button onClick={() => makeNew(p1.level, bot.level)} className="rounded-2xl px-4 py-2 bg-emerald-600 hover:bg-emerald-500">Play again</button>
              </div>
            </div>
          )}

          {/* Log */}
          <div className="md:col-span-3 rounded-3xl bg-neutral-900 border border-neutral-800 p-4 max-h-80 overflow-auto">
            <h2 className="text-lg font-semibold mb-3">Combat log</h2>
            <ul className="space-y-2 text-sm">
              {log.map((line, idx) => (
                <li key={idx} className="font-mono leading-relaxed whitespace-pre-wrap">{line}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer hints */}
        <div className="text-xs text-neutral-400">
          <p>Rules in this prototype: 1 attack zone per turn; exactly 2 block zones. Damage = 18% of the attacker’s HP, with bonus chances: +2% (20%), +4% (10%), +6% (5%), +8% (1%). Blocked = 0. Level 1 = 50 HP; Level 2 = 120 HP. Winner gets 100% of HP done; loser gets 50%.</p>
        </div>
      </div>
    </div>
    );
}


function makeFighter(name: string, level: Level): Fighter {
  const hp = HP_BY_LEVEL[level];
  return { name, level, hpMax: hp, hp, dealt: 0 };
}

function damageFor(attack: Zone, defenderBlocks: Zone[], attacker: Fighter): number {
  if (defenderBlocks.includes(attack)) return 0; // no damage if blocked
  const pct = damagePercent();
  const roll = attacker.hpMax * pct;
  return Math.max(1, Math.floor(roll));
}

function hpBarPercent(hp: number, hpMax: number) {
  return Math.round((hp / hpMax) * 100);
}

function FighterCard({ title, hp, hpMax, hpBar, lastAttack, lastBlocks, right }: { title: string; hp: number; hpMax: number; hpBar: number; lastAttack?: Zone; lastBlocks?: Zone[]; right?: boolean }) {
  return (
    <div className={`rounded-3xl bg-neutral-900 border border-neutral-800 p-4 ${right ? "md:text-right" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-neutral-400">HP {hp}/{hpMax}</span>
      </div>
      <div className="h-3 bg-neutral-800 rounded-xl overflow-hidden">
        <div className="h-full bg-emerald-600" style={{ width: `${hpBar}%` }} />
      </div>
      <div className={`mt-3 grid gap-1 text-sm text-neutral-300 ${right ? "md:justify-items-end" : ""}`}>
        <div><span className="text-neutral-500">Last attack:</span> {lastAttack ?? "—"}</div>
        <div><span className="text-neutral-500">Last blocks:</span> {lastBlocks?.length ? lastBlocks.join(" + ") : "—"}</div>
      </div>
    </div>
  );
}

function LevelPicker({ label, value, onChange }: { label: string; value: Level; onChange: (l: Level) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-neutral-400">{label}</span>
      <select
        className="bg-neutral-900 border border-neutral-700 rounded-xl px-2 py-1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) as Level)}
      >
        <option value={1}>Lv 1 (50 HP)</option>
        <option value={2}>Lv 2 (120 HP)</option>
      </select>
    </div>
  );
}

function toggleBlock(z: Zone, choices: TurnChoices, setChoices: React.Dispatch<React.SetStateAction<TurnChoices>>) {
  const selected = choices.blocks.includes(z);
  if (selected) {
    setChoices({ ...choices, blocks: choices.blocks.filter(b => b !== z) });
  } else {
    if (choices.blocks.length >= 2) return; // enforce max 2
    setChoices({ ...choices, blocks: [...choices.blocks, z] });
  }
}