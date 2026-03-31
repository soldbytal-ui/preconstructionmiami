export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';

export const metadata: Metadata = {
  title: 'New Condos in Miami | Browse All Pre-Construction Projects',
  description: 'Browse 200+ new pre-construction condo projects across Miami-Dade, Broward & Palm Beach. Filter by neighborhood, price, status, and category.',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function NewCondosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, neighborhood, status, category, sort } = params;

  let projectQuery = supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)');

  if (q) projectQuery = projectQuery.ilike('name', `%${q}%`);
  if (status) projectQuery = projectQuery.eq('status', status);
  if (category) projectQuery = projectQuery.eq('category', category);

  if (sort === 'price_asc') projectQuery = projectQuery.order('priceMin', { ascending: true });
  else if (sort === 'price_desc') projectQuery = projectQuery.order('priceMin', { ascending: false });
  else if (sort === 'units_desc') projectQuery = projectQuery.order('totalUnits', { ascending: false });
  else projectQuery = projectQuery.order('createdAt', { ascending: false });

  const [{ data: allProjects }, { data: neighborhoods }] = await Promise.all([
    projectQuery,
    supabase.from('neighborhoods').select('*').order('name'),
  ]);

  // Filter by neighborhood slug in JS since it's a relation filter
  let projects = allProjects || [];
  if (neighborhood) {
    projects = projects.filter((p: any) => p.neighborhood?.slug === neighborhood);
  }
  const total = projects.length;

  return (
    <div className="container-main py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
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
          {projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-text-primary mb-2">No projects found</h3>
          <p className="text-text-muted">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
