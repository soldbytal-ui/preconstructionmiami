import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://preconstructionmiami.net';

  const [projects, neighborhoods, blogPosts] = await Promise.all([
    prisma.project.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.neighborhood.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/pre-construction`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...projects.map((p) => ({
      url: `${baseUrl}/pre-construction/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...neighborhoods.map((n) => ({
      url: `${baseUrl}/new-condos-${n.slug}`,
      lastModified: n.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...blogPosts.map((bp) => ({
      url: `${baseUrl}/blog/${bp.slug}`,
      lastModified: bp.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
