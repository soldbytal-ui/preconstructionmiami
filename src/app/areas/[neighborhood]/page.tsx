export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { generateBreadcrumbSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import InquiryForm from '@/components/projects/InquiryForm';

type Props = { params: Promise<{ neighborhood: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { neighborhood: slug } = await params;
  const { data: n } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!n) return { title: 'Neighborhood Not Found' };
  return {
    title: n.metaTitle || `New Pre-Construction Condos in ${n.name} | PreConstructionMiami.net`,
    description: n.metaDescription || `Browse pre-construction condos in ${n.name}. Find new developments, pricing, floor plans, and completion dates.`,
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { neighborhood: slug } = await params;

  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!neighborhood) notFound();

  const { data: projects } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('neighborhoodId', neighborhood.id)
    .order('priceMin', { ascending: true });

  const { data: otherNeighborhoods } = await supabase
    .from('neighborhoods')
    .select('*, projects(count)')
    .neq('id', neighborhood.id)
    .order('displayOrder', { ascending: true })
    .limit(4);

  const projectList = projects || [];
  const projectCount = projectList.length;

  const otherWithCount = (otherNeighborhoods || []).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'New Condos', url: 'https://preconstructionmiami.net/new-condos' },
    { name: neighborhood.name, url: `https://preconstructionmiami.net/new-condos-${neighborhood.slug}` },
  ]);

  const prices = [
    { type: 'Studio', price: neighborhood.avgPriceStudio },
    { type: '1 Bedroom', price: neighborhood.avgPrice1br },
    { type: '2 Bedroom', price: neighborhood.avgPrice2br },
    { type: '3 Bedroom', price: neighborhood.avgPrice3br },
    { type: 'Penthouse', price: neighborhood.avgPricePenthouse },
  ].filter((p) => p.price);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Hero */}
      <section className="bg-surface py-16 md:py-24 border-b border-border">
        <div className="container-main">
          <nav className="text-sm text-text-muted mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
            <span>/</span>
            <Link href="/new-condos" className="hover:text-accent-green transition-colors">New Condos</Link>
            <span>/</span>
            <span className="text-accent-green">{neighborhood.name}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary">
            New Pre-Construction Condos in <span className="text-accent-green">{neighborhood.name}</span>
          </h1>
          <p className="text-text-muted mt-4 text-lg max-w-2xl">
            {projectCount} active {projectCount === 1 ? 'development' : 'developments'} available.
            {neighborhood.avgPriceStudio && ` Starting from ${formatPrice(neighborhood.avgPriceStudio)}.`}
          </p>
        </div>
      </section>

      <div className="container-main py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {neighborhood.description && (
              <div className="text-text-muted leading-relaxed whitespace-pre-line">
                {neighborhood.description}
              </div>
            )}

            {/* Price Table */}
            {prices.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Average Pre-Construction Prices</h2>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface2 text-sm">
                        <th className="px-6 py-3 text-left font-medium text-text-muted">Unit Type</th>
                        <th className="px-6 py-3 text-right font-medium text-text-muted">Starting Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((p, i) => (
                        <tr key={p.type} className={`border-t border-border ${i % 2 === 0 ? 'bg-bg' : 'bg-surface'}`}>
                          <td className="px-6 py-3 text-sm text-text-primary">{p.type}</td>
                          <td className="px-6 py-3 text-sm text-right font-semibold font-mono text-accent-green">{formatPrice(p.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Projects */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                All Projects in {neighborhood.name} ({projectCount})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projectList.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              {projectCount === 0 && (
                <div className="text-center py-16">
                  <p className="text-text-muted">No projects listed in this neighborhood yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-20">
              <InquiryForm neighborhoodId={neighborhood.id} source="neighborhood" />

              {/* Other Neighborhoods */}
              <div className="mt-6 card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Other Neighborhoods</h3>
                <div className="space-y-3">
                  {otherWithCount.map((n: any) => (
                    <Link
                      key={n.id}
                      href={`/new-condos-${n.slug}`}
                      className="flex items-center justify-between text-sm text-text-muted hover:text-accent-green transition-colors"
                    >
                      <span>{n.name}</span>
                      <span className="text-text-muted/60">{n._count.projects} projects</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
