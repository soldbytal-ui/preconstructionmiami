// Cached and refreshed in the background every 5 minutes.
export const revalidate = 300;
// Pages are generated on first visit, then cached (ISR).
export async function generateStaticParams() {
  return [];
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase, throwIfOutage } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import { formatPrice, formatPriceRange } from '@/lib/utils';
import { generateBreadcrumbSchema, fitTitle, DEFAULT_OG } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import DevLogo from '@/components/ui/DevLogo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: dev } = await supabase
    .from('developers')
    .select('name, description, logoUrl')
    .eq('slug', slug)
    .single();

  if (!dev) return { title: 'Developer Not Found' };

  const title = `${dev.name} | Miami Developer Profile`;
  const description = dev.description
    ? dev.description.slice(0, 160)
    : `Explore ${dev.name}'s pre-construction condo portfolio in South Florida. View projects, pricing, and developer track record.`;

  return {
    title: { absolute: fitTitle(title) },
    description,
    alternates: {
      canonical: `https://preconstructionmiami.net/developers/${slug}`,
    },
    openGraph: {
      images: DEFAULT_OG,
      title,
      description,
      url: `https://preconstructionmiami.net/developers/${slug}`,
      type: 'website',
      ...(dev.logoUrl && { images: [{ url: dev.logoUrl.split(',')[0], alt: dev.name }] }),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function DeveloperProfilePage({ params }: Props) {
  const { slug } = await params;

  const { data: developer, error: loadError } = await supabase
    .from('developers')
    .select('*')
    .eq('slug', slug)
    .single();

  throwIfOutage(loadError);
  if (!developer) notFound();

  const { data: projects } = await supabase
    .from('projects')
    .select(CARD_COLUMNS)
    .eq('developerId', developer.id)
    .order('name');

  const { data: otherDevs } = await supabase
    .from('developers')
    .select('id, name, slug, logoUrl, projects:projects(id)')
    .neq('id', developer.id)
    .limit(50);

  // Filter other devs to those with projects, pick 4
  const relatedDevs = (otherDevs || [])
    .filter((d: any) => d.projects && d.projects.length > 0)
    .sort((a: any, b: any) => (b.projects?.length || 0) - (a.projects?.length || 0))
    .slice(0, 4);

  // Stats
  const allProjects = projects || [];
  const neighborhoods = [...new Set(allProjects.map((p: any) => p.neighborhood?.name).filter(Boolean))];
  const priceMinAll = Math.min(...allProjects.map((p: any) => p.priceMin).filter(Boolean));
  const priceMaxAll = Math.max(...allProjects.map((p: any) => p.priceMax).filter(Boolean));
  const yearsActive = developer.foundedYear
    ? new Date().getFullYear() - developer.foundedYear
    : null;

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'Developers', url: 'https://preconstructionmiami.net/developers' },
    { name: developer.name, url: `https://preconstructionmiami.net/developers/${developer.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <Link href="/developers" className="hover:text-accent-green transition-colors">Developers</Link>
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{developer.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <DevLogo src={developer.logoUrl} name={developer.name} size={80} initialsClassName="text-accent-green font-bold text-2xl" />
          <div>
            <h1 className="display-big text-text-primary">{developer.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-muted flex-wrap">
              {developer.headquarters && <span>{developer.headquarters}</span>}
              {developer.foundedYear && <span>Est. {developer.foundedYear}</span>}
              {developer.websiteUrl && (
                <a
                  href={developer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-green hover:underline"
                >
                  Website &rarr;
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Facts */}
        <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y border-border py-5 mb-10">
          <div>
            <dt className="text-sm text-text-muted">Projects on this site</dt>
            <dd className="text-text-primary font-semibold text-2xl mt-0.5">{allProjects.length}</dd>
          </div>
          {neighborhoods.length > 0 && (
            <div>
              <dt className="text-sm text-text-muted">Neighbourhoods</dt>
              <dd className="text-text-primary font-semibold text-2xl mt-0.5">{neighborhoods.length}</dd>
            </div>
          )}
          {isFinite(priceMinAll) && (
            <div>
              <dt className="text-sm text-text-muted">Price range</dt>
              <dd className="text-text-primary font-semibold text-2xl mt-0.5">{formatPriceRange(priceMinAll, priceMaxAll)}</dd>
            </div>
          )}
          {yearsActive && (
            <div>
              <dt className="text-sm text-text-muted">Founded</dt>
              <dd className="text-text-primary font-semibold text-2xl mt-0.5">{developer.foundedYear}</dd>
            </div>
          )}
        </dl>

        {/* Bio */}
        {developer.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">About {developer.name}</h2>
            <p className="text-text-muted leading-relaxed max-w-3xl">{developer.description}</p>
          </div>
        )}

        {/* Projects Grid */}
        {allProjects.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Projects by {developer.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProjects.map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {/* Other Developers */}
        {relatedDevs.length > 0 && (
          <div className="border-t border-border pt-10">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Other active developers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedDevs.map((d: any) => (
                <Link
                  key={d.id}
                  href={`/developers/${d.slug}`}
                  className="card p-4 group hover:border-accent-green/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <DevLogo src={d.logoUrl} name={d.name} size={40} />
                    <div className="min-w-0">
                      <h3 className="text-text-primary font-medium group-hover:text-accent-green transition-colors line-clamp-1">
                        {d.name}
                      </h3>
                      <div className="text-xs text-text-muted mt-0.5">
                        {d.projects?.length || 0} project{(d.projects?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
