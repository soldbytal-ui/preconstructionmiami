import type { Metadata } from 'next';
import Link from 'next/link';
import { DEFAULT_OG } from '@/lib/seo';
import DynamicMap from '@/components/map/DynamicMap';

const URL = 'https://preconstructionmiami.net/preconstruction-3d';
const TITLE = 'Pre-Construction 3D Map of Miami\'s New Towers';
const DESC = 'Only the new towers: every pre-construction and under-construction condo in Miami, Fort Lauderdale and Palm Beach on a night 3D map, coloured by stage.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'website', images: DEFAULT_OG },
};

export default function Preconstruction3DPage() {
  return (
    <div className="pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Pre-construction 3D map of Miami', url: URL, description: DESC, applicationCategory: 'MapApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) }} />
      <h1 className="sr-only">Pre-construction 3D map of Miami</h1>
      <div className="theme-dark relative h-[calc(100vh-56px)] min-h-[520px] w-full bg-bg">
        <DynamicMap />
      </div>
      <section className="container-main py-14">
        <h2 className="display-big max-w-[16ch] text-text-primary">Only what is coming</h2>
        <p className="mt-5 max-w-[62ch] text-lg text-text-primary/85">
          This map shows the new towers on their own, each in its real colours with its stage marked at the base. Select a tower for its price,
          storeys and completion date. To see them among the buildings that already stand, and to check the view from any floor, open{' '}
          <Link href="/miami-3d" className="link-underline">Miami 3D</Link>.
        </p>
        <h2 className="mt-12 text-2xl font-semibold text-text-primary">How to read the map</h2>
        <ul className="mt-4 max-w-[62ch] space-y-2 text-text-muted">
          <li>Every tower is drawn at its real height and footprint, from the developer&apos;s published storeys and the county parcel record.</li>
          <li>The pad under each tower shows its stage: planned, under construction, nearly finished or completed.</li>
          <li>The map covers Miami-Dade, Broward and Palm Beach counties, from Coral Gables to West Palm Beach.</li>
          <li>Use the district buttons to jump between Brickell, Downtown, Edgewater, Miami Beach and the other areas.</li>
        </ul>
        <p className="mt-6 max-w-[62ch] text-text-muted">
          Prefer a list? <Link href="/new-condos" className="link-underline">Every project is on one page</Link>, and each{' '}
          <Link href="/areas" className="link-underline">neighborhood</Link> has its own map and table.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/miami-3d" className="btn-primary">Open Miami 3D</Link>
          <Link href="/tallest-buildings" className="btn-secondary">See the tallest towers</Link>
        </div>
      </section>
    </div>
  );
}
