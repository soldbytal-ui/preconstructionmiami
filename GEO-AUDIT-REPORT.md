# SEO and AI-search audit: preconstructionmiami.net

Audit date: November 20, 2026. Method: every URL in the sitemap (359) plus three extra pages was fetched from the live site and checked for status, title, description, canonical, headings, structured data, word count, image alt text and internal links. Scores are my judgement against that crawl, not a third-party tool's.

## Scores

| Area | Before | After fixes | Notes |
|---|---|---|---|
| Structured data | 70 | 88 | Developer pages had only breadcrumbs; area pages lacked a page-level type |
| Titles and descriptions | 72 | 90 | Stale counts and prices in descriptions; a few over-length titles |
| AI discoverability | 80 | 90 | llms.txt and crawler rules were already good; pages lacked plain stated facts |
| Content quality | 55 | 70 | 131 developer pages were thin; 143 listings still use template wording |
| Technical | 88 | 92 | All 362 URLs returned 200; canonicals consistent; www and http redirect correctly |
| Indexation | 85 | 92 | One empty area page and empty developer pages were indexable |

## What was already right

- Every sitemap URL returned 200. No broken pages, no redirect chains.
- Every page has one H1, a canonical URL and an Open Graph image.
- All 172 listings carry RealEstateListing, BreadcrumbList and FAQPage data.
- robots.txt allows the main AI crawlers; llms.txt and llms-full.txt exist and list every project.

## Issues found and what was done

### Fixed in this pass

1. **Area pages stated stale or unsourced numbers.** Descriptions said things like "Browse 24+ condos in Brickell" (there are 29) and "from $500K to $50M+". The pages also showed an "average price by unit type" table whose figures had no source. Titles, descriptions, the opening summary, a full comparison table and the questions on each area page are now generated from the live listings, so they cannot drift. The unsourced average-price table is removed.
2. **Area prose contained unsourced price claims and one outdated name.** Ten sentences such as "prices 40-50% below Miami Beach" were removed, and "AmericanAirlines Arena" is now "Kaseya Center".
3. **Developer pages were thin (median 85 words) with no organisation data.** Each now has a facts summary, a comparison table of its projects, questions answered from the data, and Organization, ItemList and FAQPage structured data. A single firm's page now also gathers the projects it builds with partners (Related Group goes from 3 projects to 19).
4. **Listing descriptions in search results could be stale.** They were read from stored text written months ago (Okan Tower still said 70 storeys after the listing was corrected to 72). Search descriptions are now built from the listing's own fields. Four listings whose body text disagreed with their own storey or unit count were corrected.
5. **Empty pages were indexable.** The Palm Beach area page has no projects; it is now excluded from search and from the sitemap until it has one.
6. **Smaller items.** Pre-construction 3D page had 71 words and no structured data (now has an explanation and WebApplication data); the neighborhoods index gained a comparison table and ItemList data; two titles over 60 characters were shortened; the account page pointed its canonical at the home page; robots.txt now names the search and answer crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Perplexity-User and others) explicitly; "150+" became "170+".

### Still open

1. **143 of 172 listings use template wording** ("one of South Florida's most sought-after neighborhoods", an "Investment Outlook" paragraph that reads as a promise). The facts are right but the prose is near-identical across listings, which search engines discount and AI engines will not quote. Recommended: rewrite them from each listing's facts, the way the newer listings are written.
2. **36 listings load photos from other websites** rather than our own storage, mostly broker sites. This is a sourcing and reliability problem more than an SEO one, but image search and link previews depend on it.
3. **No author or review signals on blog posts.** Posts have BlogPosting data but no named author with credentials. Needs a decision on whose name goes on them.
4. **About and Contact pages are short** (258 and 123 words) and say little about who runs the site. For trust signals they should name the operator and the licensed partners.
5. **Not measured here:** page speed (Core Web Vitals), actual Google index coverage and rankings. Those need Search Console access.
