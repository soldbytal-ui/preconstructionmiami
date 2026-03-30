export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { generateLocalBusinessSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';

export default async function HomePage() {
  const [
    { data: featured },
    { data: neighborhoods },
    { count: projectCount },
    { count: neighborhoodCount },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
      .eq('featured', true)
      .order('priceMin', { ascending: false })
      .limit(6),
    supabase
      .from('neighborhoods')
      .select('*, projects(count)')
      .order('displayOrder', { ascending: true })
      .limit(8),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('neighborhoods').select('*', { count: 'exact', head: true }),
  ]);

  const neighborhoodsWithCount = (neighborhoods || []).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  const schema = generateLocalBusinessSchema();
  const totalProjects = projectCount || 0;
  const totalNeighborhoods = neighborhoodCount || 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy/95 to-navy" />
        <div className="relative container-main py-24 md:py-36 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
            Miami&apos;s Premier<br />
            <span className="text-gold">Pre-Construction</span> Marketplace
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Access {totalProjects}+ new condo developments from $300K to $50M+ across South Florida.
            Brickell, Miami Beach, Downtown, Edgewater &amp; more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pre-construction" className="btn-gold text-lg px-8 py-4">
              Browse All Projects
            </Link>
            <Link href="/contact" className="btn-outline border-gold text-gold hover:bg-gold hover:text-navy text-lg px-8 py-4">
              Get Expert Guidance
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: `${totalProjects}+`, label: 'Projects' },
              { value: `${totalNeighborhoods}+`, label: 'Neighborhoods' },
              { value: '$300K-$50M+', label: 'Price Range' },
              { value: 'Pre-Launch', label: 'Access' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-gold font-display text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="section-padding bg-white">
        <div className="container-main">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy">Featured Developments</h2>
              <p className="text-gray-500 mt-2">Handpicked new construction projects across Miami</p>
            </div>
            <Link href="/pre-construction" className="hidden md:inline-flex btn-outline text-sm">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featured || []).map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/pre-construction" className="btn-outline">View All Projects &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy">Explore Miami&apos;s Neighborhoods</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              From the financial hub of Brickell to the oceanfront luxury of Miami Beach
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {neighborhoodsWithCount.map((n: any) => (
              <Link
                key={n.id}
                href={`/new-condos-${n.slug}`}
                className="card group p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold-200 transition-colors">
                  <span className="text-gold-700 font-display text-xl font-bold">{n.name[0]}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-navy group-hover:text-gold transition-colors">
                  {n.name}
                </h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{n._count.projects} Projects</span>
                  {n.avgPriceStudio && (
                    <span className="text-gold font-medium">From {formatPrice(n.avgPriceStudio)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-navy text-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How Pre-Construction Works</h2>
            <p className="text-gray-400 mt-2">Four simple steps to securing your dream home</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse', desc: 'Explore 200+ pre-construction developments across South Florida with detailed specs, pricing, and floor plans.' },
              { step: '02', title: 'Reserve', desc: 'Secure your preferred unit with a reservation deposit, typically $10K-$50K. Lock in pre-construction pricing.' },
              { step: '03', title: 'Track', desc: 'Monitor construction milestones and make scheduled deposit payments (typically 50% total before completion).' },
              { step: '04', title: 'Move In', desc: 'Receive your keys to a brand-new home. Close with a mortgage or cash for the remaining balance.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-gold font-display text-5xl font-bold mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gold-50">
        <div className="container-main text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            Ready to Explore Pre-Construction in Miami?
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8">
            Get exclusive access to pre-launch pricing and new development updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pre-construction" className="btn-navy text-lg px-8 py-4">
              Browse Projects
            </Link>
            <Link href="/contact" className="btn-gold text-lg px-8 py-4">
              Speak with an Expert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
