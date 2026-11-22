// Cached and refreshed in the background every 5 minutes.
export const revalidate = 300;

import Link from 'next/link';
import type { Metadata } from 'next';
import { generateBreadcrumbSchema, generateOrganizationSchema, DEFAULT_OG } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { allArchitects, hasProfile } from '@/lib/architects';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'How PreConstructionMiami.net is built: developer-published facts, a to-scale 3D map of every new tower, architect and developer records, and open data.',
  alternates: {
    canonical: 'https://preconstructionmiami.net/about',
  },
  openGraph: {
      images: DEFAULT_OG,
    title: 'About PreConstructionMiami.net',
    description: 'Miami\'s premier marketplace for new construction condos. We help buyers access pre-launch pricing across 170+ developments.',
    url: 'https://preconstructionmiami.net/about',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About PreConstructionMiami.net',
    description: 'Miami\'s premier marketplace for new construction condos. Connecting buyers with 170+ developments.',
  },
};

async function siteCounts() {
  const count = async (table: string) => (await supabase.from(table).select('id', { count: 'exact', head: true })).count || 0;
  const [projects, developers, buildings, architects] = await Promise.all([count('projects'), count('developers'), count('buildings'), allArchitects()]);
  return { projects, developers, buildings, architects: architects.length, architectProfiles: architects.filter(hasProfile).length };
}

const HOW: { title: string; body: string; link?: { href: string; label: string } }[] = [
  {
    title: 'Where the facts come from',
    body: 'Storeys, residence counts, starting prices and completion dates are taken from what each developer publishes: its website, sales materials and public filings. When a developer changes a figure, we change ours. Where a developer has not published something, the field stays empty rather than being estimated.',
  },
  {
    title: 'A 3D map built tower by tower',
    body: 'Every project is modelled at its real location and drawn to scale, from the lot outline and the published height and floor count. Towers are shaped to follow the real design where renderings allow, so a stepped or curved building looks stepped or curved. You can stand on any floor to see the view, move the sun through the day, and filter by what is planned, being built or finished.',
    link: { href: '/miami-3d', label: 'Open the 3D map' },
  },
  {
    title: 'Completed towers, for context',
    body: 'A new building only makes sense next to what is already there. We profile finished condo towers by the same developers, with the year built, height and architect, and label them on the map so you can compare a developer’s promises with what it has delivered.',
    link: { href: '/buildings', label: 'See existing buildings' },
  },
  {
    title: 'Architects and developers, connected',
    body: 'Listings name the same firm in different ways. We match those spellings to one record, so each architect and developer has a single page listing every new project and completed building on our records.',
    link: { href: '/architects', label: 'Browse architects' },
  },
  {
    title: 'Photos only from official sources',
    body: 'Renderings come from the developer’s own website or press materials and are stored on our own servers. If we cannot confirm where an image came from, we do not use it: the listing shows the 3D model instead. Our software also scans galleries for repeated images and removes them.',
  },
  {
    title: 'Open data',
    body: 'The full list of projects we track, by year, stage, area and developer, is published as a table anyone can download and cite.',
    link: { href: '/miami-condo-pipeline', label: 'Download the pipeline data' },
  },
];

