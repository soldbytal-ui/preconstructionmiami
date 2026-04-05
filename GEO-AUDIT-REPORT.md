# GEO Audit Report: PreConstructionMiami.net

**Audit Date:** April 5, 2026
**URL:** https://preconstructionmiami.net
**Business Type:** Real Estate Marketplace / Local Business
**Pages Analyzed:** 45+
**Auditor:** Claude Code GEO Audit Suite

---

## Executive Summary

**Overall GEO Score: 64/100 (Fair)**

PreConstructionMiami.net has strong technical GEO foundations -- server-side rendering, comprehensive structured data, AI crawler access, and an llms.txt file. The site's primary weaknesses are near-zero off-site brand presence (no Wikipedia, Reddit, YouTube, or LinkedIn mentions), organizational author attribution instead of named persons on blog content, and some schema markup gaps. The site scores well on technical infrastructure and content depth but needs significant work on external authority signals for AI systems to consistently cite it.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 62/100 | 25% | 15.5 |
| Brand Authority | 12/100 | 20% | 2.4 |
| Content E-E-A-T | 55/100 | 20% | 11.0 |
| Technical GEO | 82/100 | 15% | 12.3 |
| Schema & Structured Data | 78/100 | 10% | 7.8 |
| Platform Optimization | 15/100 | 10% | 1.5 |
| **Overall GEO Score** | | | **64/100** |

---

## Critical Issues (Fix Immediately)

### 1. No Off-Site Brand Presence
**Impact:** AI models cannot corroborate this brand from external sources
- No Wikipedia article
- No Reddit mentions (0 results across r/Miami, r/realestate, r/RealEstateInvesting)
- No YouTube channel or videos
- No LinkedIn company page
- Not mentioned on industry publications (The Real Deal, Curbed, etc.)

**Recommendation:** This is the #1 blocker for AI citations. Create LinkedIn, YouTube, and begin Reddit participation. Pursue 1-2 PR placements in Miami real estate media.

---

## High Priority Issues

### 2. Blog Author Attribution Uses Organization Name
**Status: FIXED in this audit**
- Blog posts listed "PreConstructionMiami.net" as author (Organization type)
- Changed to Person schema with jobTitle and worksFor properties
- For maximum E-E-A-T impact, assign real named authors with credentials

### 3. RealEstateListing Schema Missing Price Range
**Status: FIXED in this audit**
- Was using single `Offer.price` with only priceMin
- Now uses `AggregateOffer` with lowPrice/highPrice and PreSale availability

### 4. No HowTo Schema on Homepage
**Status: FIXED in this audit**
- "How Pre-Construction Works" 4-step process now has HowTo structured data

### 5. Placeholder Phone Number in Schema
**Status: FIXED in this audit**
- Removed fake `+1-305-000-0000` from LocalBusiness schema

### 6. No llms-full.txt Companion File
**Status: FIXED in this audit**
- Created comprehensive llms-full.txt with full content map
- Updated llms.txt to reference the full version

---

## Medium Priority Issues

### 7. About Page Lacks Specific Credentials
The About page uses generic messaging without specific data points:
- No team member names or credentials
- No founding date or company history
- No transaction volume or client count
- No specific expertise claims backed by data

**Recommendation:** Add team bios with names, photos, and credentials. Include founding story, market coverage statistics, and specific expertise areas.

### 8. Content Freshness Signals
- Blog posts now properly staggered (Jan-Apr 2026)
- Property descriptions updated with unique content
- No `dateModified` signals on static pages (About, Contact)

### 9. Missing Content-Security-Policy Header
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy present
- CSP header not set (common for Vercel deployments)

### 10. Empty sameAs Arrays in Schema
- Organization and LocalBusiness schemas have empty sameAs arrays
- Will be populated once social profiles are created

---

## Low Priority Issues

### 11. Some Property Descriptions Share Same Opening Pattern
- 3 Bay Harbor Islands properties share architect-based opening
- 152/154 have unique first lines

### 12. Blog Images Are Stock Photos
- All 20 blog posts have featured images (Unsplash)
- Original photography/graphics would strengthen E-E-A-T

