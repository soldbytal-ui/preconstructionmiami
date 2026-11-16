import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function GET() {
  const [{ data: projects, error }, { data: neighborhoods }, { data: developers }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, slug, latitude, longitude, floors, totalUnits, priceMin, priceMax, status, category, address, estCompletion, description, mainImageUrl, footprint, neighborhoodId, developerId, featured')
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

    for (const part of massing(ring, drawFloors)) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [part.ring] },
        properties: { id: p.id, status: p.status, base: part.base, height: part.height },
      });
    }
  }

  return NextResponse.json(
    { type: 'FeatureCollection', features, projects: lookup },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  );
}
