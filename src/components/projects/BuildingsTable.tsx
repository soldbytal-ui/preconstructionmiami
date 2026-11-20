import Link from 'next/link';
import { feet, type Building } from '@/lib/buildings';

/** Finished buildings as one comparable table. */
export default function BuildingsTable({ buildings, caption, showDeveloper = false }: { buildings: Building[]; caption: string; showDeveloper?: boolean }) {
  if (!buildings.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[620px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-text-muted">
            <th scope="col" className="px-4 py-3 font-medium">Building</th>
            {showDeveloper && <th scope="col" className="px-4 py-3 font-medium">Developer</th>}
            <th scope="col" className="px-4 py-3 font-medium">Area</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Built</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Storeys</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Height</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Residences</th>
          </tr>
        </thead>
        <tbody>
          {buildings.map((b) => (
            <tr key={b.slug} className="border-b border-border last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-text-primary">
                <Link href={`/buildings/${b.slug}`} className="hover:text-accent-green">{b.name}</Link>
                {b.tenure === 'rental' && <span className="ml-2 text-xs font-normal text-text-muted">rental</span>}
              </th>
              {showDeveloper && <td className="px-4 py-3 text-text-muted">{b.developer ? <Link href={`/developers/${b.developer.slug}`} className="hover:text-accent-green">{b.developer.name}</Link> : ''}</td>}
              <td className="px-4 py-3 text-text-muted">{b.neighborhood?.name || ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{b.yearBuilt || ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{b.floors || ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{b.heightM ? `${feet(b.heightM)?.toLocaleString()} ft` : ''}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-primary">{b.totalUnits ? b.totalUnits.toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