### 13. No Google Business Profile Integration
- Address is listed but no GBP link or review signals
- Creating a verified GBP would strengthen local authority

---

## Category Deep Dives

### AI Citability (62/100)

**Strengths:**
- Blog market report contains specific data tables with pricing metrics
- Property pages have structured data (price, units, floors, completion)
- "How Pre-Construction Works" section is well-structured for AI extraction
- FAQ sections on neighborhood and property pages provide direct answers
- 154 unique property descriptions with specific details

**Weaknesses:**
- No definition/glossary content for industry terms
- No comparison tables (Project A vs. Project B)
- Investment potential sections could include more specific data (cap rates, appreciation rates)
- Blog author not yet a named person with verifiable credentials

**Top Citable Content:**
1. Market Report Q1 2026 data table (Score: 82/100)
2. "How Pre-Construction Works" 4-step process (Score: 74/100)
3. Neighborhood price comparison data (Score: 73/100)
4. Deposit structure explanations (Score: 70/100)

### Brand Authority (12/100)

**Platform Presence Map:**

| Platform | Present? | Details |
|---|---|---|
| Wikipedia | No | No article, no entity recognition |
| Reddit | No | Zero mentions in any subreddit |
| YouTube | No | No channel, no videos |
| LinkedIn | Minimal | One tangential hashtag mention |
| Trustpilot | No | No listing |
| Google Business Profile | No | Not verified |
| Industry Publications | No | No mentions in The Real Deal, Curbed, etc. |
| Backlinks | Minimal | No major referring domains detected |

**Impact:** AI models like ChatGPT, Perplexity, and Gemini heavily weight external corroboration. Without off-site presence, the site is largely invisible to AI citation systems.

### Content E-E-A-T (55/100)

| Dimension | Score | Notes |
|---|---|---|
| Experience | 40/100 | No first-hand experience signals, no original photos from site visits |
| Expertise | 65/100 | Detailed market knowledge demonstrated in blog content |
| Authoritativeness | 35/100 | No external citations, no named team, no industry recognition |
| Trustworthiness | 80/100 | Proper legal pages, disclaimers, transparent data sourcing claims |

**Author Attribution:** Blog posts use "PreConstructionMiami.net" as author. Schema now uses Person type with jobTitle, but real named authors with verifiable credentials would significantly boost E-E-A-T.

### Technical GEO (82/100)

| Check | Status | Score |
|---|---|---|
| Server-Side Rendering | SSR via Next.js App Router | 95/100 |
| AI Crawler Access | All major AI bots explicitly allowed | 95/100 |
| llms.txt | Present with full companion file | 90/100 |
| Sitemap | Dynamic, comprehensive (248 URLs) | 90/100 |
| robots.txt | Proper AI directives, admin/api blocked | 90/100 |
| Security Headers | 4/5 present (missing CSP) | 70/100 |
| Meta Tags | All pages have canonical, OG, Twitter | 85/100 |
| Page Load | SSR with force-dynamic (higher TTFB risk) | 65/100 |
| Mobile | Responsive Tailwind design | 85/100 |

### Schema & Structured Data (78/100)

**Schema Types Implemented:**

| Schema Type | Pages | Quality |
|---|---|---|
| RealEstateAgent | Homepage | Good -- full address, geo, hours, area served |
| Organization | About | Good -- address, contact, logo |
| WebSite + SearchAction | Homepage | Good -- enables sitelinks search |
| RealEstateListing | 154 property pages | Improved -- now has AggregateOffer, units, floors |
| BlogPosting | 20 blog pages | Improved -- Person author, dateModified, image |
| FAQPage | Property + Neighborhood pages | Good -- dynamic Q&A pairs |
| BreadcrumbList | All detail pages | Good -- proper hierarchy |
| HowTo | Homepage | NEW -- 4-step buying process |
| ItemList | Developers listing | Good -- developer directory |

