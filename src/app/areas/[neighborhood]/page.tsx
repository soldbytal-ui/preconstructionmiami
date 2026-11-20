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
import { formatPrice } from '@/lib/utils';
import { generateBreadcrumbSchema, generateFAQSchema, fitTitle, fitDesc, DEFAULT_OG, generateProjectListSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import InquiryForm from '@/components/projects/InquiryForm';
import DynamicMap from '@/components/map/DynamicMap';
import ProjectFactsTable from '@/components/projects/ProjectFactsTable';
import { projectFacts, summarySentences, factFaqs } from '@/lib/facts';

type Props = { params: Promise<{ neighborhood: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { neighborhood: slug } = await params;
  const { data: n } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!n) return { title: 'Neighborhood Not Found' };
  // Title and description come from the live listings, so the counts and prices in search results stay true
  const { data: ps } = await supabase.from('projects').select(CARD_COLUMNS).eq('neighborhoodId', n.id);
  const f = projectFacts((ps || []) as any);
  const title = f.total
    ? fitTitle(`New Condos in ${n.name}: ${f.total} Pre-Construction ${f.total === 1 ? 'Project' : 'Projects'}`)
    : fitTitle(`New Pre-Construction Condos in ${n.name}`);
  const description = f.total
    ? fitDesc(`${f.total} new condo ${f.total === 1 ? 'project' : 'projects'} in ${n.name}${f.cheapest?.priceMin ? `, from ${formatPrice(f.cheapest.priceMin)}` : ''}. ${f.tallest?.floors ? `Tallest: ${f.tallest.name}, ${f.tallest.floors} storeys. ` : ''}Prices, developers and completion dates.`, 160)
    : `New pre-construction condos in ${n.name}: prices, developers and completion dates as projects are announced.`;
  const url = `https://preconstructionmiami.net/new-condos-${n.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // An area with nothing listed yet stays out of search results until it has a project
    ...(f.total === 0 && { robots: { index: false, follow: true } }),
    openGraph: { images: DEFAULT_OG, title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { neighborhood: slug } = await params;

  const { data: neighborhood, error: loadError } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single();

  throwIfOutage(loadError);
  if (!neighborhood) notFound();

  const [{ data: projects }, { data: allNeighborhoods }] = await Promise.all([
    supabase
      .from('projects')
      .select(CARD_COLUMNS)
      .eq('neighborhoodId', neighborhood.id)
      .order('priceMin', { ascending: true }),
    supabase
      .from('neighborhoods')
      .select('*, projects(count)')
      .neq('id', neighborhood.id)
      .order('displayOrder', { ascending: true })
      .limit(12),
  ]);

  const projectList = projects || [];
  const projectCount = projectList.length;

  const allWithCount = (allNeighborhoods || []).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  // Split neighborhoods for sidebar (4) and bottom interlinking (all)
  const sidebarNeighborhoods = allWithCount.slice(0, 4);
  const bottomNeighborhoods = allWithCount;

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'New Condos', url: 'https://preconstructionmiami.net/new-condos' },
    { name: neighborhood.name, url: `https://preconstructionmiami.net/new-condos-${neighborhood.slug}` },
  ]);

  // Summary, table and questions are all worked out from the listings, so they update when the data does
  const facts = projectFacts(projectList as any);
  const summary = summarySentences(`in ${neighborhood.name}`, facts);
  const faqs = projectCount > 0
    ? factFaqs(neighborhood.name, facts)
    : [{ question: `Are there new condo projects in ${neighborhood.name}?`, answer: `We are not tracking any new condo projects in ${neighborhood.name} at the moment. New launches are added as they are announced.` }];
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const pageUrl = `https://preconstructionmiami.net/new-condos-${neighborhood.slug}`;
  const collectionSchema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: `New condos in ${neighborhood.name}`, url: pageUrl,
    description: summary.join(' '), dateModified: new Date().toISOString().slice(0, 10), inLanguage: 'en-US',
    about: { '@type': 'Place', name: `${neighborhood.name}, Florida`, address: { '@type': 'PostalAddress', addressLocality: neighborhood.name, addressRegion: 'FL', addressCountry: 'US' } },
    isPartOf: { '@type': 'WebSite', name: 'PreConstructionMiami', url: 'https://preconstructionmiami.net' },
  };

  const faqSchema = generateFAQSchema(faqs);

  // Neighborhood center coordinates for mini-map
  const NEIGHBORHOOD_MAP_CENTERS: Record<string, [number, number]> = {
    'brickell': [25.7635, -80.1940],
    'downtown-miami': [25.7750, -80.1900],
    'edgewater': [25.7950, -80.1870],
    'midtown-wynwood': [25.8050, -80.1990],
    'miami-beach': [25.7907, -80.1300],
    'coconut-grove': [25.7280, -80.2410],
    'sunny-isles-beach': [25.9430, -80.1240],
    'aventura': [25.9565, -80.1392],
    'surfside': [25.8785, -80.1258],
    'hollywood': [25.9870, -80.1490],
    'design-district': [25.8141, -80.1913],
    'coral-gables': [25.7210, -80.2680],
    'south-beach': [25.7826, -80.1340],
    'bal-harbour': [25.8920, -80.1270],
    'north-bay-village': [25.8460, -80.1530],
    'hallandale-beach': [25.9812, -80.1485],
    'key-biscayne': [25.6935, -80.1627],
    'fort-lauderdale': [26.1224, -80.1373],
    'bay-harbor-islands': [25.8870, -80.1320],
    'palm-beach': [26.7056, -80.0364],
    'north-miami-beach': [25.9330, -80.1620],
    'pompano-beach': [26.2379, -80.1248],
    'boca-raton': [26.3587, -80.0831],
    'west-palm-beach': [26.7153, -80.0534],
  };
  // Open the map on the projects themselves when the area has any, so they are never off screen
  const { data: spots } = await supabase.from('projects').select('latitude, longitude').eq('neighborhoodId', neighborhood.id);
  const pts = (spots || []).filter((p: any) => p.latitude && p.longitude);
  const mid = (xs: number[]) => { const v = [...xs].sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
  const mapCenter: [number, number] = pts.length
    ? [mid(pts.map((p: any) => p.latitude)), mid(pts.map((p: any) => p.longitude))]
    : NEIGHBORHOOD_MAP_CENTERS[slug] || [25.7750, -80.1900];
  const spread = pts.length ? Math.max(...pts.map((p: any) => Math.max(Math.abs(p.latitude - mapCenter[0]), Math.abs(p.longitude - mapCenter[1])))) : 0;
  const mapZoom = spread > 0.05 ? 12.6 : spread > 0.025 ? 13.4 : spread > 0.012 ? 14 : 14.6;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      {projectList.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateProjectListSchema(`New pre-construction condos in ${neighborhood.name}`, projectList as any)) }}
        />
      )}

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
            {summary[0] || 'No new condo projects listed here yet.'} Updated {updated}.
          </p>
        </div>
      </section>

      {/* The same 3D map as the home page, opened on this neighbourhood */}
      <section className="container-main mt-8">
        <div className="theme-dark relative h-[60vh] min-h-[420px] overflow-hidden rounded-[26px] border-2 border-ink bg-bg shadow-[0_30px_60px_-40px_rgba(17,27,51,0.6)]">
          <DynamicMap focus={{ lat: mapCenter[0], lng: mapCenter[1], zoom: mapZoom, name: neighborhood.name }} />
        </div>
      </section>

      <div className="container-main pt-24 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* The numbers first: what is being built here, stated plainly */}
            {projectCount > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">New condos in {neighborhood.name} at a glance</h2>
                <p className="text-text-muted leading-relaxed mb-6">{summary.join(' ')}</p>
                <ProjectFactsTable projects={projectList as any} caption={`New condo projects in ${neighborhood.name}: developer, storeys, residences, starting price, completion and stage`} />
                <p className="mt-3 text-xs text-text-muted">Figures come from developer announcements and public filings and can change. Last checked {updated}.</p>
              </section>
            )}

            {/* About This Neighborhood */}
            {neighborhood.description && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  About {neighborhood.name} Real Estate
                </h2>
                <div className="text-text-muted leading-relaxed whitespace-pre-line">
                  {neighborhood.description}
                </div>
              </section>
            )}

            {/* Projects */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                All Pre-Construction Projects in {neighborhood.name} ({projectCount})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projectList.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              {projectCount === 0 && (
                <div className="text-center py-16 card">
                  <p className="text-text-muted mb-4">No projects listed in {neighborhood.name} yet.</p>
                  <p className="text-sm text-text-muted">
                    New pre-construction launches are announced regularly.{' '}
                    <Link href="/contact-us" className="text-accent-green hover:underline">Contact us</Link>
                    {' '}to be notified of upcoming projects in {neighborhood.name}.
                  </p>
                </div>
              )}
            </section>

            {/* Lifestyle Section */}
            {neighborhood.lifestyleDescription && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Living in {neighborhood.name}: Lifestyle & Amenities
                </h2>
                <div className="text-text-muted leading-relaxed whitespace-pre-line">
                  {neighborhood.lifestyleDescription}
                </div>
              </section>
            )}

            {/* FAQ Section */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Questions about new condos in {neighborhood.name}
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details key={i} className="card group" open={i === 0}>
                    <summary className="p-5 cursor-pointer list-none flex items-center justify-between text-text-primary font-medium hover:text-accent-green transition-colors">
                      <h3 className="text-base font-medium pr-4">{faq.question}</h3>
                      <span className="text-accent-green text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <div className="px-5 pb-5 text-text-muted text-sm leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Top Developers in this Neighborhood */}
            {(() => {
              const devCounts: Record<string, { name: string; slug: string; count: number }> = {};
              for (const p of projectList) {
                const dev = (p as any).developer;
                if (dev?.name && dev?.slug) {
                  if (!devCounts[dev.slug]) devCounts[dev.slug] = { name: dev.name, slug: dev.slug, count: 0 };
                  devCounts[dev.slug].count++;
                }
              }
              const topDevs = Object.values(devCounts).sort((a, b) => b.count - a.count).slice(0, 6);
              if (topDevs.length === 0) return null;
              return (
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-6">
                    Top Developers in {neighborhood.name}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {topDevs.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/developers/${d.slug}`}
                        className="card p-4 hover:border-accent-green/30 transition-all group"
                      >
                        <div className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors line-clamp-1">
                          {d.name}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {d.count} {d.count === 1 ? 'project' : 'projects'} in {neighborhood.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Explore All Neighborhoods — Full Interlinking */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Explore More South Florida Neighborhoods
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bottomNeighborhoods.map((n: any) => (
                  <Link
                    key={n.id}
                    href={`/new-condos-${n.slug}`}
                    className="card p-4 hover:border-accent-green/30 transition-all group"
                  >
                    <div className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
                      {n.name}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {n._count.projects} {n._count.projects === 1 ? 'project' : 'projects'}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/new-condos" className="text-sm text-accent-green hover:underline">
                  View all neighborhoods &rarr;
                </Link>
              </div>
            </section>

            {/* CTA — Contextual interlink to homepage */}
            <section className="bg-accent-green/5 border border-accent-green/20 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-text-primary mb-3">
                Ready to Invest in {neighborhood.name}?
              </h2>
              <p className="text-text-muted text-sm mb-6 max-w-lg mx-auto">
                Our partner agents specialize in {neighborhood.name} pre-construction condos.
                Get VIP access to new launches, developer pricing, and exclusive floor plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact-us" className="btn-primary">
                  Schedule a Consultation
                </Link>
                <Link href="/new-condos" className="px-6 py-3 border border-border rounded-xl text-sm text-text-primary hover:border-accent-green/30 transition-colors">
                  Browse All Projects
                </Link>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
              <InquiryForm neighborhoodId={neighborhood.id} source="neighborhood" />

              {/* Nearby Neighborhoods */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Nearby Neighborhoods</h3>
                <div className="space-y-3">
                  {sidebarNeighborhoods.map((n: any) => (
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

              {/* Quick Links */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/" className="block text-sm text-text-muted hover:text-accent-green transition-colors">
                    &rarr; Home
                  </Link>
                  <Link href="/new-condos" className="block text-sm text-text-muted hover:text-accent-green transition-colors">
                    &rarr; All New Condos
                  </Link>
                  <Link href="/blog" className="block text-sm text-text-muted hover:text-accent-green transition-colors">
                    &rarr; Market Insights Blog
                  </Link>
                  <Link href="/contact-us" className="block text-sm text-text-muted hover:text-accent-green transition-colors">
                    &rarr; Connect with an Agent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
