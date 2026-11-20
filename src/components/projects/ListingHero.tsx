import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import StatusBadge from '@/components/projects/StatusBadge';
import type { SkylineTower } from '@/lib/skyline';
import { fmtFt } from '@/lib/skyline';

type Img = { url: string; alt?: string };

function Silhouette({ t, scale, own }: { t: SkylineTower; scale: number; own: boolean }) {
  const w = Math.max(10, t.widthM * scale), h = t.topM * scale;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${t.widthM} ${t.topM}`} preserveAspectRatio="none" aria-hidden className="shrink-0">
      {t.rects.map(([x, rw, base, top], i) => (
        <rect key={i} x={x} y={t.topM - top} width={rw} height={top - base} fill={own ? '#E8563F' : '#515D85'} />
      ))}
      {own && t.rects.map(([x, rw, base, top], i) => (
        <rect key={`f${i}`} x={x} y={t.topM - top} width={rw} height={top - base} fill="url(#lh-floors)" />
      ))}
    </svg>
  );
}

/** The 3D tile: this tower in coral among its nearest neighbours, all at one scale. Opens the map on this tower. */
function MapTile({ slug, tower, around, className, tall }: { slug: string; tower: SkylineTower; around: SkylineTower[]; className: string; tall: boolean }) {
  const left = around.filter((_, i) => i % 2 === 0), right = around.filter((_, i) => i % 2 === 1);
  const tallest = Math.max(tower.topM, ...around.map((t) => t.topM));
  // Fit the group to the tile: by height for towers, by total width for low, wide buildings
  const span = tower.widthM + around.reduce((a, t) => a + t.widthM, 0);
  const scale = Math.min((tall ? 430 : 205) / tallest, (tall ? 520 : 400) / span);
  return (
    <Link
      href={`/miami-3d?project=${slug}`}
      className={`group relative block overflow-hidden bg-[#141A2B] text-white ${className}`}
      style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <pattern id="lh-floors" width="10" height="3.6" patternUnits="userSpaceOnUse"><rect width="10" height="0.6" fill="rgba(255,255,255,0.4)" /></pattern>
        </defs>
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-end gap-2.5 pr-20 sm:pr-28 transition-transform duration-500 group-hover:translate-y-[-4px]">
        {left.map((t) => <Silhouette key={t.id} t={t} scale={scale} own={false} />)}
        <Silhouette t={tower} scale={scale} own />
        {right.map((t) => <Silhouette key={t.id} t={t} scale={scale} own={false} />)}
      </div>
      <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-[#141A2B] via-[#141A2B]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#141A2B]/90 to-transparent sm:hidden" />
      <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
        <span className="h-2 w-2 rounded-full bg-coral" aria-hidden />
        3D map
      </span>
      <div className="absolute bottom-4 left-4 right-16">
        <div className="font-display text-xl sm:text-[22px] font-bold leading-tight tracking-[-0.03em]">See it on the 3D map</div>
        <div className="mt-0.5 text-sm text-white/70">
          {tower.heightSource === 'published' ? '' : 'About '}{fmtFt(tower.heightM)} ft. Fly around it and check the view from any floor.
        </div>
      </div>
      <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-coral transition-transform group-hover:scale-110" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
      </span>
    </Link>
  );
}

export default function ListingHero({
  slug, name, status, soldOut, main, gallery, tower, around,
}: {
  slug: string; name: string; status: string; soldOut?: boolean | null; main: string | null; gallery: Img[]; tower: SkylineTower | null; around: SkylineTower[];
}) {
  const extra = gallery.filter((g) => g.url && g.url !== main).slice(0, 2);
  const photoCount = gallery.length || (main ? 1 : 0);
  const hasSide = Boolean(tower) || extra.length > 0;

  // No photos yet: lead with the 3D tower instead of an empty photo frame
  if (!main && extra.length === 0 && tower) {
    return (
      <div className="relative overflow-hidden rounded-[26px]">
        <MapTile slug={slug} tower={tower} around={around} tall className="h-[320px] sm:h-[420px] lg:h-[480px]" />
        <div className="absolute right-4 top-4"><StatusBadge status={status} soldOut={soldOut} /></div>
      </div>
    );
  }

  return (
    <div className={`grid gap-2 overflow-hidden rounded-[26px] ${hasSide ? 'lg:grid-cols-2' : ''}`}>
      <div className="relative h-[300px] sm:h-[420px] lg:h-[560px] bg-surface2">
        {main ? (
          <SafeImage src={main} alt={`${name} rendering`} className="h-full w-full object-cover" loading="eager" fetchPriority="high" fallbackLabel={name} />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-7xl font-extrabold text-text-muted/30">{name[0]}</div>
        )}
        <div className="absolute left-4 top-4"><StatusBadge status={status} soldOut={soldOut} /></div>
        {photoCount > 1 && (
          <a href="#gallery" className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12h18M12 3v18" /></svg>
            Show all {photoCount} photos
          </a>
        )}
      </div>

      {hasSide && (
        <div className={`grid gap-2 ${extra.length && tower ? 'grid-rows-[auto_auto] lg:grid-rows-2' : ''} lg:h-[560px]`}>
          {extra.length > 0 && (
            <div className={`hidden sm:grid gap-2 ${extra.length === 2 ? 'grid-cols-2' : ''} ${tower ? 'h-[200px] lg:h-auto' : 'h-[300px] lg:h-full'}`}>
              {extra.map((g, i) => (
                <a key={g.url} href="#gallery" className="relative block overflow-hidden bg-surface2">
                  <SafeImage src={g.url} alt={g.alt || `${name}, photo ${i + 2}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]" loading="lazy" fallbackLabel={name} />
                </a>
              ))}
            </div>
          )}
          {tower && <MapTile slug={slug} tower={tower} around={around} tall={extra.length === 0} className="h-[220px] lg:h-auto" />}
        </div>
      )}
    </div>
  );
}
