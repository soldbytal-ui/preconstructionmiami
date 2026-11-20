import Link from 'next/link';
import type { Metadata } from 'next';
import { getSkyline, fmtFt, fmtM } from '@/lib/skyline';
import SkylineLineup from '@/components/skyline/SkylineLineup';
import { DEFAULT_OG, generateBreadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

const URL = 'https://preconstructionmiami.net/tallest-buildings';
const TITLE = 'Tallest Buildings Coming to Miami, Ranked by Height';
const DESC = 'Every tall tower planned or under construction in Miami and South Florida, drawn to scale and ranked by height, with storeys, units and status.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'website', images: DEFAULT_OG },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

const STATUS_LABEL: Record<string, string> = {
  PRE_LAUNCH: 'Planned',
  PRE_CONSTRUCTION: 'Planned',
  UNDER_CONSTRUCTION: 'Under construction',
  NEAR_COMPLETION: 'Near completion',
};
const STATUS_DOT: Record<string, string> = {
  PRE_LAUNCH: '#00E5B4',
  PRE_CONSTRUCTION: '#00E5B4',
  UNDER_CONSTRUCTION: '#38B6FF',
  NEAR_COMPLETION: '#FF7A3D',
};

export default async function TallestBuildingsPage() {
  const all = (await getSkyline()).filter((t) => t.status !== 'COMPLETED');
  const ranked = all.slice(0, 50);
  const lineup = all.slice(0, 40);
  // The headline names the tallest tower whose height is a filed or announced figure, not an estimate or a ceiling
  const tallest = all.find((t) => t.heightSource === 'published') || all[0];
  const over200 = all.filter((t) => t.heightM >= 200).length;
  const building = all.filter((t) => t.status === 'UNDER_CONSTRUCTION' || t.status === 'NEAR_COMPLETION').length;
  const published = all.filter((t) => t.heightSource === 'published').length;

  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tallest buildings planned and under construction in Miami',
    itemListElement: ranked.slice(0, 25).map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `https://preconstructionmiami.net/properties/${t.slug}`,
    })),
  };

  return (
    <main className="pt-24 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbSchema([
              { name: 'Home', url: 'https://preconstructionmiami.net' },
              { name: 'Tallest buildings', url: URL },
            ])
          ),
        }}
      />

      <header className="container-main mb-10">
        <h1 className="max-w-4xl text-4xl md:text-6xl font-semibold tracking-tight leading-[1.04] text-text-primary">
          The tallest towers coming to Miami
        </h1>
        {tallest && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
            {over200} towers taller than 650 feet are planned or rising across South Florida, and {building} of the {all.length} towers we
            track are already under construction. The tallest,{' '}
            <Link href={`/properties/${tallest.slug}`} className="text-text-primary underline underline-offset-4">
              {tallest.name}
            </Link>
            , will reach {fmtFt(tallest.heightM)} feet.
          </p>
        )}
      </header>

      <SkylineLineup towers={lineup} total={all.length} />

      <section className="container-main mt-20">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-primary">Ranked by height</h2>
        <p className="mt-2 max-w-2xl text-text-muted">The 50 tallest towers we list that are planned or under construction.</p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th scope="col" className="px-4 py-3 font-medium w-12">Rank</th>
                <th scope="col" className="px-4 py-3 font-medium">Tower</th>
                <th scope="col" className="px-4 py-3 font-medium">Area</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Height</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Storeys</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Residences</th>
                <th scope="col" className="px-4 py-3 font-medium">Stage</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t, i) => (
                <tr key={t.id} className="border-t border-border hover:bg-surface">
                  <td className="px-4 py-3 tabular-nums text-text-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/properties/${t.slug}`} className="font-medium text-text-primary hover:underline underline-offset-4">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {t.neighborhoodSlug ? (
                      <Link href={`/new-condos-${t.neighborhoodSlug}`} className="hover:text-text-primary">{t.neighborhood}</Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary whitespace-nowrap">
                    {t.heightSource !== 'published' && <span className="text-text-muted">about </span>}
                    {fmtFt(t.heightM)} ft <span className="text-text-muted">({fmtM(t.heightM)} m)</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary">{t.floors ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary">{t.units ? t.units.toLocaleString('en-US') : '—'}</td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: STATUS_DOT[t.status] || '#8A9098' }} aria-hidden />
                    {STATUS_LABEL[t.status] || t.status}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">{t.estCompletion && /^\d{4}$/.test(t.estCompletion) ? t.estCompletion : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container-main mt-16 max-w-3xl">
        <h2 className="text-xl font-semibold text-text-primary">How we measure</h2>
        <div className="mt-3 space-y-3 leading-relaxed text-text-muted">
          <p>
            {published} of these heights come from a filed or announced figure, such as a Federal Aviation Administration filing or the
            developer&apos;s own plans. The rest are marked &ldquo;about&rdquo;: they are either worked out from the storey count or are the
            maximum height the aviation authority has cleared, which the finished design may not reach.
          </p>
          <p>
            The silhouettes are the same models you can fly around on the{' '}
            <Link href="/miami-3d" className="text-text-primary underline underline-offset-4">3D map of Miami</Link>, flattened to a side
            view. They show each tower&apos;s overall shape and proportions, not its architectural detail.
          </p>
          <p>A supertall is a building of 300 metres (984 feet) or more. Florida does not have one yet.</p>
        </div>
      </section>
    </main>
  );
}
