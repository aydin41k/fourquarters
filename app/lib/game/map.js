/**
 * Minimal map geometry and movement helpers in plain JS for testability.
 * Coordinates are in canvas space (pixels).
 */

/**
 * Create a simple map geometry with a horizontal street band and three buildings.
 * @param {{ width: number, height: number, margin?: number }} params
 */
function createMapGeometry(params) {
  const { width, height, margin = Math.round(Math.min(width, height) * 0.06) } = params;
  const streetThickness = Math.round(height * 0.12);
  // Create a gently curving street path across the scene
  const points = createCurvedStreet(width, height, { margin });
  const metrics = buildPathMetrics(points);

  // Fallback rect bounds of street for compatibility (rough bbox)
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const streetTop = Math.min(...ys) - Math.floor(streetThickness / 2);
  const streetBottom = Math.max(...ys) + Math.floor(streetThickness / 2);
  const streetLeft = Math.min(...xs) - margin;
  const streetRight = Math.max(...xs) + margin;

  // Buildings positioned along the path at 15%, 50%, 85%
  const buildingWidth = Math.round(width * 0.18);
  const buildingHeight = Math.round(height * 0.22);

  function buildingAt(percent, id) {
    const s = metrics.totalLength * percent;
    const pt = pointOnPath(metrics, s);
    // Place building above the road normal
    const offset = streetThickness * 1.2;
    const bx = Math.round(pt.x - buildingWidth / 2 + pt.nx * offset * 0.2);
    const by = Math.round(pt.y - buildingHeight - offset);
    return {
      id,
      x: bx,
      y: by,
      w: buildingWidth,
      h: buildingHeight,
      entrance: { x: Math.round(pt.x), y: Math.round(pt.y) },
    };
  }

  const arena = buildingAt(0.15, 'arena');
  const shop = buildingAt(0.5, 'shop');
  const cafe = buildingAt(0.85, 'cafe');
  const buildings = [arena, shop, cafe];

  return {
    width,
    height,
    street: { top: streetTop, bottom: streetBottom, left: streetLeft, right: streetRight, thickness: streetThickness, path: points, metrics },
    buildings,
  };
}

/**
 * Is a point inside the street band (inclusive)?
 * @param {number} x
 * @param {number} y
 * @param {ReturnType<typeof createMapGeometry>} geom
 */
function isPointOnStreet(x, y, geom) {
  const s = geom.street;
  if (s && s.metrics) {
    return isNearPath(x, y, s.metrics, Math.max(10, Math.round(s.thickness * 0.65)));
  }
  return x >= s.left && x <= s.right && y >= s.top && y <= s.bottom;
}

/**
 * Returns the building hit by a point, or null.
 * @param {number} x
 * @param {number} y
 * @param {ReturnType<typeof createMapGeometry>} geom
 */
function whichBuildingHit(x, y, geom) {
  for (const b of geom.buildings) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

/**
 * Return the entrance point for a building id.
 * @param {'arena'|'shop'|'cafe'} id
 * @param {ReturnType<typeof createMapGeometry>} geom
 */
function getEntranceForBuilding(id, geom) {
  const b = geom.buildings.find((bb) => bb.id === id);
  return b ? { x: b.entrance.x, y: b.entrance.y } : null;
}

/**
 * Move along the street path using arc-length param s. Returns { s, reached }.
 * @param {number} currentS
 * @param {number} targetS
 * @param {number} speedPxPerSec
 * @param {number} dtMs
 */
function moveAlongStreet(currentS, targetS, speedPxPerSec, dtMs) {
  if (!Number.isFinite(currentS) || !Number.isFinite(targetS) || !Number.isFinite(speedPxPerSec) || !Number.isFinite(dtMs)) {
    return { s: currentS, reached: false };
  }
  if (speedPxPerSec <= 0 || dtMs <= 0) return { s: currentS, reached: currentS === targetS };
  const delta = targetS - currentS;
  const step = (speedPxPerSec * dtMs) / 1000;
  if (Math.abs(delta) <= step) return { s: targetS, reached: true };
  return { s: currentS + Math.sign(delta) * step, reached: false };
}

/**
 * Create a gently curving street path from left to right.
 */
function createCurvedStreet(width, height, { margin = Math.round(Math.min(width, height) * 0.06) } = {}) {
  const left = margin;
  const right = width - margin;
  const cy = height * 0.62;
  const amp = height * 0.12;
  const points = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = left + (right - left) * t;
    const y = cy + Math.sin(t * Math.PI * 1.2) * amp * (0.7 + 0.3 * Math.cos(t * Math.PI));
    points.push({ x: Math.round(x), y: Math.round(y) });
  }
  return points;
}

/** Build cumulative path metrics for quick arc-length queries */
function buildPathMetrics(points) {
  const seg = [];
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const d = Math.hypot(dx, dy);
    seg.push(d);
    cum.push(cum[cum.length - 1] + d);
  }
  const totalLength = cum[cum.length - 1];
  return { points, seg, cum, totalLength };
}

/** Return point and unit normal at arc-length s */
function pointOnPath(metrics, s) {
  const clamped = Math.max(0, Math.min(metrics.totalLength, s));
  // find segment
  let i = 1;
  while (i < metrics.cum.length && metrics.cum[i] < clamped) i++;
  i = Math.max(1, i);
  const prev = metrics.points[i - 1];
  const next = metrics.points[i];
  const segLen = metrics.seg[i - 1] || 1;
  const t = segLen === 0 ? 0 : (clamped - metrics.cum[i - 1]) / segLen;
  const x = prev.x + (next.x - prev.x) * t;
  const y = prev.y + (next.y - prev.y) * t;
  const tx = next.x - prev.x; const ty = next.y - prev.y; const len = Math.hypot(tx, ty) || 1;
  const nx = -ty / len; const ny = tx / len;
  return { x, y, nx, ny };
}

/** Project a point to the closest position on the path; returns arc-length s */
function projectPointOntoPath(x, y, metrics) {
  let bestS = 0;
  let bestD = Infinity;
  for (let i = 1; i < metrics.points.length; i++) {
    const a = metrics.points[i - 1];
    const b = metrics.points[i];
    const abx = b.x - a.x, aby = b.y - a.y;
    const apx = x - a.x, apy = y - a.y;
    const ab2 = abx * abx + aby * aby || 1;
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + abx * t; const py = a.y + aby * t;
    const d = Math.hypot(px - x, py - y);
    if (d < bestD) { bestD = d; bestS = metrics.cum[i - 1] + (metrics.seg[i - 1] || 0) * t; }
  }
  return bestS;
}

function isNearPath(x, y, metrics, radius) {
  const s = projectPointOntoPath(x, y, metrics);
  const p = pointOnPath(metrics, s);
  return Math.hypot(p.x - x, p.y - y) <= radius;
}
module.exports = {
  createMapGeometry,
  isPointOnStreet,
  whichBuildingHit,
  getEntranceForBuilding,
  moveAlongStreet,
  createCurvedStreet,
  buildPathMetrics,
  pointOnPath,
  projectPointOntoPath,
  isNearPath,
};
