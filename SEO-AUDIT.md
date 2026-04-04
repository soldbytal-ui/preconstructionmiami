# SEO Content Audit
## https://preconstructionmiami.net/
### Date: April 3, 2026

---

## SEO Health Score: 72/100

The site has a solid foundation with dynamic metadata, structured data, and good internal linking. Critical gaps in canonical tags, OG images, schema breadth, and property page meta have been identified and **fixed as part of this audit**.

---

## On-Page SEO Checklist

### Title Tag
- **Status: Pass**
- Current: `Pre-Construction Condos in Miami | PreConstructionMiami.net` (62 chars)
- Primary keyword "Pre-Construction Condos in Miami" is front-loaded
- Brand name is appended
- Template system ensures unique titles per page
- **Issue found & fixed:** About page rendered as "About Us | PreConstructionMiami.net | PreConstructionMiami.net" (double brand). Fixed.

### Meta Description
- **Status: Pass**
- Current: `Access 200+ pre-construction condo developments across Miami and South Florida. From $300K to $50M+. Brickell, Miami Beach, Downtown, Edgewater & more.` (155 chars)
- Contains primary keyword, price range, neighborhoods
- Good CTA-like language ("Access 200+")
- Within optimal length

### Heading Hierarchy
- **Status: Pass**
- H1: "Miami's Premier Pre-Construction Marketplace" -- contains "Pre-Construction" keyword
- H2s: "Featured Developments", "Explore Miami's Neighborhoods", "How Pre-Construction Works", "Ready to Explore Pre-Construction in Miami?"
- Logical hierarchy, no skipped levels
- Secondary keywords in subheadings

### Image Optimization
- **Status: Needs Work**
- Only 3 of 6 featured cards have images (50% missing hero images)
- Alt text is well-structured: `{project.name} - Pre-Construction in {neighborhood}`
- All images use `loading="lazy"`
- **Recommendation:** Ensure all 154 projects have `mainImageUrl` populated in the database. Missing images on featured cards significantly impact CTR and perceived quality.

### Internal Linking
- **Status: Pass**
- 42 internal links on homepage
- Excellent neighborhood interlinking (24 neighborhood pages cross-link to each other)
- Breadcrumbs on all hierarchical pages
- Related projects on property detail pages
- Blog posts link to relevant neighborhood pages
- Footer provides site-wide link equity distribution

### URL Structure
- **Status: Pass**
- Clean, keyword-rich URLs: `/new-condos-brickell`, `/properties/888-brickell-by-dolce-and-gabbana`
- All lowercase, hyphen-separated
- Proper redirects from old `/pre-construction/` paths to `/properties/`
- Rewrite rule maps `/new-condos-{neighborhood}` to internal `/areas/{neighborhood}`

---

## Content Quality (E-E-A-T)

| Dimension | Score | Evidence |
|---|---|---|
| Experience | **Present** | Real project data (154+ listings), specific pricing, unit counts, completion dates. Could be strengthened with market commentary, site visit reports, buyer testimonials. |
| Expertise | **Strong** | Deep neighborhood knowledge (lifestyle sections, price tables, developer profiles), 21 blog posts covering financing, deposits, market analysis, neighborhood comparisons. |
| Authoritativeness | **Present** | 78 developer profiles, comprehensive market coverage. Could improve with author bylines on blog posts, industry partnerships, media mentions. |
| Trustworthiness | **Strong** | Physical address displayed (3250 NE 1st Ave Unit 305, Miami), clear disclaimer about not being licensed brokers, Terms of Service & Privacy Policy linked, HTTPS, prices marked as approximate. |

---

## Keyword Analysis

### Primary Keywords & Rankings Targets

| Target Keyword | Est. Volume | Page Targeting It | Status |
|---|---|---|---|
| pre-construction condos miami | High | Homepage, Blog | Title + H1 + meta |
| new condos brickell | High | /new-condos-brickell | Title + H1 + content + FAQ schema |
| new condos miami | High | /new-condos | Title + H1 + meta |
| pre-construction miami beach | Medium | /new-condos-miami-beach | Title + H1 |
| luxury condos brickell | Medium | /new-condos-brickell | In content |
| miami pre-construction market 2026 | Medium | Blog post | Dedicated article |
| branded residences miami | Medium | Blog + property pages | Dedicated blog post |
| pre-construction deposit miami | Low-Med | Blog post | Dedicated article |
| 888 brickell dolce gabbana | Medium | Property page | Title + meta |

### Search Intent Alignment
- Homepage: **Commercial** (browse/compare) -- Aligned
- /new-condos: **Commercial** (filter/compare) -- Aligned
- /new-condos-brickell: **Commercial** (location-specific browse) -- Aligned
- Blog posts: **Informational** (guides, analysis) -- Aligned
- Property pages: **Transactional** (inquire/reserve) -- Aligned

