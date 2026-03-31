'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NEIGHBORHOODS = [
  { name: 'Brickell', slug: 'brickell' },
  { name: 'Downtown Miami', slug: 'downtown-miami' },
  { name: 'Edgewater', slug: 'edgewater' },
  { name: 'Miami Beach', slug: 'miami-beach' },
  { name: 'Sunny Isles Beach', slug: 'sunny-isles-beach' },
  { name: 'Coconut Grove', slug: 'coconut-grove' },
  { name: 'Hollywood', slug: 'hollywood' },
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale' },
  { name: 'Aventura', slug: 'aventura' },
  { name: 'Surfside', slug: 'surfside' },
  { name: 'Wynwood', slug: 'wynwood' },
  { name: 'Midtown', slug: 'midtown' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHoodOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 ${
        scrolled || !isHome ? 'glass-panel' : 'bg-transparent'
      }`}
    >
      <div className="container-main h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-accent-green font-semibold text-lg tracking-tight">PRECONSTRUCTION</span>
          <span className="text-text-primary font-light text-lg">MIAMI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/new-condos" className="btn-ghost text-sm">Properties</Link>
          <div className="relative" onMouseEnter={() => setHoodOpen(true)} onMouseLeave={() => setHoodOpen(false)}>
            <button className="btn-ghost text-sm flex items-center gap-1">
              Neighborhoods
              <svg className={`w-3.5 h-3.5 transition-transform ${hoodOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {hoodOpen && (
              <div className="absolute top-full left-0 mt-1 glass-panel rounded-xl py-2 min-w-[200px]">
                {NEIGHBORHOODS.map((n) => (
                  <Link key={n.slug} href={`/new-condos-${n.slug}`} className="block px-4 py-2 text-sm text-text-muted hover:text-accent-green hover:bg-surface2 transition-colors">
                    {n.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/blog" className="btn-ghost text-sm">Blog</Link>
          <Link href="/about" className="btn-ghost text-sm">About</Link>
          <Link href="/contact-us" className="btn-primary text-sm !py-2 !px-4 ml-2">Contact Us</Link>
        </div>

        <button className="md:hidden text-text-primary" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-panel border-t border-border">
          <div className="container-main py-4 space-y-1">
            <Link href="/new-condos" className="block py-2.5 text-text-muted hover:text-accent-green transition-colors">Properties</Link>
            <Link href="/blog" className="block py-2.5 text-text-muted hover:text-accent-green transition-colors">Blog</Link>
            <Link href="/about" className="block py-2.5 text-text-muted hover:text-accent-green transition-colors">About</Link>
            <div className="pt-2 border-t border-border mt-2">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Neighborhoods</p>
              <div className="grid grid-cols-2 gap-1">
                {NEIGHBORHOODS.slice(0, 8).map((n) => (
                  <Link key={n.slug} href={`/new-condos-${n.slug}`} className="text-sm text-text-muted hover:text-accent-green py-1.5 transition-colors">{n.name}</Link>
                ))}
              </div>
            </div>
            <Link href="/contact-us" className="btn-primary w-full text-sm mt-4">Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
