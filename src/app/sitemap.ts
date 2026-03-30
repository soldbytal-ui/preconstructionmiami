export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://preconstructionmiami.net';

  const [{ data: projects }, { data: neighborhoods }, { data: blogPosts }] = await Promise.all([
    supabase.from('projects').select('slug, updatedAt'),
    supabase.from('neighborhoods').select('slug, updatedAt'),
    supabase.from('blog_posts').select('slug, updatedAt').not('publishedAt', 'is', null),
  ]);

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/pre-construction`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...(projects || []).map((p: any) => ({
      url: `${baseUrl}/pre-construction/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(neighborhoods || []).map((n: any) => ({
      url: `${baseUrl}/new-condos-${n.slug}`,
      lastModified: n.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(blogPosts || []).map((bp: any) => ({
      url: `${baseUrl}/blog/${bp.slug}`,
      lastModified: bp.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
