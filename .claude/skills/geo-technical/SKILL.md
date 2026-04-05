---
name: geo-technical
description: Deep technical GEO/SEO audit — structured data validation, schema.org compliance, Core Web Vitals, rendering, and crawlability for AI and traditional search engines.
allowed-tools: Read Grep Glob Bash Agent WebFetch WebSearch Edit Write
---

# Technical GEO/SEO Audit

Run a deep technical audit of preconstructionmiami.net focusing on structured data, rendering, and crawlability for both traditional search engines and AI systems.

## Audit Areas

### 1. Schema.org Validation
Read `src/lib/seo.ts` and every page that generates JSON-LD:

```!
grep -rn "application/ld+json" src/app/ --include="*.tsx" | head -30
```

For each schema instance, validate:
- **Required fields** per schema.org spec are present
- **@type** is the most specific applicable type
- **Nested objects** use proper @type (e.g., PostalAddress, GeoCoordinates, AggregateOffer)
- **URLs** are absolute, not relative
- **Dates** are in ISO 8601 format
- **Prices** use proper currency format with priceCurrency
- No null/undefined values are serialized into JSON-LD

### 2. Rendering & Hydration
- Verify pages use Server Components (not client-side rendering) for SEO content
- Check that `force-dynamic` is set where needed for fresh data
- Ensure no content is hidden behind client-side JavaScript
- Verify meta tags are in the initial HTML response (not injected client-side)

### 3. Crawl Budget & URL Structure
- Check for URL parameter pollution
- Verify canonical URLs are consistent (no www vs non-www, http vs https)
- Look for redirect chains (301 → 301 → 200)
- Check for duplicate content across URL variants
- Verify sitemap completeness:

```!
grep -c "url:" src/app/sitemap.ts 2>/dev/null || echo "Check sitemap"
```

### 4. Response Headers & Performance
Read `next.config.js` / `next.config.ts` for:
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Cache-Control headers for static assets
- Content-Security-Policy
- Image optimization settings

### 5. Structured Data for AI Parsing
Beyond schema.org, check for:
- **Semantic HTML**: proper heading hierarchy (H1 → H2 → H3, no skips)
- **Data tables**: pricing, features, comparisons in parseable format
- **Lists and enumerations**: amenities, neighborhoods in `<ul>/<ol>` not just comma-separated text
- **Microdata or RDFa**: any additional markup beyond JSON-LD

### 6. Error Handling & Edge Cases
- Check all Supabase queries have null/error handling
- Verify `notFound()` is called for missing entities
- Test empty states: what if a developer has 0 projects? What if a neighborhood has no listings?
- Check for `Math.min(...[])` = Infinity or `Math.max(...[])` = -Infinity patterns

### 7. International & Alternate Signals
- Check for `hreflang` tags if applicable
- Verify `lang="en"` is set on `<html>`
- Check for proper UTF-8 encoding declaration

## Output

For each issue:
- **Severity**: Critical (breaks indexing), Warning (hurts ranking), Info (best practice)
- **File**: Exact path and line number
- **Fix**: Code diff or specific instruction

Apply critical fixes immediately. List warnings and info items for review.

Save findings to `GEO-TECHNICAL-REPORT.md`.
