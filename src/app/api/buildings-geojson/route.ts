import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      'id, name, slug, latitude, longitude, floors, totalUnits, priceMin, priceMax, status, category, address, estCompletion, description, mainImageUrl, footprint, modelUrl, developer:developers(name), neighborhood:neighborhoods(name, slug)'
    )
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .not('footprint', 'is', null);

  if (error) {
    console.error('buildings-geojson error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`buildings-geojson: ${(projects || []).length} projects returned from Supabase`);

  const features = (projects || []).map((p: any) => ({
    type: 'Feature' as const,
    geometry: p.footprint,
    properties: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      floors: p.floors || 10,
      totalUnits: p.totalUnits,
      priceMin: p.priceMin,
      priceMax: p.priceMax,
      status: p.status,
      category: p.category,
      address: p.address,
      estCompletion: p.estCompletion,
      description: p.description,
      mainImageUrl: p.mainImageUrl,
      developer: p.developer?.name || null,
      neighborhood: p.neighborhood?.name || null,
      neighborhoodSlug: p.neighborhood?.slug || null,
      latitude: p.latitude,
      longitude: p.longitude,
      modelUrl: p.modelUrl || null,
    },
  }));

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features,
  };

  return NextResponse.json(geojson, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
