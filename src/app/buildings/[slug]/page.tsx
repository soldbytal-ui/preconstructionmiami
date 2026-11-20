export const revalidate = 300;
export async function generateStaticParams() { return []; }

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase, throwIfOutage } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import { DEFAULT_OG, generateBreadcrumbSchema, generateFAQSchema, fitDesc, pickTitle } from '@/lib/seo';
import { BUILDING_COLUMNS, feet, type Building } from '@/lib/buildings';
import InquiryForm from '@/components/projects/InquiryForm';
import ProjectCard from '@/components/projects/ProjectCard';

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const { data, error } = await supabase.from('buildings').select(BUILDING_COLUMNS).eq('slug', slug).maybeSingle();
  return { b: data as unknown as Building | null, error };
}

function sentences(b: Building) {
  const area = b.neighborhood?.name || 'Miami';
  const kind = b.tenure === 'rental' ? 'rental tower' : 'condo tower';
  const out = [
    `${b.name} is a ${b.floors ? `${b.floors}-storey ` : ''}${kind}${b.address ? ` at ${b.address.split(',')[0]}` : ''} in ${area}${b.yearBuilt ? `, completed in ${b.yearBuilt}` : ''}.`,
  ];
  if (b.heightM) out.push(`It stands about ${feet(b.heightM)?.toLocaleString()} feet tall.`);
  if (b.developer || b.architect) out.push(`${b.developer ? `It was developed by ${b.developer.name}` : 'It was'}${b.architect ? `${b.developer ? ' and' : ''} designed by ${b.architect}` : ''}.`);
  if (b.totalUnits) out.push(`The building has ${b.totalUnits.toLocaleString()} residences.`);
  if (b.note) out.push(b.note);
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { b } = await load(slug);
  if (!b) return { title: 'Building Not Found' };
  const area = b.neighborhood?.name || 'Miami';
  const title = pickTitle([`${b.name}: ${area} Condo Tower Facts and Resales`, `${b.name}: ${area} Condo Tower`, b.name]);
  const description = fitDesc(sentences(b).join(' '), 160);
  const url = `https://preconstructionmiami.net/buildings/${b.slug}`;
  return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website', images: DEFAULT_OG } };
}

