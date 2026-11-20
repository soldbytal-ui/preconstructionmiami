import Link from 'next/link';
import type { Metadata } from 'next';
import { throwIfOutage } from '@/lib/supabase';
import { DEFAULT_OG, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo';
import { getPipeline, yearOf, type PipeRow } from '@/lib/pipeline';

export const revalidate = 300;

const URL = 'https://preconstructionmiami.net/miami-condo-pipeline';
const TITLE = 'Miami Condo Pipeline: Units by Year, Area and Developer';
const DESC = 'How many new condo residences are planned and under construction in Miami and South Florida, counted by completion year, stage, neighborhood and developer.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'article', images: DEFAULT_OG },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

type Group = { key: string; href?: string; projects: number; units: number; note?: string };
const num = (n: number) => n.toLocaleString('en-US');

function tally(rows: PipeRow[], keyOf: (p: PipeRow) => { key: string; href?: string } | null): Group[] {
  const m = new Map<string, Group>();
  for (const p of rows) {
    const k = keyOf(p);
    if (!k) continue;
    const g = m.get(k.key) || { ...k, projects: 0, units: 0 };
    g.projects++; g.units += p.totalUnits || 0; m.set(k.key, g);
  }
  return [...m.values()];
}

/** A table whose last column is a bar, so the size of each row reads at a glance and the exact figure is still there. */
function BarTable({ caption, head, groups }: { caption: string; head: string; groups: Group[] }) {
  const max = Math.max(...groups.map((g) => g.units), 1);
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th scope="col" className="px-4 py-3 font-medium">{head}</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Projects</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Residences</th>
            <th scope="col" className="w-[42%] px-4 py-3 font-medium"><span className="sr-only">Share of residences</span></th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.key} className="border-b border-border last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-text-primary">
                {g.href ? <Link href={g.href} className="hover:text-accent-green">{g.key}</Link> : g.key}
                {g.note && <span className="ml-2 text-xs font-normal text-text-muted">{g.note}</span>}
              </th>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{g.projects}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{num(g.units)}</td>
              <td className="px-4 py-3" aria-hidden>
                <div className="h-3 rounded-r-[4px] bg-[#1F4E79]" style={{ width: `${Math.max(1.5, (g.units / max) * 100)}%` }} title={`${g.key}: ${num(g.units)} residences`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PipelinePage() {
  const { rows, error } = await getPipeline();
  throwIfOutage(error);
  const thisYear = new Date().getFullYear();
  const units = rows.reduce((s, p) => s + (p.totalUnits || 0), 0);

  const byYear = tally(rows, (p) => { const y = yearOf(p); return { key: y ? String(y) : 'No date announced' }; })
    .sort((a, b) => (a.key === 'No date announced' ? 1 : b.key === 'No date announced' ? -1 : Number(a.key) - Number(b.key)))
    .map((g) => (Number(g.key) < thisYear ? { ...g, note: 'scheduled, not yet finished' } : g));
  const stageKey: Record<string, string> = { PRE_LAUNCH: 'Planned', PRE_CONSTRUCTION: 'Planned', UNDER_CONSTRUCTION: 'Under construction', NEAR_COMPLETION: 'Nearly finished' };
  const order = ['Planned', 'Under construction', 'Nearly finished'];
  const byStage = tally(rows, (p) => ({ key: stageKey[p.status] || p.status })).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const byArea = tally(rows, (p) => (p.neighborhood ? { key: p.neighborhood.name, href: `/new-condos-${p.neighborhood.slug}` } : null)).sort((a, b) => b.units - a.units);
  const byDev = tally(rows, (p) => (p.developer ? { key: p.developer.name, href: `/developers/${p.developer.slug}` } : null)).sort((a, b) => b.units - a.units).slice(0, 15);

  const peak = [...byYear].filter((g) => /^\d+$/.test(g.key)).sort((a, b) => b.units - a.units)[0];
  const building = byStage.filter((g) => g.key !== 'Planned').reduce((s, g) => s + g.units, 0);
  const tall = rows.filter((p) => p.heightIsPublished && (p.heightM || 0) >= 182.88).sort((a, b) => (b.heightM || 0) - (a.heightM || 0));
  const biggest = [...rows].sort((a, b) => (b.totalUnits || 0) - (a.totalUnits || 0)).slice(0, 10);
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const iso = new Date().toISOString().slice(0, 10);

  const faqs = [
    { question: 'How many new condos are being built in Miami and South Florida?', answer: `PreConstructionMiami tracks ${rows.length} new condo projects that are planned or under construction across Miami-Dade, Broward and Palm Beach counties, with about ${num(units)} residences between them. About ${num(building)} of those residences are in buildings already under construction.` },
    peak && { question: 'Which year will the most new Miami condos be finished?', answer: `${peak.key}, on current schedules: ${peak.projects} projects with about ${num(peak.units)} residences are due that year. Completion dates are developer estimates and often slip.` },
    byArea[0] && { question: 'Which neighborhood has the most new condos coming?', answer: `${byArea[0].key} has the most, with about ${num(byArea[0].units)} residences across ${byArea[0].projects} projects${byArea[1] ? `, followed by ${byArea[1].key} with about ${num(byArea[1].units)}` : ''}.` },
    tall.length > 0 && { question: 'How many towers over 600 feet are planned in Miami?', answer: `${tall.length} planned or under-construction towers on our list have a published height of 600 feet or more. The tallest is ${tall[0].name} at about ${num(Math.round((tall[0].heightM || 0) * 3.28084))} feet.` },
  ].filter(Boolean) as { question: string; answer: string }[];

  const dataset = {
    '@context': 'https://schema.org', '@type': 'Dataset', name: 'Miami and South Florida condo pipeline', description: DESC, url: URL,
    dateModified: iso, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'PreConstructionMiami', url: 'https://preconstructionmiami.net' },
    spatialCoverage: 'Miami-Dade, Broward and Palm Beach counties, Florida, United States',
    variableMeasured: ['Projects', 'Residences', 'Expected completion year', 'Construction stage', 'Storeys', 'Starting price'],
    distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${URL}/data.csv` }],
  };

  return (
    <div className="container-main pt-28 md:pt-32 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema([{ name: 'Home', url: 'https://preconstructionmiami.net' }, { name: 'Condo pipeline', url: URL }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(faqs)) }} />

      <h1 className="display-big max-w-[18ch] text-text-primary">Miami&apos;s condo pipeline, counted</h1>
      <p className="mt-5 max-w-[64ch] text-lg text-text-primary/85">
        {rows.length} new condo projects are planned or under construction across South Florida, with about {num(units)} residences between them.
        {peak && ` The busiest year for completions is ${peak.key}, when about ${num(peak.units)} residences are due.`}
      </p>
      <p className="mt-3 text-sm text-text-muted">Updated {updated}. Counts come from the projects listed on this site and change as listings are corrected.</p>

      <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-5 border-y border-border py-6">
        {[['Projects', String(rows.length)], ['Residences', num(units)], ['Already under construction', `${num(building)} residences`], ['600 ft or taller', `${tall.length} towers`]].map(([k, v]) => (
          <div key={k}><dt className="text-sm text-text-muted">{k}</dt><dd className="mt-0.5 text-3xl font-semibold text-text-primary">{v}</dd></div>
        ))}
      </dl>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-text-primary">Residences by expected completion year</h2>
        <p className="mt-2 mb-5 max-w-[64ch] text-text-muted">Each project is counted in the year its developer expects to finish. Projects scheduled for a year that has passed are still open and are marked.</p>
        <BarTable caption="New condo projects and residences by expected completion year" head="Year" groups={byYear} />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-text-primary">By construction stage</h2>
        <p className="mt-2 mb-5 max-w-[64ch] text-text-muted">Planned projects have been announced or approved but have not broken ground.</p>
        <BarTable caption="New condo projects and residences by construction stage" head="Stage" groups={byStage} />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-text-primary">By neighborhood</h2>
        <p className="mt-2 mb-5 max-w-[64ch] text-text-muted">Every area with at least one project, largest first. Each name opens that area&apos;s full project table.</p>
        <BarTable caption="New condo projects and residences by neighborhood" head="Neighborhood" groups={byArea} />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-text-primary">The 15 developers with the most residences on the way</h2>
        <p className="mt-2 mb-5 max-w-[64ch] text-text-muted">Joint ventures are counted as their own entry, so a firm that builds with partners appears more than once.</p>
        <BarTable caption="Developers ranked by residences planned or under construction" head="Developer" groups={byDev} />
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-text-primary">The ten largest projects by residences</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-border text-left text-text-muted"><th scope="col" className="px-4 py-3 font-medium">Project</th><th scope="col" className="px-4 py-3 font-medium">Area</th><th scope="col" className="px-4 py-3 text-right font-medium">Residences</th><th scope="col" className="px-4 py-3 text-right font-medium">Storeys</th><th scope="col" className="px-4 py-3 text-right font-medium">Due</th></tr></thead>
            <tbody>
              {biggest.map((p) => (
                <tr key={p.slug} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-semibold text-text-primary"><Link href={`/properties/${p.slug}`} className="hover:text-accent-green">{p.name}</Link></th>
                  <td className="px-4 py-3 text-text-muted">{p.neighborhood?.name || ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.totalUnits ? num(p.totalUnits) : ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.floors || ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.estCompletion || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-text-muted">For height, see <Link href="/tallest-buildings" className="link-underline">the tallest towers coming to Miami</Link>, drawn to scale.</p>
      </section>

      <section className="mt-14 max-w-3xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-6">Questions this data answers</h2>
        <dl className="space-y-5">
          {faqs.map((q) => (<div key={q.question}><dt className="font-semibold text-text-primary">{q.question}</dt><dd className="mt-1 text-text-muted leading-relaxed">{q.answer}</dd></div>))}
        </dl>
      </section>

      <section className="mt-14 max-w-3xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold text-text-primary">How this is counted, and how to cite it</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-text-muted">
          <li>It covers condo projects listed on PreConstructionMiami in Miami-Dade, Broward and Palm Beach counties. It is not a census: projects we have not listed are not counted, and rental buildings are left out.</li>
          <li>Residence counts, storeys and completion dates come from developer announcements, city approvals and press reports, checked project by project.</li>
          <li>Finished buildings are excluded. Completion years are developer estimates.</li>
        </ul>
        <p className="mt-4 text-text-muted">Free to use with credit: <span className="text-text-primary">PreConstructionMiami, &ldquo;Miami condo pipeline,&rdquo; {updated}, preconstructionmiami.net/miami-condo-pipeline</span>.</p>
        <a href="/miami-condo-pipeline/data.csv" className="btn-secondary mt-5 inline-flex">Download the project list (CSV)</a>
      </section>
    </div>
  );
}
