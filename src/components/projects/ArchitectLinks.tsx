import Link from 'next/link';
import { splitArchitects, architectSlug } from '@/lib/architect-names';

/** Architect names, each linked to its profile when the firm has one. */
export default function ArchitectLinks({ field, profiles, className = 'underline' }: { field: string | null | undefined; profiles: Set<string>; className?: string }) {
  const names = splitArchitects(field);
  return (
    <>
      {names.map((n, i) => {
        const slug = architectSlug(n);
        return (
          <span key={slug}>
            {i > 0 && (i === names.length - 1 ? ' and ' : ', ')}
            {profiles.has(slug) ? <Link href={`/architects/${slug}`} className={className}>{n}</Link> : n}
          </span>
        );
      })}
    </>
  );
}
