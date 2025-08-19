"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";

// --- Telegram Game SDK Integration ---
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
        viewport: {
          height: number;
          width: number;
          is_expanded: boolean;
          stable_height: number;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
            language_code?: string;
          };
          chat_type?: string;
          chat_instance?: string;
        };
        colorScheme: 'light' | 'dark';
        isClosingConfirmationEnabled: boolean;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

  // Telegram SDK utilities
  const useTelegramSDK = () => {
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState<{ id: number; first_name: string; username?: string } | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [viewport, setViewport] = useState<{ height: number; width: number; is_expanded: boolean }>({ height: 0, width: 0, is_expanded: false });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();
      
      // Set up theme
      setTheme(tg.colorScheme);
      
      // Set up user info
      if (tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      // Set up viewport
      setViewport({
        height: tg.viewport.height,
        width: tg.viewport.width,
        is_expanded: tg.viewport.is_expanded
      });
      
      // Handle theme changes
      tg.onEvent('themeChanged', () => {
        setTheme(tg.colorScheme);
      });
      
      // Handle viewport changes
      tg.onEvent('viewportChanged', () => {
        setViewport({
          height: tg.viewport.height,
          width: tg.viewport.width,
          is_expanded: tg.viewport.is_expanded
        });
      });
      
      setIsReady(true);
    } else {
      // Fallback for web browsers - set ready state after a short delay
      setTimeout(() => {
        setIsReady(true);
        setTheme('dark'); // Default theme for web
      }, 100);
    }
  }, []);

  const haptic = {
    light: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    },
    medium: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    },
    heavy: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
      }
    },
    success: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    },
    error: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    },
    warning: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    },
    selection: () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    },
  };

  const mainButton = {
    show: (text: string, callback?: () => void) => {
      if (window.Telegram?.WebApp?.MainButton) {
        const btn = window.Telegram.WebApp.MainButton;
        btn.setText(text);
        if (callback) btn.onClick(callback);
        btn.show();
        btn.enable();
      }
    },
    hide: () => {
      if (window.Telegram?.WebApp?.MainButton) {
        window.Telegram.WebApp.MainButton.hide();
      }
    },
    setProgress: (show: boolean) => {
      if (window.Telegram?.WebApp?.MainButton) {
        if (show) {
          window.Telegram.WebApp.MainButton.showProgress();
        } else {
          window.Telegram.WebApp.MainButton.hideProgress();
        }
      }
    }
  };

  const backButton = {
    show: (callback: () => void) => {
      if (window.Telegram?.WebApp?.BackButton) {
        const btn = window.Telegram.WebApp.BackButton;
        btn.onClick(callback);
        btn.show();
      }
    },
    hide: () => {
      if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.hide();
      }
    }
  };

  return { isReady, user, theme, viewport, haptic, mainButton, backButton };
};

// --- Minimal, single-file battle playground (NO SPRITES) ---
// Zones per your instruction
const ZONES = ["Head", "Chest", "Torso", "Knees", "Feet"] as const;
type Zone = typeof ZONES[number];

// Telegram theme-aware colours
const getThemeColours = (theme: 'light' | 'dark') => ({
  bg: theme === 'light' ? 'bg-neutral-50' : 'bg-neutral-950',
  card: theme === 'light' ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800',
  text: theme === 'light' ? 'text-neutral-900' : 'text-neutral-100',
  textSecondary: theme === 'light' ? 'text-neutral-600' : 'text-neutral-400',
  accent: theme === 'light' ? 'bg-emerald-600' : 'bg-emerald-500',
  accentHover: theme === 'light' ? 'hover:bg-emerald-700' : 'hover:bg-emerald-600',
  danger: theme === 'light' ? 'bg-rose-600' : 'bg-rose-500',
  dangerHover: theme === 'light' ? 'hover:bg-rose-700' : 'hover:bg-rose-600',
  neutral: theme === 'light' ? 'bg-neutral-800' : 'bg-neutral-700',
  neutralHover: theme === 'light' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-600',
});

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
    // Trigger haptic feedback for zone selection
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
    
    // Enhanced visual feedback for Telegram
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
          <g key={z} onClick={()=>handle(z)} data-zone={z}>
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
              <text x="50" y={labelY(z)} textAnchor="middle" className="fill-sky-300 text-[8px] sm:text-[10px]">🛡</text>
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
  @keyframes pulse { 0%{opacity:1} 50%{opacity:0.5} 100%{opacity:1} }
  .shake { animation: shake .12s linear 1 }
