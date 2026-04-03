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
    <Link href={`/properties/${project.slug}`} className="card group hover:border-accent-green/30 transition-all">
      <div className="relative h-48 overflow-hidden">
        {project.mainImageUrl ? (
          <img src={project.mainImageUrl} alt={`${project.name} - Pre-Construction in ${project.neighborhood?.name || 'Miami'}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${
            project.status === 'PRE_CONSTRUCTION' || project.status === 'PRE_LAUNCH'
              ? 'bg-gradient-to-br from-accent-green/10 via-surface2 to-accent-green/5'
              : project.status === 'UNDER_CONSTRUCTION'
              ? 'bg-gradient-to-br from-blue-500/10 via-surface2 to-blue-500/5'
              : project.status === 'NEAR_COMPLETION'
              ? 'bg-gradient-to-br from-orange-500/10 via-surface2 to-orange-500/5'
              : 'bg-gradient-to-br from-surface2 to-surface'
          }`}>
            <span className="text-text-primary/60 text-base font-semibold leading-tight line-clamp-2">{project.name}</span>
            {project.neighborhood && (
              <span className="text-text-muted/40 text-xs mt-1.5">{project.neighborhood.name}</span>
            )}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={project.status} />
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-bg/80 backdrop-blur-sm text-text-muted text-xs font-medium px-2 py-1 rounded border border-border">
            {CATEGORY_LABELS[project.category] || project.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-green transition-colors leading-tight">
          {project.name}
        </h3>
        {project.developer && (
          <p className="text-sm text-text-muted mt-1">by {project.developer.name}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-accent-green font-mono font-medium">
            {project.priceMin ? `From ${formatPrice(project.priceMin)}` : 'Contact for pricing'}
          </span>
          {project.neighborhood && (
            <span className="text-xs text-text-muted bg-surface2 px-2 py-1 rounded">
              {project.neighborhood.name}
            </span>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-text-muted">
          {project.totalUnits && <span><span className="font-mono text-text-primary">{project.totalUnits}</span> Units</span>}
          {project.floors && <span><span className="font-mono text-text-primary">{project.floors}</span> Floors</span>}
          {project.estCompletion && <span>Est. {project.estCompletion}</span>}
        </div>
      </div>
    </Link>
  );
}
