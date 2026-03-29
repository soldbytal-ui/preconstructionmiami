'use client';

import Link from 'next/link';
import { useState } from 'react';

const neighborhoods = [
  { name: 'Brickell', slug: 'brickell' },
  { name: 'Miami Beach', slug: 'miami-beach' },
  { name: 'Downtown Miami', slug: 'downtown-miami' },
  { name: 'Edgewater', slug: 'edgewater' },
  { name: 'Sunny Isles', slug: 'sunny-isles-beach' },
  { name: 'Coconut Grove', slug: 'coconut-grove' },
  { name: 'Surfside', slug: 'surfside' },
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  return (
    <nav className="bg-navy sticky top-0 z-50 border-b border-navy-400">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-gold font-display text-xl font-bold tracking-tight">
              PRECONSTRUCTION
            </span>
            <span className="text-white font-display text-xl font-light">
              MIAMI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/pre-construction" className="text-gray-300 hover:text-gold transition-colors text-sm font-medium">
              Projects
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setNeighborhoodOpen(true)}
              onMouseLeave={() => setNeighborhoodOpen(false)}
            >
              <button className="text-gray-300 hover:text-gold transition-colors text-sm font-medium flex items-center gap-1">
                Neighborhoods
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {neighborhoodOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 py-2 w-56 z-50">
                  {neighborhoods.map((n) => (
                    <Link
                      key={n.slug}
                      href={`/new-condos-${n.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gold-50 hover:text-navy transition-colors"
                    >
                      {n.name}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      href="/pre-construction"
                      className="block px-4 py-2 text-sm text-gold font-medium hover:bg-gold-50"
                    >
                      View All Neighborhoods &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link href="/blog" className="text-gray-300 hover:text-gold transition-colors text-sm font-medium">
              Blog
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-gold transition-colors text-sm font-medium">
              About
            </Link>
            <Link href="/contact" className="btn-gold text-sm !py-2 !px-4">
              Contact Us
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-navy-400 mt-2 pt-4 space-y-2">
            <Link href="/pre-construction" className="block text-gray-300 hover:text-gold py-2 text-sm" onClick={() => setMobileOpen(false)}>
              All Projects
            </Link>
            {neighborhoods.slice(0, 6).map((n) => (
              <Link
                key={n.slug}
                href={`/new-condos-${n.slug}`}
                className="block text-gray-400 hover:text-gold py-1 text-sm pl-4"
                onClick={() => setMobileOpen(false)}
              >
                {n.name}
              </Link>
            ))}
            <Link href="/blog" className="block text-gray-300 hover:text-gold py-2 text-sm" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>
            <Link href="/about" className="block text-gray-300 hover:text-gold py-2 text-sm" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <Link href="/contact" className="block text-gold font-medium py-2 text-sm" onClick={() => setMobileOpen(false)}>
              Contact Us
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
