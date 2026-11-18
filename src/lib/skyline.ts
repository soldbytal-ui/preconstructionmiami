/**
 * Skyline data: every listed tower with a height, plus a flat side elevation
 * drawn from the same generator that builds the towers on the 3D map, so the
 * silhouettes here and the towers there are the same shapes at the same scale.
 */
import { supabase } from '@/lib/supabase';
import { buildTower, RESIDENTIAL_FLOOR_M, PODIUM_FLOOR_M, type Part } from '@/lib/massing';

export const M_TO_FT = 3.28084;

/** [x, width, base, top, colour] in metres; x runs along the tower's long side. */
export type ElevRect = [number, number, number, number, string];

export type SkylineTower = {
  id: string;
  slug: string;
  name: string;
  status: string;
  neighborhood: string | null;
  neighborhoodSlug: string | null;
  floors: number | null;
  units: number | null;
  estCompletion: string | null;
  heightM: number;
  /** 'published' = a filed or announced height; 'estimated' = our estimate; 'storeys' = worked out from the storey count */
  heightSource: 'published' | 'estimated' | 'storeys';
  widthM: number;
  /** Top of the drawn model, which can sit a little below the stated height (spires, crowns) */
  topM: number;
  rects: ElevRect[];
};

type Pt = [number, number];

/** Lift near-black tones so dark towers still read against the dark stage. */
function lift(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  if (Number.isNaN(n)) return hex;
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum >= 0.3) return hex;
  const t = (0.3 - lum) * 1.5;
  const mix = (v: number, to: number) => Math.round(v + (to - v) * t);
  return '#' + [mix(r, 0x7a), mix(g, 0x90), mix(b, 0xa8)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Flatten the stacked 3D parts into a side view looking at the tower's long face. */
function elevation(parts: Part[], pad: Pt[]): { rects: ElevRect[]; width: number } {
  const lon0 = pad[0][0], lat0 = pad[0][1];
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110540;
  const local = (p: Pt): Pt => [(p[0] - lon0) * kx, (p[1] - lat0) * ky];

  // Long axis of everything above ground, from the spread of its corners
  const pts: Pt[] = [];
  for (const part of parts) for (const p of part.ring) pts.push(local(p as Pt));
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(ang), uy = Math.sin(ang);

  const flat = parts.map((part, i) => {
    let lo = Infinity, hi = -Infinity, depth = 0;
    for (const p of part.ring) {
      const [x, y] = local(p as Pt);
      const along = (x - mx) * ux + (y - my) * uy;
      lo = Math.min(lo, along); hi = Math.max(hi, along);
      depth += -(x - mx) * uy + (y - my) * ux;
    }
    return { lo, hi, depth: depth / part.ring.length, base: part.base, top: part.height, color: part.color, i };
  });
  // Far side first, so nearer volumes paint over it
  flat.sort((a, b) => b.depth - a.depth || a.i - b.i);
  const min = Math.min(...flat.map((f) => f.lo)), max = Math.max(...flat.map((f) => f.hi));
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    width: r1(max - min),
    rects: flat.map((f) => [r1(f.lo - min), r1(f.hi - f.lo), r1(f.base), r1(f.top), lift(f.color)]),
  };
}

function lotAreaM2(ring: number[][]): number {
  const k = 111320 * Math.cos((ring[0][1] * Math.PI) / 180);
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * k * ring[i + 1][1] * 110540 - ring[i + 1][0] * k * ring[i][1] * 110540;
  return Math.abs(a) / 2;
}

export async function getSkyline(): Promise<SkylineTower[]> {
  const [{ data: projects }, { data: neighborhoods }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, slug, floors, totalUnits, status, estCompletion, footprint, neighborhoodId, heightM, heightIsPublished, massing, massingConfirmed'),
    supabase.from('neighborhoods').select('id, name, slug'),
  ]);
  const nh: Record<string, { name: string; slug: string }> = {};
  for (const n of neighborhoods || []) nh[n.id] = { name: n.name, slug: n.slug };

  const out: SkylineTower[] = [];
  for (const p of projects || []) {
    const ring = (p.footprint as any)?.coordinates?.[0] as Pt[] | undefined;
    if (!ring || ring.length < 4 || !p.massing) continue;
    if (!(p.floors && p.floors > 0) && !p.heightM) continue;

    const matched = Boolean(p.massingConfirmed || (p.massing as any)?.filed);
    const recipe = !matched && lotAreaM2(ring) > 5500 ? { ...(p.massing as any), podium: false } : (p.massing as any);
    const built = buildTower({ lot: ring, floors: p.floors, heightM: p.heightM ? Number(p.heightM) : null, recipe, maxBands: 26 });
    if (!built || !built.parts.length) continue;

    const top = Math.max(...built.parts.map((x) => x.height));
    const podiumFloors = recipe.podium ? Math.min(recipe.podiumFloors || 4, Math.max(1, (p.floors || 8) - 2)) : 0;
    const fromStoreys = podiumFloors * PODIUM_FLOOR_M + ((p.floors || 8) - podiumFloors) * RESIDENTIAL_FLOOR_M;
    const heightM = p.heightM ? Number(p.heightM) : Math.max(top, fromStoreys);
    const { rects, width } = elevation(built.parts, built.pad as Pt[]);

    out.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      status: p.status,
      neighborhood: nh[p.neighborhoodId]?.name || null,
      neighborhoodSlug: nh[p.neighborhoodId]?.slug || null,
      floors: p.floors,
      units: p.totalUnits,
      estCompletion: p.estCompletion,
      heightM: Math.round(heightM * 10) / 10,
      heightSource: p.heightM ? (p.heightIsPublished ? 'published' : 'estimated') : 'storeys',
      widthM: width,
      topM: Math.round(top * 10) / 10,
      rects,
    });
  }
  out.sort((a, b) => b.heightM - a.heightM || (b.floors || 0) - (a.floors || 0));
  return out;
}

export const fmtFt = (m: number) => Math.round(m * M_TO_FT).toLocaleString('en-US');
export const fmtM = (m: number) => Math.round(m).toLocaleString('en-US');