`;

export default function BattlePrototype() {
  // Telegram SDK integration
  const { isReady, user, theme, viewport, haptic, mainButton, backButton } = useTelegramSDK();
  const colours = getThemeColours(theme);
  
  const [p1, setP1] = useState<Fighter>(() => makeFighter(user?.first_name || "You", 1));
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

  // Telegram haptic feedback for game interactions
  const triggerHaptic = (type: 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (isReady) {
      haptic[type]();
    }
  };

  // Enhanced visual effects with Telegram theme integration
  const spawnTelegramFx = (f: Omit<Fx,"id">) => {
    const id = fxId.current++;
    setFx(s=>[...s,{...f,id}]);
    
    // Add haptic feedback based on effect type
    if (f.kind === 'dmg') {
      triggerHaptic('medium');
    } else if (f.kind === 'slash') {
      triggerHaptic('heavy');
    } else if (f.kind === 'parry') {
      triggerHaptic('light');
    }
    
    setTimeout(()=> setFx(s=>s.filter(x=>x.id!==id)), f.ttl);
  };

  // Telegram notification system
  const showTelegramNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    if (isReady) {
      // Use Telegram's built-in notification system if available, otherwise fallback to custom notifications
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
      
      const bgColor = type === 'success' ? 'bg-emerald-500' : 
                     type === 'error' ? 'bg-rose-500' : 
                     type === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
      
      notification.className += ` ${bgColor} text-white`;
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <p class="text-sm font-medium">${message}</p>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => notification.classList.remove('translate-x-full'), 100);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }
  };

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
    setP1(makeFighter(user?.first_name || "You", p));
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
    
    // Update Telegram main button
    if (isReady) {
      mainButton.hide();
    }
  }

  function resolveTurn() {
    if (isOver) return;
    // Guard: require exactly 1 attack and 2 blocks
    if (!choicesP1.attack || choicesP1.blocks.length !== 2) {
      if (isReady) {
        showTelegramNotification("Pick one attack zone and exactly two block zones.", 'warning');
      } else {
        alert("Pick one attack zone and exactly two block zones.");
      }
      return;
    }

    // Show progress on Telegram main button
    if (isReady) {
      mainButton.setProgress(true);
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

    // Telegram haptic feedback for combat outcomes
    if (isReady) {
      if (pBlocked) {
        triggerHaptic('light'); // Light feedback for blocked attack
      } else {
        triggerHaptic('medium'); // Medium feedback for successful hit
      }
      
      setTimeout(() => {
        if (bBlocked) {
          triggerHaptic('light'); // Light feedback for blocked attack
        } else {
          triggerHaptic('medium'); // Medium feedback for successful hit
        }
      }, 350);
    }

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
    spawnTelegramFx({ kind: pBlocked ? "parry" : "slash", xPct: posPlayer.xPct, yPct: posPlayer.yPct, ttl: pBlocked ? 250 : 350 });
    if (!pBlocked && appliedToBot>0) spawnTelegramFx({ kind:"dmg", xPct: posPlayer.xPct, yPct: Math.max(0,posPlayer.yPct-6), text:`-${appliedToBot}`, ttl: 900 });
    spawnTelegramFx({ kind: bBlocked ? "parry" : "slash", xPct: posBot.xPct, yPct: posBot.yPct, ttl: bBlocked ? 250 : 350 });
    if (!bBlocked && appliedToP1>0) spawnTelegramFx({ kind:"dmg", xPct: posBot.xPct, yPct: Math.max(0,posBot.yPct-6), text:`-${appliedToBot}`, ttl: 900 });
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

      // Telegram haptic feedback and notifications for game outcome
      if (isReady) {
        if (outcome === "You win") {
          triggerHaptic('success');
          showTelegramNotification(`Victory! You won with ${youDealt} damage dealt!`, 'success');
        } else if (outcome === "Bot wins") {
          triggerHaptic('error');
          showTelegramNotification(`Defeat! Bot won with ${botDealt} damage dealt.`, 'error');
        } else {
          triggerHaptic('warning');
          showTelegramNotification(`Draw! Both fighters dealt equal damage.`, 'warning');
        }
      }

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
    
    // Hide progress on Telegram main button
    if (isReady) {
      mainButton.setProgress(false);
    }
  }

  const hpBarP1 = useMemo(() => hpBarPercent(p1.hp, p1.hpMax), [p1.hp, p1.hpMax]);
  const hpBarBot = useMemo(() => hpBarPercent(bot.hp, bot.hpMax), [bot.hp, bot.hpMax]);

  // Telegram main button management
  useEffect(() => {
    if (isReady) {
      if (isOver) {
        mainButton.show("Play Again", () => makeNew(p1.level, bot.level));
        // Enhanced visual feedback for game over
        showTelegramNotification(`Game Over! ${finalOutcome}`, finalOutcome === 'You win' ? 'success' : finalOutcome === 'Bot wins' ? 'error' : 'warning');
      } else if (choicesP1.attack && choicesP1.blocks.length === 2) {
        mainButton.show("Resolve Turn", resolveTurn);
        // Enhanced visual feedback for ready state
        showTelegramNotification("Ready to fight! Click Resolve Turn or use the main button.", 'info');
      } else {
        mainButton.hide();
      }
    }
  }, [isReady, isOver, choicesP1.attack, choicesP1.blocks.length, p1.level, bot.level, finalOutcome]);

  // Auto-save game state
  useEffect(() => {
    if (isReady && !isOver) {
      const saveInterval = setInterval(saveGameState, 30000); // Save every 30 seconds
      return () => clearInterval(saveInterval);
    }
  }, [isReady, isOver, p1.hp, bot.hp, round, choicesP1]);

  // Auto-load game state on mount
  useEffect(() => {
    if (isReady) {
      loadGameState();
    }
  }, [isReady]);

  // Enhanced button interactions with haptic feedback
  const handleButtonClick = (action: () => void, hapticType: 'selection' | 'light' | 'medium' = 'selection') => {
    triggerHaptic(hapticType);
    
    // Enhanced visual feedback for button clicks
    if (isReady) {
      const event = new CustomEvent('telegramButtonClick', { 
        detail: { hapticType, timestamp: Date.now() } 
      });
      window.dispatchEvent(event);
    }
    
    action();
  };

  // Enhanced visual feedback for Telegram
  const addTelegramVisualFeedback = (element: HTMLElement, type: 'success' | 'error' | 'warning' | 'info') => {
    if (!isReady) return;
    
    const colors = {
      success: 'ring-emerald-500',
      error: 'ring-rose-500',
      warning: 'ring-amber-500',
      info: 'ring-blue-500'
    };
    
    element.classList.add('ring-2', colors[type], 'ring-opacity-75');
    element.style.animation = 'pulse 0.6s ease-in-out';
    
    setTimeout(() => {
      element.classList.remove('ring-2', colors.success, colors.error, colors.warning, colors.info, 'ring-opacity-75');
      element.style.animation = '';
    }, 600);
  };

  // Telegram game state persistence
  const saveGameState = () => {
    if (isReady) {
      const gameState = {
        p1: { level: p1.level, hp: p1.hp, dealt: p1.dealt },
        bot: { level: bot.level, hp: bot.hp, dealt: bot.dealt },
        round,
        choices: choicesP1,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('fourQuartersGameState', JSON.stringify(gameState));
        showTelegramNotification('Game state saved!', 'success');
      } catch (error) {
        showTelegramNotification('Failed to save game state', 'error');
      }
    }
  };

  const loadGameState = () => {
    if (isReady) {
      try {
        const savedState = localStorage.getItem('fourQuartersGameState');
        if (savedState) {
          const gameState = JSON.parse(savedState);
          // Only restore if saved within last hour
          if (Date.now() - gameState.timestamp < 3600000) {
            setP1(prev => ({ ...prev, level: gameState.p1.level, hp: gameState.p1.hp, dealt: gameState.p1.dealt }));
            setBot(prev => ({ ...prev, level: gameState.bot.level, hp: gameState.bot.hp, dealt: gameState.bot.dealt }));
            setRound(gameState.round);
            setChoicesP1(gameState.choices);
            showTelegramNotification('Game state restored!', 'success');
            return true;
          }
        }
      } catch (error) {
        showTelegramNotification('Failed to restore game state', 'error');
      }
    }
    return false;
  };

  // Telegram back button handling
  useEffect(() => {
    if (isReady) {
      if (isOver) {
        backButton.show(() => {
          triggerHaptic('light');
          makeNew(p1.level, bot.level);
        });
      } else {
        backButton.hide();
      }
    }
  }, [isReady, isOver, p1.level, bot.level]);

  return (
    <div className={`min-h-screen w-full ${colours.bg} ${colours.text} p-3 sm:p-6`}>
      <style>{FX_CSS}</style>
      
      {/* Loading state */}
      {!isReady && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-semibold">
              {typeof window !== 'undefined' && window.Telegram?.WebApp ? 'Loading Telegram Game...' : 'Loading Game...'}
            </p>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto grid gap-3 sm:gap-4">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              {isReady && user ? `${user.first_name}'s Battleground` : "FOUR QUARTERS · Battleground"}
            </h1>
            {isReady && (
              <div className={`text-xs ${colours.textSecondary} flex items-center gap-2`}>
                {user ? (
                  <>
                    <span>👤 {user.first_name}</span>
                    {user.username && <span>@{user.username}</span>}
                    <span>🎮 Telegram Game</span>
                  </>
                ) : (
                  <span>🌐 Web Browser</span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs ${theme === 'light' ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-700 text-neutral-200'}`}>
                  {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <LevelPicker label="You" value={p1.level} onChange={(lvl) => makeNew(lvl, bot.level)} />
            <LevelPicker label="Bot" value={bot.level} onChange={(lvl) => makeNew(p1.level, lvl)} />
            <button className={`ml-2 rounded-2xl px-3 py-1 ${colours.neutral} ${colours.neutralHover}`} onClick={() => handleButtonClick(() => makeNew(p1.level, bot.level), 'light')}>Restart</button>
          </div>
        </header>

        {/* Fighters */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <FighterCard title="You" hp={p1.hp} hpMax={p1.hpMax} hpBar={hpBarP1} lastAttack={p1.lastAttack} lastBlocks={p1.lastBlocks} />
          <FighterCard title="Bot" hp={bot.hp} hpMax={bot.hpMax} hpBar={hpBarBot} lastAttack={bot.lastAttack} lastBlocks={bot.lastBlocks} right />
        </div>

        {/* Controls */}
        <div className="grid gap-4">
          {!isOver && (
          <div id="controlsCard" className={`rounded-3xl ${colours.card} p-3 sm:p-4 relative overflow-hidden`}>
            <h2 className="text-lg font-semibold mb-3">Your turn · Round {round}</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
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
            <div className={`text-xs ${colours.textSecondary} mt-2`}>Tip: Click the <span className={colours.text}>opponent</span> to choose your <span className={colours.text}>attack</span>, and click your <span className={colours.text}>body</span> to toggle up to two <span className={colours.text}>blocks</span>.</div>
            {/* Buttons (redundant controls) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-3">
              {/* LEFT: Block (pick 2) */}
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-2">Block (pick 2)</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {ZONES.map((z) => {
                    const selected = choicesP1.blocks.includes(z);
                    const disabled = !selected && choicesP1.blocks.length >= 2;
                    return (
                      <button
                        key={z}
                        onClick={() => toggleBlock(z, choicesP1, setChoicesP1)}
                        disabled={disabled}
                        className={
                          "px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs sm:text-sm " +
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
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {ZONES.map((z) => (
                    <button
                      key={z}
                      onClick={() => setChoicesP1((c) => ({ ...c, attack: c.attack === z ? null : z }))}
                      className={
                        "px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs sm:text-sm " +
                        (choicesP1.attack === z
                          ? "bg-emerald-600 border-emerald-500"
                          : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700")
                      }
                    >{z}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => handleButtonClick(resolveTurn, 'medium')}
                disabled={isOver}
                className={`w-full sm:w-auto rounded-2xl px-4 py-2 ${colours.accent} ${colours.accentHover} disabled:opacity-60`}
              >Make your move 👊</button>
              <button
                onClick={() => handleButtonClick(() => {
                setChoicesP1({ attack: null, blocks: [] });
                setLastBlockedZone(null); setLastHitZone(null);
                setLastBotBlockedZone(null); setLastBotHitZone(null);
                setShowBotBlocks(false);
                setBot(prev=>({...prev, lastBlocks: []}));
              }, 'light')}
                disabled={isOver}
                className={`w-full sm:w-auto rounded-2xl px-3 py-2 ${colours.neutral} ${colours.neutralHover}`}
              >Reset</button>
            </div>
          </div>

          )}

          {isOver && (
            <div className={`rounded-3xl ${colours.card} p-4 sm:p-6 text-center`}>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Battle complete</h2>
              <p className="text-base sm:text-lg"><span className="font-semibold">{finalOutcome}</span> — you obtained {finalRewards?.you ?? 0} HP and bot obtained {finalRewards?.bot ?? 0} HP</p>
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <button onClick={() => handleButtonClick(() => makeNew(p1.level, bot.level), 'medium')} className={`rounded-2xl px-4 py-2 ${colours.accent} ${colours.accentHover}`}>Play again</button>
                {isReady && (
                  <button 
                    onClick={() => handleButtonClick(() => {
                      const message = `🎮 ${user?.first_name || 'You'} just played FOUR QUARTERS and ${finalOutcome?.toLowerCase() || 'completed'} the battle! Final score: You ${finalRewards?.you || 0} - Bot ${finalRewards?.bot || 0} HP`;
                      if (window.Telegram?.WebApp) {
                        window.Telegram.WebApp.close();
                      } else {
                        // Fallback for web browsers - copy to clipboard
                        navigator.clipboard.writeText(message).then(() => {
                          showTelegramNotification('Result copied to clipboard!', 'success');
                        }).catch(() => {
                          showTelegramNotification('Share feature coming soon!', 'info');
                        });
                      }
                    }, 'light')} 
                    className={`rounded-2xl px-4 py-2 ${colours.neutral} ${colours.neutralHover}`}
                  >
                    📤 Share Result
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Log */}
          <div className={`rounded-3xl ${colours.card} p-3 sm:p-4 max-h-80 overflow-auto`}>
            <h2 className="text-lg font-semibold mb-3">Combat log</h2>
            <ul className="space-y-2 text-xs sm:text-sm">
              {log.map((line, idx) => (
                <li key={idx} className="font-mono leading-relaxed whitespace-pre-wrap">{line}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer hints */}
        <div className={`text-xs ${colours.textSecondary}`}>
          <p>Rules in this prototype: 1 attack zone per turn; exactly 2 block zones. Damage = 18% of the attacker’s HP, with bonus chances: +2% (20%), +4% (10%), +6% (5%), +8% (1%). Blocked = 0. Level 1 = 50 HP; Level 2 = 120 HP. Winner gets 100% of HP done; loser gets 50%.</p>
        </div>
        
        {/* Telegram floating action button for quick actions */}
        {isReady && window.Telegram?.WebApp && (
          <div className={`fixed z-40 ${viewport.is_expanded ? 'bottom-6 right-6' : 'bottom-4 right-4'}`}>
            <button
              onClick={() => {
                if (isOver) {
                  handleButtonClick(() => makeNew(p1.level, bot.level), 'medium');
                } else if (choicesP1.attack && choicesP1.blocks.length === 2) {
                  handleButtonClick(resolveTurn, 'medium');
                }
              }}
              className={`${viewport.is_expanded ? 'w-14 h-14 text-2xl' : 'w-12 h-12 text-xl'} rounded-full ${colours.accent} ${colours.accentHover} shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110`}
              title={isOver ? "Play Again" : choicesP1.attack && choicesP1.blocks.length === 2 ? "Resolve Turn" : "Make your choices"}
            >
              {isOver ? "🔄" : choicesP1.attack && choicesP1.blocks.length === 2 ? "⚔️" : "🎯"}
            </button>
            
            {/* Additional Telegram action buttons */}
            <div className="mt-3 space-y-2">
              <button
                onClick={() => handleButtonClick(saveGameState, 'light')}
                className={`${viewport.is_expanded ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-sm'} rounded-full ${colours.neutral} ${colours.neutralHover} shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110`}
                title="Save Game"
              >
                💾
              </button>
              <button
                onClick={() => handleButtonClick(loadGameState, 'light')}
                className={`${viewport.is_expanded ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-sm'} rounded-full ${colours.neutral} ${colours.neutralHover} shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110`}
                title="Load Game"
              >
                📂
              </button>
            </div>
          </div>
        )}
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

function LevelPicker({ label, value, onChange }: { label: string; value: Level; onChange: (l: Level) => void }) {
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

function toggleBlock(z: Zone, choices: TurnChoices, setChoices: React.Dispatch<React.SetStateAction<TurnChoices>>) {
  const selected = choices.blocks.includes(z);
  if (selected) {
    setChoices({ ...choices, blocks: choices.blocks.filter(b => b !== z) });
  } else {
    if (choices.blocks.length >= 2) return; // enforce max 2
    setChoices({ ...choices, blocks: [...choices.blocks, z] });
  }
}