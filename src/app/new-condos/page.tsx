export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import type { Metadata } from 'next';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import { generateBreadcrumbSchema, DEFAULT_OG, generateProjectListSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: 'New Condos in Miami | All Pre-Construction Projects' },
  description: 'Browse 150+ new pre-construction condo projects across Miami-Dade, Broward & Palm Beach. Filter by neighborhood, price, status, and category.',
  alternates: {
    canonical: 'https://preconstructionmiami.net/new-condos',
  },
  openGraph: {
      images: DEFAULT_OG,
    title: 'New Condos in Miami | Browse All Pre-Construction Projects',
    description: 'Browse 150+ new pre-construction condo projects across Miami-Dade, Broward & Palm Beach.',
    url: 'https://preconstructionmiami.net/new-condos',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New Condos in Miami | Browse All Pre-Construction Projects',
    description: 'Browse 150+ new pre-construction condo projects across Miami-Dade, Broward & Palm Beach.',
  },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function NewCondosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, neighborhood, status, category, sort } = params;
  const PER_PAGE = 30;

  let projectQuery = supabase
    .from('projects')
    .select(CARD_COLUMNS);

  if (q) projectQuery = projectQuery.ilike('name', `%${q}%`);
  if (status) projectQuery = projectQuery.eq('status', status);
  if (category) projectQuery = projectQuery.eq('category', category);

  if (sort === 'price_asc') projectQuery = projectQuery.order('priceMin', { ascending: true });
  else if (sort === 'price_desc') projectQuery = projectQuery.order('priceMin', { ascending: false });
  else if (sort === 'units_desc') projectQuery = projectQuery.order('totalUnits', { ascending: false });
  else projectQuery = projectQuery.order('createdAt', { ascending: false });

  const [{ data: allProjects }, { data: neighborhoods }] = await Promise.all([
    projectQuery,
    supabase.from('neighborhoods').select('id, name, slug').order('name'),
  ]);

  // Filter by neighborhood slug in JS since it's a relation filter
  let projects = allProjects || [];
  if (neighborhood) {
    projects = projects.filter((p: any) => p.neighborhood?.slug === neighborhood);
  }
  // Sort so projects with their own photos appear first
  projects = projects.sort((a: any, b: any) => {
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });
  const total = projects.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pageCount, Math.max(1, parseInt(params.page || '1', 10) || 1));
  const pageProjects = projects.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, neighborhood, status, category, sort })) if (v) sp.set(k, v);
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
    <div className="container-main pt-24 pb-10">
      <div className="mb-8">
        <h1 className="text-4xl md:text-6xl leading-[0.95] tracking-[-0.045em] text-text-primary">
          New Condos in Miami
        </h1>
        <p className="text-text-muted mt-2">
          {total} {total === 1 ? 'project' : 'projects'} available across South Florida
        </p>
      </div>

      <Suspense fallback={<div className="h-20" />}>
        <ProjectFilters neighborhoods={neighborhoods || []} />
      </Suspense>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageProjects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-text-primary mb-2">No projects found</h3>
          <p className="text-text-muted">Try adjusting your filters</p>
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
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm border transition-colors ${
                n === page
                  ? 'bg-accent-green text-bg border-accent-green font-semibold'
                  : 'border-border text-text-muted hover:text-text-primary hover:border-accent-green/40'
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
