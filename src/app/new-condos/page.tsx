export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { supabase, throwIfOutage } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import type { Metadata } from 'next';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import { generateBreadcrumbSchema, DEFAULT_OG, generateProjectListSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: 'New Condos in Miami | All Pre-Construction Projects' },
  description: 'Browse every new pre-construction condo project across Miami-Dade, Broward & Palm Beach. Filter by neighborhood, price, status, and category.',
  alternates: {
    canonical: 'https://preconstructionmiami.net/new-condos',
  },
  openGraph: {
      images: DEFAULT_OG,
    title: 'New Condos in Miami | Browse All Pre-Construction Projects',
    description: 'Browse every new pre-construction condo project across Miami-Dade, Broward & Palm Beach.',
    url: 'https://preconstructionmiami.net/new-condos',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New Condos in Miami | Browse All Pre-Construction Projects',
    description: 'Browse every new pre-construction condo project across Miami-Dade, Broward & Palm Beach.',
  },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function NewCondosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, neighborhood, category, sort, budget } = params;
  // Older links used ?status=; keep them working
  const LEGACY: Record<string, string> = { PRE_LAUNCH: 'planned', PRE_CONSTRUCTION: 'planned', UNDER_CONSTRUCTION: 'building', NEAR_COMPLETION: 'near', COMPLETED: 'completed' };
  const stage = params.stage || (params.status ? LEGACY[params.status] : '') || '';
  const STAGE_STATUS: Record<string, string[]> = {
    planned: ['PRE_LAUNCH', 'PRE_CONSTRUCTION'],
    building: ['UNDER_CONSTRUCTION'],
    near: ['NEAR_COMPLETION'],
    completed: ['COMPLETED'],
  };
  const PER_PAGE = 30;

  const [{ data: allProjects, error: loadError }, { data: neighborhoods }] = await Promise.all([
    supabase.from('projects').select(`${CARD_COLUMNS}, heightM`),
    supabase.from('neighborhoods').select('id, name, slug').order('name'),
  ]);
  throwIfOutage(loadError);

  const everything: any[] = allProjects || [];
  // Finished buildings only appear when asked for
  const live = everything.filter((p) => p.status !== 'COMPLETED');
  const counts: Record<string, number> = {};
  for (const p of live) if (p.neighborhood?.slug) counts[p.neighborhood.slug] = (counts[p.neighborhood.slug] || 0) + 1;
  const areaOptions = (neighborhoods || []).filter((n: any) => counts[n.slug]).map((n: any) => ({ ...n, count: counts[n.slug] }));

  const needle = (q || '').trim().toLowerCase();
  const maxPrice = Number(budget) || 0;
  let projects = (stage === 'completed' ? everything : live).filter((p) => {
    if (stage && !STAGE_STATUS[stage]?.includes(p.status)) return false;
    if (category && p.category !== category) return false;
    if (neighborhood && p.neighborhood?.slug !== neighborhood) return false;
    if (maxPrice && !(p.priceMin && p.priceMin <= maxPrice)) return false;
    if (needle && !`${p.name} ${p.neighborhood?.name || ''} ${p.developer?.name || ''}`.toLowerCase().includes(needle)) return false;
    return true;
  });
  const height = (p: any) => Number(p.heightM) || (p.floors ? p.floors * 3.3 : 0);
  const year = (p: any) => (/^\d{4}$/.test(p.estCompletion || '') ? Number(p.estCompletion) : 9999);
  const SORTS: Record<string, (a: any, b: any) => number> = {
    price_asc: (a, b) => (a.priceMin || 9e12) - (b.priceMin || 9e12),
    price_desc: (a, b) => (b.priceMin || 0) - (a.priceMin || 0),
    soon: (a, b) => year(a) - year(b),
    az: (a, b) => a.name.localeCompare(b.name),
    tall: (a, b) => height(b) - height(a),
  };
  projects = projects.sort(SORTS[sort || 'tall'] || SORTS.tall);
  const filtered = Boolean(needle || neighborhood || stage || maxPrice || category);
  const total = projects.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pageCount, Math.max(1, parseInt(params.page || '1', 10) || 1));
  const pageProjects = projects.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, neighborhood, stage, budget, category, sort })) if (v) sp.set(k, v);
    if (n > 1) sp.set('page', String(n));
    const qs = sp.toString();
    return qs ? `/new-condos?${qs}` : '/new-condos';
  };

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'New Condos', url: 'https://preconstructionmiami.net/new-condos' },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(generateProjectListSchema('New pre-construction condos in Miami and South Florida', pageProjects as any)) }}
    />
    <div className="container-main pt-28 md:pt-32 pb-10">
      <div className="mb-8">
        <h1 className="display-big max-w-[16ch] text-text-primary">Every project, in one list</h1>
        <p className="mt-5 max-w-[60ch] text-lg text-text-primary/85">
          {live.length} pre-construction towers and residences across Miami-Dade, Broward and Palm Beach. Filter by area, stage and budget.
        </p>
      </div>

      <Suspense fallback={<div className="h-16" />}>
        <ProjectFilters neighborhoods={areaOptions} />
      </Suspense>

      <p className="mb-6 text-[15px] text-text-muted" aria-live="polite">
        {total} {total === 1 ? 'project' : 'projects'}{filtered ? ' match' + (total === 1 ? 'es' : '') : ''}
        {filtered && <> · <Link href="/new-condos" className="underline underline-offset-4 hover:text-text-primary">Clear filters</Link></>}
      </p>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageProjects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-border bg-surface px-6 py-16 text-center">
          <h2 className="text-2xl text-text-primary">Nothing matches those filters</h2>
          <p className="mt-2 text-text-muted">Widen the budget, pick another area, or <Link href="/new-condos" className="underline underline-offset-4">clear the filters</Link>.</p>
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 flex-wrap">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn-secondary text-sm" rel="prev">&larr; Previous</Link>
          )}
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`w-10 h-10 flex items-center justify-center rounded-full text-sm border transition-colors ${
                n === page
                  ? 'bg-ink text-white border-ink font-semibold'
                  : 'border-border text-text-muted hover:text-text-primary hover:border-text-primary'
              }`}
            >
              {n}
            </Link>
          ))}
          {page < pageCount && (
            <Link href={pageHref(page + 1)} className="btn-secondary text-sm" rel="next">Next &rarr;</Link>
          )}
        </nav>
      )}
    </div>
    </>
  );
}
