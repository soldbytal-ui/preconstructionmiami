import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pre-Construction Condos in Miami | PreConstructionMiami.net',
    template: '%s | PreConstructionMiami.net',
  },
  description: 'Access 200+ pre-construction condo developments across Miami and South Florida. From $300K to $50M+. Brickell, Miami Beach, Downtown, Edgewater & more.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://preconstructionmiami.net',
    siteName: 'PreConstructionMiami.net',
    title: 'Pre-Construction Condos in Miami | PreConstructionMiami.net',
    description: 'Access 200+ pre-construction condo developments across Miami and South Florida.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
