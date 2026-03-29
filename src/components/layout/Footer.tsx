import Link from 'next/link';

const neighborhoodLinks = [
  { name: 'Brickell', slug: 'brickell' },
  { name: 'Miami Beach', slug: 'miami-beach' },
  { name: 'Downtown Miami', slug: 'downtown-miami' },
  { name: 'Edgewater', slug: 'edgewater' },
  { name: 'Sunny Isles', slug: 'sunny-isles-beach' },
  { name: 'Coconut Grove', slug: 'coconut-grove' },
  { name: 'Hollywood', slug: 'hollywood' },
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale' },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-400">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-gold font-display text-xl font-bold">PRECONSTRUCTION</span>
              <span className="text-white font-display text-xl font-light ml-1">MIAMI</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Miami&apos;s premier marketplace for pre-construction condos. Access 200+ new developments across South Florida.
            </p>
          </div>

          {/* Neighborhoods */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Neighborhoods</h4>
            <ul className="space-y-2">
              {neighborhoodLinks.map((n) => (
                <li key={n.slug}>
                  <Link href={`/new-condos-${n.slug}`} className="text-sm hover:text-gold transition-colors">
                    {n.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/pre-construction" className="text-sm hover:text-gold transition-colors">All Projects</Link></li>
              <li><Link href="/blog" className="text-sm hover:text-gold transition-colors">Blog</Link></li>
              <li><Link href="/blog/pre-construction-condos-miami-buyers-guide-2026" className="text-sm hover:text-gold transition-colors">Buyer&apos;s Guide</Link></li>
              <li><Link href="/blog/miami-condo-market-2026-trends-prices-forecast" className="text-sm hover:text-gold transition-colors">Market Report</Link></li>
              <li><Link href="/blog/how-much-does-home-staging-cost-miami" className="text-sm hover:text-gold transition-colors">Pricing Guide</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Miami, Florida</li>
              <li>
                <Link href="/contact" className="hover:text-gold transition-colors">
                  Get in Touch &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-400 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs">&copy; {new Date().getFullYear()} PreConstructionMiami.net. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <Link href="/about" className="hover:text-gold transition-colors">About</Link>
            <Link href="/contact" className="hover:text-gold transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
