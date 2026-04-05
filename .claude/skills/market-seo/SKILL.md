---
name: market-seo
description: Analyze Miami real estate market SEO — competitor keywords, local search terms, neighborhood targeting, and content gaps for pre-construction condos.
allowed-tools: Read Grep Glob Bash Agent WebFetch WebSearch
---

# Miami Real Estate Market SEO Analysis

Perform a market-focused SEO analysis for preconstructionmiami.net targeting the Miami pre-construction condo market.

## Analysis Steps

### 1. Keyword Coverage Audit
Scan all page content, titles, descriptions, and H1/H2 tags for coverage of key market terms:

**Primary keywords** (must appear on relevant pages):
- "pre-construction condos Miami"
- "new condos Miami" / "new construction Miami"
- "Miami condo developments"
- "pre-construction [neighborhood]" for each area (Brickell, Edgewater, Downtown, Sunny Isles, etc.)

**Long-tail keywords** (check content and blog coverage):
- "best pre-construction condos in Miami [year]"
- "[developer name] new projects"
- "Miami condo prices [year]"
- "pre-construction vs resale Miami"
- "Miami condo investment ROI"

### 2. Neighborhood Page Analysis
- Check each `/areas/[neighborhood]` page for:
  - Unique, substantial content (not just project listings)
  - Local keywords: "condos in [area]", "[area] real estate", "[area] new developments"
  - Neighborhood-specific stats and context
  - Internal links to relevant project pages

### 3. Developer Page Analysis
- Check each `/developers/[slug]` page for:
  - Developer-specific keywords: "[developer] Miami projects", "[developer] condos"
  - Portfolio completeness — are all known projects listed?
  - Bio/description quality for E-E-A-T signals

### 4. Content Gap Analysis
Search for Miami pre-construction topics and identify:
- Blog topics competitors cover that we don't
- High-volume keywords we're missing entirely
- Seasonal or trending queries (e.g., "Miami condo market 2026")
- FAQ-style content opportunities

### 5. Local SEO Signals
- Verify LocalBusiness schema has correct NAP (Name, Address, Phone)
- Check for Miami-specific geographic terms in content
- Evaluate Google Business Profile alignment (if applicable)
- Check for location pages vs area pages completeness

### 6. Competitor Benchmarking
Search for top Miami pre-construction sites and compare:
- Their content depth vs ours
- Features they have that we lack (calculators, comparison tools, etc.)
- Their structured data vs ours

## Output

Generate a prioritized action plan with:
- **Quick Wins**: Changes that can be made in code/content today
- **Content Calendar**: Blog posts and pages to create, ordered by impact
- **Keyword Map**: Which keywords should target which pages
- **Gap Report**: What competitors rank for that we don't cover

Output as `MARKET-SEO-REPORT.md`.
