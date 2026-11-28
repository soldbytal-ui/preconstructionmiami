'use client';

import { useState } from 'react';
import { BUCKET_LABEL, type Bucket, type Listing } from '@/lib/idx/types';

const money = (n: number | null) => (n ? '$' + Math.round(n).toLocaleString('en-US') : 'Price on request');
const day = (d: string | null) => (d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

/** A building's units from the MLS feed: for sale, for rent, sold, rented. Every row names the listing brokerage. */
export default function BuildingListings({ name, byBucket, updatedAt, disclaimer }: { name: string; byBucket: Record<Bucket, Listing[]>; updatedAt: string | null; disclaimer: string }) {
  const order: Bucket[] = ['forSale', 'forLease', 'sold', 'leased'];
  const [tab, setTab] = useState<Bucket>(order.find((k) => byBucket[k].length) || 'forSale');
  const [all, setAll] = useState(false);
  const rows = byBucket[tab], shown = all ? rows : rows.slice(0, 8);
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-text-primary">Units in {name}</h2>
      <div role="tablist" aria-label="Listings" className="mt-4 flex flex-wrap gap-2">
        {order.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setAll(false); }} disabled={!byBucket[k].length}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${tab === k ? 'border-text-primary bg-text-primary text-white' : 'border-border text-text-primary disabled:text-text-muted disabled:opacity-60'}`}>
            {BUCKET_LABEL[k]} <span className="tabular-nums opacity-70">{byBucket[k].length}</span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-text-muted">No units in this list right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {shown.map((l) => {
            const closed = l.bucket === 'sold' || l.bucket === 'leased';
            const amount = closed ? l.closePrice ?? l.price : l.price;
            return (
              <li key={l.key} className="flex gap-4 py-3.5">
                {l.photoUrl ? <img src={l.photoUrl} alt={`Unit ${l.unit || ''} at ${name}`} loading="lazy" className="h-16 w-24 shrink-0 rounded-lg object-cover bg-surface2" /> : <div className="h-16 w-24 shrink-0 rounded-lg bg-surface2" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-text-primary">{l.unit ? `Unit ${l.unit}` : l.address}</p>
                    <p className="font-semibold text-text-primary tabular-nums whitespace-nowrap">{money(amount)}{l.bucket === 'forLease' || l.bucket === 'leased' ? ' /mo' : ''}</p>
                  </div>
                  <p className="text-sm text-text-muted">
                    {[l.beds === 0 ? 'Studio' : l.beds ? `${l.beds} bed` : null, l.baths ? `${l.baths} bath` : null, l.sqft ? `${Math.round(l.sqft).toLocaleString('en-US')} sq ft` : null, amount && l.sqft && !/Lease|leased/.test(l.bucket) ? `$${Math.round(amount / l.sqft).toLocaleString('en-US')} per sq ft` : null].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {closed ? `${BUCKET_LABEL[l.bucket]} ${day(l.closeDate)}` : l.status}{l.officeName ? ` · Listed by ${l.officeName}` : ''}{l.mlsId ? ` · MLS ${l.mlsId}` : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > shown.length && <button onClick={() => setAll(true)} className="btn-secondary mt-3">Show all {rows.length}</button>}
      <p className="mt-4 text-xs leading-relaxed text-text-muted">
        {updatedAt ? `Updated ${new Date(updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} Eastern. ` : ''}{disclaimer}
      </p>
    </section>
  );
}
