import type { Listing } from './types';

// Tying a listing to one of our building profiles. A tower's units all share the tower's street address,
// so the address decides; position on the map is the fallback when a listing writes the address differently.

export type BuildingRef = { id: string; slug: string; name: string; address: string | null; addressAliases?: string[] | null; latitude: number | null; longitude: number | null };

const DIR: Record<string, string> = { north: 'n', south: 's', east: 'e', west: 'w', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw' };
const SUFFIX: Record<string, string> = { avenue: 'ave', street: 'st', boulevard: 'blvd', drive: 'dr', road: 'rd', court: 'ct', place: 'pl', terrace: 'ter', lane: 'ln', way: 'way', highway: 'hwy', causeway: 'cswy', plaza: 'plz', circle: 'cir' };

/** "1000 Brickell Avenue, Unit 2301, Miami FL" and "1000 BRICKELL AVE #2301" both become "1000 brickell ave". */
export function normalizeAddress(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw.toLowerCase().split(',')[0];
  s = s.replace(/[.#]/g, ' ').replace(/\b(unit|apt|apartment|suite|ste|ph|penthouse)\b.*$/, ' ');
  const words = s.split(/\s+/).filter(Boolean).map((w) => DIR[w] || SUFFIX[w] || w.replace(/^(\d+)(st|nd|rd|th)$/, '$1'));
  // a trailing bare unit number: "1000 brickell ave 2301"
  if (words.length > 3 && /^\d+[a-z]?$/.test(words[words.length - 1]) && SUFFIX_SET.has(words[words.length - 2])) words.pop();
  return words.join(' ');
}
const SUFFIX_SET = new Set(Object.values(SUFFIX));

const metres = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) =>
  Math.hypot((a.longitude - b.longitude) * 111320 * Math.cos((a.latitude * Math.PI) / 180), (a.latitude - b.latitude) * 110540);

export type Match = { buildingId: string; by: 'address' | 'position' } | null;

export function makeMatcher(buildings: BuildingRef[]) {
  const byAddress = new Map<string, string[]>();
  for (const b of buildings) for (const a of [b.address, ...(b.addressAliases || [])]) {
    const k = normalizeAddress(a);
    if (k && /^\d/.test(k)) byAddress.set(k, [...(byAddress.get(k) || []), b.id]);
  }
  return (l: Pick<Listing, 'address' | 'latitude' | 'longitude' | 'buildingName'>): Match => {
    const ids = byAddress.get(normalizeAddress(l.address));
    if (ids?.length === 1) return { buildingId: ids[0], by: 'address' };
    if (ids && ids.length > 1) {
      // Two towers on one address (a north and a south tower): the name the agent typed settles it, otherwise leave it unmatched
      const name = (l.buildingName || '').toLowerCase();
      const hit = buildings.filter((b) => ids.includes(b.id)).filter((b) => name && b.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3).every((w) => name.includes(w)));
      return hit.length === 1 ? { buildingId: hit[0].id, by: 'address' } : null;
    }
    if (l.latitude && l.longitude) {
      const near = buildings.filter((b) => b.latitude && b.longitude).map((b) => ({ b, d: metres(l as any, b as any) })).filter((x) => x.d < 35).sort((x, y) => x.d - y.d);
      // Only when one tower is clearly the nearest; in a dense block a guess would put units in the wrong building
      if (near.length === 1 || (near.length > 1 && near[1].d - near[0].d > 25)) return { buildingId: near[0].b.id, by: 'position' };
    }
    return null;
  };
}
