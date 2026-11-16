import type { Metadata } from 'next';
import { DEFAULT_OG } from '@/lib/seo';
import Link from 'next/link';
import DynamicWorld from '@/components/world/DynamicWorld';

export const metadata: Metadata = {
  title: { absolute: 'Miami 3D Map: Every New Condo Tower | PreConstructionMiami' },
  description:
    'Fly around Miami in 3D. See every pre-construction and under-construction tower in place among the existing skyline, and check the view from any floor.',
  alternates: { canonical: 'https://preconstructionmiami.net/miami-3d' },
  openGraph: {
      images: DEFAULT_OG,
    title: 'Miami 3D | PreConstructionMiami.net',
    description: 'Every new tower in place on a 3D map of Miami. Check the view from any floor.',
    url: 'https://preconstructionmiami.net/miami-3d',
    type: 'website',
  },
};

const FAQ = [
  ['What does the Miami 3D map show?', 'Existing buildings appear in white and every pre-construction or under-construction condo tower we list appears in green, standing on its own lot. Click a green tower to see its status, estimated completion, storeys, height and starting price.'],
  ['Can I see the view from a specific floor?', 'Yes. Select a tower, choose a floor with the slider and press "See the view". You are placed at that height at the centre of the building and can turn to look in any direction. It is an illustration, not the view from a particular residence.'],
  ['How accurate are the towers?', 'Positions come from county property records. Heights use published figures where a developer or city filing states one and are otherwise estimated from the storey count. Shapes are simplified. Always confirm details with the developer.'],
  ['Which areas are covered?', 'Downtown Miami, Brickell, Edgewater, Midtown and Wynwood, Miami Beach, Coconut Grove, Coral Gables, Sunny Isles Beach, Fort Lauderdale and the rest of Miami-Dade, Broward and Palm Beach counties where we list projects.'],
];

export default function Miami3DPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Miami 3D',
    url: 'https://preconstructionmiami.net/miami-3d',
    applicationCategory: 'Map',
    operatingSystem: 'Any',
    description: 'An interactive 3D map of Miami showing every pre-construction and under-construction condo tower, with the view from any floor.',
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  };
  return (
    <div className="pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <h1 className="sr-only">Miami 3D: pre-construction towers on a 3D map of Miami</h1>
      <div className="relative h-[calc(100vh-56px)] min-h-[520px] w-full">
        <DynamicWorld />
      </div>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-text-primary">Miami&apos;s new skyline, in 3D</h2>
        <p className="text-text-muted mt-4 leading-relaxed">
          This map places every pre-construction and under-construction condo development we track into a 3D model of Miami, so you can see where each
          tower stands, what surrounds it and what the outlook is from any floor. Use it to compare locations in{' '}
          <Link href="/new-condos-brickell" className="text-accent-green hover:underline">Brickell</Link>,{' '}
          <Link href="/new-condos-downtown-miami" className="text-accent-green hover:underline">Downtown Miami</Link>,{' '}
          <Link href="/new-condos-edgewater" className="text-accent-green hover:underline">Edgewater</Link> and{' '}
          <Link href="/new-condos-miami-beach" className="text-accent-green hover:underline">Miami Beach</Link>, or browse the full list of{' '}
          <Link href="/new-condos" className="text-accent-green hover:underline">new condos in Miami</Link>.
        </p>
        <div className="mt-10 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="glass-panel rounded-xl group">
              <summary className="cursor-pointer p-4 text-text-primary font-medium hover:text-accent-green transition-colors">{q}</summary>
              <p className="px-4 pb-4 text-text-muted leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
