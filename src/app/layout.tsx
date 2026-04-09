import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import CRMTracker from '@/components/CRMTracker';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://preconstructionmiami.net'),
  title: {
    default: 'Pre-Construction Condos in Miami | PreConstructionMiami.net',
    template: '%s | PreConstructionMiami.net',
  },
  description: 'Access 200+ pre-construction condo developments across Miami and South Florida. From $300K to $50M+. Brickell, Miami Beach, Downtown, Edgewater & more.',
  alternates: {
    canonical: 'https://preconstructionmiami.net',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://preconstructionmiami.net',
    siteName: 'PreConstructionMiami.net',
    title: 'Pre-Construction Condos in Miami | PreConstructionMiami.net',
    description: 'Access 200+ pre-construction condo developments across Miami and South Florida.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PreConstructionMiami.net - Miami Pre-Construction Condo Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pre-Construction Condos in Miami | PreConstructionMiami.net',
    description: 'Access 200+ pre-construction condo developments across Miami and South Florida.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00E5B4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-bg text-text-primary">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatWidget />
        <CRMTracker />
      </body>
    </html>
  );
}