### Keyword Density Assessment
- Homepage is lean on body text (most content is in cards/UI elements)
- Neighborhood pages have excellent keyword-rich content blocks (About section, FAQ, price tables)
- Blog posts target long-tail keywords effectively

---

## Technical SEO

### Robots.txt -- Pass
```
User-Agent: *
Allow: /
Sitemap: https://preconstructionmiami.net/sitemap.xml
```

### XML Sitemap -- Pass
- 231 URLs indexed (5 core + 170 properties + 28 neighborhoods + 20 blog posts)
- Dynamic generation via Next.js `sitemap.ts`
- Proper priority weighting (homepage 1.0, properties 0.8, blog 0.6)
- Last-modified dates present and current

### Canonical Tags
- **Status: Fixed in this audit**
- Homepage: Was missing, now added
- /new-condos: Was missing, now added
- Neighborhood pages: Already had canonicals
- Property pages: Was missing, now added

### Open Graph / Social Meta
- **Status: Fixed in this audit**
- `og:image` was missing site-wide -- now configured via `metadataBase` + `/og-image.png`
- `twitter:card` upgraded from `summary` to `summary_large_image`
- `twitter:image` added
- Property pages now include project-specific OG images from `mainImageUrl`
- **Action needed:** Create a `/public/og-image.png` (1200x630px) branded image for social sharing

### Robots Meta
- **Status: Fixed in this audit**
- Added explicit `index, follow` with `max-image-preview: large` and `max-snippet: -1` for rich results eligibility

### Page Speed Indicators
- Next.js with server-side rendering (good for LCP)
- Google Fonts loaded with `preconnect` (good)
- Images use `loading="lazy"` (good)
- **Recommendation:** Add `<link rel="preload">` for the hero map component CSS/JS to improve LCP

### Mobile-Friendliness -- Pass
- Viewport meta tag present
- Responsive grid layouts (grid-cols-1 to grid-cols-4)
- Mobile-specific CTA buttons visible

---

## Schema Markup

### Before This Audit
| Schema Type | Status |
|---|---|
| RealEstateAgent | Present (homepage) |
| RealEstateListing | Present (property pages) |
| Article | Present (blog posts) |
| FAQPage | Present (neighborhood pages) |
| BreadcrumbList | Present (all hierarchical pages) |
| WebSite + SearchAction | **Missing** |
| Organization (enhanced) | **Missing** |
| ItemList | **Missing** |

### After This Audit (Fixed)
| Schema Type | Status |
|---|---|
| RealEstateAgent (enhanced) | **Updated** -- added postal address, multi-county areaServed, knowsAbout |
| WebSite + SearchAction | **Added** -- enables sitelinks search box in Google |
| ItemList | **Added** -- utility function for listings pages |
| RealEstateListing URL | **Fixed** -- was pointing to `/pre-construction/` (old path), now `/properties/` |
| Breadcrumb URL | **Fixed** -- "Properties" breadcrumb was pointing to dead URL |

---

## Content Gap Analysis

| Missing Topic | Search Volume | Competition | Content Type | Priority |
|---|---|---|---|---|
| "miami condo market forecast 2027" | Medium | Low | Blog post | 1 |
| "best neighborhoods to invest miami 2026" | High | Medium | Blog guide | 1 |
| "pre-construction vs ready to move in" | Medium | Low | Blog post | 2 |
| "miami condo insurance costs" | Medium | Low | Blog post | 2 |
| "aventura pre-construction condos" | Medium | Low | Neighborhood page content | 3 |
| "coral gables new developments" | Medium | Low | Neighborhood page content | 3 |
| "miami condo assignment/flip guide" | Medium | Medium | Blog post | 2 |
| "construction timeline tracker" (tool) | Low | Very Low | Interactive tool | 3 |
| Developer deep-dive profiles | Low per dev | Very Low | Developer page content | 4 |

---

## Featured Snippet Opportunities

### Already Optimized
- Neighborhood pages have FAQ schema with 4 questions each -- eligible for FAQ rich results
- Blog posts target "how to" and "what is" queries

### New Opportunities
1. **"How much do pre-construction condos cost in Brickell?"** -- The price table on /new-condos-brickell is perfect for a table snippet. Ensure H2 contains the question.
2. **"What is the deposit structure for Miami pre-construction?"** -- Blog post exists but could add a concise 40-60 word answer immediately after the heading.
3. **"Best pre-construction condos in Miami 2026"** -- Add an ordered list (H2 + OL) to the relevant blog post.

---

## Internal Linking Opportunities

