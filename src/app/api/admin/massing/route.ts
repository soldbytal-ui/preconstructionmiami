export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

const SHAPES = ['slab', 'square', 'curved', 'tapered', 'stepped', 'offset-blocks'];
const CROWNS = ['flat', 'stepped', 'spire'];
const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
};

/** Keep only known recipe fields, in valid ranges. Height and footprint are never part of a recipe. */
function cleanRecipe(input: any) {
  if (!input || typeof input !== 'object') return null;
  const m = input.manual || {};
  const manual: Record<string, unknown> = {};
  if (num(m.offsetAlong, -1, 1)) manual.offsetAlong = num(m.offsetAlong, -1, 1);
  if (num(m.offsetAcross, -1, 1)) manual.offsetAcross = num(m.offsetAcross, -1, 1);
  if (m.rotate90) manual.rotate90 = true;
  if (num(m.plateWidthM, 8, 150)) manual.plateWidthM = num(m.plateWidthM, 8, 150);
  if (num(m.plateDepthM, 8, 150)) manual.plateDepthM = num(m.plateDepthM, 8, 150);
  if (num(m.tower2Floors, 1, 150)) manual.tower2Floors = num(m.tower2Floors, 1, 150);
  return {
    towers: num(input.towers, 1, 3) || 1,
    podium: !!input.podium,
    podiumFloors: input.podium ? num(input.podiumFloors, 1, 20) || 4 : 0,
    shape: SHAPES.includes(input.shape) ? input.shape : 'slab',
    ...(input.shape === 'offset-blocks' ? { blocks: num(input.blocks, 2, 12) || 6 } : {}),
    crown: CROWNS.includes(input.crown) ? input.crown : 'flat',
    colors: {
      glass: hex(input.colors?.glass) || '#7F9BB0',
      slab: hex(input.colors?.slab) || '#E6E8EA',
      accent: hex(input.colors?.accent) || '#9AA3AB',
    },
    ...(Object.keys(manual).length ? { manual } : {}),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, status, floors, latitude, longitude, mainImageUrl, footprint, footprintSource, heightM, heightIsPublished, massing, massingConfirmed')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if ('massing' in body) patch.massing = body.massing === null ? null : cleanRecipe(body.massing);
  if ('massingConfirmed' in body) patch.massingConfirmed = !!body.massingConfirmed;
  if ('heightM' in body) patch.heightM = body.heightM === null || body.heightM === '' ? null : num(body.heightM, 5, 1000) ?? null;
  if ('heightIsPublished' in body) patch.heightIsPublished = !!body.heightIsPublished;
  if ('floors' in body) patch.floors = body.floors === null || body.floors === '' ? null : num(body.floors, 1, 200) ?? null;

  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', body.id)
    .select('id, floors, heightM, heightIsPublished, massing, massingConfirmed')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
