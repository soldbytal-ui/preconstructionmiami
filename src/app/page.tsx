// Rebuilt at most every 5 minutes; served from the CDN in between.
export const revalidate = 300;

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import { formatPrice } from '@/lib/utils';
import { generateLocalBusinessSchema, generateWebSiteSchema, generateHowToSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import DynamicMap from '@/components/map/DynamicMap';
import SkylineLineup from '@/components/skyline/SkylineLineup';
import { getSkyline, fmtFt } from '@/lib/skyline';

export default async function HomePage() {
  const featuredRes = await supabase
    .from('projects')
    .select(CARD_COLUMNS)
    .eq('featured', true)
    .order('priceMin', { ascending: false })
    .limit(6);

  const neighborhoodRes = await supabase
    .from('neighborhoods')
    .select('id, name, slug, avgPriceStudio, projects(count)')
    .order('displayOrder', { ascending: true })
    .limit(12);

  const countRes = await supabase.from('projects').select('*', { count: 'exact', head: true });
  const nhCountRes = await supabase.from('neighborhoods').select('*', { count: 'exact', head: true });

  const featured: any[] = featuredRes.data || [];
  const neighborhoods = neighborhoodRes.data || [];
  const projectCount = countRes.count || 0;
  const neighborhoodCount = nhCountRes.count || 0;

  const neighborhoodsWithCount = (neighborhoods).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  // Sort featured: projects with images first
  const sortedFeatured = [...featured].sort((a: any, b: any) => {
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });

  const devRes = await supabase.from('developers').select('name, slug, logoUrl, projects(count)').not('logoUrl', 'is', null);
  const devLogos = ((devRes.data as any[]) || [])
    .filter((d) => d.logoUrl && !d.logoUrl.includes(','))
    .sort((a, b) => (b.projects?.[0]?.count || 0) - (a.projects?.[0]?.count || 0))
    .slice(0, 16);

  const skyline = (await getSkyline()).filter((t) => t.status !== 'COMPLETED');
  const rising = skyline.filter((t) => t.status === 'UNDER_CONSTRUCTION' || t.status === 'NEAR_COMPLETION').length;
  const tallest = skyline.find((t) => t.heightSource === 'published') || skyline[0];
  const hoodRows = neighborhoodsWithCount.filter((n: any) => n._count.projects > 0).sort((a: any, b: any) => b._count.projects - a._count.projects).slice(0, 10);

  const schema = generateLocalBusinessSchema();
  const webSiteSchema = generateWebSiteSchema();
  const howToSchema = generateHowToSchema();
  const totalProjects = projectCount;
  const totalNeighborhoods = neighborhoodCount;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* Hero */}
      <section className="gridbg pt-28 md:pt-36 pb-10">
        <div className="container-main">
          <h1 className="display-mega max-w-[11ch] text-text-primary">See Miami&apos;s next skyline before it&apos;s built.</h1>
          <p className="mt-7 max-w-[54ch] text-lg md:text-xl leading-normal text-text-primary/85">
            {totalProjects} new towers and residences across Miami, Fort Lauderdale and Palm Beach, each one placed on the map and drawn to scale.{' '}
            {rising} are already rising.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/contact-us" className="btn-primary">Get price lists</Link>
            <Link href="/miami-3d" className="btn-secondary">Open the 3D map</Link>
          </div>
          {tallest && (
            <p className="mt-5 text-[15px] text-text-muted">
              The tallest with a published height is{' '}
              <Link href={`/properties/${tallest.slug}`} className="text-text-primary underline underline-offset-4">{tallest.name}</Link>, at {fmtFt(tallest.heightM)} feet.
            </p>
          )}
        </div>
      </section>

      {/* The map */}
      <section className="pb-6">
        <div className="container-main">
          <div className="theme-dark relative h-[68vh] min-h-[460px] overflow-hidden rounded-[26px] border-2 border-ink bg-bg shadow-[0_30px_60px_-40px_rgba(17,27,51,0.6)]">
            <DynamicMap />
          </div>
          <div className="mt-10 grid md:grid-cols-3 border-b border-border">
            {[
              ['Every tower on one map', 'Fly around a 3D model of the city and see where each project stands and what surrounds it.'],
              ['Drawn to scale', 'Each tower is modelled from its lot, storeys and height, so you can compare them side by side.'],
              ['Follow what you like', 'Create a free account to keep a list of towers and ask for prices when you are ready.'],
            ].map(([h, p], i) => (
              <div key={h} className={`py-7 md:pb-10 ${i ? 'border-t md:border-t-0 md:border-l border-border md:pl-8' : ''} md:pr-8`}>
                <h3 className="text-[22px] font-bold text-text-primary">{h}</h3>
                <p className="mt-2 max-w-[34ch] text-text-primary/80">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="pt-20 md:pt-24">
        <div className="container-main">
          <div className="mb-9 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <h2 className="display-big text-text-primary">On the market now</h2>
            <Link href="/new-condos" className="link-underline self-start md:self-auto">Browse all {totalProjects} projects</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFeatured.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Skyline */}
      <section className="pt-20 md:pt-24">
        <div className="container-main mb-9 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <h2 className="display-big text-text-primary max-w-[14ch]">The tallest, drawn to one scale</h2>
          <Link href="/tallest-buildings" className="link-underline self-start md:self-auto">See the full ranking</Link>
        </div>
        <SkylineLineup towers={skyline.slice(0, 40)} total={skyline.length} />
      </section>

      {/* Neighborhoods */}
      <section className="pt-20 md:pt-24">
        <div className="container-main">
          <div className="mb-9 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <h2 className="display-big text-text-primary">Where it&apos;s being built</h2>
            <Link href="/areas" className="link-underline self-start md:self-auto">All {totalNeighborhoods} neighborhoods</Link>
          </div>
          <div className="grid md:grid-cols-2 md:gap-x-14 border-t-2 border-ink">
            {hoodRows.map((n: any) => (
              <Link key={n.id} href={`/new-condos-${n.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-border py-[18px]">
                <span className="font-display text-[26px] md:text-[32px] font-bold leading-tight tracking-[-0.035em] transition-all group-hover:translate-x-1.5 group-hover:text-accent-green">{n.name}</span>
                <span className="text-[15px] tabular-nums text-text-muted">{n._count.projects} {n._count.projects === 1 ? 'project' : 'projects'}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How buying works */}
      <section className="pt-20 md:pt-24">
        <div className="container-main">
          <h2 className="display-big text-text-primary max-w-[15ch] mb-9">How buying before completion works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-[22px] border border-border bg-surface">
            {[
              ['Reserve', 'A deposit holds a residence while the developer prepares contracts.'],
              ['Sign the contract', 'You sign the purchase agreement and pay the first contract deposit.'],
              ['Pay as it rises', 'Further deposits fall due at construction milestones such as groundbreaking and topping off.'],
              ['Close', 'The balance is paid at closing, once the building receives its certificate of occupancy.'],
            ].map(([h, p], i) => (
              <div key={h} className="border-b sm:border-r border-border p-7 last:border-b-0 lg:border-b-0 lg:last:border-r-0">
                <div className="font-display text-[54px] font-extrabold leading-none tracking-[-0.05em] text-coral mb-5">{i + 1}</div>
                <h3 className="text-[21px] font-bold text-text-primary">{h}</h3>
                <p className="mt-2 text-base text-text-primary/80">{p}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[80ch] text-sm text-text-muted">
            This is a general outline, not legal or financial advice. Deposit amounts, refund terms and timing differ between projects; read the
            contract with a Florida real estate attorney.
          </p>
        </div>
      </section>

      {/* Developers */}
      {devLogos.length > 0 && (
        <section className="pt-20 md:pt-24">
          <div className="container-main">
            <div className="mb-9 flex flex-col md:flex-row md:items-end justify-between gap-5">
              <h2 className="display-big text-text-primary">The developers behind them</h2>
              <Link href="/developers" className="link-underline self-start md:self-auto">See every developer</Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3.5">
              {devLogos.map((d: any) => (
                <Link key={d.slug} href={`/developers/${d.slug}`} title={d.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.logoUrl} alt={d.name} loading="lazy" className="aspect-square w-full rounded-[18px] border border-border transition-colors hover:border-ink" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="pt-24 pb-10">
        <div className="container-main">
          <div className="grid items-end gap-8 rounded-[30px] bg-coral px-8 py-14 text-white md:grid-cols-[1fr_auto] md:px-16 md:py-[76px]">
            <div>
              <h2 className="font-display font-extrabold leading-[0.92] tracking-[-0.05em] text-[clamp(40px,6vw,84px)] max-w-[12ch]">Get the price list for any tower.</h2>
              <p className="mt-5 max-w-[44ch] text-lg text-[#FFE9E3]">Tell us which project you are looking at. We reply with current pricing, floor plans and what is still available.</p>
            </div>
            <Link href="/contact-us" className="inline-flex h-14 items-center justify-center rounded-full bg-ink px-8 font-semibold text-white">Request a price list</Link>
          </div>
        </div>
      </section>
    </>
  );
}
