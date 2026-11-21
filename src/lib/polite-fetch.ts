// Reads public pages the way a considerate visitor would: checks robots.txt first, waits
// between requests to the same site, and caches what it gets. No imports: shared with tests.

export type PoliteOptions = { userAgent?: string; minDelayMs?: number; cacheMs?: number; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void>; now?: () => number };
export type PoliteResult = { ok: true; status: number; text: string; fromCache: boolean } | { ok: false; reason: 'robots-disallow' | 'http-error' | 'network' | 'blocked'; status?: number };

export const BOT_UA = 'PreConstructionMiamiBot/1.0 (+https://preconstructionmiami.net/contact; reads public meeting agendas once a day)';

type Rules = { disallow: string[]; allow: string[]; crawlDelayMs: number };

/** The rules in a robots.txt that apply to us (our own group if named, else "*"). */
export function parseRobots(txt: string, ua = 'preconstructionmiamibot'): Rules {
  const groups: { agents: string[]; rules: Rules }[] = [];
  let cur: { agents: string[]; rules: Rules } | null = null; let lastWasAgent = false;
  for (const line of txt.split(/\r?\n/)) {
    const m = line.replace(/#.*/, '').match(/^\s*([A-Za-z-]+)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2];
    if (k === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: { disallow: [], allow: [], crawlDelayMs: 0 } }; groups.push(cur); }
      cur.agents.push(v.toLowerCase()); lastWasAgent = true; continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (k === 'disallow' && v) cur.rules.disallow.push(v);
    else if (k === 'allow' && v) cur.rules.allow.push(v);
    else if (k === 'crawl-delay' && Number(v) > 0) cur.rules.crawlDelayMs = Number(v) * 1000;
  }
  const mine = groups.find((g) => g.agents.some((a) => a !== '*' && ua.includes(a))) || groups.find((g) => g.agents.includes('*'));
  return mine ? mine.rules : { disallow: [], allow: [], crawlDelayMs: 0 };
}

const rx = (p: string) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'));
export function robotsAllows(rules: Rules, path: string): boolean {
  const longest = (list: string[]) => list.filter((p) => rx(p).test(path)).reduce((n, p) => Math.max(n, p.length), -1);
  const d = longest(rules.disallow); const a = longest(rules.allow);
  return d < 0 || a >= d;
}

export function createPoliteFetcher(opts: PoliteOptions = {}) {
  const f = opts.fetchImpl || fetch;
  const ua = opts.userAgent || BOT_UA;
  const minDelay = opts.minDelayMs ?? 5000;
  const cacheMs = opts.cacheMs ?? 12 * 3600 * 1000;
  const sleep = opts.sleep || ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now || Date.now;
  const robots = new Map<string, Rules>();
  const lastHit = new Map<string, number>();
  const cache = new Map<string, { at: number; status: number; text: string }>();

  async function wait(host: string, delay: number) {
    const last = lastHit.get(host);
    if (last !== undefined) { const due = last + delay - now(); if (due > 0) await sleep(due); }
    lastHit.set(host, now());
  }

  async function rulesFor(u: URL): Promise<Rules> {
    if (robots.has(u.host)) return robots.get(u.host)!;
    let rules: Rules = { disallow: [], allow: [], crawlDelayMs: 0 };
    try {
      await wait(u.host, minDelay);
      const r = await f(`${u.protocol}//${u.host}/robots.txt`, { headers: { 'User-Agent': ua } });
      if (r.ok) rules = parseRobots(await r.text());
      else if (r.status === 401 || r.status === 403) rules = { disallow: ['/'], allow: [], crawlDelayMs: 0 }; // told to keep out
    } catch { /* no robots.txt reachable: treated as no rules */ }
    robots.set(u.host, rules);
    return rules;
  }

  return async function politeGet(url: string): Promise<PoliteResult> {
    const u = new URL(url);
    const hit = cache.get(url);
    if (hit && now() - hit.at < cacheMs) return { ok: true, status: hit.status, text: hit.text, fromCache: true };
    const rules = await rulesFor(u);
    if (!robotsAllows(rules, u.pathname + u.search)) return { ok: false, reason: 'robots-disallow' };
    await wait(u.host, Math.max(minDelay, rules.crawlDelayMs));
    try {
      const r = await f(url, { headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml,application/xml,application/json' } });
      // A login wall or CAPTCHA is a "no": never worked around
      if (r.status === 401 || r.status === 403 || r.status === 429) return { ok: false, reason: 'blocked', status: r.status };
      if (!r.ok) return { ok: false, reason: 'http-error', status: r.status };
      const text = await r.text();
      if (/captcha|are you a robot|verify you are human/i.test(text.slice(0, 4000))) return { ok: false, reason: 'blocked', status: r.status };
      cache.set(url, { at: now(), status: r.status, text });
      return { ok: true, status: r.status, text, fromCache: false };
    } catch { return { ok: false, reason: 'network' }; }
  };
}
