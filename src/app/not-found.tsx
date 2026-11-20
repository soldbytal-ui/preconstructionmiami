import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist. Browse our pre-construction condo listings in Miami.',
};

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="display-mega text-accent-green/25 mb-2">404</div>
      <h1 className="display-big text-text-primary mb-4">
        This page isn&apos;t here
      </h1>
      <p className="text-text-muted max-w-md mb-8 leading-relaxed">
        The link may be old, or the listing may have been renamed. Every current project is on the list and on the map.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/new-condos" className="btn-primary">Browse new condos</Link>
        <Link href="/miami-3d" className="btn-secondary">Open the 3D map</Link>
        <Link href="/" className="btn-secondary">Go to the home page</Link>
      </div>
    </div>
  );
}
