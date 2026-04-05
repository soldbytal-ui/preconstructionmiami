export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'PreConstructionMiami.net',
    description: 'Miami\'s premier pre-construction condo marketplace. Access 200+ new developments across South Florida.',
    url: 'https://preconstructionmiami.net',
    logo: 'https://preconstructionmiami.net/og-image.png',
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
    priceRange: '$300K - $50M+',
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
    logo: 'https://preconstructionmiami.net/og-image.png',
    description: 'South Florida\'s most comprehensive pre-construction condo marketplace connecting buyers and investors with 200+ new developments.',
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
    description: 'South Florida\'s premier marketplace for pre-construction condos. Access 200+ new developments across 24 neighborhoods.',
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
  neighborhood?: { name: string } | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    description: project.description?.slice(0, 300) || `${project.name} - New pre-construction development in Miami`,
    url: `https://preconstructionmiami.net/properties/${project.slug}`,
    ...(project.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: project.address,
        addressLocality: project.neighborhood?.name || 'Miami',
        addressRegion: 'FL',
        addressCountry: 'US',
      },
    }),
    ...(project.priceMin && {
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: project.priceMin,
        ...(project.priceMax && { highPrice: project.priceMax }),
        priceCurrency: 'USD',
        availability: 'https://schema.org/PreSale',
      },
    }),
    ...(project.mainImageUrl && { image: project.mainImageUrl }),
    ...(project.totalUnits && { numberOfAccommodationUnits: project.totalUnits }),
    ...(project.floors && { numberOfFloors: project.floors }),
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
        text: 'Explore 200+ pre-construction developments across South Florida with detailed specs, pricing, and floor plans.',
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
