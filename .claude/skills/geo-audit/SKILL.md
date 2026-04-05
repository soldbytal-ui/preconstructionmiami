---
name: geo-audit
description: Run a full GEO (Generative Engine Optimization) and SEO audit on the site. Checks structured data, content quality, AI discoverability, and search rankings.
allowed-tools: Read Grep Glob Bash Agent WebFetch WebSearch
---

# Full GEO & SEO Audit

Run a comprehensive GEO (Generative Engine Optimization) and SEO audit for preconstructionmiami.net.

## Audit Steps

### 1. Structured Data & Schema Markup
- Read `src/lib/seo.ts` and all page files for JSON-LD schema
- Verify every page type has proper schema: LocalBusiness, RealEstateListing, BlogPosting, BreadcrumbList, ItemList, Organization
- Check schema against Google's requirements (required vs recommended fields)
- Validate AggregateOffer, GeoCoordinates, and other nested schemas

### 2. Meta Tags & Open Graph
- Audit every page for: title (under 60 chars), meta description (under 160 chars), canonical URL, OG tags, Twitter cards
- Check for duplicate titles or descriptions across pages
- Verify all images have alt text

### 3. AI Discoverability (GEO-specific)
- Check `llms.txt` and `llms-full.txt` exist and are comprehensive
- Check `robots.ts` for AI crawler rules (GPTBot, ClaudeBot, PerplexityBot, etc.)
- Evaluate content for AI citation-worthiness: statistics, authoritative claims, structured answers
- Check if content uses "question + direct answer" patterns that AI engines prefer

### 4. Content Quality & E-E-A-T
- Evaluate author/expertise signals on blog posts
- Check for thin content pages (under 300 words)
- Verify internal linking density between related pages
- Check for content freshness signals (dates, "updated" timestamps)

### 5. Technical SEO
- Verify `sitemap.xml` includes all dynamic routes
- Check for proper canonical URLs (no trailing slashes, consistent scheme)
- Verify `robots.txt` / `robots.ts` is correct
- Check page load: are images optimized? Is there excessive JS?

### 6. Indexation & Coverage
- Count total indexable pages (projects, developers, areas, blog posts)
- Identify orphaned pages (no internal links pointing to them)
- Check for soft 404s or pages returning errors

## Output Format

Generate a markdown report with:
- **Score**: 0-100 for each category
- **Issues Found**: Prioritized list (critical, warning, info)
- **Action Items**: Specific code changes needed with file paths and line numbers
- **Comparison**: Before/after for any fixes already in place

Save the report to `GEO-AUDIT-REPORT.md` in the project root.
