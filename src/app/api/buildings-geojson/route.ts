import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildTower } from '@/lib/massing';

// Rebuilt at most every 5 minutes and served from the CDN in between.
export const revalidate = 300;

const FLOOR_HEIGHT_M = 3.4;

type Ring = [number, number][];

function centroid(ring: Ring): [number, number] {
  const pts = ring.slice(0, -1);
  const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [x, y];
}

/** Scale a footprint ring about its centre. */
function scaleRing(ring: Ring, factor: number): Ring {
  const [cx, cy] = centroid(ring);
  return ring.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
}

/**
 * Turn one flat footprint into the stacked volumes of a tower: a wider podium,
 * the shaft, and a stepped-back crown. Low-rise projects stay a single block.
 */
function massing(ring: Ring, floors: number): { ring: Ring; base: number; height: number }[] {
  const h = floors * FLOOR_HEIGHT_M;
  if (floors >= 25) {
    const podium = Math.min(8, Math.round(floors * 0.12)) * FLOOR_HEIGHT_M;
    const crownStart = h * 0.93;
    return [
      { ring: scaleRing(ring, 1.3), base: 0, height: podium },
      { ring, base: podium, height: crownStart },
      { ring: scaleRing(ring, 0.72), base: crownStart, height: h },
    ];
  }
  if (floors >= 10) {
    const podium = 3 * FLOOR_HEIGHT_M;
    return [
      { ring: scaleRing(ring, 1.2), base: 0, height: podium },
      { ring, base: podium, height: h },
    ];
  }
  return [{ ring, base: 0, height: h }];
}

// Six decimals is about 10 cm on the ground: plenty for a tower, and it keeps the file small.
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
const r1 = (n: number) => Math.round(n * 10) / 10;
const slim = (ring: number[][]) => ring.map(([x, y]) => [r6(x), r6(y)]);

export async function GET() {
  const [{ data: projects, error }, { data: neighborhoods }, { data: developers }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, slug, latitude, longitude, floors, totalUnits, priceMin, priceMax, status, category, address, estCompletion, description, mainImageUrl, footprint, neighborhoodId, developerId, featured, heightM, heightIsPublished, massing, hiddenBaseIds')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
    supabase.from('neighborhoods').select('id, name, slug'),
    supabase.from('developers').select('id, name'),
  ]);

  if (error) {
    console.error('buildings-geojson error:', error.message);
    return NextResponse.json({ error: 'Could not load map data' }, { status: 500 });
  }

  const nh: Record<string, { name: string; slug: string }> = {};
  for (const n of neighborhoods || []) nh[n.id] = { name: n.name, slug: n.slug };
  const dev: Record<string, string> = {};
  for (const d of developers || []) dev[d.id] = d.name;

  const features: any[] = [];
  const pads: any[] = [];
  const hiddenBaseIds: number[] = [];
  const lookup: Record<string, any> = {};

  for (const p of projects || []) {
    const ring: Ring | undefined = (p.footprint as any)?.coordinates?.[0];
    if (!ring || ring.length < 4) continue;

    // Projects with no published floor count are drawn as a modest mid-rise;
    // the card still shows "TBD" rather than an invented number.
    const drawFloors = p.floors && p.floors > 0 ? p.floors : 8;

    lookup[p.id] = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      latitude: p.latitude,
      longitude: p.longitude,
      floors: p.floors,
      totalUnits: p.totalUnits,
      priceMin: p.priceMin,
      priceMax: p.priceMax,
      status: p.status,
      category: p.category,
      address: p.address,
      estCompletion: p.estCompletion,
      description: p.description ? String(p.description).slice(0, 220) : null,
      mainImageUrl: p.mainImageUrl,
      neighborhood: nh[p.neighborhoodId] || null,
      neighborhoodId: p.neighborhoodId,
      developer: p.developerId && dev[p.developerId] ? { name: dev[p.developerId] } : null,
      featured: !!p.featured,
    };

    // Projects with a recipe get a data-built tower in real tones; the rest
    // keep the simple status-coloured massing until theirs is done.
    const realistic = p.massing
      ? buildTower({ lot: ring, floors: p.floors, heightM: p.heightM ? Number(p.heightM) : null, recipe: p.massing as any })
      : null;

    if (realistic) {
      lookup[p.id].realistic = true;
      for (const part of realistic.parts) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [slim(part.ring)] },
          properties: { id: p.id, status: p.status, base: r1(part.base), height: r1(part.height), color: part.color },
        });
      }
      pads.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [slim(realistic.pad)] },
        properties: { id: p.id, status: p.status },
      });
      if (Array.isArray(p.hiddenBaseIds)) hiddenBaseIds.push(...(p.hiddenBaseIds as number[]));
    } else {
      for (const part of massing(ring, drawFloors)) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [slim(part.ring)] },
          properties: { id: p.id, status: p.status, base: r1(part.base), height: r1(part.height) },
        });
      }
    }
  }

  return NextResponse.json(
    {
      type: 'FeatureCollection',
      features,
      projects: lookup,
      pads: { type: 'FeatureCollection', features: pads },
      hiddenBaseIds,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  );
}
