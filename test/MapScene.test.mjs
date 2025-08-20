import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Test that the MapScene component no longer loads tile patterns
const mapScenePath = './app/components/MapScene.tsx';
const mapSceneContent = fs.readFileSync(mapScenePath, 'utf8');

// Verify that tile pattern loading code has been removed
assert.ok(!mapSceneContent.includes('tilesPattern'), 'tilesPattern state variable should not exist');
assert.ok(!mapSceneContent.includes('loadTiles'), 'loadTiles function should not exist');
assert.ok(!mapSceneContent.includes('road-tile.svg'), 'road-tile.svg loading should not exist');
assert.ok(!mapSceneContent.includes('createPattern'), 'createPattern should not exist');

// Verify that the component still loads building icons
assert.ok(mapSceneContent.includes('arena-svgrepo-com.svg'), 'Arena icon loading should still exist');
assert.ok(mapSceneContent.includes('shopping-card-svgrepo-com.svg'), 'Shop icon loading should still exist');
assert.ok(mapSceneContent.includes('cafe-svgrepo-com.svg'), 'Cafe icon loading should still exist');

// Verify that street rendering uses gradient instead of pattern
assert.ok(mapSceneContent.includes('createLinearGradient'), 'Street should use gradient rendering');
assert.ok(!mapSceneContent.includes('setTilesPattern'), 'setTilesPattern should not exist');

console.log('MapScene.test.mjs passed - tile pattern code successfully removed');
