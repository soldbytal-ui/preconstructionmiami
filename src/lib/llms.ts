import { supabase } from '@/lib/supabase';
import { STATUS_LABELS } from '@/lib/utils';
import { plainText } from '@/lib/seo';

const SITE = 'https://preconstructionmiami.net';
const money = (n: number | null) => (n ? (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : `$${Math.round(n / 1000)}K`) : null);

/** Plain-language site guide for AI assistants, generated from the live database. */
export async function buildLlms(full: boolean): Promise<string> {
  const [{ data: projects }, { data: hoods }, { data: posts }, { data: devs }] = await Promise.all([
    supabase
      .from('projects')
      .select('name, slug, status, address, floors, totalUnits, priceMin, priceMax, estCompletion, description, architect, neighborhood:neighborhoods(name, slug), developer:developers(name)')
      .order('name'),
    supabase.from('neighborhoods').select('name, slug, projects(count)').order('name'),
    supabase.from('blog_posts').select('title, slug, excerpt').not('publishedAt', 'is', null).order('publishedAt', { ascending: false }),
    supabase.from('developers').select('name, slug, projects(count)').order('name'),
  ]);
  const P: any[] = projects || [];
  const today = new Date().toISOString().slice(0, 10);
  const L: string[] = [];

  L.push('# PreConstructionMiami.net', '');
  L.push(`> A directory of ${P.length} pre-construction and under-construction condo developments across Miami-Dade, Broward and Palm Beach counties, with prices, completion dates, developers and a 3D map. Updated ${today}.`, '');
  L.push('PreConstructionMiami.net is an informational platform. It is not a real estate brokerage and does not take part in transactions. Inquiries are passed to licensed local real estate professionals. Prices and dates are approximate and should be confirmed with the developer.', '');

  L.push('## Key pages', '');
  L.push(`- [All new condos](${SITE}/new-condos): every project, filterable by status, category and price`);
  L.push(`- [Miami 3D](${SITE}/miami-3d): 3D map of Miami with every new tower in place and the view from any floor`);
  L.push(`- [Developers](${SITE}/developers): developer profiles and their projects`);
  L.push(`- [Blog](${SITE}/blog): buyer guides and market reports`, '');

  L.push('## Neighborhoods', '');
  for (const n of (hoods as any[]) || []) {
    const c = n.projects?.[0]?.count || 0;
    if (c) L.push(`- [New condos in ${n.name}](${SITE}/new-condos-${n.slug}): ${c} ${c === 1 ? 'project' : 'projects'}`);
  }
  L.push('');

  L.push(full ? '## Every project' : '## Projects', '');
  for (const p of P) {
    const facts = [
      p.neighborhood?.name,
      STATUS_LABELS[p.status] || p.status,
      p.developer?.name ? `by ${p.developer.name}` : null,
      p.floors ? `${p.floors} storeys` : null,
      p.totalUnits ? `${p.totalUnits} residences` : null,
      money(p.priceMin) ? `from ${money(p.priceMin)}` : null,
      p.estCompletion ? `est. completion ${p.estCompletion}` : null,
    ].filter(Boolean).join(', ');
    L.push(`- [${p.name}](${SITE}/properties/${p.slug}): ${facts}`);
    if (full) {
      if (p.address) L.push(`  - Address: ${p.address}`);
      if (p.architect) L.push(`  - Architect: ${p.architect}`);
      const d = plainText(p.description).slice(0, 420);
      if (d) L.push(`  - ${d}`);
    }
  }
  L.push('');

  if (full) {
    L.push('## Developers', '');
    for (const d of (devs as any[]) || []) if (d.projects?.[0]?.count) L.push(`- [${d.name}](${SITE}/developers/${d.slug}): ${d.projects[0].count} listed`);
    L.push('');
  }

  L.push('## Guides', '');
  for (const b of (posts as any[]) || []) L.push(`- [${b.title}](${SITE}/blog/${b.slug})${full && b.excerpt ? `: ${plainText(b.excerpt).slice(0, 200)}` : ''}`);
  L.push('');
  if (!full) L.push(`Full detail for every project: ${SITE}/llms-full.txt`, '');
  return L.join('\n');
}
