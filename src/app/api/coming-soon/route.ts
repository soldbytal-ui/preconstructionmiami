import { NextResponse } from 'next/server';
import { comingSoonProjects } from '@/lib/approval-store';

export const revalidate = 300;

const FLOOR_M = 3.4;

/** A plain square footprint around a point, used when a project has no modelled tower yet. */
function box(lng: number, lat: number, half = 18): number[][][] {
  const dLat = half / 111_320;
  const dLng = half / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [[[lng - dLng, lat - dLat], [lng + dLng, lat - dLat], [lng + dLng, lat + dLat], [lng - dLng, lat + dLat], [lng - dLng, lat - dLat]]];
}

/** Projects not yet approved, as ghost towers for the 3D map. */
export async function GET() {
  const projects = await comingSoonProjects();
  return NextResponse.json({
    type: 'FeatureCollection',
    features: projects.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: box(p.longitude, p.latitude) },
      properties: {
        id: p.id, slug: p.slug, name: p.name, area: p.area, developer: p.developer, floors: p.floors,
        height: Math.max(30, (p.floors || 20) * FLOOR_M), lng: p.longitude, lat: p.latitude,
        stage: p.record.stage, sourceUrl: p.record.sourceUrl, sourceLabel: p.record.sourceLabel || null, confirmedOn: p.record.confirmedOn,
      },
    })),
  });
}
