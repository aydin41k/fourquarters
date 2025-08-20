import assert from 'node:assert/strict';
import fs from 'node:fs';

const p = './app/components/BattlePrototype.tsx';
const s = fs.readFileSync(p, 'utf8');

// No duplicate pill controls
assert.ok(!s.includes('Block (pick 2)'), 'Duplicate Block control pill buttons should be removed');
assert.ok(!/>\s*Attack\s*<\/h3>/.test(s), 'Duplicate Attack control pill buttons should be removed');

// Sticky helper bar content
assert.ok(s.includes('You will block:'), 'Helper bar should summarise blocks');
assert.ok(s.includes('You will attack:'), 'Helper bar should summarise attack');
assert.ok(s.includes('Change'), 'Helper bar should include Change chips');

// Blocks-left indicator
assert.ok(s.includes('blocks left'), 'Should show “blocks left” indicator');

// CTA locked until valid
assert.ok(/disabled=\{isOver\s*\|\|\s*!\(choicesP1\.attack\s*&&\s*choicesP1\.blocks\.length\s*===\s*2\)\}/.test(s), 'CTA should be disabled until selections are valid');

// First-move overlay hints exist in source, gated by level and round
assert.ok(s.includes('Block 2 areas'), 'Should include Block 2 areas hint in source');
assert.ok(s.includes('Hit 1'), 'Should include Hit 1 hint in source');

// Round initialization - should restore saved round from localStorage
assert.ok(s.includes('setRound(gameState.round)'), 'Should restore saved round number from localStorage');

console.log('BattlePrototype.test.mjs passed');


