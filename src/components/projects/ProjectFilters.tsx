'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type Neighborhood = { id: string; name: string; slug: string; count?: number };

const STAGES: [string, string][] = [
  ['', 'All'],
  ['planned', 'Planned'],
  ['building', 'Under construction'],
  ['near', 'Near completion'],
  ['completed', 'Completed'],
];

const FIELD =
  'h-12 rounded-full border border-border bg-surface px-5 text-base text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-text-primary';

export default function ProjectFilters({ neighborhoods }: { neighborhoods: Neighborhood[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      params.delete('status');
      const qs = params.toString();
      router.push(qs ? `/new-condos?${qs}` : '/new-condos', { scroll: false });
    },
    [router, searchParams]
  );

  // Wait for a pause in typing before searching
  useEffect(() => {
    if (q === (searchParams.get('q') || '')) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => updateParam('q', q.trim()), 300);
    return () => clearTimeout(timer.current);
  }, [q, searchParams, updateParam]);

  const stage = searchParams.get('stage') || '';

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <label className="w-full sm:w-auto">
        <span className="sr-only">Search by project, developer or area</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search project, developer or area" className={`${FIELD} w-full sm:w-[290px]`} />
      </label>
      <label className="w-full sm:w-auto">
        <span className="sr-only">Area</span>
        <select value={searchParams.get('neighborhood') || ''} onChange={(e) => updateParam('neighborhood', e.target.value)} className={`${FIELD} w-full`}>
          <option value="">All areas</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.slug}>{n.name}{n.count ? ` (${n.count})` : ''}</option>
          ))}
        </select>
      </label>
      <label className="flex-1 sm:flex-none">
        <span className="sr-only">Budget</span>
        <select value={searchParams.get('budget') || ''} onChange={(e) => updateParam('budget', e.target.value)} className={`${FIELD} w-full`}>
          <option value="">Any budget</option>
          <option value="750000">Up to $750K</option>
          <option value="1500000">Up to $1.5M</option>
          <option value="3000000">Up to $3M</option>
          <option value="6000000">Up to $6M</option>
        </select>
      </label>
      <label className="flex-1 sm:flex-none">
        <span className="sr-only">Sort</span>
        <select value={searchParams.get('sort') || ''} onChange={(e) => updateParam('sort', e.target.value)} className={`${FIELD} w-full`}>
          <option value="">Tallest first</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
          <option value="soon">Soonest completion</option>
          <option value="az">A to Z</option>
        </select>
      </label>
      <div role="group" aria-label="Stage" className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1">
        {STAGES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={stage === value}
            onClick={() => updateParam('stage', value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${stage === value ? 'bg-ink text-white' : 'text-text-muted hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
