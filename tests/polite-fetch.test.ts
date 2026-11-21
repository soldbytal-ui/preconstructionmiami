import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPoliteFetcher, parseRobots, robotsAllows } from '../src/lib/polite-fetch';

// A pretend website. Nothing here touches the network.
function site(robots: string | null, pages: Record<string, { status?: number; body: string }>) {
  const calls: string[] = [];
  const fetchImpl = (async (url: any) => {
    const u = new URL(String(url)); calls.push(u.pathname);
    if (u.pathname === '/robots.txt') return robots === null ? new Response('nope', { status: 404 }) : new Response(robots, { status: 200 });
    const p = pages[u.pathname];
    return p ? new Response(p.body, { status: p.status || 200 }) : new Response('missing', { status: 404 });
  }) as typeof fetch;
  let t = 0; const sleeps: number[] = [];
  return { calls, sleeps, opts: { fetchImpl, now: () => t, sleep: async (ms: number) => { sleeps.push(ms); t += ms; } } };
}

test('robots.txt: disallow-all means the page is never requested', async () => {
  const s = site('User-agent: *\nDisallow: /', { '/agendas': { body: 'x' } });
  const get = createPoliteFetcher(s.opts);
  assert.deepEqual(await get('https://agendas.example/agendas'), { ok: false, reason: 'robots-disallow' });
  assert.deepEqual(s.calls, ['/robots.txt']);
});

test('robots.txt: a listed path is skipped, others are read', async () => {
  const rules = parseRobots('User-agent: *\nDisallow: /Government/City-Commission/\nDisallow: /Sandbox/*');
  assert.equal(robotsAllows(rules, '/Government/City-Commission/agenda'), false);
  assert.equal(robotsAllows(rules, '/Government/Departments/DRC'), true);
});

test('waits between requests, and honours a longer Crawl-delay', async () => {
  const s = site('user-agent: *\nCrawl-delay: 60', { '/a': { body: 'A' }, '/b': { body: 'B' } });
  const get = createPoliteFetcher({ ...s.opts, minDelayMs: 5000 });
  await get('https://agendas.example/a'); await get('https://agendas.example/b');
  assert.deepEqual(s.sleeps, [60000, 60000]); // after robots.txt, and between the two pages
});

test('with no Crawl-delay, the gap is still several seconds', async () => {
  const s = site(null, { '/a': { body: 'A' }, '/b': { body: 'B' } });
  const get = createPoliteFetcher({ ...s.opts, minDelayMs: 5000 });
  await get('https://agendas.example/a'); await get('https://agendas.example/b');
  assert.deepEqual(s.sleeps, [5000, 5000]);
});

test('results are cached: the same page is not requested twice', async () => {
  const s = site(null, { '/a': { body: 'A' } });
  const get = createPoliteFetcher(s.opts);
  const first = await get('https://agendas.example/a'); const second = await get('https://agendas.example/a');
  assert.equal(first.ok && !first.fromCache, true); assert.equal(second.ok && second.fromCache, true);
  assert.deepEqual(s.calls, ['/robots.txt', '/a']);
});

test('a login wall, rate limit or CAPTCHA is treated as a refusal', async () => {
  const s = site(null, { '/login': { status: 403, body: 'no' }, '/busy': { status: 429, body: 'slow down' }, '/cap': { body: '<h1>Please complete the CAPTCHA</h1>' } });
  const get = createPoliteFetcher(s.opts);
  for (const p of ['/login', '/busy', '/cap']) { const r = await get('https://agendas.example' + p); assert.equal(r.ok === false && r.reason, 'blocked'); }
});
