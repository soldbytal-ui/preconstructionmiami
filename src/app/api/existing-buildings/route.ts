import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Finished towers with a profile, as points for the 3D maps
export const revalidate = 300;

export async function GET() {
  const { data, error } = await supabase
    .from('buildings')
    .select('name, slug, floors, yearBuilt, heightM, latitude, longitude, developer:developers(name)')
    .not('latitude', 'is', null);
  if (error) return NextResponse.json({ type: 'FeatureCollection', features: [] });
  return NextResponse.json({
    type: 'FeatureCollection',
    features: (data || []).map((b: any) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
      properties: { name: b.name, slug: b.slug, floors: b.floors, yearBuilt: b.yearBuilt, heightM: b.heightM, developer: b.developer?.name || null },
    })),
  });
}
