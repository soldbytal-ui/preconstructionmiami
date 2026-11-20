import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase, throwIfOutage } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { DEFAULT_OG, generateBreadcrumbSchema } from '@/lib/seo';

export const revalidate = 300;

const URL = 'https://preconstructionmiami.net/areas';
const TITLE = 'Miami Neighborhoods with New Condos | PreConstructionMiami';
const DESC = 'Every South Florida neighborhood with pre-construction condos, from Brickell to West Palm Beach, with the number of projects and starting prices in each.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'website', images: DEFAULT_OG },
};

export default async function AreasPage() {
  const [{ data: hoods, error }, { data: projects, error: e2 }] = await Promise.all([
    supabase.from('neighborhoods').select('id, name, slug').order('name'),
    supabase.from('projects').select('neighborhoodId, priceMin, status, floors, name'),
  ]);
  throwIfOutage(error);
  throwIfOutage(e2);

  const stats = new Map<string, { count: number; from: number | null; tall: number; tallName: string }>();
  for (const p of projects || []) {
    if (!p.neighborhoodId || p.status === 'COMPLETED') continue;
    const s = stats.get(p.neighborhoodId) || { count: 0, from: null, tall: 0, tallName: '' };
    if ((p.floors || 0) > s.tall) { s.tall = p.floors || 0; s.tallName = p.name; }
    s.count += 1;
    if (p.priceMin) s.from = s.from ? Math.min(s.from, p.priceMin) : p.priceMin;
    stats.set(p.neighborhoodId, s);
  }
  const rows = (hoods || [])
    .map((h) => ({ ...h, ...(stats.get(h.id) || { count: 0, from: null, tall: 0, tallName: '' }) }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div className="container-main pt-28 md:pt-32 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema([{ name: 'Home', url: 'https://preconstructionmiami.net' }, { name: 'Neighborhoods', url: URL }])) }}
      />
      <h1 className="display-big max-w-[14ch] text-text-primary">Where it&apos;s being built</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-text-primary/85">
        {rows.length} neighborhoods from Coral Gables to West Palm Beach have new projects planned or under construction. Pick one to see every project in it.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'South Florida neighborhoods with new condo projects', numberOfItems: rows.length, itemListElement: rows.map((h, i) => ({ '@type': 'ListItem', position: i + 1, name: `New condos in ${h.name}`, url: `https://preconstructionmiami.net/new-condos-${h.slug}` })) }) }}
      />
      <p className="mt-4 max-w-[60ch] text-text-muted">
        {rows[0] && `${rows[0].name} has the most, with ${rows[0].count} projects.`} Counts leave out towers that are already finished. Starting prices are the lowest published by a developer in that area.
      </p>
      <div className="mt-10 grid md:grid-cols-2 md:gap-x-14 border-t-2 border-ink">
        {rows.map((h) => (
          <Link key={h.id} href={`/new-condos-${h.slug}`} className="group grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_110px] items-baseline gap-4 border-b border-border py-[18px]">
            <span className="font-display text-[26px] md:text-[32px] font-bold leading-tight tracking-[-0.035em] transition-all group-hover:translate-x-1.5 group-hover:text-accent-green">{h.name}</span>
            <span className="text-[15px] tabular-nums text-text-muted">{h.count} {h.count === 1 ? 'project' : 'projects'}</span>
            <span className="hidden sm:block text-right text-[15px] font-medium tabular-nums">{h.from ? `from ${formatPrice(h.from)}` : ''}</span>
          </Link>
        ))}
      </div>
      <h2 className="mt-16 text-2xl font-semibold text-text-primary">Tallest new tower in each neighborhood</h2>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Neighborhood</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Projects</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">From</th>
              <th scope="col" className="px-4 py-3 font-medium">Tallest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-b border-border last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-semibold text-text-primary"><Link href={`/new-condos-${h.slug}`} className="hover:text-accent-green">{h.name}</Link></th>
                <td className="px-4 py-3 text-right tabular-nums">{h.count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{h.from ? formatPrice(h.from) : ''}</td>
                <td className="px-4 py-3 text-text-muted">{h.tall ? `${h.tallName}, ${h.tall} storeys` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
