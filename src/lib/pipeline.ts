import { supabase } from '@/lib/supabase';

/** The live pipeline: every listed project that is not finished yet, with the fields the pipeline page counts. */
export type PipeRow = {
  name: string; slug: string; status: string; estCompletion: string | null; totalUnits: number | null; floors: number | null;
  heightM: number | null; heightIsPublished: boolean | null; priceMin: number | null; soldOut: boolean | null; address: string | null;
  developer: { name: string; slug: string } | null; neighborhood: { name: string; slug: string } | null;
};

export async function getPipeline() {
  const { data, error } = await supabase
    .from('projects')
    .select('name, slug, status, estCompletion, totalUnits, floors, heightM, heightIsPublished, priceMin, soldOut, address, developer:developers(name, slug), neighborhood:neighborhoods(name, slug)')
    .neq('status', 'COMPLETED');
  return { rows: (data || []) as unknown as PipeRow[], error };
}

export const yearOf = (p: PipeRow) => { const m = (p.estCompletion || '').match(/20\d\d/); return m ? Number(m[0]) : null; };
export const STAGE_OF: Record<string, string> = { PRE_LAUNCH: 'Planned', PRE_CONSTRUCTION: 'Planned', UNDER_CONSTRUCTION: 'Under construction', NEAR_COMPLETION: 'Nearly finished' };
