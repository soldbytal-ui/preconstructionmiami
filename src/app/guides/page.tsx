import Link from 'next/link';
import type { Metadata } from 'next';
import { GUIDES, NOT_LEGAL_ADVICE } from '@/lib/guides';
import { DEFAULT_OG, generateBreadcrumbSchema } from '@/lib/seo';

const URL = 'https://preconstructionmiami.net/guides';
const TITLE = 'Buyer Guides: Deposits, Cancelling and Approvals';
const DESC = 'Plain-English guides for Florida pre-construction buyers: how deposits are protected, the 15-day right to cancel, reservations vs contracts, and Miami approvals.';

export const metadata: Metadata = {
  title: TITLE, description: DESC, alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESC, url: URL, type: 'website', images: DEFAULT_OG },
};

export default function GuidesIndex() {
  return (
    <div className="container-main pt-28 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema([{ name: 'Home', url: 'https://preconstructionmiami.net' }, { name: 'Buyer guides', url: URL }])) }} />
      <h1 className="display-big text-text-primary">Buyer guides</h1>
      <p className="mt-5 max-w-2xl text-lg text-text-muted">What protects you when you buy a Florida condo before it is built, with the statute behind each point quoted and linked.</p>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.slug} className="bg-surface">
            <Link href={`/guides/${g.slug}`} className="block h-full p-7 hover:bg-surface2 transition-colors">
              <h2 className="text-2xl leading-tight tracking-[-0.03em] text-text-primary">{g.h1}</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">{g.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-text-primary underline">Read the guide</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-2xl text-sm text-text-muted">{NOT_LEGAL_ADVICE}</p>
    </div>
  );
}
