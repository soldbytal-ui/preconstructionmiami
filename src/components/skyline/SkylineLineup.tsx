'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { SkylineTower } from '@/lib/skyline';

const M_TO_FT = 3.28084;
const STATUS: Record<string, { label: string; color: string; group: 'building' | 'planned' }> = {
  PRE_LAUNCH: { label: 'Planned', color: '#00E5B4', group: 'planned' },
  PRE_CONSTRUCTION: { label: 'Planned', color: '#00E5B4', group: 'planned' },
  UNDER_CONSTRUCTION: { label: 'Under construction', color: '#38B6FF', group: 'building' },
  NEAR_COMPLETION: { label: 'Near completion', color: '#FF7A3D', group: 'building' },
};

type Unit = 'ft' | 'm';
type Filter = 'all' | 'building' | 'planned';

/** The tallest finished building in Florida today, drawn as a grey ghost for scale. */
const REFERENCE = { name: 'Panorama Tower', note: 'Tallest completed today', heightM: 264.6, floors: 85, widthM: 46 };

const STAGE_PX = 560;

function height(m: number, unit: Unit) {
  return unit === 'ft' ? `${Math.round(m * M_TO_FT).toLocaleString('en-US')} ft` : `${Math.round(m).toLocaleString('en-US')} m`;
}

function Silhouette({ t, scale, dim }: { t: SkylineTower; scale: number; dim: boolean }) {
  const w = Math.max(18, t.widthM * scale);
  const h = t.heightM * scale;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${t.widthM} ${t.topM}`} preserveAspectRatio="none" aria-hidden className="block transition-opacity duration-200" style={{ opacity: dim ? 0.28 : 1 }}>
      {t.rects.map(([x, rw, base, top, color], i) => (
        <rect key={i} x={x} y={Math.max(0, t.topM - top)} width={rw} height={Math.max(0.2, top - base)} fill={color} />
      ))}
    </svg>
  );
}

export default function SkylineLineup({ towers, total }: { towers: SkylineTower[]; total: number }) {
  const [unit, setUnit] = useState<Unit>('ft');
  const [filter, setFilter] = useState<Filter>('all');
  const [hover, setHover] = useState<string | null>(null);

  const shown = useMemo(
    () => towers.filter((t) => filter === 'all' || STATUS[t.status]?.group === filter).slice(0, 14),
    [towers, filter]
  );

  // One scale for the whole lineup, so every tower is drawn at true relative size
  const tallest = Math.max(REFERENCE.heightM, ...towers.map((t) => t.heightM));
  const scale = STAGE_PX / (tallest * 1.06);
  const step = unit === 'ft' ? 250 / M_TO_FT : 50;
  const ticks: number[] = [];
  const SUPERTALL = 300;
  for (let m = step; m < tallest * 1.04; m += step) if (Math.abs(m - SUPERTALL) > 14) ticks.push(m);

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm transition-colors ${active ? 'bg-text-primary text-bg font-medium' : 'text-text-muted hover:text-text-primary'}`;

  return (
    <div>
      <div className="container-main flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Filter by stage">
          <button className={chip(filter === 'all')} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
          <button className={chip(filter === 'building')} aria-pressed={filter === 'building'} onClick={() => setFilter('building')}>Under construction</button>
          <button className={chip(filter === 'planned')} aria-pressed={filter === 'planned'} onClick={() => setFilter('planned')}>Planned</button>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Units">
          <button className={chip(unit === 'ft')} aria-pressed={unit === 'ft'} onClick={() => setUnit('ft')}>Feet</button>
          <button className={chip(unit === 'm')} aria-pressed={unit === 'm'} onClick={() => setUnit('m')}>Metres</button>
        </div>
      </div>

      <div className="relative overflow-x-auto overscroll-x-contain" style={{ background: 'linear-gradient(180deg, #0A0C0F 0%, #0f141b 55%, #172230 100%)' }}>
        <div className="relative min-w-max px-6 md:px-10">
          {/* Height lines, shared by every tower */}
          <div className="pointer-events-none absolute left-0 right-0 top-0" style={{ height: STAGE_PX }} aria-hidden>
            {ticks.map((m) => (
              <div key={m} className="absolute left-0 right-0 h-0 border-t border-white/[0.06]" style={{ bottom: m * scale }}>
                <span className="absolute left-3 top-0 -translate-y-1/2 whitespace-nowrap text-[11px] tabular-nums text-text-muted bg-[#0d1117]/80 px-1.5 rounded">
                  {unit === 'ft' ? `${Math.round(m * M_TO_FT).toLocaleString('en-US')} ft` : `${Math.round(m)} m`}
                </span>
              </div>
            ))}
            <div className="absolute left-0 right-0 h-0 border-t border-dashed border-white/30" style={{ bottom: SUPERTALL * scale }}>
              <span className="absolute left-3 top-0 -translate-y-[130%] whitespace-nowrap text-[11px] text-text-primary/80 bg-[#0d1117]/80 px-1.5 rounded">
                Supertall line, {unit === 'ft' ? '984 ft' : '300 m'}
              </span>
            </div>
          </div>

          <ol className="relative flex items-start gap-2 md:gap-3 pl-16">
            <li className="flex w-[124px] shrink-0 flex-col items-center">
              <div className="flex items-end justify-center" style={{ height: STAGE_PX }}>
                <div style={{ width: REFERENCE.widthM * scale, height: REFERENCE.heightM * scale, background: 'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.09))' }} aria-hidden />
              </div>
              <div className="w-full border-t border-white/25 pt-3 pb-6 text-center">
                <div className="text-[13px] font-medium leading-tight text-text-muted">{REFERENCE.name}</div>
                <div className="mt-1 text-sm tabular-nums text-text-muted">{height(REFERENCE.heightM, unit)}</div>
                <div className="text-xs text-text-muted">{REFERENCE.floors} storeys</div>
                <div className="mt-1 text-xs text-text-muted">{REFERENCE.note}</div>
              </div>
            </li>

            {shown.map((t) => {
              const s = STATUS[t.status] || STATUS.PRE_CONSTRUCTION;
              const rank = towers.indexOf(t) + 1;
              const est = t.heightSource !== 'published';
              return (
                <li key={t.id} className="shrink-0" style={{ width: Math.max(124, Math.ceil(t.widthM * scale) + 14) }}>
                  <Link
                    href={`/properties/${t.slug}`}
                    className="group flex flex-col items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
                    onMouseEnter={() => setHover(t.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(t.id)}
                    onBlur={() => setHover(null)}
                  >
                    <div className="flex items-end justify-center" style={{ height: STAGE_PX }}>
                      <Silhouette t={t} scale={scale} dim={hover !== null && hover !== t.id} />
                    </div>
                    <div className="w-full border-t border-white/25 pt-3 pb-6 text-center">
                      <div className="text-[13px] font-medium leading-tight text-text-primary group-hover:underline underline-offset-4">
                        <span className="tabular-nums text-text-muted">{rank}. </span>{t.name}
                      </div>
                      <div className="mt-1 text-sm tabular-nums text-text-primary">
                        {est ? 'about ' : ''}{height(t.heightM, unit)}
                      </div>
                      <div className="text-xs text-text-muted">{t.floors ? `${t.floors} storeys` : 'Storeys not announced'}</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
                        {s.label}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <p className="container-main mt-3 text-sm text-text-muted">
        Showing the {shown.length} tallest of {total} towers. Every tower is drawn to the same scale. Scroll sideways to see them all; select one to open its listing.
      </p>
    </div>
  );
}
