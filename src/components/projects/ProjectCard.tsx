import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { formatPrice, CATEGORY_LABELS } from '@/lib/utils';

const NEIGHBORHOOD_FALLBACK_IMAGES: Record<string, string> = {
  brickell: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=600&h=400&fit=crop',
  'downtown-miami': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&h=400&fit=crop',
  'miami-beach': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=600&h=400&fit=crop',
  edgewater: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&h=400&fit=crop',
  'midtown-wynwood': 'https://images.unsplash.com/photo-1571895457364-1ec050122c8d?w=600&h=400&fit=crop',
  'coconut-grove': 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&h=400&fit=crop',
  'sunny-isles-beach': 'https://images.unsplash.com/photo-1548263594-a71ea65a8598?w=600&h=400&fit=crop',
  surfside: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop',
  hollywood: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop',
  'fort-lauderdale': 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=600&h=400&fit=crop',
  'coral-gables': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  aventura: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'south-beach': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=600&h=400&fit=crop',
  'bal-harbour': 'https://images.unsplash.com/photo-1548263594-a71ea65a8598?w=600&h=400&fit=crop',
  'bay-harbor-islands': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&h=400&fit=crop',
  'key-biscayne': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop',
  'design-district': 'https://images.unsplash.com/photo-1571895457364-1ec050122c8d?w=600&h=400&fit=crop',
  'hallandale-beach': 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop',
  'pompano-beach': 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=600&h=400&fit=crop',
  'north-bay-village': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&h=400&fit=crop',
  'north-miami-beach': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'palm-beach': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'boca-raton': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'west-palm-beach': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
};

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop';

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
  const imageUrl =
    project.mainImageUrl ||
    NEIGHBORHOOD_FALLBACK_IMAGES[project.neighborhood?.slug || ''] ||
    DEFAULT_FALLBACK;

  return (
    <Link href={`/properties/${project.slug}`} className="card group hover:border-accent-green/30 transition-all">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${project.name} - Pre-Construction in ${project.neighborhood?.name || 'Miami'}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {!project.mainImageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
            <span className="text-white/80 text-xs">{project.neighborhood?.name || 'Miami'}</span>
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
