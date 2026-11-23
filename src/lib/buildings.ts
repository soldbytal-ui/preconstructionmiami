import { supabase } from '@/lib/supabase';

/** Finished towers that are not new projects: profiles for the buildings already standing. */
export type Building = {
  id: string; name: string; slug: string; address: string | null; architect: string | null;
  floors: number | null; totalUnits: number | null; yearBuilt: number | null; heightM: number | null;
  latitude: number | null; longitude: number | null; tenure: string; note: string | null; sources: string[];
  mainImageUrl?: string | null; images?: { credit?: { author?: string; license?: string; source?: string } } | null;
  developer?: { name: string; slug: string } | null; neighborhood?: { name: string; slug: string } | null;
};

export const BUILDING_COLUMNS =
  'id, name, slug, address, architect, floors, totalUnits, yearBuilt, heightM, latitude, longitude, tenure, note, sources, mainImageUrl, images, developerId, neighborhoodId, developer:developers(name, slug), neighborhood:neighborhoods(name, slug)';

export const feet = (m: number | null | undefined) => (m ? Math.round(m * 3.28084) : null);

export async function buildingsByDeveloper(ids: string[]): Promise<Building[]> {
  if (!ids.length) return [];
  const { data } = await supabase.from('buildings').select(BUILDING_COLUMNS).in('developerId', ids).order('yearBuilt', { ascending: false });
  return (data || []) as unknown as Building[];
}
