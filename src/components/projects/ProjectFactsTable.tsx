import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { STAGE, type FactProject } from '@/lib/facts';

/** Every project in a set as one comparable table: the facts in a form people and search engines can both read. */
export default function ProjectFactsTable({ projects, caption, showArea = false }: { projects: FactProject[]; caption: string; showArea?: boolean }) {
  const rows = [...projects].sort((a, b) => (b.floors || 0) - (a.floors || 0) || a.name.localeCompare(b.name));
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th scope="col" className="px-4 py-3 font-medium">Project</th>
            {showArea && <th scope="col" className="px-4 py-3 font-medium">Area</th>}
            <th scope="col" className="px-4 py-3 font-medium">Developer</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Storeys</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Residences</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">From</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Due</th>
            <th scope="col" className="px-4 py-3 font-medium">Stage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.slug} className="border-b border-border last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-text-primary">
                <Link href={`/properties/${p.slug}`} className="hover:text-accent-green">{p.name}</Link>
              </th>
              {showArea && <td className="px-4 py-3 text-text-muted">{p.neighborhood ? <Link href={`/new-condos-${p.neighborhood.slug}`} className="hover:text-accent-green">{p.neighborhood.name}</Link> : ''}</td>}
              <td className="px-4 py-3 text-text-muted">{p.developer ? <Link href={`/developers/${p.developer.slug}`} className="hover:text-accent-green">{p.developer.name}</Link> : ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.floors || ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.totalUnits ? p.totalUnits.toLocaleString() : ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.soldOut ? 'Sold out' : p.priceMin ? formatPrice(p.priceMin) : ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{p.estCompletion || ''}</td>
              <td className="px-4 py-3 text-text-muted">{STAGE[p.status] || p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
