import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      // Search and answer crawlers named explicitly, so there is no doubt they are welcome
      ...['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'Perplexity-User', 'Applebot-Extended', 'meta-externalagent', 'Bingbot', 'Googlebot'].map((userAgent) => ({ userAgent, allow: '/', disallow: ['/admin', '/api/'] })),
    ],
    sitemap: 'https://preconstructionmiami.net/sitemap.xml',
  };
}
