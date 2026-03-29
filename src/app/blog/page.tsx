import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Miami Pre-Construction Blog | Market Reports, Guides & Tips',
  description: 'Expert insights on Miami pre-construction condos. Buyer guides, market reports, neighborhood comparisons, investment analysis, and more.',
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="container-main py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-navy">Blog</h1>
        <p className="text-gray-500 mt-2">Expert insights on Miami pre-construction condos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="card group hover:shadow-lg transition-shadow"
          >
            <div className="h-48 bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center">
              <span className="text-gold-500 font-display text-4xl">{post.title[0]}</span>
            </div>
            <div className="p-5">
              {post.targetKeyword && (
                <span className="text-xs text-gold font-medium uppercase tracking-wider">
                  {post.targetKeyword}
                </span>
              )}
              <h2 className="font-display text-lg font-semibold text-navy mt-1 group-hover:text-gold transition-colors leading-tight">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-gray-500 text-sm mt-2 line-clamp-3">{post.excerpt}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>{post.author}</span>
                {post.publishedAt && (
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>Blog posts coming soon.</p>
        </div>
      )}
    </div>
  );
}
