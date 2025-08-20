import assert from 'node:assert/strict';
import pkg from '../app/lib/game/map.js';
const { createMapGeometry, isPointOnStreet, whichBuildingHit, getEntranceForBuilding, moveAlongStreet, pointOnPath, projectPointOntoPath } = pkg;

// Basic geometry
const geom = createMapGeometry({ width: 1920, height: 1080 });
assert.ok(geom.street.top < geom.street.bottom);
assert.equal(geom.buildings.length, 3);

// Street hit tests (use point on path and far-off point)
{
  const mid = geom.street.metrics.totalLength * 0.5;
  const p = pkg.pointOnPath(geom.street.metrics, mid);
  assert.equal(isPointOnStreet(p.x, p.y, geom), true);
  assert.equal(isPointOnStreet(p.x, p.y - geom.street.thickness * 3, geom), false);
}

// Building hit tests
for (const b of geom.buildings) {
  const hit = whichBuildingHit(b.x + 1, b.y + 1, geom);
  assert.ok(hit && hit.id === b.id);
}

// Entrances
for (const id of ['arena', 'shop', 'cafe']) {
  const e = getEntranceForBuilding(id, geom);
  assert.ok(e);
  assert.equal(isPointOnStreet(e.x, e.y, geom), true);
}

// Movement along street (path-based s)
{
  const m = geom.street.metrics;
  let s = 100;
  const target = 200;
  const res1 = moveAlongStreet(s, target, 100, 500); // 50px step
  assert.equal(Math.round(res1.s), 150);
  const res2 = moveAlongStreet(res1.s, target, 100, 600); // 60px step reaches
  assert.equal(Math.round(res2.s), 200);
  assert.equal(res2.reached, true);
  const p = pointOnPath(m, res2.s);
  const proj = projectPointOntoPath(p.x, p.y, m);
  assert.ok(Math.abs(proj - res2.s) < 1);
}

console.log('map.test.mjs passed');


