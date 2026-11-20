const BRAND = 'PreConstructionMiami';

/** Default social preview image, used wherever a page has no image of its own. */
export const DEFAULT_OG = [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PreConstructionMiami.net' }];

/** Plain text from markdown, for meta descriptions and structured data. */
export function plainText(md: string | null | undefined): string {
  return (md || '')
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Meta description that fits what search results show (about 155 characters). */
export function fitDesc(text: string | null | undefined, max = 155): string {
  const t = plainText(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…';
}

/**
 * Page title that fits in a search result (60 characters). Adds the brand only
 * when there is room, and drops trailing segments before cutting anything off.
 */
export function fitTitle(base: string): string {
  let segs = base.replace(/[*_`]/g, '').trim().split(' | ').map((x) => x.trim()).filter((x) => x && !/preconstructionmiami/i.test(x));
  while (segs.length > 1 && segs.join(' | ').length > 60) segs = segs.slice(0, -1);
  const core = segs.join(' | ');
  return core.length + BRAND.length + 3 <= 60 ? `${core} | ${BRAND}` : core;
}

/** First title option that fits. */
export function pickTitle(options: string[]): string {
  return options.find((o) => o.length <= 60) || options[options.length - 1];
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PreConstructionMiami.net',
    description: 'Miami\'s premier pre-construction condo marketplace. Access 170+ new developments across South Florida.',
    url: 'https://preconstructionmiami.net',
    logo: 'https://preconstructionmiami.net/icon.png',
    image: 'https://preconstructionmiami.net/og-image.png',
    email: 'info@preconstructionmiami.net',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3250 NE 1st Ave Unit 305',
      addressLocality: 'Miami',
      addressRegion: 'FL',
      postalCode: '33137',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 25.8095,
      longitude: -80.1918,
    },
    areaServed: [
      { '@type': 'City', name: 'Miami', containedInPlace: { '@type': 'State', name: 'Florida' } },
      { '@type': 'County', name: 'Miami-Dade County' },
      { '@type': 'County', name: 'Broward County' },
      { '@type': 'County', name: 'Palm Beach County' },
    ],
    priceRange: '$350K+',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    sameAs: [],
    knowsAbout: ['pre-construction condos', 'Miami real estate', 'new construction', 'luxury condominiums', 'South Florida developments'],
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PreConstructionMiami.net',
    url: 'https://preconstructionmiami.net',
    logo: 'https://preconstructionmiami.net/icon.png',
    description: 'South Florida\'s most comprehensive pre-construction condo marketplace connecting buyers and investors with 170+ new developments.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3250 NE 1st Ave Unit 305',
      addressLocality: 'Miami',
      addressRegion: 'FL',
      postalCode: '33137',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@preconstructionmiami.net',
      contactType: 'customer service',
      availableLanguage: ['English', 'Spanish'],
    },
    sameAs: [],
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PreConstructionMiami.net',
    url: 'https://preconstructionmiami.net',
    description: 'South Florida\'s premier marketplace for pre-construction condos. Access 170+ new developments across South Florida.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://preconstructionmiami.net/new-condos?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateItemListSchema(items: { name: string; url: string; position: number }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

export function generateRealEstateListingSchema(project: {
  name: string;
  slug: string;
  address?: string | null;
  description?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  mainImageUrl?: string | null;
  totalUnits?: number | null;
  floors?: number | null;
  estCompletion?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  images?: any;
  neighborhood?: { name: string } | null;
  developer?: { name: string } | null;
}) {
  const url = `https://preconstructionmiami.net/properties/${project.slug}`;
  const parts = (project.address || '').split(',').map((x) => x.trim()).filter(Boolean);
  const zip = (project.address || '').match(/\b(3[0-4]\d{3})\b/)?.[1];
  const city = parts.length > 1 ? parts[1].replace(/\bFL\b.*$/i, '').trim() : '';
  const gallery: string[] = Array.isArray(project.images?.gallery) ? project.images.gallery.map((g: any) => g?.url).filter(Boolean).slice(0, 6) : [];
  const images = Array.from(new Set([project.mainImageUrl, ...gallery].filter(Boolean)));
  const iso = (d?: string | null) => (d ? new Date(d.endsWith('Z') ? d : d + 'Z').toISOString() : undefined);
  const address = project.address
    ? {
        '@type': 'PostalAddress',
        streetAddress: parts[0],
        addressLocality: city || project.neighborhood?.name || 'Miami',
        addressRegion: 'FL',
        ...(zip && { postalCode: zip }),
        addressCountry: 'US',
      }
    : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    name: project.name,
    description: fitDesc(project.description, 300) || `${project.name} is a new pre-construction development in South Florida.`,
    url,
    ...(iso(project.createdAt) && { datePosted: iso(project.createdAt) }),
    ...(iso(project.updatedAt) && { dateModified: iso(project.updatedAt) }),
    ...(images.length && { image: images }),
    ...(project.priceMin && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: project.priceMin,
        ...(project.priceMax && { highPrice: project.priceMax }),
        priceCurrency: 'USD',
        availability: 'https://schema.org/PreSale',
      },
    }),
    // The building itself, so search engines and AI assistants can read its facts
    about: {
      '@type': 'ApartmentComplex',
      name: project.name,
      ...(address && { address }),
      ...(project.latitude && project.longitude && { geo: { '@type': 'GeoCoordinates', latitude: project.latitude, longitude: project.longitude } }),
      ...(project.totalUnits && { numberOfAccommodationUnits: project.totalUnits }),
      ...(project.floors && { additionalProperty: [{ '@type': 'PropertyValue', name: 'Storeys', value: project.floors }, ...(project.estCompletion ? [{ '@type': 'PropertyValue', name: 'Estimated completion', value: project.estCompletion }] : [])] }),
      ...(project.developer?.name && { brand: { '@type': 'Organization', name: project.developer.name } }),
    },
  };
}

/** A list of listings, so engines can see what a hub page links to. */
export function generateProjectListSchema(name: string, projects: { name: string; slug: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `https://preconstructionmiami.net/properties/${p.slug}`,
    })),
  };
}

