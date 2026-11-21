import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { architectBySlug, hasProfile, type Architect } from '@/lib/architects';
import { feet } from '@/lib/buildings';
import ProjectFactsTable from '@/components/projects/ProjectFactsTable';
import BuildingsTable from '@/components/projects/BuildingsTable';
import { DEFAULT_OG, fitDesc, pickTitle, generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/lib/seo';

export const revalidate = 3600;

const BASE = 'https://preconstructionmiami.net';
type Props = { params: Promise<{ slug: string }> };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Everything said about a firm comes from the listings and building profiles: no biography is invented. */
function facts(a: Architect) {
  const works = [
    ...a.projects.map((p: any) => ({ name: p.name, href: `/properties/${p.slug}`, floors: p.floors as number | null, heightM: p.heightM as number | null, area: p.neighborhood?.name as string | undefined, done: false })),
    ...a.buildings.map((b) => ({ name: b.name, href: `/buildings/${b.slug}`, floors: b.floors, heightM: b.heightM, area: b.neighborhood?.name, done: true })),
  ];
  const tallest = [...works].filter((w) => w.heightM || w.floors).sort((x, y) => (y.heightM || 0) - (x.heightM || 0) || (y.floors || 0) - (x.floors || 0))[0] || null;
  const areaCount = new Map<string, number>();
  for (const w of works) if (w.area) areaCount.set(w.area, (areaCount.get(w.area) || 0) + 1);
  const areas = [...areaCount.entries()].sort((x, y) => y[1] - x[1]).map(([n]) => n);
  const devCount = new Map<string, number>();
  for (const p of a.projects as any[]) if (p.developer?.name) devCount.set(p.developer.name, (devCount.get(p.developer.name) || 0) + 1);
  for (const b of a.buildings) if (b.developer?.name) devCount.set(b.developer.name, (devCount.get(b.developer.name) || 0) + 1);
  const developers = [...devCount.entries()].sort((x, y) => y[1] - x[1]);
  const years = a.buildings.map((b) => b.yearBuilt).filter(Boolean) as number[];
  const building = a.projects.filter((p: any) => p.status === 'UNDER_CONSTRUCTION').length;
  return { works, tallest, areas, developers, years, building };
}

function sentences(a: Architect) {
  const f = facts(a);
  const out: string[] = [];
  const parts = [a.projects.length && plural(a.projects.length, 'new condo project', 'new condo projects'), a.buildings.length && plural(a.buildings.length, 'completed building', 'completed buildings')].filter(Boolean) as string[];
  out.push(`${a.name} is the architect named on ${list(parts)} in South Florida on our records.`);
  if (f.building) out.push(`${plural(f.building, 'of the new projects is', 'of the new projects are')} under construction now.`);
  if (f.tallest) {
    const ft = feet(f.tallest.heightM);
    out.push(`The tallest is ${f.tallest.name}${f.tallest.floors ? `, at ${f.tallest.floors} storeys` : ''}${ft ? ` and ${ft.toLocaleString()} ft` : ''}${f.tallest.done ? '' : ' (planned)'}.`);
  }
  if (f.areas.length) out.push(`Its work here is in ${list(f.areas.slice(0, 4))}${f.areas.length > 4 ? ` and ${f.areas.length - 4} other ${f.areas.length - 4 === 1 ? 'area' : 'areas'}` : ''}.`);
  if (f.years.length) out.push(`The completed buildings date from ${Math.min(...f.years) === Math.max(...f.years) ? Math.min(...f.years) : `${Math.min(...f.years)} to ${Math.max(...f.years)}`}.`);
  return { f, out };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await architectBySlug((await params).slug);
  if (!a) return { title: 'Architect not found' };
  const n = a.projects.length + a.buildings.length;
  const title = pickTitle([`${a.name}: ${n} Condo Towers in South Florida`, `${a.name}: Miami Condo Towers`, `${a.name}: Architect Profile`, a.name]);
  const description = fitDesc(sentences(a).out.join(' '));
  const url = `${BASE}/architects/${a.slug}`;
  return {
    title, description, alternates: { canonical: url }, robots: hasProfile(a) ? undefined : { index: false, follow: true },
    openGraph: { title, description, url, type: 'profile', images: DEFAULT_OG },
  };
}

export default async function ArchitectPage({ params }: Props) {
  const a = await architectBySlug((await params).slug);
  if (!a) notFound();
  const { f, out } = sentences(a);
  const url = `${BASE}/architects/${a.slug}`;
  const faqs = [
    { question: `What has ${a.name} designed in Miami and South Florida?`, answer: `On our records: ${list(f.works.slice(0, 12).map((w) => w.name))}${f.works.length > 12 ? `, and ${f.works.length - 12} more` : ''}.` },
    f.tallest && { question: `What is the tallest ${a.name} building in South Florida?`, answer: `${f.tallest.name}${f.tallest.floors ? `, at ${f.tallest.floors} storeys` : ''}${feet(f.tallest.heightM) ? ` and ${feet(f.tallest.heightM)!.toLocaleString()} ft` : ''}${f.tallest.done ? '' : '. It is not yet complete'}.` },
    f.developers.length > 0 && { question: `Which developers work with ${a.name}?`, answer: `${list(f.developers.slice(0, 6).map(([n, c]) => (c > 1 ? `${n} (${c} projects)` : n)))}.` },
  ].filter(Boolean) as { question: string; answer: string }[];
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: a.name, url, knowsAbout: 'Architecture' };

  return (
    <div className="container-main pt-28 pb-20">
      {[org, generateFAQSchema(faqs), generateItemListSchema(f.works.map((w, i) => ({ name: w.name, url: `${BASE}${w.href}`, position: i + 1 }))),
        generateBreadcrumbSchema([{ name: 'Home', url: BASE }, { name: 'Architects', url: `${BASE}/architects` }, { name: a.name, url }])].map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <nav className="text-sm text-text-muted"><Link href="/architects" className="underline">Architects</Link></nav>
      <h1 className="mt-4 text-4xl md:text-6xl leading-[0.98] tracking-[-0.045em] text-text-primary">{a.name}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-primary">{out.join(' ')}</p>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
        {[['New projects', String(a.projects.length)], ['Completed buildings', String(a.buildings.length)], ['Tallest', f.tallest?.floors ? `${f.tallest.floors} storeys` : 'n/a'], ['Areas', String(f.areas.length)]].map(([k, v]) => (
          <div key={k} className="bg-surface p-5"><dt className="text-xs uppercase tracking-wider text-text-muted">{k}</dt><dd className="mt-1 text-2xl tracking-[-0.03em] text-text-primary">{v}</dd></div>
        ))}
      </dl>

      {a.projects.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl md:text-3xl tracking-[-0.03em] text-text-primary">New projects designed by {a.name}</h2>
          <div className="mt-5"><ProjectFactsTable projects={a.projects as any} showArea caption={`New condo projects designed by ${a.name}: area, developer, storeys, residences, starting price, completion and stage`} /></div>
        </section>
      )}

      {a.buildings.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl md:text-3xl tracking-[-0.03em] text-text-primary">Completed buildings by {a.name}</h2>
          <p className="mt-2 max-w-2xl text-text-muted">Finished towers with a profile on this site. This is not the firm’s full portfolio.</p>
          <div className="mt-5"><BuildingsTable buildings={a.buildings} showDeveloper caption={`Completed buildings designed by ${a.name}: developer, area, year built, storeys, height and residences`} /></div>
        </section>
      )}

      {f.developers.length > 0 && (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl md:text-3xl tracking-[-0.03em] text-text-primary">Developers it works with</h2>
          <p className="mt-3 leading-relaxed text-text-primary">{list(f.developers.slice(0, 12).map(([n, c]) => (c > 1 ? `${n} (${c})` : n)))}.</p>
        </section>
      )}

      <section className="mt-14 max-w-3xl">
        <h2 className="text-2xl md:text-3xl tracking-[-0.03em] text-text-primary">Common questions</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {faqs.map((q) => (<div key={q.question} className="py-5"><dt className="font-semibold text-text-primary">{q.question}</dt><dd className="mt-2 leading-relaxed text-text-muted">{q.answer}</dd></div>))}
        </dl>
        <p className="mt-6 text-sm text-text-muted">Counts come from the listings and building profiles on this site, as named by each developer or public record. They are not a complete list of the firm’s work.</p>
      </section>
    </div>
  );
}
