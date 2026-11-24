'use client';

import Link from 'next/link';
import type { MapProject } from './mapShared';
import SafeImage from '@/components/ui/SafeImage';
import { thumbUrl } from '@/lib/utils';
import FollowButton from '@/components/account/FollowButton';

const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch',
  PRE_CONSTRUCTION: 'Pre-Construction',
  UNDER_CONSTRUCTION: 'Under Construction',
  NEAR_COMPLETION: 'Near Completion',
  COMPLETED: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  PRE_LAUNCH: 'bg-accent-green/20 text-accent-green',
  PRE_CONSTRUCTION: 'bg-accent-green/20 text-accent-green',
  UNDER_CONSTRUCTION: 'bg-accent-blue/20 text-accent-blue',
  NEAR_COMPLETION: 'bg-accent-orange/20 text-accent-orange',
  COMPLETED: 'bg-accent-gray/20 text-accent-gray',
};

function formatPrice(val: number | null) {
  if (!val) return 'TBD';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${(val / 1000).toFixed(0)}K`;
}

type Props = {
  project: MapProject;
  onClose: () => void;
};

export default function MapPropertyCard({ project: p, onClose }: Props) {
  return (
    // The card is sized to the map it sits on, not the window: details scroll, and the two buttons stay in view at the bottom
    <div className="absolute inset-y-0 right-0 w-full sm:w-[380px] z-30 flex items-start justify-end p-3 pointer-events-none">
      <div className="glass-panel rounded-2xl w-full max-h-full flex flex-col overflow-hidden pointer-events-auto relative">
        <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Image placeholder */}
        <div className="h-36 shrink-0 bg-gradient-to-br from-surface2 to-surface flex items-center justify-center relative">
          <SafeImage src={thumbUrl(p.mainImageUrl)} alt={p.name} fallbackLabel={p.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] || 'bg-accent-gray/20 text-accent-gray'}`}>
              {STATUS_LABELS[p.status] || p.status}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary leading-tight">{p.name}</h3>
            {p.address && <p className="text-sm text-text-muted mt-1">{p.address}</p>}
            {p.developer && (
              <p className="text-sm text-text-muted mt-0.5">
                by <span className="text-text-primary">{p.developer.name}</span>
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface2 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Price From</div>
              <div className="text-accent-green font-mono font-medium mt-0.5">
                {formatPrice(p.priceMin)}
              </div>
            </div>
            <div className="bg-surface2 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Floors</div>
              <div className="text-text-primary font-mono font-medium mt-0.5">
                {p.floors || 'TBD'}
              </div>
            </div>
            <div className="bg-surface2 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Units</div>
              <div className="text-text-primary font-mono font-medium mt-0.5">
                {p.totalUnits || 'TBD'}
              </div>
            </div>
            <div className="bg-surface2 rounded-xl px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Completion</div>
              <div className="text-text-primary font-mono font-medium mt-0.5">
                {p.estCompletion || 'TBD'}
              </div>
            </div>
          </div>

          {/* Neighborhood */}
          {p.neighborhood && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Neighborhood:</span>
              <span className="text-xs bg-surface2 px-2.5 py-1 rounded-full text-text-primary">
                {p.neighborhood.name}
              </span>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
              {p.description}
            </p>
          )}

        </div>
        </div>

        {/* Buttons: always visible */}
        <div className="shrink-0 border-t border-border p-3 space-y-2">
          <Link
            href={`/properties/${p.slug}`}
            className="btn-primary w-full text-sm"
          >
            View Full Listing
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <FollowButton projectId={p.id} projectName={p.name} source="map" className="w-full" />
        </div>
      </div>
    </div>
  );
}
