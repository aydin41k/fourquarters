"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTelegramSDK } from '@/app/hooks/useTelegramSDK';
import { getThemeColours } from '@/app/lib/ui/theme';
import { clamp, formatBlocks, hpBarPercent, pickTwoDistinct } from '@/app/lib/game/utils';
import { makeFighter, damageFor, zoneCenterPct } from '@/app/lib/game/logic';
import { ZONES, type Zone, type Level } from '@/app/lib/game/constants';
import { EffectsLayer, type Fx } from './EffectsLayer';
import { ZoneBoard } from './ZoneBoard';
import { FighterCard } from './FighterCard';
import { LevelPicker } from './LevelPicker';

export default function Battle() {
  const { isReady, user, theme, viewport, haptic, mainButton, backButton } = useTelegramSDK();
  const colours = getThemeColours(theme);

  // FX timing constants
  const FX_TTL = {
    dmg: 1400,
    slash: 400,
    parry: 300,
  } as const;

  const [p1, setP1] = useState(() => makeFighter(user?.first_name || 'You', 1));
  const [bot, setBot] = useState(() => makeFighter('Bot', 1));

  const [choicesP1, setChoicesP1] = useState<{ attack: Zone | null; blocks: Zone[] }>({ attack: null, blocks: [] });
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
  const [showBotBlocks, setShowBotBlocks] = useState(false);

  function spawnFx(f: Omit<Fx,'id'>){ const id = fxId.current++; setFx(s=>[...s,{...f,id}]); setTimeout(()=> setFx(s=>s.filter(x=>x.id!==id)), f.ttl); }

  const triggerHaptic = (type: 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => { if (isReady) haptic[type](); };

  const spawnTelegramFx = (f: Omit<Fx,'id'>) => {
    const id = fxId.current++;
    setFx(s=>[...s,{...f,id}]);
    if (f.kind === 'dmg') triggerHaptic('medium');
    else if (f.kind === 'slash') triggerHaptic('heavy');
    else if (f.kind === 'parry') triggerHaptic('light');
    setTimeout(()=> setFx(s=>s.filter(x=>x.id!==id)), f.ttl);
  };

  const showTelegramNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    if (!isReady) return;
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
    notification.className += ` ${bgColor} text-white`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <p class="text-sm font-medium">${message}</p>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => { notification.classList.add('translate-x-full'); setTimeout(() => document.body.removeChild(notification), 300); }, 3000);
  };

  // Audio
  const audioRef = useRef<AudioContext | null>(null);
  function ensureAudio(){
    try{
      if(!audioRef.current){
        // @ts-expect-error - vendor prefixes
        const C = ((window as Record<string, unknown>).AudioContext || (window as Record<string, unknown>).webkitAudioContext) as typeof AudioContext;
        audioRef.current = new C();
      }
      if(audioRef.current?.state === 'suspended') audioRef.current.resume();
    }catch{}
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
  function playHit(ctx: AudioContext){ beep(ctx, 180, 0.12, 'triangle', 0.25); setTimeout(()=> beep(ctx, 120, 0.08, 'sawtooth', 0.18), 60); }
  function playBlock(ctx: AudioContext){ beep(ctx, 800, 0.06, 'square', 0.12); setTimeout(()=> beep(ctx, 500, 0.08, 'square', 0.10), 40); }

  function makeNew(p: Level, b: Level) {
    setP1(makeFighter(user?.first_name || 'You', p));
    setBot(makeFighter('Bot', b));
    setRound(1);
    setLog(["Battle started. Make your choices and click Resolve Turn."]);
    setIsOver(false);
    setChoicesP1({ attack: null, blocks: [] });
    setLastBlockedZone(null); setLastHitZone(null);
    setLastBotBlockedZone(null); setLastBotHitZone(null);
    setShowBotBlocks(false);
    setFinalRewards(null);
    setFinalOutcome(null);
    if (isReady) mainButton.hide();
  }

  function resolveTurn() {
    if (isOver) return;
    if (!choicesP1.attack || choicesP1.blocks.length !== 2) {
      if (isReady) showTelegramNotification("Pick one attack zone and exactly two block zones.", 'warning');
      else alert("Pick one attack zone and exactly two block zones.");
      return;
    }
    if (isReady) mainButton.setProgress(true);

    const [b1, b2] = pickTwoDistinct(ZONES);
    const botBlocks: Zone[] = [b1, b2];
    const botAttack: Zone = ZONES[Math.floor(Math.random() * ZONES.length)];

    const dmgToBot = damageFor(choicesP1.attack, botBlocks, p1);
    const dmgToP1 = damageFor(botAttack, choicesP1.blocks, bot);

    const appliedToBot = Math.min(dmgToBot, bot.hp);
    const appliedToP1 = Math.min(dmgToP1, p1.hp);

    const pBlocked = botBlocks.includes(choicesP1.attack!);
    const bBlocked = choicesP1.blocks.includes(botAttack);

    if (isReady) {
      triggerHaptic(pBlocked ? 'light' : 'medium');
      setTimeout(() => triggerHaptic(bBlocked ? 'light' : 'medium'), 350);
    }

    const _ctx = ensureAudio();
    if (_ctx) { (pBlocked ? playBlock : playHit)(_ctx); setTimeout(() => (bBlocked ? playBlock : playHit)(_ctx), 350); }

    setLastBlockedZone(bBlocked ? botAttack : null);
    setLastHitZone(!bBlocked ? botAttack : null);
    setLastBotBlockedZone(pBlocked ? choicesP1.attack! : null);
    setLastBotHitZone(!pBlocked ? choicesP1.attack! : null);
    setTimeout(() => { setLastBlockedZone(null); setLastHitZone(null); setLastBotBlockedZone(null); setLastBotHitZone(null); setShowBotBlocks(false); }, 2200);
    const posPlayer = zoneCenterPct(choicesP1.attack!);
    const posBot = zoneCenterPct(botAttack);
    spawnTelegramFx({ kind: pBlocked ? 'parry' : 'slash', xPct: posPlayer.xPct, yPct: posPlayer.yPct, ttl: pBlocked ? FX_TTL.parry : FX_TTL.slash, side: 'opponent' });
    if (!pBlocked && appliedToBot>0) spawnTelegramFx({ kind:'dmg', xPct: posPlayer.xPct, yPct: Math.max(0,posPlayer.yPct-6), text:`-${appliedToBot}`, ttl: FX_TTL.dmg, side: 'opponent' });
    spawnTelegramFx({ kind: bBlocked ? 'parry' : 'slash', xPct: posBot.xPct, yPct: posBot.yPct, ttl: bBlocked ? FX_TTL.parry : FX_TTL.slash, side: 'you' });
    if (!bBlocked && appliedToP1>0) spawnTelegramFx({ kind:'dmg', xPct: posBot.xPct, yPct: Math.max(0,posBot.yPct-6), text:`-${appliedToP1}`, ttl: FX_TTL.dmg, side: 'you' });
    const card = document.getElementById('controlsCard');
    if (card){ card.classList.add('shake'); setTimeout(()=> card.classList.remove('shake'), 140); }

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

    const nextBotHp = clamp(bot.hp - dmgToBot, 0, bot.hpMax);
    const nextP1Hp = clamp(p1.hp - dmgToP1, 0, p1.hpMax);

    let outcome: string | null = null;
    if (nextBotHp <= 0 && nextP1Hp <= 0) outcome = 'Draw';
    else if (nextBotHp <= 0) outcome = 'You win';
    else if (nextP1Hp <= 0) outcome = 'Bot wins';

    if (outcome) {
      const youDealt = p1.dealt + appliedToBot;
      const botDealt = bot.dealt + appliedToP1;
      let youReward = 0, botReward = 0;
      if (outcome === 'Draw') { youReward = Math.floor(youDealt * 0.5); botReward = Math.floor(botDealt * 0.5); }
      else if (outcome === 'You win') { youReward = youDealt; botReward = Math.floor(botDealt * 0.5); }
      else { youReward = Math.floor(youDealt * 0.5); botReward = botDealt; }
      setFinalRewards({ you: youReward, bot: botReward });
      setFinalOutcome(outcome as 'You win'|'Bot wins'|'Draw');

      if (isReady) {
        if (outcome === 'You win') { triggerHaptic('success'); showTelegramNotification(`Victory! You won with ${youDealt} damage dealt!`, 'success'); }
        else if (outcome === 'Bot wins') { triggerHaptic('error'); showTelegramNotification(`Defeat! Bot won with ${botDealt} damage dealt.`, 'error'); }
        else { triggerHaptic('warning'); showTelegramNotification(`Draw! Both fighters dealt equal damage.`, 'warning'); }
      }

      if (outcome === 'Draw') {
        turnLines.push(`Result: Draw. Rewards — You: ${Math.floor(youDealt * 0.5)}, Bot: ${Math.floor(botDealt * 0.5)}.`);
      } else if (outcome === 'You win') {
        turnLines.push(`Result: You win. Rewards — You: ${youDealt}, Bot: ${Math.floor(botDealt * 0.5)}.`);
      } else {
        turnLines.push(`Result: Bot wins. Rewards — Bot: ${botDealt}, You: ${Math.floor(youDealt * 0.5)}.`);
      }
      setIsOver(true);
    }

    setRound(r => r + 1);
    setLog(prev => [...turnLines, ...prev]);
    setChoicesP1({ attack: null, blocks: [] });
    if (isReady) mainButton.setProgress(false);
  }

  const hpBarP1 = useMemo(() => hpBarPercent(p1.hp, p1.hpMax), [p1.hp, p1.hpMax]);
  const hpBarBot = useMemo(() => hpBarPercent(bot.hp, bot.hpMax), [bot.hp, bot.hpMax]);

  useEffect(() => {
    if (!isReady) return;
    if (isOver) {
      mainButton.show('Play Again', () => makeNew(p1.level as Level, bot.level as Level));
      // lightweight notification
      if (finalOutcome) showTelegramNotification(`Game Over! ${finalOutcome}`, finalOutcome === 'You win' ? 'success' : finalOutcome === 'Bot wins' ? 'error' : 'warning');
    } else if (choicesP1.attack && choicesP1.blocks.length === 2) {
      mainButton.show('Resolve Turn', resolveTurn);
    } else {
      mainButton.hide();
    }
  }, [isReady, isOver, choicesP1.attack, choicesP1.blocks.length, p1.level, bot.level, finalOutcome]);

  useEffect(() => {
    if (!isReady) return;
    const saveInterval = setInterval(saveGameState, 30000);
    return () => clearInterval(saveInterval);
  }, [isReady, isOver, p1.hp, bot.hp, round, choicesP1]);

  useEffect(() => { if (isReady) loadGameState(); }, [isReady]);

  const handleButtonClick = (action: () => void, hapticType: 'selection' | 'light' | 'medium' = 'selection') => {
    triggerHaptic(hapticType);
    if (isReady) window.dispatchEvent(new CustomEvent('telegramButtonClick', { detail: { hapticType, timestamp: Date.now() } }));
    action();
  };

  const saveGameState = () => {
    if (!isReady || isOver) return;
    const gameState = {
      p1: { level: p1.level, hp: p1.hp, dealt: p1.dealt },
      bot: { level: bot.level, hp: bot.hp, dealt: bot.dealt },
      round,
      choices: choicesP1,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('fourQuartersGameState', JSON.stringify(gameState));
    } catch {}
  };

  const loadGameState = () => {
    if (!isReady) return false;
    try {
      const savedState = localStorage.getItem('fourQuartersGameState');
      if (savedState) {
        const gameState = JSON.parse(savedState);
        if (Date.now() - gameState.timestamp < 3600000) {
          setP1(prev => ({ ...prev, level: gameState.p1.level, hp: gameState.p1.hp, dealt: gameState.p1.dealt }));
          setBot(prev => ({ ...prev, level: gameState.bot.level, hp: gameState.bot.hp, dealt: gameState.bot.dealt }));
          setRound(gameState.round);
          setChoicesP1(gameState.choices);
          return true;
        }
      }
    } catch {}
    return false;
  };

  useEffect(() => {
    if (!isReady) return;
    if (isOver) backButton.show(() => { triggerHaptic('light'); makeNew(p1.level as Level, bot.level as Level); });
    else backButton.hide();
  }, [isReady, isOver, p1.level, bot.level]);

  return (
    <div className={`min-h-screen w-full ${colours.bg} ${colours.text} p-3 sm:p-6`}>
      <div className="max-w-4xl mx-auto grid gap-3 sm:gap-4">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{isReady && user ? `${user.first_name}'s Battleground` : 'FOUR QUARTERS · Battleground'}</h1>
            {isReady && (
              <div className={`text-xs ${colours.textSecondary} flex items-center gap-2`}>
                {user ? (<><span>👤 {user.first_name}</span>{user.username && <span>@{user.username}</span>}<span>🎮 Telegram Game</span></>) : (<span>🌐 Web Browser</span>)}
                <span className={`px-2 py-1 rounded-full text-xs ${theme === 'light' ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-700 text-neutral-200'}`}>{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <LevelPicker label="You" value={p1.level as Level} onChange={(lvl) => makeNew(lvl, bot.level as Level)} />
            <LevelPicker label="Bot" value={bot.level as Level} onChange={(lvl) => makeNew(p1.level as Level, lvl)} />
            <button className={`ml-2 rounded-2xl px-3 py-1 ${colours.neutral} ${colours.neutralHover}`} onClick={() => handleButtonClick(() => makeNew(p1.level as Level, bot.level as Level), 'light')}>Restart</button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <FighterCard title="You" hp={p1.hp} hpMax={p1.hpMax} hpBar={hpBarP1} lastAttack={p1.lastAttack} lastBlocks={p1.lastBlocks} />
          <FighterCard title="Bot" hp={bot.hp} hpMax={bot.hpMax} hpBar={hpBarBot} lastAttack={bot.lastAttack} lastBlocks={bot.lastBlocks} right />
        </div>

        <div className="grid gap-4">
          {!isOver && (
          <div id="controlsCard" className={`rounded-3xl ${colours.card} p-3 sm:p-4 relative overflow-hidden`}>
            <h2 className="text-lg font-semibold mb-3">Your turn · Round {round}</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
              <div className="relative">
                <div className="text-xs text-neutral-400 mb-1">You</div>
                <ZoneBoard attack={null} blocks={choicesP1.blocks} mode="blocks" onToggleBlock={(z)=> toggleBlock(z)} hitZone={lastHitZone} blockedZone={lastBlockedZone} />
                <EffectsLayer fx={fx.filter(f => f.side === 'you')} />
              </div>
              <div className="relative">
                <div className="text-xs text-neutral-400 mb-1 text-right">Opponent</div>
                <ZoneBoard attack={choicesP1.attack} blocks={showBotBlocks ? (bot.lastBlocks ?? []) : []} mode="attack" onAttack={(z)=> setChoicesP1(c=>({...c, attack: z}))} hitZone={lastBotHitZone} blockedZone={lastBotBlockedZone} />
                <EffectsLayer fx={fx.filter(f => f.side === 'opponent')} />
              </div>
            </div>
            <div className={`text-xs ${colours.textSecondary} mt-2`}>Tip: Click the <span className={colours.text}>opponent</span> to choose your <span className={colours.text}>attack</span>, and click your <span className={colours.text}>body</span> to toggle up to two <span className={colours.text}>blocks</span>.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-3">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-2">Block (pick 2)</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {ZONES.map((z) => {
                    const selected = choicesP1.blocks.includes(z);
                    const disabled = !selected && choicesP1.blocks.length >= 2;
                    return (
                      <button key={z} onClick={() => toggleBlock(z)} disabled={disabled} className={"px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs sm:text-sm " + (selected ? "bg-sky-600 border-sky-500" : disabled ? "bg-neutral-900 border-neutral-800 opacity-60 cursor-not-allowed" : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700")}>{z}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-2">Attack</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {ZONES.map((z) => (
                    <button key={z} onClick={() => setChoicesP1((c) => ({ ...c, attack: c.attack === z ? null : z }))} className={"px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs sm:text-sm " + (choicesP1.attack === z ? "bg-emerald-600 border-emerald-500" : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700")}>{z}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
              <button onClick={() => handleButtonClick(resolveTurn, 'medium')} disabled={isOver} className={`w-full sm:w-auto rounded-2xl px-4 py-2 ${colours.accent} ${colours.accentHover} disabled:opacity-60`}>Make your move 👊</button>
              <button onClick={() => handleButtonClick(() => { setChoicesP1({ attack: null, blocks: [] }); setLastBlockedZone(null); setLastHitZone(null); setLastBotBlockedZone(null); setLastBotHitZone(null); setShowBotBlocks(false); setBot(prev=>({...prev, lastBlocks: []})); }, 'light')} disabled={isOver} className={`w-full sm:w-auto rounded-2xl px-3 py-2 ${colours.neutral} ${colours.neutralHover}`}>Reset</button>
            </div>
          </div>
          )}

          {isOver && (
            <div className={`rounded-3xl ${colours.card} p-4 sm:p-6 text-center`}>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Battle complete</h2>
              <p className="text-base sm:text-lg"><span className="font-semibold">{finalOutcome}</span> — you obtained {finalRewards?.you ?? 0} HP and bot obtained {finalRewards?.bot ?? 0} HP</p>
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <button onClick={() => handleButtonClick(() => makeNew(p1.level as Level, bot.level as Level), 'medium')} className={`rounded-2xl px-4 py-2 ${colours.accent} ${colours.accentHover}`}>Play again</button>
                {isReady && (
                  <button onClick={() => handleButtonClick(() => { const message = `🎮 ${user?.first_name || 'You'} just played FOUR QUARTERS and ${finalOutcome?.toLowerCase() || 'completed'} the battle! Final score: You ${finalRewards?.you || 0} - Bot ${finalRewards?.bot || 0} HP`; if (window.Telegram?.WebApp) { window.Telegram.WebApp.close(); } else { navigator.clipboard.writeText(message); } }, 'light')} className={`rounded-2xl px-4 py-2 ${colours.neutral} ${colours.neutralHover}`}>📤 Share Result</button>
                )}
              </div>
            </div>
          )}

          <div className={`rounded-3xl ${colours.card} p-3 sm:p-4 max-h-80 overflow-auto`}>
            <h2 className="text-lg font-semibold mb-3">Combat log</h2>
            <ul className="space-y-2 text-xs sm:text-sm">
              {log.map((line, idx) => (<li key={idx} className="font-mono leading-relaxed whitespace-pre-wrap">{line}</li>))}
            </ul>
          </div>
        </div>

        <div className={`text-xs ${colours.textSecondary}`}>
          <p>Rules in this prototype: 1 attack zone per turn; exactly 2 block zones. Damage = 18% of the attacker’s HP, with bonus chances: +2% (20%), +4% (10%), +6% (5%), +8% (1%). Blocked = 0. Level 1 = 50 HP; Level 2 = 120 HP. Winner gets 100% of HP done; loser gets 50%.</p>
        </div>

        {isReady && window.Telegram?.WebApp && (
          <div className={`fixed z-40 ${viewport.is_expanded ? 'bottom-6 right-6' : 'bottom-4 right-4'}`}>
            <button onClick={() => { if (isOver) { handleButtonClick(() => makeNew(p1.level as Level, bot.level as Level), 'medium'); } else if (choicesP1.attack && choicesP1.blocks.length === 2) { handleButtonClick(resolveTurn, 'medium'); } }} className={`${viewport.is_expanded ? 'w-14 h-14 text-2xl' : 'w-12 h-12 text-xl'} rounded-full ${colours.accent} ${colours.accentHover} shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110`} title={isOver ? "Play Again" : choicesP1.attack && choicesP1.blocks.length === 2 ? "Resolve Turn" : "Make your choices"}>{isOver ? "🔄" : choicesP1.attack && choicesP1.blocks.length === 2 ? "⚔️" : "🎯"}</button>
            <div className="mt-3 space-y-2">
              <button onClick={() => handleButtonClick(saveGameState, 'light')} className={`${viewport.is_expanded ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-sm'} rounded-full ${colours.neutral} ${colours.neutralHover} shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110`} title="Save Game">💾</button>
              <button onClick={() => handleButtonClick(loadGameState, 'light')} className={`${viewport.is_expanded ? 'w-14 h-14 text-lg' : 'w-12 h-12 text-sm'} rounded-full ${colours.neutral} ${colours.neutralHover} shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110`} title="Load Game">📂</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function toggleBlock(z: Zone) {
    const selected = choicesP1.blocks.includes(z);
    if (selected) setChoicesP1({ ...choicesP1, blocks: choicesP1.blocks.filter(b => b !== z) });
    else {
      if (choicesP1.blocks.length >= 2) return;
      setChoicesP1({ ...choicesP1, blocks: [...choicesP1.blocks, z] });
    }
  }
}


