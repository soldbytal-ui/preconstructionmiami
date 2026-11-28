import { supabase, supabaseAdmin, hasServiceRole } from '@/lib/supabase';
import { fetchChanged, idxConfigured } from './bridge';
import { makeMatcher, type BuildingRef } from './match';
import type { Listing } from './types';

/** Sort a batch of feed listings into "belongs to this building" and "no building profile yet". Pure, so it can be tested. */
export function plan(listings: Listing[], buildings: BuildingRef[]) {
  const match = makeMatcher(buildings);
  const rows: (Listing & { buildingId: string; matchedBy: string })[] = [];
  const unmatched = new Map<string, { address: string; zip: string | null; buildingName: string | null; listings: number }>();
  for (const l of listings) {
    const m = match(l);
    if (m) rows.push({ ...l, buildingId: m.buildingId, matchedBy: m.by });
    else {
      const u = unmatched.get(l.address) || { address: l.address, zip: l.zip, buildingName: l.buildingName, listings: 0 };
      u.listings++; unmatched.set(l.address, u);
    }
  }
  return { rows, unmatched: [...unmatched.values()].sort((a, b) => b.listings - a.listings) };
}

/** One sync: ask the feed what changed, store what matches a building, take down what was withdrawn. */
export async function runSync(): Promise<{ ok: boolean; reason?: string; fetched?: number; matched?: number; removed?: number }> {
  if (!idxConfigured()) return { ok: false, reason: 'The MLS feed is not connected yet.' };
  if (!hasServiceRole) return { ok: false, reason: 'The server key that allows saving listings is not set.' };
  const { data: bs, error } = await supabase.from('buildings').select('id, slug, name, address, addressAliases, zip, latitude, longitude');
  if (error || !bs) return { ok: false, reason: 'The listings tables are not in the database yet.' };
  const zips = [...new Set((bs as any[]).map((b) => b.zip).filter(Boolean))] as string[];
  if (!zips.length) return { ok: false, reason: 'No building has a ZIP code to ask the feed about.' };
  const { data: last } = await supabaseAdmin.from('idx_sync_runs').select('startedAt').is('error', null).order('id', { ascending: false }).limit(1);
  const { data: run } = await supabaseAdmin.from('idx_sync_runs').insert({}).select('id').single();
  try {
    const { listings, removedKeys } = await fetchChanged({ since: last?.[0]?.startedAt, zips });
    const { rows, unmatched } = plan(listings, bs as BuildingRef[]);
    const now = new Date().toISOString();
    for (let i = 0; i < rows.length; i += 200) await supabaseAdmin.from('idx_listings').upsert(rows.slice(i, i + 200).map((r) => ({ ...r, syncedAt: now })), { onConflict: 'key' });
    if (removedKeys.length) await supabaseAdmin.from('idx_listings').delete().in('key', removedKeys);
    if (unmatched.length) await supabaseAdmin.from('idx_unmatched').upsert(unmatched.slice(0, 500).map((u) => ({ ...u, lastSeen: now })), { onConflict: 'address' });
    await supabaseAdmin.from('idx_sync_runs').update({ finishedAt: now, fetched: listings.length, matched: rows.length, removed: removedKeys.length }).eq('id', run?.id);
    return { ok: true, fetched: listings.length, matched: rows.length, removed: removedKeys.length };
  } catch (e: any) {
    await supabaseAdmin.from('idx_sync_runs').update({ finishedAt: new Date().toISOString(), error: String(e?.message || e).slice(0, 300) }).eq('id', run?.id);
    return { ok: false, reason: 'The feed could not be read this time.' };
  }
}
