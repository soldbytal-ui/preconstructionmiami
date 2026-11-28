// Resale and rental listings from an MLS feed, in the one shape the site uses.
// The feed speaks RESO (the industry standard field names); reso.ts turns a feed record into this.

export type Bucket = 'forSale' | 'forLease' | 'sold' | 'leased';

export type Listing = {
  key: string;                 // the feed's permanent id for the listing
  mlsId: string | null;        // the MLS number people quote
  bucket: Bucket;
  status: string;              // as the MLS states it: Active, Pending, Closed…
  price: number | null;        // asking price, or monthly rent for a lease
  closePrice: number | null;
  closeDate: string | null;    // YYYY-MM-DD
  address: string;             // street address without the unit
  unit: string | null;
  city: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  buildingName: string | null; // what the listing agent typed; used only as a hint
  officeName: string | null;   // listing brokerage: shown with every listing
  agentName: string | null;
  photoUrl: string | null;
  daysOnMarket: number | null;
  modifiedAt: string | null;
};

export const BUCKET_LABEL: Record<Bucket, string> = { forSale: 'For sale', forLease: 'For rent', sold: 'Sold', leased: 'Rented' };
