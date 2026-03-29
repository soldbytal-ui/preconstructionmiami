import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { formatPrice, CATEGORY_LABELS } from '@/lib/utils';

type ProjectCardProps = {
  project: {
    slug: string;
    name: string;
    status: string;
    category: string;
    priceMin: number | null;
    priceMax: number | null;
    totalUnits: number | null;
    floors: number | null;
    estCompletion: string | null;
    mainImageUrl: string | null;
    neighborhood: { name: string; slug: string } | null;
    developer: { name: string } | null;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/pre-construction/${project.slug}`} className="card group hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-navy-200 to-navy-300">
        {project.mainImageUrl ? (
          <img src={project.mainImageUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-navy-300 text-4xl font-display">{project.name[0]}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={project.status} />
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-navy/80 text-gold text-xs font-medium px-2 py-1 rounded">
            {CATEGORY_LABELS[project.category] || project.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-navy group-hover:text-gold transition-colors leading-tight">
          {project.name}
        </h3>
        {project.developer && (
          <p className="text-sm text-gray-500 mt-1">by {project.developer.name}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-gold font-semibold">
            {project.priceMin ? `From ${formatPrice(project.priceMin)}` : 'Contact for pricing'}
          </span>
          {project.neighborhood && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {project.neighborhood.name}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          {project.totalUnits && <span>{project.totalUnits} Units</span>}
          {project.floors && <span>{project.floors} Floors</span>}
          {project.estCompletion && <span>Est. {project.estCompletion}</span>}
        </div>
      </div>
    </Link>
  );
}
