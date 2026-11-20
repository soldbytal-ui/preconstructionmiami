// Cached and refreshed in the background every 5 minutes.
export const revalidate = 300;
// fix: moved devsWithProjects before itemList to prevent ReferenceError
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { generateBreadcrumbSchema, generateItemListSchema, DEFAULT_OG } from '@/lib/seo';
import DevLogo from '@/components/ui/DevLogo';

export const metadata: Metadata = {
  title: { absolute: 'Miami Pre-Construction Developers | PreConstructionMiami' },
  description:
    'Explore top pre-construction condo developers in South Florida. Browse developer profiles, project portfolios, and track records from Brickell to Palm Beach.',
  alternates: {
    canonical: 'https://preconstructionmiami.net/developers',
  },
  openGraph: {
      images: DEFAULT_OG,
    title: 'Miami Pre-Construction Developers',
    description: 'Explore top pre-construction condo developers in South Florida. Browse profiles, portfolios, and track records.',
    url: 'https://preconstructionmiami.net/developers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miami Pre-Construction Developers',
    description: 'Explore top pre-construction condo developers in South Florida.',
  },
};

export default async function DevelopersPage() {
  const { data: developers } = await supabase
    .from('developers')
    .select('*, projects:projects(id, name, slug, priceMin, priceMax, neighborhood:neighborhoods(name))')
    .order('name');

  // Filter to only show developers with at least 1 project
  // Most active first, then by name
  const devsWithProjects = (developers || [])
    .filter((d: any) => d.projects && d.projects.length > 0)
    .sort((a: any, b: any) => b.projects.length - a.projects.length || a.name.localeCompare(b.name));
  const projectTotal = devsWithProjects.reduce((n: number, d: any) => n + d.projects.length, 0);

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'Developers', url: 'https://preconstructionmiami.net/developers' },
  ]);

  const itemList = generateItemListSchema(
    devsWithProjects.map((d: any, i: number) => ({
      name: d.name,
      url: `https://preconstructionmiami.net/developers/${d.slug}`,
      position: i + 1,
    }))
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">Developers</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="display-big text-text-primary">
            Who is building South Florida
          </h1>
          <p className="text-text-muted mt-3 max-w-2xl">
            {devsWithProjects.length} developers are behind the {projectTotal} projects on this site. They are listed
            with the most active first. Open one to see everything it is building.
          </p>
        </div>

        {/* Developer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devsWithProjects.map((dev: any) => {
            const projectCount = dev.projects?.length || 0;
            const initials = dev.name
              .split(/[\s,&]+/)
              .filter((w: string) => w.length > 0)
              .slice(0, 2)
              .map((w: string) => w[0].toUpperCase())
              .join('');

            const neighborhoods = [
              ...new Set(
                (dev.projects || [])
                  .map((p: any) => p.neighborhood?.name)
                  .filter(Boolean)
              ),
            ];

            return (
              <Link
                key={dev.id}
                href={`/developers/${dev.slug}`}
                className="card p-6 group hover:border-accent-green/30 transition-all"
              >
                {/* Logo / Initials */}
                <div className="flex items-center gap-4 mb-4">
                  <DevLogo src={dev.logoUrl} name={dev.name} size={(dev.logoUrl || '').includes(',') ? 48 : 64} />
                  <div className="min-w-0">
                    <h2 className="text-text-primary font-semibold group-hover:text-accent-green transition-colors line-clamp-1">
                      {dev.name}
                    </h2>
                    <div className="text-xs text-text-muted mt-0.5">
                      {projectCount} project{projectCount !== 1 ? 's' : ''}
                      {dev.headquarters && ` · ${dev.headquarters}`}
                    </div>
                  </div>
                </div>

                {/* Bio excerpt */}
                {dev.description && (
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-3 mb-4">
                    {dev.description}
                  </p>
                )}

                {/* Neighborhood tags */}
                {neighborhoods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(neighborhoods as string[]).slice(0, 4).map((n) => (
                      <span
                        key={n}
                        className="text-xs bg-surface2 border border-border text-text-muted px-2 py-0.5 rounded-full"
                      >
                        {n}
                      </span>
                    ))}
                    {neighborhoods.length > 4 && (
                      <span className="text-xs text-text-muted">+{neighborhoods.length - 4} more</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
