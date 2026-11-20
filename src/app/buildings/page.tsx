import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase, throwIfOutage } from '@/lib/supabase';
import { DEFAULT_OG, generateBreadcrumbSchema } from '@/lib/seo';
import { BUILDING_COLUMNS, type Building } from '@/lib/buildings';
import BuildingsTable from '@/components/projects/BuildingsTable';

export const revalidate = 300;

const URL = 'https://preconstructionmiami.net/buildings';
const TITLE = 'Existing Condo Towers in Miami: Building Profiles';
const DESC = 'Profiles of the condo towers already standing in Miami: year built, storeys, height, developer and architect, starting with Brickell.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'website', images: DEFAULT_OG },
};

export default async function BuildingsPage() {
  const { data, error } = await supabase.from('buildings').select(BUILDING_COLUMNS).order('heightM', { ascending: false, nullsFirst: false });
  throwIfOutage(error);
  const rows = (data || []) as unknown as Building[];
  const areas = [...new Set(rows.map((b) => b.neighborhood?.name).filter(Boolean))];
  return (
    <div className="container-main pt-28 md:pt-32 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema([{ name: 'Home', url: 'https://preconstructionmiami.net' }, { name: 'Existing buildings', url: URL }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Existing condo towers in Miami', numberOfItems: rows.length, itemListElement: rows.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, url: `${URL}/${b.slug}` })) }) }} />
      <h1 className="display-big max-w-[16ch] text-text-primary">The towers already standing</h1>
      <p className="mt-5 max-w-[62ch] text-lg text-text-primary/85">
        {rows.length} finished towers in {areas.join(', ') || 'Miami'}, with the year each was built, its height, and who developed and designed it.
        These are resale buildings: units in them change hands on the open market rather than being sold by a developer.
      </p>
      <p className="mt-3 max-w-[62ch] text-text-muted">
        Looking for something not yet built? <Link href="/new-condos" className="link-underline">See every new project</Link>.
      </p>
      <div className="mt-10">
        <BuildingsTable buildings={rows} showDeveloper caption="Existing condo towers: developer, area, year built, storeys, height and residences" />
      </div>
      <p className="mt-3 text-xs text-text-muted">Facts are taken from public sources listed on each building&apos;s page. Blank cells mean we have not confirmed the figure yet.</p>
    </div>
  );
}
