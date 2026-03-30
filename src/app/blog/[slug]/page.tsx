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
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gold">Blog</Link>
          <span>/</span>
          <span className="text-navy font-medium truncate">{post.title}</span>
        </nav>

        <header className="mb-10">
          {post.targetKeyword && (
            <span className="text-xs text-gold font-medium uppercase tracking-wider">
              {post.targetKeyword}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-navy mt-2 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>By {post.author}</span>
            {post.publishedAt && (
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>
        </header>

        <div className="prose prose-gray prose-lg max-w-none prose-headings:font-display prose-headings:text-navy prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-navy">
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
        <div className="mt-12 bg-navy rounded-xl p-8 text-center text-white">
          <h3 className="font-display text-2xl font-bold mb-3">Interested in Miami Pre-Construction?</h3>
          <p className="text-gray-300 mb-6">Browse our curated selection of 200+ new developments across South Florida.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pre-construction" className="btn-gold">Browse Projects</Link>
            <Link href="/contact" className="btn-outline border-gold text-gold hover:bg-gold hover:text-navy">Contact Us</Link>
          </div>
        </div>

        {/* Related */}
        {(relatedPosts || []).length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedPosts || []).map((rp: any) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="card group p-5 hover:shadow-lg transition-shadow">
                  <h3 className="font-display font-semibold text-navy group-hover:text-gold transition-colors leading-tight">
                    {rp.title}
                  </h3>
                  {rp.publishedAt && (
                    <p className="text-xs text-gray-400 mt-2">
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