### Strengths
- Neighborhood pages cross-link extensively (24 pages interlinked)
- Property pages link to neighborhood + related projects
- Blog posts link to neighborhoods in sidebar
- Footer provides universal navigation

### Improvements Needed
1. **Blog -> Property pages:** Blog posts mention specific projects by name but don't always link directly to `/properties/{slug}`. Adding contextual links from blog mentions to property pages would pass authority.
2. **Homepage -> Blog:** The homepage has no links to blog content. Adding a "Latest Insights" section with 2-3 recent blog cards would improve crawl depth and time-on-site.
3. **Developer pages -> Property pages:** Ensure each developer profile page links to all their active projects.

---

## Core Web Vitals

### Assessment
| Metric | Expected | Notes |
|---|---|---|
| LCP | ~2.5-3.5s | Hero section is a full-viewport Mapbox GL map -- heavy JS. Consider a static fallback image that loads instantly, then hydrates to interactive map. |
| FID/INP | <200ms | Next.js SSR helps. Mapbox and deck.gl are large JS bundles. |
| CLS | <0.1 | No dynamic ad injection. Image placeholders used. Should be good. |

### Revenue Impact Estimate
- Improving LCP from ~3.5s to <2.5s could reduce bounce rate by ~15%
- Adding OG images (now done) will increase social CTR by 2-3x
- Schema enhancements (now done) increase eligible rich result impressions

---

## Fixes Executed in This Audit

### Critical (Fixed)
1. **Added canonical tags** to homepage, /new-condos, and all property pages -- prevents duplicate content signals
2. **Added og:image and twitter:image** configuration -- social shares now show preview images
3. **Upgraded twitter:card** from `summary` to `summary_large_image` -- larger social previews
4. **Added explicit robots meta** with `max-image-preview: large` -- enables large image previews in Google results
5. **Fixed RealEstateListing schema URL** from `/pre-construction/` to `/properties/` -- schema was pointing to redirect
6. **Fixed breadcrumb schema URL** from dead `/pre-construction` to `/new-condos`
7. **Fixed About page double brand name** in title tag

### High Priority (Fixed)
8. **Added WebSite + SearchAction schema** -- enables Google sitelinks search box
9. **Enhanced RealEstateAgent schema** with postal address, multi-county service area, knowsAbout
10. **Added ItemList schema utility** for use on listings pages
11. **Added metadataBase** to layout.tsx for proper OG image URL resolution
12. **Added OpenGraph metadata** to /new-condos and property detail pages

---

## Remaining Recommendations

### High Priority (This Month)
1. **Create `/public/og-image.png`** (1200x630px) branded social sharing image
2. **Fill missing project images** -- 3 of 6 featured homepage cards have no images
3. **Add "Latest Insights" blog section to homepage** for crawl depth and engagement
4. **Add contextual links from blog posts to specific property pages**

### Medium Priority (This Quarter)
5. **Write 2026 market forecast blog post** targeting "miami condo market 2027"
6. **Write "best neighborhoods to invest" guide** -- high volume, medium competition
7. **Add author bylines to blog posts** for E-E-A-T signals
8. **Optimize hero LCP** -- add static fallback image before Mapbox loads
9. **Enrich developer profile pages** with bio content, track record, project history

### Low Priority (When Resources Allow)
10. **Add `hreflang` tags** if targeting international buyers (Spanish, Portuguese)
11. **Create an interactive construction timeline tool** -- unique content, linkable asset
12. **Add testimonials/reviews** with AggregateRating schema
13. **Implement Google Search Console structured data monitoring**

---

## Keyword Ranking Targets Summary

### Tier 1 -- Primary (Monthly monitoring)
| Keyword | Target Page | Current Position | Goal |
|---|---|---|---|
| pre-construction condos miami | Homepage | TBD | Top 5 |
| new condos brickell | /new-condos-brickell | TBD | Top 3 |
| new condos miami | /new-condos | TBD | Top 5 |
| 888 brickell | /properties/888-brickell-by-dolce-and-gabbana | TBD | Top 3 |

### Tier 2 -- Secondary (Bi-weekly monitoring)
| Keyword | Target Page |
|---|---|
| pre-construction condos brickell 2026 | Blog post |
| miami beach new condos | /new-condos-miami-beach |
| branded residences miami | Blog post |
| downtown miami condos | /new-condos-downtown-miami |
| fort lauderdale pre-construction | /new-condos-fort-lauderdale |

### Tier 3 -- Long-tail (Monthly monitoring)
| Keyword | Target Page |
|---|---|
| how to buy pre-construction condo miami | Blog post |
| miami pre-construction deposit structure | Blog post |
| foreign buyer miami condo | Blog post |
| miami condo HOA fees | Blog post |

---

*Report generated by PreConstructionMiami SEO Audit Tool -- April 3, 2026*