export function generateArticleSchema(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  author: string;
  featuredImage?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    url: `https://preconstructionmiami.net/blog/${post.slug}`,
    ...(post.excerpt && { description: post.excerpt }),
    ...(post.publishedAt && { datePublished: typeof post.publishedAt === 'string' ? post.publishedAt : post.publishedAt.toISOString() }),
    ...(post.updatedAt && { dateModified: typeof post.updatedAt === 'string' ? post.updatedAt : post.updatedAt.toISOString() }),
    ...(post.featuredImage && { image: post.featuredImage }),
    author: {
      '@type': 'Person',
      name: post.author || 'PreConstructionMiami.net',
      url: 'https://preconstructionmiami.net/about',
      jobTitle: 'Real Estate Market Analyst',
      worksFor: {
        '@type': 'Organization',
        name: 'PreConstructionMiami.net',
        url: 'https://preconstructionmiami.net',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'PreConstructionMiami.net',
      url: 'https://preconstructionmiami.net',
      logo: {
        '@type': 'ImageObject',
        url: 'https://preconstructionmiami.net/og-image.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://preconstructionmiami.net/blog/${post.slug}`,
    },
  };
}

export function generateHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Buy a Pre-Construction Condo in Miami',
    description: 'A four-step guide to purchasing a pre-construction condo in South Florida, from browsing to move-in.',
    totalTime: 'P24M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Browse Projects',
        text: 'Explore 170+ pre-construction developments across South Florida with detailed specs, pricing, and floor plans.',
        url: 'https://preconstructionmiami.net/new-condos',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Reserve Your Unit',
        text: 'Secure your preferred unit with a reservation deposit, typically $10K-$50K. Lock in pre-construction pricing before public launch.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Track Construction',
        text: 'Monitor construction milestones and make scheduled deposit payments, typically 50% total before completion.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Close and Move In',
        text: 'Receive your keys to a brand-new home. Close with a mortgage or cash for the remaining balance at completion.',
      },
    ],
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
