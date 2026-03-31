export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Markdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || post.title,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!post) notFound();

  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .neq('id', post.id)
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: false })
    .limit(3);

  const articleSchema = generateArticleSchema(post);
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'Blog', url: 'https://preconstructionmiami.net/blog' },
    { name: post.title, url: `https://preconstructionmiami.net/blog/${post.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <article className="container-main py-10 max-w-4xl">
        <nav className="text-sm text-text-muted mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-accent-green transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-text-primary font-medium truncate">{post.title}</span>
        </nav>

        <header className="mb-10">
          {post.targetKeyword && (
            <span className="inline-block text-xs text-accent-green font-medium uppercase tracking-wider bg-accent-green/10 px-2 py-0.5 rounded">
              {post.targetKeyword}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mt-2 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-text-muted">
            <span>By {post.author}</span>
            {post.publishedAt && (
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-text-primary prose-p:text-text-muted prose-li:text-text-muted prose-strong:text-text-primary prose-a:text-accent-green prose-a:no-underline hover:prose-a:underline prose-blockquote:border-accent-green/30 prose-blockquote:text-text-muted prose-code:text-accent-green prose-hr:border-border">
          <Markdown
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith('/')) {
                  return <Link href={href}>{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
              },
            }}
          >
            {post.content}
          </Markdown>
        </div>

        {/* CTA */}
        <div className="mt-12 glass-panel p-8 text-center">
          <h3 className="text-2xl font-bold text-text-primary mb-3">Interested in Miami Pre-Construction?</h3>
          <p className="text-text-muted mb-6">Browse our curated selection of 200+ new developments across South Florida.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/new-condos" className="btn-primary">Browse Projects</Link>
            <Link href="/contact-us" className="btn-secondary">Contact Us</Link>
          </div>
        </div>

        {/* Related */}
        {(relatedPosts || []).length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedPosts || []).map((rp: any) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="card group p-5 hover:border-accent-green/30 transition-all">
                  <h3 className="font-semibold text-text-primary group-hover:text-accent-green transition-colors leading-tight">
                    {rp.title}
                  </h3>
                  {rp.publishedAt && (
                    <p className="text-xs text-text-muted/60 mt-2">
                      {new Date(rp.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
