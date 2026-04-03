export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'PreConstructionMiami.net',
    description: 'Miami\'s premier pre-construction condo marketplace. Access 200+ new developments across South Florida.',
    url: 'https://preconstructionmiami.net',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3250 NE 1st Ave Unit 305',
      addressLocality: 'Miami',
      addressRegion: 'FL',
      postalCode: '33137',
      addressCountry: 'US',
    },
    areaServed: [
      { '@type': 'City', name: 'Miami', containedInPlace: { '@type': 'State', name: 'Florida' } },
      { '@type': 'County', name: 'Miami-Dade County' },
      { '@type': 'County', name: 'Broward County' },
      { '@type': 'County', name: 'Palm Beach County' },
    ],
    priceRange: '$300K - $50M+',
    knowsAbout: ['pre-construction condos', 'Miami real estate', 'new construction', 'luxury condominiums', 'South Florida developments'],
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
  mainImageUrl?: string | null;
  totalUnits?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    description: project.description || `${project.name} - New pre-construction development in Miami`,
    url: `https://preconstructionmiami.net/properties/${project.slug}`,
    ...(project.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: project.address,
        addressLocality: 'Miami',
        addressRegion: 'FL',
        addressCountry: 'US',
      },
    }),
    ...(project.priceMin && {
      offers: {
        '@type': 'Offer',
        price: project.priceMin,
        priceCurrency: 'USD',
      },
    }),
    ...(project.mainImageUrl && { image: project.mainImageUrl }),
  };
}

export function generateArticleSchema(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    url: `https://preconstructionmiami.net/blog/${post.slug}`,
    ...(post.excerpt && { description: post.excerpt }),
    ...(post.publishedAt && { datePublished: typeof post.publishedAt === 'string' ? post.publishedAt : post.publishedAt.toISOString() }),
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'PreConstructionMiami.net',
      url: 'https://preconstructionmiami.net',
    },
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