export default async function BuildingPage({ params }: Props) {
  const { slug } = await params;
  const { b, error } = await load(slug);
  throwIfOutage(error);
  if (!b) notFound();
  const area = b.neighborhood?.name || 'Miami';
  const url = `https://preconstructionmiami.net/buildings/${b.slug}`;
  const text = sentences(b);

  const [{ data: sameDev }, { data: nearbyNew }, { data: others }] = await Promise.all([
    b.developer ? supabase.from('buildings').select(BUILDING_COLUMNS).eq('developerId', (b as any).developerId).neq('id', b.id).limit(8) : Promise.resolve({ data: [] as any[] }),
    (b as any).neighborhoodId ? supabase.from('projects').select(`${CARD_COLUMNS}, latitude, longitude`).eq('neighborhoodId', (b as any).neighborhoodId).neq('status', 'COMPLETED') : Promise.resolve({ data: [] as any[] }),
    supabase.from('buildings').select('name, slug, latitude, longitude, floors').neq('id', b.id),
  ]);
  const dist = (p: any) => (b.latitude && b.longitude && p.latitude && p.longitude ? Math.hypot((p.latitude - b.latitude) * 110540, (p.longitude - b.longitude) * 111320 * Math.cos((b.latitude * Math.PI) / 180)) : 1e9);
  const newNear = [...((nearbyNew || []) as any[])].sort((x, y) => dist(x) - dist(y)).slice(0, 3);
  const neighbours = [...((others || []) as any[])].sort((x, y) => dist(x) - dist(y)).slice(0, 5);

  const facts: [string, string][] = [
    ['Built', b.yearBuilt ? String(b.yearBuilt) : ''],
    ['Storeys', b.floors ? String(b.floors) : ''],
    ['Height', b.heightM ? `${feet(b.heightM)?.toLocaleString()} ft` : ''],
    ['Residences', b.totalUnits ? b.totalUnits.toLocaleString() : ''],
    ['Type', b.tenure === 'rental' ? 'Rental' : 'Condo'],
  ].filter(([, v]) => v) as [string, string][];

  const faqs = [
    b.yearBuilt && { question: `When was ${b.name} built?`, answer: `${b.name} was completed in ${b.yearBuilt}.` },
    b.floors && { question: `How tall is ${b.name}?`, answer: `${b.name} has ${b.floors} storeys${b.heightM ? ` and stands about ${feet(b.heightM)?.toLocaleString()} feet tall` : ''}.` },
    (b.developer || b.architect) && { question: `Who built ${b.name}?`, answer: `${b.developer ? `${b.name} was developed by ${b.developer.name}.` : ''}${b.architect ? ` The architect was ${b.architect}.` : ''}`.trim() },
    { question: `Can I buy a unit in ${b.name}?`, answer: b.tenure === 'rental' ? `${b.name} is a rental building, so its apartments are leased rather than sold.` : `Yes. ${b.name} is a finished condo building, so units are sold by their owners on the resale market. Use the form on this page and a licensed local agent will send you what is currently available.` },
  ].filter(Boolean) as { question: string; answer: string }[];

  const schema = {
    '@context': 'https://schema.org', '@type': b.tenure === 'rental' ? 'ApartmentComplex' : 'Residence', name: b.name, url, description: text.join(' '),
    ...(b.address && { address: { '@type': 'PostalAddress', streetAddress: b.address.split(',')[0], addressLocality: 'Miami', addressRegion: 'FL', addressCountry: 'US' } }),
    ...(b.latitude && b.longitude && { geo: { '@type': 'GeoCoordinates', latitude: b.latitude, longitude: b.longitude } }),
    ...(b.yearBuilt && { yearBuilt: b.yearBuilt }),
  };

  return (
    <div className="container-main pt-28 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema([{ name: 'Home', url: 'https://preconstructionmiami.net' }, { name: 'Existing buildings', url: 'https://preconstructionmiami.net/buildings' }, { name: b.name, url }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(faqs)) }} />

      <nav className="text-sm text-text-muted mb-8 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-accent-green">Home</Link><span className="text-text-muted/40">/</span>
        <Link href="/buildings" className="hover:text-accent-green">Existing buildings</Link><span className="text-text-muted/40">/</span>
        <span className="text-text-primary font-medium">{b.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <header>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary">
              <span className="h-2 w-2 rounded-full bg-[#8A9098]" aria-hidden />{b.tenure === 'rental' ? 'Existing rental building' : 'Existing building'}
            </span>
            <h1 className="display-big mt-3 text-text-primary">{b.name}</h1>
            <p className="mt-2 text-text-muted">{[b.address, area].filter(Boolean).join(' · ').replace(' · ', ', ')}</p>
            {b.developer && <p className="mt-1 text-text-muted">by <Link href={`/developers/${b.developer.slug}`} className="font-medium text-text-primary hover:text-accent-green">{b.developer.name}</Link></p>}
          </header>

          <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y border-border py-5">
            {facts.map(([k, v]) => (
              <div key={k}><dt className="text-sm text-text-muted">{k}</dt><dd className="mt-0.5 text-2xl font-semibold text-text-primary">{v}</dd></div>
            ))}
          </dl>

          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">About {b.name}</h2>
            <p className="text-text-muted leading-relaxed">{text.join(' ')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/miami-3d" className="btn-secondary">See it on the 3D map</Link>
              {b.neighborhood && <Link href={`/new-condos-${b.neighborhood.slug}`} className="btn-secondary">New projects in {area}</Link>}
            </div>
          </section>

          {b.tenure !== 'rental' && (
            <section className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl font-semibold text-text-primary">Units for sale in {b.name}</h2>
              <p className="mt-2 text-text-muted">We do not show live resale listings yet. Send the form and a licensed local agent will reply with the units currently for sale or rent in this building.</p>
            </section>
          )}

          {neighbours.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-text-primary mb-4">Nearby existing towers</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {neighbours.map((n: any) => (
                  <li key={n.slug}><Link href={`/buildings/${n.slug}`} className="flex items-baseline justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent-green/40"><span className="font-medium text-text-primary">{n.name}</span><span className="text-sm text-text-muted">{n.floors ? `${n.floors} storeys` : ''}</span></Link></li>
                ))}
              </ul>
            </section>
          )}

          {(sameDev || []).length > 0 && b.developer && (
            <section>
              <h2 className="text-2xl font-semibold text-text-primary mb-4">More finished buildings by {b.developer.name}</h2>
              <ul className="flex flex-wrap gap-2">
                {(sameDev as any[]).map((n) => <li key={n.slug}><Link href={`/buildings/${n.slug}`} className="inline-block rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-text-primary hover:border-accent-green/40">{n.name}</Link></li>)}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Questions about {b.name}</h2>
            <dl className="space-y-5">
              {faqs.map((q) => (<div key={q.question}><dt className="font-semibold text-text-primary">{q.question}</dt><dd className="mt-1 text-text-muted leading-relaxed">{q.answer}</dd></div>))}
            </dl>
          </section>

          {b.sources?.length > 0 && (
            <p className="text-xs text-text-muted">Sources: {b.sources.map((s, i) => (<span key={s}>{i > 0 && ', '}<a href={s} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-text-primary">{new globalThis.URL(s).hostname.replace('www.', '')}</a></span>))}. Tell us if something here is out of date.</p>
          )}
        </div>

        <aside>
          <div className="sticky top-24">
            <InquiryForm projectName={b.name} neighborhoodId={(b as any).neighborhoodId || undefined} source={`resale:${b.slug}`} />
          </div>
        </aside>
      </div>

      {newNear.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">New projects near {b.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{newNear.map((p: any) => <ProjectCard key={p.id} project={p} />)}</div>
        </section>
      )}
    </div>
  );
}
