import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-accent-green font-semibold text-xl">PRECONSTRUCTION</span>
              <span className="text-text-primary font-light text-xl ml-1">MIAMI</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Miami&apos;s premier marketplace for pre-construction condos. Access 200+ new developments across South Florida.
            </p>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Neighborhoods</h4>
            <ul className="space-y-2">
              {[
                { name: 'Brickell', slug: 'brickell' },
                { name: 'Miami Beach', slug: 'miami-beach' },
                { name: 'Downtown Miami', slug: 'downtown-miami' },
                { name: 'Edgewater', slug: 'edgewater' },
                { name: 'Sunny Isles', slug: 'sunny-isles-beach' },
                { name: 'Coconut Grove', slug: 'coconut-grove' },
                { name: 'Hollywood', slug: 'hollywood' },
                { name: 'Fort Lauderdale', slug: 'fort-lauderdale' },
              ].map((n) => (
                <li key={n.slug}>
                  <Link href={`/new-condos-${n.slug}`} className="text-sm text-text-muted hover:text-accent-green transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/new-condos" className="text-sm text-text-muted hover:text-accent-green transition-colors">All Properties</Link></li>
              <li><Link href="/blog" className="text-sm text-text-muted hover:text-accent-green transition-colors">Blog</Link></li>
              <li><Link href="/about" className="text-sm text-text-muted hover:text-accent-green transition-colors">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-text-muted">Miami, Florida</li>
              <li><Link href="/contact-us" className="text-text-muted hover:text-accent-green transition-colors">Get in Touch &rarr;</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} PreConstructionMiami.net. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <Link href="/about" className="text-text-muted hover:text-accent-green transition-colors">About</Link>
            <Link href="/contact-us" className="text-text-muted hover:text-accent-green transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
