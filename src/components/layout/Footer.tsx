import Link from 'next/link';

const MIAMI_DADE = [
  { name: 'Brickell', slug: 'brickell' },
  { name: 'Downtown Miami', slug: 'downtown-miami' },
  { name: 'Edgewater', slug: 'edgewater' },
  { name: 'Miami Beach', slug: 'miami-beach' },
  { name: 'South Beach', slug: 'south-beach' },
  { name: 'Coconut Grove', slug: 'coconut-grove' },
  { name: 'Coral Gables', slug: 'coral-gables' },
  { name: 'Sunny Isles Beach', slug: 'sunny-isles-beach' },
  { name: 'Surfside', slug: 'surfside' },
  { name: 'Bal Harbour', slug: 'bal-harbour' },
  { name: 'Bay Harbor Islands', slug: 'bay-harbor-islands' },
  { name: 'Key Biscayne', slug: 'key-biscayne' },
  { name: 'Midtown/Wynwood', slug: 'midtown-wynwood' },
  { name: 'Design District', slug: 'design-district' },
  { name: 'Aventura', slug: 'aventura' },
  { name: 'North Bay Village', slug: 'north-bay-village' },
  { name: 'North Miami Beach', slug: 'north-miami-beach' },
];

const BROWARD_PALM = [
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale' },
  { name: 'Hollywood', slug: 'hollywood' },
  { name: 'Hallandale Beach', slug: 'hallandale-beach' },
  { name: 'Pompano Beach', slug: 'pompano-beach' },
  { name: 'Palm Beach', slug: 'palm-beach' },
  { name: 'Boca Raton', slug: 'boca-raton' },
  { name: 'West Palm Beach', slug: 'west-palm-beach' },
];

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
              South Florida&apos;s premier marketplace for pre-construction condos. Access 130+ new developments across 24 neighborhoods from Brickell to West Palm Beach.
            </p>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Miami-Dade</h4>
            <ul className="space-y-1.5">
              {MIAMI_DADE.map((n) => (
                <li key={n.slug}>
                  <Link href={`/new-condos-${n.slug}`} className="text-sm text-text-muted hover:text-accent-green transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Broward & Palm Beach</h4>
            <ul className="space-y-1.5">
              {BROWARD_PALM.map((n) => (
                <li key={n.slug}>
                  <Link href={`/new-condos-${n.slug}`} className="text-sm text-text-muted hover:text-accent-green transition-colors">{n.name}</Link>
                </li>
              ))}
            </ul>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mt-8 mb-4">Resources</h4>
            <ul className="space-y-1.5">
              <li><Link href="/new-condos" className="text-sm text-text-muted hover:text-accent-green transition-colors">All Properties</Link></li>
              <li><Link href="/developers" className="text-sm text-text-muted hover:text-accent-green transition-colors">Developers</Link></li>
              <li><Link href="/blog" className="text-sm text-text-muted hover:text-accent-green transition-colors">Market Insights Blog</Link></li>
              <li><Link href="/about" className="text-sm text-text-muted hover:text-accent-green transition-colors">About Us</Link></li>
              <li><Link href="/terms" className="text-sm text-text-muted hover:text-accent-green transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-text-muted hover:text-accent-green transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-text-muted">Miami, Florida</li>
              <li><Link href="/contact-us" className="text-accent-green hover:underline transition-colors">Get in Touch &rarr;</Link></li>
            </ul>
            <div className="mt-8">
              <h4 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Popular Searches</h4>
              <ul className="space-y-1.5">
                <li><Link href="/new-condos?category=ULTRA_LUXURY" className="text-sm text-text-muted hover:text-accent-green transition-colors">Ultra-Luxury Condos</Link></li>
                <li><Link href="/new-condos?status=PRE_LAUNCH" className="text-sm text-text-muted hover:text-accent-green transition-colors">Pre-Launch Projects</Link></li>
                <li><Link href="/new-condos?status=UNDER_CONSTRUCTION" className="text-sm text-text-muted hover:text-accent-green transition-colors">Under Construction</Link></li>
                <li><Link href="/new-condos?sort=price_asc" className="text-sm text-text-muted hover:text-accent-green transition-colors">Most Affordable</Link></li>
              </ul>
            </div>
          </div>
        </div>
        {/* Disclaimer Banner */}
        <div className="border-t border-border mt-12 pt-8">
          <p className="text-xs text-text-muted/70 leading-relaxed max-w-4xl">
            PreConstructionMiami.net is an informational platform that partners with licensed local real estate professionals. We are not licensed real estate brokers. All pricing and project details are approximate, based on publicly available information, and subject to change without notice. Consult a licensed real estate professional before making any purchasing decisions.
            {' '}Prices shown throughout this site are estimates only &mdash; verify with the developer or a licensed agent.
          </p>
        </div>

        {/* Copyright + Legal Links */}
        <div className="border-t border-border mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} PreConstructionMiami.net. All rights reserved.</p>
            <p className="text-xs text-text-muted/60 mt-1">PreConstructionMiami is an informational platform that partners with licensed local real estate professionals. We are not licensed real estate brokers. All pricing and project details are approximate and subject to change.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link href="/about" className="text-text-muted hover:text-accent-green transition-colors">About</Link>
            <Link href="/contact-us" className="text-text-muted hover:text-accent-green transition-colors">Contact</Link>
            <Link href="/blog" className="text-text-muted hover:text-accent-green transition-colors">Blog</Link>
            <span className="text-text-muted/30">|</span>
            <Link href="/terms" className="text-text-muted hover:text-accent-green transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-text-muted hover:text-accent-green transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
