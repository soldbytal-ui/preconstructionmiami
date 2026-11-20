import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { GUIDES, guideBySlug, NOT_LEGAL_ADVICE, type Block } from '@/lib/guides';
import { DEFAULT_OG, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo';
import { formatDay } from '@/lib/approval';

const BASE = 'https://preconstructionmiami.net';
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return GUIDES.map((g) => ({ slug: g.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return { title: 'Guide not found' };
  const url = `${BASE}/guides/${g.slug}`;
  return {
    title: g.title, description: g.description, alternates: { canonical: url },
    openGraph: { title: g.title, description: g.description, url, type: 'article', images: DEFAULT_OG, modifiedTime: g.reviewed },
    twitter: { card: 'summary_large_image', title: g.title, description: g.description },
  };
}

function Body({ b }: { b: Block }) {
  if (b.type === 'h') return <h2 className="mt-12 text-2xl md:text-3xl leading-tight tracking-[-0.03em] text-text-primary">{b.text}</h2>;
  if (b.type === 'p') return <p className="mt-4 leading-relaxed text-text-primary">{b.text}</p>;
  if (b.type === 'list') return <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-text-primary">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
  if (b.type === 'quote') return (
    <figure className="mt-5 border-l-4 border-[#E8563F] bg-surface py-4 pl-5 pr-4">
      <blockquote className="text-[15px] leading-relaxed text-text-primary">“{b.text}”</blockquote>
      <figcaption className="mt-2 text-sm text-text-muted"><a href={b.url} target="_blank" rel="noopener noreferrer" className="underline">{b.cite}</a></figcaption>
    </figure>
  );
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <thead><tr className="border-b border-border text-left">{b.head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold text-text-primary">{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r) => (
          <tr key={r[0]} className="border-b border-border last:border-0 align-top">
            {r.map((c, i) => i === 0 ? <th key={i} scope="row" className="px-4 py-3 text-left font-semibold text-text-primary">{c}</th> : <td key={i} className="px-4 py-3 text-text-primary">{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default async function GuidePage({ params }: Props) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const url = `${BASE}/guides/${g.slug}`;
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description, dateModified: g.reviewed, datePublished: g.reviewed,
    mainEntityOfPage: url, author: { '@type': 'Organization', name: 'PreConstruction Miami', url: BASE }, publisher: { '@type': 'Organization', name: 'PreConstruction Miami', url: BASE },
    citation: g.sources.map((s) => s.url),
  };
  return (
    <article className="container-main pt-28 pb-20">
      {[article, generateFAQSchema(g.faqs.map((f) => ({ question: f.q, answer: f.a }))), generateBreadcrumbSchema([{ name: 'Home', url: BASE }, { name: 'Buyer guides', url: `${BASE}/guides` }, { name: g.h1, url }])].map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <div className="max-w-3xl">
        <nav className="text-sm text-text-muted"><Link href="/guides" className="underline">Buyer guides</Link></nav>
        <h1 className="mt-4 text-4xl md:text-6xl leading-[0.98] tracking-[-0.045em] text-text-primary">{g.h1}</h1>
        <p className="mt-6 text-lg leading-relaxed text-text-primary">{g.summary}</p>
        <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-muted"><strong className="text-text-primary">Not legal advice.</strong> {NOT_LEGAL_ADVICE}</p>
        <p className="mt-3 text-xs text-text-muted">Checked against the sources below on {formatDay(g.reviewed)}.</p>

        {g.blocks.map((b, i) => <Body key={i} b={b} />)}

        <h2 className="mt-14 text-2xl md:text-3xl leading-tight tracking-[-0.03em] text-text-primary">Common questions</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {g.faqs.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-semibold text-text-primary">{f.q}</dt>
              <dd className="mt-2 leading-relaxed text-text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 text-xl font-semibold text-text-primary">Sources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {g.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline text-text-primary">{s.label}</a></li>)}
        </ul>

        <h2 className="mt-14 text-xl font-semibold text-text-primary">More guides</h2>
        <ul className="mt-3 space-y-2">
          {GUIDES.filter((x) => x.slug !== g.slug).map((x) => <li key={x.slug}><Link href={`/guides/${x.slug}`} className="underline text-text-primary">{x.h1}</Link></li>)}
        </ul>
      </div>
    </article>
  );
}
