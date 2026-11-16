/**
 * Tower generator.
 *
 * Turns DATA into stacked extrusions:
 *   - scale comes only from the lot outline and the height / storey count
 *   - the recipe (from the rendering) decides shape and colour, never size
 *
 * Everything is computed in a local metre grid around the lot centre and
 * converted back to longitude / latitude at the end.
 */

export type Recipe = {
  towers?: number;
  podium?: boolean;
  podiumFloors?: number;
  shape?: 'slab' | 'square' | 'curved' | 'tapered' | 'stepped' | 'offset-blocks';
  blocks?: number;
  crown?: 'flat' | 'stepped' | 'spire';
  colors?: { glass?: string; slab?: string; accent?: string };
  /** Solid frame: end walls and/or a roof cap in one colour (e.g. concrete side walls around glass). */
  frame?: { ends?: boolean; top?: boolean; color?: string };
  /** A recessed vertical strip of balconies on the front face. side: 1 or -1 picks which long face. */
  notch?: { width?: number; depth?: number; side?: 1 | -1; color?: string };
  /** Facade rhythm: 'glass' = curtain wall with fine lines, 'balcony' = bold projecting slabs. */
  bands?: 'glass' | 'balcony';
  /** Podium treatment: mostly solid wall, or glazed. */
  podiumStyle?: { wall?: string; glass?: string; solid?: boolean };
  /** Hand-entered adjustments. Never filled by the vision model. */
  manual?: {
    offsetAlong?: number; // -1..1 along the lot's long axis (positive = east / north)
    offsetAcross?: number; // -1..1 across it
    rotate90?: boolean; // tower's long side runs across the lot
    plateWidthM?: number;
    plateDepthM?: number;
    tower2Floors?: number;
  };
};

export type Part = { ring: [number, number][]; base: number; height: number; color: string };

export const RESIDENTIAL_FLOOR_M = 3.2;
export const PODIUM_FLOOR_M = 4.75;

type Pt = [number, number];

const DEFAULT_COLORS = { glass: '#7F9BB0', slab: '#E6E8EA', accent: '#9AA3AB' };

function toLocal(ring: Pt[]): { pts: Pt[]; back: (p: Pt) => Pt } {
  const open = ring.slice(0, -1);
  const lon0 = open.reduce((s, p) => s + p[0], 0) / open.length;
  const lat0 = open.reduce((s, p) => s + p[1], 0) / open.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  return {
    pts: open.map(([x, y]) => [(x - lon0) * kx, (y - lat0) * ky]),
    back: ([x, y]) => [lon0 + x / kx, lat0 + y / ky],
  };
}

/** Smallest rectangle around the lot, which gives the street orientation. */
function orientedBox(pts: Pt[]) {
  let best = { area: Infinity, angle: 0, cx: 0, cy: 0, w: 0, h: 0 };
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 3) continue; // ignore tiny chamfer edges
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const c = Math.cos(-ang), s = Math.sin(-ang);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      const rx = x * c - y * s, ry = x * s + y * c;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
      minY = Math.min(minY, ry); maxY = Math.max(maxY, ry);
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area < best.area) {
      const mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
      const ci = Math.cos(ang), si = Math.sin(ang);
      best = { area, angle: ang, cx: mx * ci - my * si, cy: mx * si + my * ci, w: maxX - minX, h: maxY - minY };
    }
  }
  // u = long axis, pointing east (or north when the lot runs north-south)
  let angle = best.angle, long = best.w, short = best.h;
  if (best.h > best.w) { angle += Math.PI / 2; long = best.h; short = best.w; }
  let ux = Math.cos(angle), uy = Math.sin(angle);
  if (ux < -0.3 || (Math.abs(ux) <= 0.3 && uy < 0)) { ux = -ux; uy = -uy; }
  return { cx: best.cx, cy: best.cy, ux, uy, vx: -uy, vy: ux, long, short };
}

/** Lighten (+) or darken (-) a hex colour. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return '#' + [ch(n >> 16), ch((n >> 8) & 255), ch(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function scaleAbout(pts: Pt[], f: number): Pt[] {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f]);
}

/** Outline of one floor plate in the box's own axes, centred on (ox, oy). */
function plate(shape: Recipe['shape'], halfL: number, halfW: number): Pt[] {
  if (shape === 'curved') {
    const out: Pt[] = [];
    const n = 28, e = 2 / 3.2; // superellipse: rounded ends, flat-ish sides
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      out.push([halfL * Math.sign(c) * Math.pow(Math.abs(c), e), halfW * Math.sign(s) * Math.pow(Math.abs(s), e)]);
    }
    return out;
  }
  return [[-halfL, -halfW], [halfL, -halfW], [halfL, halfW], [-halfL, halfW]];
}

