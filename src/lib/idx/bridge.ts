import { fromReso, isCondo } from './reso';
import type { Listing } from './types';

// The Bridge API is how the MIAMI Association of Realtors hands its MLS data to members' websites.
// Nothing here runs until the access token exists. NOT YET TRIED AGAINST THE LIVE FEED: the dataset name,
// page size and field list below are to be confirmed on the first real call.

export const idxConfigured = () => !!process.env.BRIDGE_API_TOKEN;

const FIELDS = ['ListingKey', 'ListingId', 'StandardStatus', 'PropertyType', 'PropertySubType', 'ListPrice', 'ClosePrice', 'CloseDate', 'UnparsedAddress', 'StreetNumber', 'StreetDirPrefix', 'StreetName', 'StreetSuffix', 'StreetDirSuffix', 'UnitNumber', 'City', 'PostalCode', 'Latitude', 'Longitude', 'BedroomsTotal', 'BathroomsTotalInteger', 'BathroomsTotalDecimal', 'LivingArea', 'BuildingName', 'SubdivisionName', 'ListOfficeName', 'ListAgentFullName', 'DaysOnMarket', 'ModificationTimestamp', 'InternetEntireListingDisplayYN', 'InternetAddressDisplayYN', 'Media'];

/** Records changed since a moment in time, for the ZIP codes our buildings stand in. Follows the feed's own paging. */
export async function fetchChanged(opts: { since?: string; zips: string[]; maxPages?: number }): Promise<{ listings: Listing[]; removedKeys: string[]; pages: number }> {
  const token = process.env.BRIDGE_API_TOKEN, dataset = process.env.BRIDGE_DATASET || 'miamire';
  if (!token) return { listings: [], removedKeys: [], pages: 0 };
  const zipFilter = opts.zips.map((z) => `PostalCode eq '${z.replace(/\D/g, '')}'`).join(' or ');
  const filter = [zipFilter && `(${zipFilter})`, opts.since && `ModificationTimestamp gt ${opts.since}`].filter(Boolean).join(' and ');
  let url: string | null = `https://api.bridgedataoutput.com/api/v2/OData/${dataset}/Property?$top=200&$select=${FIELDS.join(',')}${filter ? `&$filter=${encodeURIComponent(filter)}` : ''}`;
  const listings: Listing[] = [], removedKeys: string[] = [];
  let pages = 0;
  while (url && pages < (opts.maxPages ?? 25)) {
    const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(`MLS feed answered ${res.status}`);
    const body: any = await res.json();
    for (const r of body.value || []) {
      if (!isCondo(r)) continue;
      const l = fromReso(r);
      if (l) listings.push(l); else if (r.ListingKey) removedKeys.push(String(r.ListingKey)); // expired, withdrawn or hidden by the seller: take it down
    }
    url = body['@odata.nextLink'] || null;
    pages++;
  }
  return { listings, removedKeys, pages };
}
