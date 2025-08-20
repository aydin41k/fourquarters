import assert from 'node:assert/strict';
import fs from 'node:fs';

// Shared EffectsLayer
const sharedPath = './app/components/game/EffectsLayer.tsx';
const sharedSrc = fs.readFileSync(sharedPath, 'utf8');
assert.ok(sharedSrc.includes('animate-[float_1.2s_ease-out_forwards]'), 'Shared EffectsLayer should use slower 1.2s float');
assert.ok(sharedSrc.includes('text-lg') && sharedSrc.includes('md:text-2xl'), 'Shared EffectsLayer should use larger damage text');

// Prototype EffectsLayer
const protoPath = './app/components/BattlePrototype.tsx';
const protoSrc = fs.readFileSync(protoPath, 'utf8');
assert.ok(protoSrc.includes('animate-[float_1.2s_ease-out_forwards]'), 'Prototype EffectsLayer should use slower 1.2s float');
assert.ok(protoSrc.includes('text-lg') && protoSrc.includes('md:text-2xl'), 'Prototype EffectsLayer should use larger damage text');

console.log('EffectsLayer.test.mjs passed');


