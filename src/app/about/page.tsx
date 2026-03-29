import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'PreConstructionMiami.net is Miami\'s premier marketplace for new construction condos. We help buyers access pre-launch pricing across 200+ developments.',
};

export default function AboutPage() {
  return (
    <div className="container-main py-10 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-navy mb-8">About PreConstructionMiami.net</h1>

      <div className="prose prose-gray prose-lg max-w-none prose-headings:font-display prose-headings:text-navy">
        <p>
          PreConstructionMiami.net is South Florida&apos;s most comprehensive pre-construction condo marketplace.
          We connect buyers and investors with 200+ new developments across Miami-Dade, Broward, and Palm Beach counties
          -- from ultra-luxury branded residences in Brickell to emerging value plays in Edgewater and beyond.
        </p>

        <h2>What We Do</h2>
        <p>
          We aggregate every active pre-construction project in South Florida into one searchable platform.
          Each listing includes detailed specifications, pricing, deposit structures, floor plans, amenities,
          developer information, and estimated completion dates -- everything you need to make an informed decision.
        </p>

        <h2>Why Pre-Construction?</h2>
        <p>
          Buying pre-construction offers unique advantages that resale properties simply cannot match:
        </p>
        <ul>
          <li><strong>Below-market pricing:</strong> Lock in today&apos;s prices and build equity as the project develops</li>
          <li><strong>Customization:</strong> Choose your preferred unit, floor, view, and finishes</li>
          <li><strong>Brand new:</strong> Latest amenities, technology, and design -- never lived in</li>
          <li><strong>Flexible payments:</strong> Spread your deposit over 18-30 months during construction</li>
        </ul>

        <h2>Why Miami?</h2>
        <p>
          Miami has cemented its position as a global destination for real estate investment. With no state income tax,
          year-round tropical weather, a booming tech and finance scene, and over 1,000 people moving to Florida daily,
          demand for quality housing continues to outpace supply. Pre-construction allows buyers to participate in this
          growth at the earliest possible stage.
        </p>

        <h2>Our Commitment</h2>
        <p>
          We are committed to providing transparent, accurate, and up-to-date information on every project we feature.
          Our data is sourced directly from developers, public records, and verified market reports.
          We believe that informed buyers make better decisions -- and that&apos;s what drives everything we do.
        </p>
      </div>

      <div className="mt-12 bg-gold-50 rounded-xl p-8 text-center">
        <h3 className="font-display text-2xl font-bold text-navy mb-3">Have Questions?</h3>
        <p className="text-gray-600 mb-6">We&apos;re here to help you navigate the pre-construction process.</p>
        <Link href="/contact" className="btn-navy">Get in Touch</Link>
      </div>
    </div>
  );
}
