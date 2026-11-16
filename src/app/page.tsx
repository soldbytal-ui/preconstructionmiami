// Rebuilt at most every 5 minutes; served from the CDN in between.
export const revalidate = 300;

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import { formatPrice } from '@/lib/utils';
import { generateLocalBusinessSchema, generateWebSiteSchema, generateHowToSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import DynamicMap from '@/components/map/DynamicMap';

export default async function HomePage() {
  const featuredRes = await supabase
    .from('projects')
    .select(CARD_COLUMNS)
    .eq('featured', true)
    .order('priceMin', { ascending: false })
    .limit(6);

  const neighborhoodRes = await supabase
    .from('neighborhoods')
    .select('id, name, slug, avgPriceStudio, projects(count)')
    .order('displayOrder', { ascending: true })
    .limit(12);

  const countRes = await supabase.from('projects').select('*', { count: 'exact', head: true });
  const nhCountRes = await supabase.from('neighborhoods').select('*', { count: 'exact', head: true });

  const featured: any[] = featuredRes.data || [];
  const neighborhoods = neighborhoodRes.data || [];
  const projectCount = countRes.count || 0;
  const neighborhoodCount = nhCountRes.count || 0;

  const neighborhoodsWithCount = (neighborhoods).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  // Sort featured: projects with images first
  const sortedFeatured = [...featured].sort((a: any, b: any) => {
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });

  const schema = generateLocalBusinessSchema();
  const webSiteSchema = generateWebSiteSchema();
  const howToSchema = generateHowToSchema();
  const totalProjects = projectCount;
  const totalNeighborhoods = neighborhoodCount;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* Hero — 3D Map */}
      <section className="relative w-full md:h-[78vh]">
        <div className="relative h-[62vh] md:h-full w-full">
          <DynamicMap />

          {/* Keeps the menu readable over map labels */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg via-bg/70 to-transparent pointer-events-none z-10" />
          {/* Bottom gradient fade */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />
        </div>

        {/* Stats panel: overlays the map on desktop, sits under it on phones */}
        <div className="relative z-10 px-4 mt-3 md:mt-0 md:px-0 md:absolute md:bottom-16 md:left-8">
          <div className="glass-panel rounded-2xl p-5 md:p-6 md:max-w-md">
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary leading-tight mb-4">
              Miami&apos;s Premier<br />
              <span className="text-accent-green">Pre-Construction</span> Marketplace
            </h1>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div>
                <div className="text-accent-green font-mono text-lg md:text-xl font-semibold">{totalProjects}</div>
                <div className="text-text-muted text-xs mt-0.5">Projects</div>
              </div>
              <div>
                <div className="text-accent-green font-mono text-lg md:text-xl font-semibold">{totalNeighborhoods}</div>
                <div className="text-text-muted text-xs mt-0.5">Neighborhoods</div>
              </div>
              <div>
                <div className="text-accent-green font-mono text-lg md:text-xl font-semibold whitespace-nowrap">$300K&ndash;$50M</div>
                <div className="text-text-muted text-xs mt-0.5">Price Range</div>
              </div>
            </div>
            <Link href="/new-condos" className="btn-primary inline-flex items-center gap-2 text-sm">
              Browse All Properties &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Developments */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">Featured Developments</h2>
              <p className="text-text-muted mt-2">Handpicked new construction projects across Miami</p>
            </div>
            <Link href="/new-condos" className="hidden md:inline-flex btn-secondary text-sm">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFeatured.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/new-condos" className="btn-secondary">View All Projects &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Explore Neighborhoods */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">Explore Miami&apos;s Neighborhoods</h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">
              From the financial hub of Brickell to the oceanfront luxury of Miami Beach
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {neighborhoodsWithCount.map((n: any) => (
              <Link
                key={n.id}
                href={`/new-condos-${n.slug}`}
                className="glass-panel group rounded-2xl p-5 hover:border-accent-green/30 transition-all hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 bg-accent-green/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-accent-green font-semibold text-lg">{n.name[0]}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-green transition-colors">
                  {n.name}
                </h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-text-muted">{n._count.projects} Projects</span>
                  {n.avgPriceStudio && (
                    <span className="text-accent-green font-mono text-sm">From {formatPrice(n.avgPriceStudio)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">How Pre-Construction Works</h2>
            <p className="text-text-muted mt-2">Four simple steps to securing your dream home</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse', desc: `Explore ${totalProjects} pre-construction developments across South Florida with detailed specs, pricing, and floor plans.` },
              { step: '02', title: 'Reserve', desc: 'Secure your preferred unit with a reservation deposit, typically $10K-$50K. Lock in pre-construction pricing.' },
              { step: '03', title: 'Track', desc: 'Monitor construction milestones and make scheduled deposit payments (typically 50% total before completion).' },
              { step: '04', title: 'Move In', desc: 'Receive your keys to a brand-new home. Close with a mortgage or cash for the remaining balance.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-accent-green font-mono text-5xl font-bold mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-text-primary mb-4">
            Ready to Explore Pre-Construction in Miami?
          </h2>
          <p className="text-text-muted max-w-xl mx-auto mb-8">
            Get exclusive access to pre-launch pricing and new development updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/new-condos" className="btn-primary text-lg px-8 py-4">
              Browse Projects
            </Link>
            <Link href="/contact-us" className="btn-secondary text-lg px-8 py-4">
              Connect with a Local Agent
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
