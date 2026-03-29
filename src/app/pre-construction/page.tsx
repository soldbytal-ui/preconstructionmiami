import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';

export const metadata: Metadata = {
  title: 'Pre-Construction Condos in Miami | Browse All Projects',
  description: 'Browse 200+ pre-construction condo projects across Miami. Filter by neighborhood, price, status, and category. Brickell, Miami Beach, Downtown & more.',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, neighborhood, status, category, sort } = params;

  const where: any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (neighborhood) where.neighborhood = { slug: neighborhood };
  if (status) where.status = status;
  if (category) where.category = category;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { priceMin: 'asc' };
  else if (sort === 'price_desc') orderBy = { priceMin: 'desc' };
  else if (sort === 'units_desc') orderBy = { totalUnits: 'desc' };

  const [projects, neighborhoods, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      include: { neighborhood: true, developer: true },
    }),
    prisma.neighborhood.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.count({ where }),
  ]);

  return (
    <div className="container-main py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-navy">
          Pre-Construction Condos in Miami
        </h1>
        <p className="text-gray-500 mt-2">
          {total} {total === 1 ? 'project' : 'projects'} available across South Florida
        </p>
      </div>

      <Suspense fallback={<div className="h-20" />}>
        <ProjectFilters neighborhoods={neighborhoods} />
      </Suspense>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects found</h3>
          <p className="text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
