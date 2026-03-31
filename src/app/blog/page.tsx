export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Miami Pre-Construction Blog | Market Reports, Guides & Tips',
  description: 'Expert insights on Miami pre-construction condos. Buyer guides, market reports, neighborhood comparisons, investment analysis, and more.',
};

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: false });

  return (
    <div className="container-main py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Blog</h1>
        <p className="text-text-muted mt-2">Expert insights on Miami pre-construction condos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(posts || []).map((post: any) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="glass-panel group hover:border-accent-green/30 transition-all"
          >
            <div className="h-48 bg-gradient-to-br from-surface2 to-surface flex items-center justify-center rounded-t-2xl">
              <span className="text-accent-green/40 text-5xl font-light">{post.title[0]}</span>
            </div>
            <div className="p-5">
              {post.targetKeyword && (
                <span className="inline-block text-xs text-accent-green font-medium uppercase tracking-wider bg-accent-green/10 px-2 py-0.5 rounded">
                  {post.targetKeyword}
                </span>
              )}
              <h2 className="text-lg font-semibold text-text-primary mt-2 group-hover:text-accent-green transition-colors leading-tight">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-text-muted text-sm mt-2 line-clamp-3">{post.excerpt}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-text-muted/60">
                <span>{post.author}</span>
                {post.publishedAt && (
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {(!posts || posts.length === 0) && (
        <div className="text-center py-20 text-text-muted">
          <p>Blog posts coming soon.</p>
        </div>
      )}
    </div>
  );
}