export default async function AboutPage() {
  const n = await siteCounts();
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'About', url: 'https://preconstructionmiami.net/about' },
  ]);
  const orgSchema = generateOrganizationSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
    <div className="container-main pt-24 pb-10 max-w-4xl">
      <h1 className="text-4xl md:text-6xl leading-[0.95] tracking-[-0.045em] break-words text-text-primary mb-8">About PreConstructionMiami.net</h1>

      <div className="space-y-8">
        <div className="glass-panel p-8">
          <p className="text-text-muted text-lg leading-relaxed">
            PreConstructionMiami.net is South Florida&apos;s most comprehensive pre-construction condo marketplace.
            We connect buyers and investors with 170+ new developments across Miami-Dade, Broward, and Palm Beach counties
            -- from ultra-luxury branded residences in Brickell to emerging value plays in Edgewater and beyond.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">What We Do</h2>
          <p className="text-text-muted leading-relaxed">
            We aggregate every active pre-construction project in South Florida into one searchable platform.
            Each listing includes detailed specifications, pricing, deposit structures, floor plans, amenities,
            developer information, and estimated completion dates -- everything you need to make an informed decision.
          </p>
        </div>


        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-2">How we build this site</h2>
          <p className="text-text-muted leading-relaxed">
            Most condo sites are a list of brochures. We built our own software to turn those brochures into data you can compare, and a map you can walk around.
          </p>
          <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-xl border border-border bg-border">
            {[['Projects tracked', n.projects], ['Developers', n.developers], ['Architecture firms', n.architects], ['Completed towers profiled', n.buildings]].map(([k, v]) => (
              <div key={k as string} className="bg-surface2 p-4">
                <dt className="text-xs text-text-muted">{k}</dt>
                <dd className="mt-1 text-3xl tracking-[-0.03em] text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 divide-y divide-border">
            {HOW.map((h) => (
              <div key={h.title} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-lg font-semibold text-text-primary">{h.title}</h3>
                <p className="mt-2 text-text-muted leading-relaxed">{h.body}</p>
                {h.link && <Link href={h.link.href} className="mt-2 inline-block text-sm font-semibold underline text-text-primary">{h.link.label}</Link>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">What we are building next</h2>
          <ul className="space-y-3 text-text-muted leading-relaxed list-disc pl-5">
            <li><strong className="text-text-primary">An approval tracker.</strong> Where each project stands with the city, from proposed to permitted, with a link to the public record behind every stage. If we cannot find a record, the project will say so rather than guess.</li>
            <li><strong className="text-text-primary">A &ldquo;coming soon&rdquo; layer on the map</strong> for towers that have been proposed but not yet approved.</li>
            <li><strong className="text-text-primary">Plain-English buyer guides</strong> on deposits, cancellation rights and reservations, quoting the Florida statutes directly.</li>
          </ul>
          <p className="mt-5 text-text-muted leading-relaxed">
            Spotted something wrong? <Link href="/contact-us" className="underline text-text-primary">Tell us</Link> and we will check it against the source and fix it.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Why Pre-Construction?</h2>
          <p className="text-text-muted leading-relaxed mb-4">
            Buying pre-construction offers unique advantages that resale properties simply cannot match:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <h3 className="text-accent-green font-semibold mb-1">Below-market pricing</h3>
              <p className="text-text-muted text-sm">Lock in today&apos;s prices and build equity as the project develops</p>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-accent-green font-semibold mb-1">Customization</h3>
              <p className="text-text-muted text-sm">Choose your preferred unit, floor, view, and finishes</p>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-accent-green font-semibold mb-1">Brand new</h3>
              <p className="text-text-muted text-sm">Latest amenities, technology, and design -- never lived in</p>
            </div>
            <div className="glass-panel p-4">
              <h3 className="text-accent-green font-semibold mb-1">Flexible payments</h3>
              <p className="text-text-muted text-sm">Spread your deposit over 18-30 months during construction</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Why Miami?</h2>
          <p className="text-text-muted leading-relaxed">
            Miami has cemented its position as a global destination for real estate investment. With no state income tax,
            year-round tropical weather, a booming tech and finance scene, and over 1,000 people moving to Florida daily,
            demand for quality housing continues to outpace supply. Pre-construction allows buyers to participate in this
            growth at the earliest possible stage.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Our Commitment</h2>
          <p className="text-text-muted leading-relaxed">
            We are committed to providing transparent, accurate, and up-to-date information on every project we feature.
            Our data is sourced directly from developers, public records, and verified market reports.
            We believe that informed buyers make better decisions -- and that&apos;s what drives everything we do.
          </p>
        </div>
      </div>

      <div className="mt-12 glass-panel p-8 text-center">
        <h3 className="text-2xl font-bold text-text-primary mb-3">Have Questions?</h3>
        <p className="text-text-muted mb-6">We&apos;re here to help you navigate the pre-construction process.</p>
        <Link href="/contact-us" className="btn-primary">Get in Touch</Link>
      </div>
    </div>
    </>
  );
}