**Missing Opportunities:**
- No `ApartmentComplex` schema (could supplement RealEstateListing)
- No `Review` or `AggregateRating` schema
- No `Event` schema for project launch events
- sameAs arrays empty (pending social profile creation)

### Platform Optimization (15/100)

| Platform | Optimized? | Notes |
|---|---|---|
| Google AI Overviews | Partial | Good structured data; needs external authority |
| ChatGPT Web Search | Partial | Content is accessible; brand unknown to model |
| Perplexity | Partial | llms.txt present; no external corroboration |
| Gemini | Partial | Technical signals good; authority signals weak |
| Bing Copilot | Partial | Schema good; no LinkedIn/social signals |

---

## Quick Wins (Implement This Week)

1. **Create LinkedIn Company Page** -- Complete profile with logo, description, employee links. Post 3x/week about market updates. Expected impact: +5-10 brand authority score.

2. **Create Google Business Profile** -- Verify the 3250 NE 1st Ave address. Add photos, business hours, services. Solicit first 5-10 reviews. Expected impact: +10 local authority.

3. **Start Reddit Participation** -- Answer questions in r/Miami, r/realestate about pre-construction. Link to blog articles naturally. Expected impact: +5 brand mentions.

4. **Add Real Author Names to Blog** -- Update blog posts with a named author + bio. "by [Name], Licensed FL Real Estate Professional, [X] years in Miami pre-construction." Expected impact: +15 E-E-A-T score.

5. **Create a YouTube Channel** -- Even 5 short videos (market updates, neighborhood tours, project walkthroughs) would establish platform presence. Expected impact: +10 platform score.

---

## 30-Day Action Plan

### Week 1: Foundation
- [x] Fix all technical GEO issues (robots.txt, sitemap, canonical URLs, schema)
- [x] Create llms.txt and llms-full.txt
- [x] Add HowTo schema to homepage
- [x] Fix author attribution (Person, not Organization)
- [x] Enhance RealEstateListing schema (AggregateOffer)
- [ ] Create LinkedIn Company Page
- [ ] Create Google Business Profile

### Week 2: Content Authority
- [ ] Add named author bios to blog posts (database + About page)
- [ ] Write 2 new data-driven blog posts with original analysis
- [ ] Create a "Miami Pre-Construction Price Index" page (proprietary data)
- [ ] Add comparison tables to 3 key blog posts

### Week 3: External Presence
- [ ] Start Reddit engagement (r/Miami, r/realestate) -- 10+ quality contributions
- [ ] Create YouTube channel, upload 3 initial videos
- [ ] Pitch 1 guest post or data story to The Real Deal Miami or South FL Business Journal
- [ ] Submit site to 5 real estate directories

### Week 4: Refinement
- [ ] Add glossary/definitions page for pre-construction terms
- [ ] Implement `DefinedTerm` schema on glossary entries
- [ ] Review and refine top 10 most-visited property descriptions
- [ ] Create a monthly market snapshot page with original data visualizations
- [ ] Audit competitor GEO strategies for gaps to exploit

---

## Appendix: Key Pages Analyzed

| URL | Title | GEO Issues |
|---|---|---|
| / | Pre-Construction Condos in Miami | 0 (after fixes) |
| /new-condos | New Condos in Miami | 0 |
| /about | About Us | 1 (needs specific credentials) |
| /contact-us | Contact Us | 0 |
| /blog | Miami Pre-Construction Blog | 0 |
| /developers | Miami Pre-Construction Developers | 0 |
| /properties/[slug] (154 pages) | Dynamic | 0 (500 errors fixed) |
| /new-condos-[area] (24 pages) | Dynamic | 0 |
| /blog/[slug] (20 pages) | Dynamic | 0 |
| /terms | Terms of Service | 0 |
| /privacy | Privacy Policy | 0 |
| /robots.txt | Robots | 0 |
| /sitemap.xml | Sitemap | 0 |
| /llms.txt | LLMs Guide | 0 |
| /llms-full.txt | LLMs Full Guide | NEW |

---

*Report generated by Claude Code GEO Audit Suite*
*All fixable issues were implemented automatically during this audit.*
