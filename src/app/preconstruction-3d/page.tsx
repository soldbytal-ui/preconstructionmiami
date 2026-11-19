import type { Metadata } from 'next';
import Link from 'next/link';
import { DEFAULT_OG } from '@/lib/seo';
import DynamicMap from '@/components/map/DynamicMap';

const URL = 'https://preconstructionmiami.net/preconstruction-3d';
const TITLE = 'Pre-Construction 3D Map: Miami\'s New Towers | PreConstructionMiami';
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
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/miami-3d" className="btn-primary">Open Miami 3D</Link>
          <Link href="/tallest-buildings" className="btn-secondary">See the tallest towers</Link>
        </div>
      </section>
    </div>
  );
}
