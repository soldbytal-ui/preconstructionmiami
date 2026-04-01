export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatPriceRange, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/utils';
import { generateRealEstateListingSchema, generateBreadcrumbSchema } from '@/lib/seo';
import StatusBadge from '@/components/projects/StatusBadge';
import InquiryForm from '@/components/projects/InquiryForm';
import ProjectCard from '@/components/projects/ProjectCard';
import ImageGallery from '@/components/projects/ImageGallery';
import FloorPlans from '@/components/projects/FloorPlans';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*)')
    .eq('slug', slug)
    .single();

  if (!project) return { title: 'Project Not Found' };

  const area = project.neighborhood?.name || 'Miami';
  return {
    title: `${project.name} | Pre-Construction in ${area}`,
    description:
      project.description?.slice(0, 160) ||
      `${project.name} - New pre-construction development in ${area}. ${project.priceMin ? `From ${formatPrice(project.priceMin)}.` : ''} ${project.totalUnits ? `${project.totalUnits} residences.` : ''}`,
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('slug', slug)
    .single();

  if (!project) notFound();

  const { data: relatedProjects } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('neighborhoodId', project.neighborhoodId)
    .neq('id', project.id)
    .limit(3);

  const listingSchema = generateRealEstateListingSchema(project);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'Properties', url: 'https://preconstructionmiami.net/pre-construction' },
    ...(project.neighborhood
      ? [{ name: project.neighborhood.name, url: `https://preconstructionmiami.net/new-condos-${project.neighborhood.slug}` }]
      : []),
    { name: project.name, url: `https://preconstructionmiami.net/properties/${project.slug}` },
  ]);

  const amenities = (project.amenities as string[] | null) || [];
  const projectImages = (project.images as any) || {};
  const galleryImages = (projectImages.gallery || []) as { url: string; alt?: string; type?: string }[];
  const floorPlanImages = (projectImages.floorPlans || []) as { url: string; label?: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <Link href="/pre-construction" className="hover:text-accent-green transition-colors">Properties</Link>
          {project.neighborhood && (
            <>
              <span className="text-text-muted/40">/</span>
              <Link href={`/new-condos-${project.neighborhood.slug}`} className="hover:text-accent-green transition-colors">
                {project.neighborhood.name}
              </Link>
            </>
          )}
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{project.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={project.status} />
                <span className="text-xs text-text-muted bg-surface2 border border-border px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[project.category] || project.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-text-primary">{project.name}</h1>
              {project.address && <p className="text-text-muted mt-2">{project.address}</p>}
              {project.developer && (
                <p className="text-text-muted mt-1">
                  by <span className="text-text-primary font-medium">{project.developer.name}</span>
                </p>
              )}
            </div>

            {/* Image placeholder */}
            <div className="bg-gradient-to-br from-surface2 to-surface rounded-2xl h-64 md:h-96 flex items-center justify-center overflow-hidden border border-border">
              {project.mainImageUrl ? (
                <img src={project.mainImageUrl} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-text-muted/20 text-7xl font-light">{project.name[0]}</span>
              )}
            </div>

            {/* Key Specs — 4 glass panels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Price', value: formatPriceRange(project.priceMin, project.priceMax) },
                { label: 'Total Units', value: project.totalUnits ? `${project.totalUnits} Residences` : 'TBD' },
                { label: 'Floors', value: project.floors ? `${project.floors} Stories` : 'TBD' },
                { label: 'Est. Completion', value: project.estCompletion || 'TBD' },
              ].map((spec) => (
                <div key={spec.label} className="glass-panel rounded-xl p-4">
                  <div className="text-xs text-text-muted uppercase tracking-wider">{spec.label}</div>
                  <div className="text-text-primary font-semibold mt-1">{spec.value}</div>
                </div>
              ))}
            </div>

            {project.unitTypes && (
              <div className="glass-panel rounded-xl p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Unit Types</div>
                <div className="text-text-primary font-medium">{project.unitTypes}</div>
              </div>
            )}

            {project.depositStructure && (
              <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4">
                <div className="text-xs text-accent-green uppercase tracking-wider mb-1">Deposit Structure</div>
                <div className="text-text-primary font-medium">{project.depositStructure}</div>
              </div>
            )}

            {/* Description */}
            {project.description && (
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">About {project.name}</h2>
                <div className="text-text-muted leading-relaxed whitespace-pre-line">
                  {project.description}
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm text-text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            <ImageGallery images={galleryImages} projectName={project.name} />

            {/* Floor Plans — gated */}
            <FloorPlans floorPlans={floorPlanImages} projectId={project.id} projectName={project.name} />

            {/* Architect */}
            {project.architect && (
              <div className="glass-panel rounded-xl p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Architect</div>
                <div className="text-text-primary font-medium">{project.architect}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <InquiryForm projectId={project.id} projectName={project.name} />

              {/* Neighborhood link */}
              {project.neighborhood && (
                <Link
                  href={`/new-condos-${project.neighborhood.slug}`}
                  className="mt-6 block card p-5 group hover:border-accent-green/30 transition-all"
                >
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Neighborhood</div>
                  <div className="text-text-primary text-lg font-semibold group-hover:text-accent-green transition-colors">
                    {project.neighborhood.name}
                  </div>
                  <div className="text-accent-green text-sm mt-1">View all projects &rarr;</div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Related Projects */}
        {(relatedProjects || []).length > 0 && (
          <div className="mt-20 pt-10 border-t border-border">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              More in {project.neighborhood?.name || 'This Area'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedProjects || []).map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
