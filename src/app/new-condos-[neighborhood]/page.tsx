import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import { generateBreadcrumbSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import InquiryForm from '@/components/projects/InquiryForm';

type Props = { params: Promise<{ neighborhood: string }> };

export async function generateStaticParams() {
  const neighborhoods = await prisma.neighborhood.findMany({ select: { slug: true } });
  return neighborhoods.map((n) => ({ neighborhood: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { neighborhood: slug } = await params;
  const n = await prisma.neighborhood.findUnique({ where: { slug } });
  if (!n) return { title: 'Neighborhood Not Found' };
  return {
    title: n.metaTitle || `New Pre-Construction Condos in ${n.name} | PreConstructionMiami.net`,
    description: n.metaDescription || `Browse pre-construction condos in ${n.name}. Find new developments, pricing, floor plans, and completion dates.`,
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { neighborhood: slug } = await params;

  const neighborhood = await prisma.neighborhood.findUnique({
    where: { slug },
    include: {
      projects: {
        orderBy: { priceMin: 'asc' },
        include: { neighborhood: true, developer: true },
      },
      _count: { select: { projects: true } },
    },
  });

  if (!neighborhood) notFound();

  const otherNeighborhoods = await prisma.neighborhood.findMany({
    where: { id: { not: neighborhood.id } },
    take: 4,
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { projects: true } } },
  });

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'Pre-Construction', url: 'https://preconstructionmiami.net/pre-construction' },
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
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="container-main">
          <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span>/</span>
            <Link href="/pre-construction" className="hover:text-gold">Pre-Construction</Link>
            <span>/</span>
            <span className="text-gold">{neighborhood.name}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold">
            New Pre-Construction Condos in <span className="text-gold">{neighborhood.name}</span>
          </h1>
          <p className="text-gray-300 mt-4 text-lg max-w-2xl">
            {neighborhood._count.projects} active {neighborhood._count.projects === 1 ? 'development' : 'developments'} available.
            {neighborhood.avgPriceStudio && ` Starting from ${formatPrice(neighborhood.avgPriceStudio)}.`}
          </p>
        </div>
      </section>

      <div className="container-main py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            {neighborhood.description && (
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {neighborhood.description}
                </div>
              </div>
            )}

            {/* Price Table */}
            {prices.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-navy mb-4">Average Pre-Construction Prices</h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-navy text-white text-sm">
                        <th className="px-6 py-3 text-left font-medium">Unit Type</th>
                        <th className="px-6 py-3 text-right font-medium">Starting Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((p, i) => (
                        <tr key={p.type} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-3 text-sm text-gray-700">{p.type}</td>
                          <td className="px-6 py-3 text-sm text-right font-semibold text-gold">{formatPrice(p.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Projects */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-6">
                All Projects in {neighborhood.name} ({neighborhood.projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {neighborhood.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-20">
              <InquiryForm neighborhoodId={neighborhood.id} source="neighborhood" />

              {/* Other Neighborhoods */}
              <div className="mt-6 card p-6">
                <h3 className="font-display text-lg font-semibold text-navy mb-4">Other Neighborhoods</h3>
                <div className="space-y-3">
                  {otherNeighborhoods.map((n) => (
                    <Link
                      key={n.id}
                      href={`/new-condos-${n.slug}`}
                      className="flex items-center justify-between text-sm hover:text-gold transition-colors"
                    >
                      <span>{n.name}</span>
                      <span className="text-gray-400">{n._count.projects} projects</span>
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
