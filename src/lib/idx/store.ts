import { supabase } from '@/lib/supabase';
import type { Bucket, Listing } from './types';

export type StoredListing = Listing & { buildingId: string; syncedAt: string };

/** Listings for one building, newest first. Empty until the feed is connected and its table exists. */
export async function listingsForBuilding(buildingId: string): Promise<{ byBucket: Record<Bucket, StoredListing[]>; updatedAt: string | null }> {
  const byBucket: Record<Bucket, StoredListing[]> = { forSale: [], forLease: [], sold: [], leased: [] };
  try {
    const { data, error } = await supabase.from('idx_listings').select('*').eq('buildingId', buildingId).order('modifiedAt', { ascending: false }).limit(400);
    if (error || !data) return { byBucket, updatedAt: null };
    let updatedAt: string | null = null;
    for (const l of data as StoredListing[]) {
      if (!byBucket[l.bucket]) continue;
      byBucket[l.bucket].push(l);
      if (!updatedAt || l.syncedAt > updatedAt) updatedAt = l.syncedAt;
    }
    // Sold and rented: most recent closings first, and only the last two years
    const cutoff = new Date(Date.now() - 730 * 86400000).toISOString().slice(0, 10);
    for (const k of ['sold', 'leased'] as const) byBucket[k] = byBucket[k].filter((l) => !l.closeDate || l.closeDate >= cutoff).sort((a, b) => (b.closeDate || '').localeCompare(a.closeDate || ''));
    for (const k of ['forSale', 'forLease'] as const) byBucket[k].sort((a, b) => (a.price ?? 9e12) - (b.price ?? 9e12));
    return { byBucket, updatedAt };
  } catch { return { byBucket, updatedAt: null }; }
}

/** What a building's listings add up to: the line shown on cards and at the top of the page. */
export function summarize(byBucket: Record<Bucket, Listing[]>) {
  const prices = byBucket.forSale.map((l) => l.price).filter((p): p is number => !!p);
  const ppsf = byBucket.sold.filter((l) => l.closePrice && l.sqft).map((l) => l.closePrice! / l.sqft!).sort((a, b) => a - b);
  return {
    forSale: byBucket.forSale.length, forLease: byBucket.forLease.length, sold: byBucket.sold.length, leased: byBucket.leased.length,
    fromPrice: prices.length ? Math.min(...prices) : null,
    medianSoldPerSqft: ppsf.length ? Math.round(ppsf[Math.floor(ppsf.length / 2)]) : null,
  };
}
