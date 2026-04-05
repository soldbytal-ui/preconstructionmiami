---
name: geo
description: Quick GEO (Generative Engine Optimization) check — verify AI discoverability, fix issues, and improve content for AI search engines like ChatGPT, Perplexity, and Claude.
allowed-tools: Read Grep Glob Bash Edit Write Agent WebFetch
---

# Quick GEO Check & Fix

Run a focused GEO (Generative Engine Optimization) check on $ARGUMENTS and apply fixes.

If no argument is provided, check the entire site's GEO readiness.

## What to Check

### 1. AI Crawler Access
```!
cat src/app/robots.ts 2>/dev/null | head -40
```

Verify these AI crawlers are allowed:
- GPTBot, ChatGPT-User (OpenAI)
- ClaudeBot, anthropic-ai (Anthropic)
- PerplexityBot
- Google-Extended
- Bytespider (TikTok)

### 2. LLMs.txt Files
```!
ls -la public/llms.txt public/llms-full.txt 2>/dev/null
```

- `llms.txt` should be a concise site summary (under 500 words)
- `llms-full.txt` should be comprehensive (2000+ words) with all key data
- Both must be up-to-date with current projects and developers

### 3. Citation-Worthy Content
Check pages for patterns AI engines prefer to cite:
- Direct answers to questions (not just lists)
- Specific statistics and numbers
- "According to..." or authoritative framing
- Structured comparisons and summaries
- FAQ sections with clear Q&A format

### 4. Structured Data Completeness
Verify JSON-LD schema covers all entity types so AI can parse our data:
- Projects: RealEstateListing with price, location, features
- Developers: Organization with portfolio
- Blog: BlogPosting with author, date, expertise signals
- Site: LocalBusiness, BreadcrumbList

## Action

For each issue found:
1. Describe what's wrong
2. Fix it immediately if it's a code/content change
3. For data issues (Supabase), describe what needs updating

Keep output concise — this is a quick check, not a full audit. Use `/geo-audit` for the comprehensive version.
