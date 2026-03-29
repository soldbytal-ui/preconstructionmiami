'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type Neighborhood = { id: string; name: string; slug: string };

export default function ProjectFilters({ neighborhoods }: { neighborhoods: Neighborhood[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`/pre-construction?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search projects..."
          defaultValue={searchParams.get('q') || ''}
          onChange={(e) => updateParam('q', e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none"
        />

        {/* Neighborhood */}
        <select
          defaultValue={searchParams.get('neighborhood') || ''}
          onChange={(e) => updateParam('neighborhood', e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none bg-white"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.slug}>{n.name}</option>
          ))}
        </select>

        {/* Status */}
        <select
          defaultValue={searchParams.get('status') || ''}
          onChange={(e) => updateParam('status', e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none bg-white"
        >
          <option value="">All Statuses</option>
          <option value="PRE_LAUNCH">Pre-Launch</option>
          <option value="PRE_CONSTRUCTION">Pre-Construction</option>
          <option value="UNDER_CONSTRUCTION">Under Construction</option>
          <option value="NEAR_COMPLETION">Near Completion</option>
        </select>

        {/* Category */}
        <select
          defaultValue={searchParams.get('category') || ''}
          onChange={(e) => updateParam('category', e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none bg-white"
        >
          <option value="">All Categories</option>
          <option value="ULTRA_LUXURY">Ultra-Luxury</option>
          <option value="LUXURY_BRANDED">Luxury Branded</option>
          <option value="LUXURY">Luxury</option>
          <option value="PREMIUM">Premium</option>
          <option value="AFFORDABLE_LUXURY">Affordable Luxury</option>
        </select>

        {/* Sort */}
        <select
          defaultValue={searchParams.get('sort') || ''}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold outline-none bg-white"
        >
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="units_desc">Most Units</option>
        </select>
      </div>
    </div>
  );
}
