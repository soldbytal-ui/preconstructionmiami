import Link from 'next/link';
import type { Metadata } from 'next';
import { allArchitects, hasProfile } from '@/lib/architects';
import { DEFAULT_OG, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo';

export const revalidate = 3600;

const URL = 'https://preconstructionmiami.net/architects';
const TITLE = 'Architects of Miami’s New Condo Towers';
const DESC = 'The architecture firms designing South Florida’s new condo towers, with every new project and completed building each has on record.';

export const metadata: Metadata = {
  title: TITLE, description: DESC, alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'website', images: DEFAULT_OG },
};

export default async function ArchitectsIndex() {
  const all = await allArchitects();
  const firms = all.filter(hasProfile);
  const others = all.filter((a) => !hasProfile(a));
  return (
    <div className="container-main pt-28 pb-20">
      {[generateBreadcrumbSchema([{ name: 'Home', url: 'https://preconstructionmiami.net' }, { name: 'Architects', url: URL }]),
        generateItemListSchema(firms.map((a, i) => ({ name: a.name, url: `${URL}/${a.slug}`, position: i + 1 })))].map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <h1 className="display-big text-text-primary">Architects</h1>
      <p className="mt-5 max-w-2xl text-lg text-text-muted">
        {all.length} architecture firms are named on the new condo projects and completed towers we track. {firms.length} of them have designed two or more, and each of those has a profile listing its work.
      </p>

      <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {firms.map((a) => (
          <li key={a.slug} className="bg-surface">
            <Link href={`/architects/${a.slug}`} className="block h-full p-6 hover:bg-surface2 transition-colors">
              <h2 className="text-xl leading-tight tracking-[-0.02em] text-text-primary">{a.name}</h2>
              <p className="mt-2 text-sm text-text-muted">
                {[a.projects.length && `${a.projects.length} new ${a.projects.length === 1 ? 'project' : 'projects'}`, a.buildings.length && `${a.buildings.length} completed ${a.buildings.length === 1 ? 'building' : 'buildings'}`].filter(Boolean).join(' · ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {others.length > 0 && (
        <section className="mt-16 max-w-4xl">
          <h2 className="text-2xl tracking-[-0.03em] text-text-primary">Firms with one project</h2>
          <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
            {others.map((a) => {
              const w = a.projects[0] ? { name: a.projects[0].name, href: `/properties/${a.projects[0].slug}` } : { name: a.buildings[0].name, href: `/buildings/${a.buildings[0].slug}` };
              return <li key={a.slug} className="text-text-muted"><span className="text-text-primary">{a.name}</span>: <Link href={w.href} className="underline">{w.name}</Link></li>;
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
