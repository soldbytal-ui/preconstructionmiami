import type { Bucket, Listing } from './types';

const num = (v: unknown): number | null => { const n = typeof v === 'string' ? Number(v) : (v as number); return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null; };
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Which of the four lists a record belongs in, or null when it should not be shown at all. */
export function bucketOf(r: Record<string, any>): Bucket | null {
  const lease = /lease|rental/i.test(String(r.PropertyType || ''));
  const s = String(r.StandardStatus || '').replace(/\s+/g, '').toLowerCase();
  if (s === 'closed') return lease ? 'leased' : 'sold';
  if (s === 'active' || s === 'activeundercontract' || s === 'pending' || s === 'comingsoon') return lease ? 'forLease' : 'forSale';
  return null; // expired, withdrawn, cancelled, hold, deleted
}

/** Condos only for now: the site's building profiles are condo towers. */
export const isCondo = (r: Record<string, any>) => /condo/i.test(String(r.PropertySubType || '')) || /condo/i.test(String(r.PropertyType || ''));

/** The seller can keep a listing, or its address, off other brokers' websites. Both are honoured. */
export const mayDisplay = (r: Record<string, any>) => r.InternetEntireListingDisplayYN !== false && r.InternetAddressDisplayYN !== false;

export function streetLine(r: Record<string, any>): string {
  const parts = [r.StreetNumber, r.StreetDirPrefix, r.StreetName, r.StreetSuffix, r.StreetDirSuffix].map(str).filter(Boolean);
  if (parts.length >= 2) return parts.join(' ');
  // Fall back to the single-line address with the unit cut off
  return String(r.UnparsedAddress || '').split(',')[0].replace(/\s+(#|unit|apt|ph)\s*[\w-]+$/i, '').trim();
}

export function fromReso(r: Record<string, any>): Listing | null {
  const bucket = bucketOf(r);
  const key = str(r.ListingKey) || str(r.ListingId);
  if (!bucket || !key || !mayDisplay(r)) return null;
  const media = Array.isArray(r.Media) ? [...r.Media].sort((a, b) => (a.Order ?? 99) - (b.Order ?? 99)) : [];
  return {
    key, mlsId: str(r.ListingId), bucket, status: str(r.StandardStatus) || 'Active',
    price: num(r.ListPrice), closePrice: num(r.ClosePrice), closeDate: str(r.CloseDate)?.slice(0, 10) || null,
    address: streetLine(r), unit: str(r.UnitNumber), city: str(r.City), zip: str(r.PostalCode)?.slice(0, 5) || null,
    latitude: num(Math.abs(r.Latitude)) ? Number(r.Latitude) : null, longitude: num(Math.abs(r.Longitude)) ? Number(r.Longitude) : null,
    beds: r.BedroomsTotal === 0 ? 0 : num(r.BedroomsTotal), baths: num(r.BathroomsTotalDecimal) ?? num(r.BathroomsTotalInteger), sqft: num(r.LivingArea),
    buildingName: str(r.BuildingName) || str(r.SubdivisionName), officeName: str(r.ListOfficeName), agentName: str(r.ListAgentFullName),
    photoUrl: str(media[0]?.MediaURL), daysOnMarket: num(r.DaysOnMarket), modifiedAt: str(r.ModificationTimestamp),
  };
}