export function buildTower(input: {
  lot: Pt[]; // closed ring, [lng, lat]
  floors: number | null;
  heightM: number | null;
  recipe: Recipe;
}): { parts: Part[]; pad: [number, number][] } | null {
  const { lot, recipe } = input;
  if (!lot || lot.length < 4) return null;
  const colors = { ...DEFAULT_COLORS, ...(recipe.colors || {}) };
  const { pts, back } = toLocal(lot);
  const box = orientedBox(pts);
  const close = (p: Pt[]): [number, number][] => {
    const r = p.map(back);
    r.push(r[0]);
    return r;
  };
  const world = (lx: number, ly: number): Pt => [box.cx + lx * box.ux + ly * box.vx, box.cy + lx * box.uy + ly * box.vy];

  const floors = input.floors && input.floors > 0 ? input.floors : 8;
  const podiumFloors = recipe.podium ? Math.min(recipe.podiumFloors || 4, Math.max(1, floors - 2)) : 0;
  const total = input.heightM && input.heightM > 0
    ? input.heightM
    : podiumFloors * PODIUM_FLOOR_M + (floors - podiumFloors) * RESIDENTIAL_FLOOR_M;
  const podiumH = Math.min(podiumFloors * PODIUM_FLOOR_M, total * 0.35);
  const towerFloors = Math.max(1, floors - podiumFloors);
  const parts: Part[] = [];

  // ---- Podium: the lot itself, pulled in slightly from the property line
  if (podiumFloors > 0) {
    const ring = scaleAbout(pts, 0.94);
    const lip = scaleAbout(pts, 0.955);
    const fh = podiumH / podiumFloors;
    const ps = recipe.podiumStyle || {};
    const wall = ps.wall || colors.accent;
    const pGlass = ps.glass || colors.glass;
    for (let i = 0; i < podiumFloors; i++) {
      const b = i * fh;
      if (ps.solid) {
        // Solid base: glazed ground floor, then wall with a fine shadow line per floor
        parts.push({ ring: close(ring), base: b, height: b + fh - 0.25, color: i === 0 ? pGlass : wall });
        parts.push({ ring: close(scaleAbout(pts, 0.93)), base: b + fh - 0.25, height: b + fh, color: i === podiumFloors - 1 ? wall : shade(wall, -0.18) });
      } else {
        parts.push({ ring: close(ring), base: b, height: b + fh - 0.7, color: i === 0 ? pGlass : wall });
        parts.push({ ring: close(lip), base: b + fh - 0.7, height: b + fh, color: colors.slab });
      }
    }
  }

  // ---- Tower plate size: from the lot, capped at a typical residential floor plate
  const m = recipe.manual || {};
  const shape = recipe.shape || 'slab';
  const squareish = shape === 'square' || shape === 'offset-blocks';
  const inset = podiumFloors > 0 ? 0.8 : 0.86;
  let L = box.long * inset, W = box.short * inset;
  if (squareish) { const side = Math.min(L, W, Math.sqrt(1150)); L = side * 1.08; W = side; }
  else {
    L = Math.min(L, W * 2.6);
    const cap = shape === 'curved' ? 1500 : 1300;
    if (L * W > cap) { const k = Math.sqrt(cap / (L * W)); L *= k; W *= k; }
  }
  if (m.plateWidthM) L = m.plateWidthM;
  if (m.plateDepthM) W = m.plateDepthM;
  if (m.rotate90) { const t = L; L = W; W = t; }
  const nTowers = Math.max(1, Math.min(3, recipe.towers || 1));
  const ox = (m.offsetAlong || 0) * Math.max(0, box.long / 2 - (m.rotate90 ? W : L) / 2 - 1);
  const oy = (m.offsetAcross || 0) * Math.max(0, box.short / 2 - (m.rotate90 ? L : W) / 2 - 1);

  const towerH = total - podiumH;
  for (let t = 0; t < nTowers; t++) {
    // Several towers share the lot's long axis
    const slot = nTowers === 1 ? 0 : (t - (nTowers - 1) / 2) * (box.long / nTowers);
    const tl = nTowers === 1 ? L : Math.min(L, (box.long / nTowers) * 0.72);
    const tFloors = t === 1 && m.tower2Floors ? Math.min(m.tower2Floors, towerFloors) : towerFloors;
    const tH = towerH * (tFloors / towerFloors);
    const centre: Pt = [ox + slot, oy];

    // Floors are grouped so even a 100-storey tower stays light to draw
    const group = Math.max(1, Math.ceil(tFloors / 48));
    const fh = tH / tFloors;
    const crownFrom = recipe.crown === 'stepped' ? 0.9 : recipe.crown === 'spire' ? 0.93 : 2;
    const blocks = shape === 'offset-blocks' ? Math.max(2, recipe.blocks || 6) : 0;
    const perBlock = blocks ? tFloors / blocks : 0;

    for (let f = 0; f < tFloors; f += group) {
      const n = Math.min(group, tFloors - f);
      const frac = f / tFloors;
      const b = podiumH + f * fh;
      const top = b + n * fh;
      let scale = 1;
      let dx = 0, dy = 0;
      let glass = colors.glass, slab = colors.slab;

      if (shape === 'tapered') scale = 1 - 0.3 * frac;
      if (shape === 'stepped') scale = frac < 0.55 ? 1 : frac < 0.8 ? 0.85 : 0.7;
      if (blocks) {
        const k = Math.floor(f / perBlock);
        // Each block is nudged a different way, like boxes stacked off-centre
        const pattern: Pt[] = [[0, 0], [0.13, 0.05], [-0.1, 0.11], [0.06, -0.12], [-0.13, -0.04], [0.11, 0.1], [-0.05, -0.11], [0.12, -0.06], [-0.09, 0.08]];
        const p = pattern[k % pattern.length];
        dx = p[0] * tl; dy = p[1] * W;
        // A recessed joint between blocks
        if (k > 0 && f - k * perBlock < group) { scale = 0.86; glass = colors.accent; slab = colors.accent; }
      }
      if (frac >= crownFrom) {
        const step = recipe.crown === 'spire' ? 0.35 : frac >= crownFrom + (1 - crownFrom) / 2 ? 0.62 : 0.8;
        scale *= step; glass = colors.accent; slab = colors.accent;
      }

      const hl = (tl / 2) * scale, hw = (W / 2) * scale;
      const boxy = shape !== 'curved';
      const frame = recipe.frame || {};
      const frameColor = frame.color || colors.accent;
      const endT = frame.ends && boxy ? Math.max(1.2, hl * 0.09) : 0; // thickness of each solid end wall
      const nt = recipe.notch && boxy ? recipe.notch : null;
      const nW = nt ? hl * 2 * Math.min(0.5, nt.width || 0.2) : 0;
      const nD = nt ? hw * 2 * Math.min(0.4, nt.depth || 0.14) : 0;
      const nS = nt?.side === -1 ? -1 : 1;

      // Floor plate in the tower's own axes; optional recess on one long face
      const local = (extra: number): Pt[] => {
        const L = (hl - endT) * extra, D = hw * extra;
        if (!boxy) return plate(shape, hl * extra, hw * extra);
        if (!nt) return [[-L, -D], [L, -D], [L, D], [-L, D]];
        const y = nS * D, yi = nS * (D - nD);
        const p: Pt[] = [[-L, -nS * D], [L, -nS * D], [L, y], [nW / 2, y], [nW / 2, yi], [-nW / 2, yi], [-nW / 2, y], [-L, y]];
        return nS === 1 ? p : p.reverse();
      };
      const place = (p: Pt[]) => p.map(([x, y]) => world(centre[0] + dx + x, centre[1] + dy + y));

      const balcony = recipe.bands === 'balcony';
      const slabT = balcony ? Math.min(0.9, n * fh * 0.3) : Math.min(0.4, n * fh * 0.13);
      const isCap = frame.top && f + n >= tFloors && frac < crownFrom;
      parts.push({ ring: close(place(local(1))), base: b, height: top - slabT, color: isCap ? frameColor : glass });
      parts.push({ ring: close(place(local(balcony ? 1.04 : 1.012))), base: top - slabT, height: top, color: isCap ? frameColor : slab });

      // Recessed balcony stack inside the notch: dark void with a slab edge per floor
      if (nt) {
        const y0 = nS * (hw - nD), y1 = nS * (hw - nD * 0.12);
        const strip: Pt[] = [[-nW / 2, y0], [nW / 2, y0], [nW / 2, y1], [-nW / 2, y1]];
        parts.push({ ring: close(place(strip)), base: top - Math.max(0.5, slabT), height: top, color: nt.color || colors.slab });
      }

      // Solid end walls run the full height in the frame colour
      if (endT > 0) {
        for (const sx of [-1, 1]) {
          const x0 = sx * (hl - endT), x1 = sx * hl * 1.004;
          const wallBox: Pt[] = [[x0, -hw * 1.004], [x1, -hw * 1.004], [x1, hw * 1.004], [x0, hw * 1.004]];
          parts.push({ ring: close(place(wallBox)), base: b, height: top, color: frameColor });
        }
      }
    }
  }

  return { parts, pad: close(pts) };
}
