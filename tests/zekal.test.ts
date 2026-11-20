import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { postLeadToZekal, postUnsubscribeToZekal, comingSoonProblem, buildZekalPayload, CONSENT_WORDING, ZEKAL_TENANT } from '../src/lib/zekal';

// A stand-in for Zekal's inbound endpoint. People and projects here are fictional.
function fakeZekal(status = 201) {
  const got: { headers: http.IncomingHttpHeaders; body: any; path?: string }[] = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => { got.push({ headers: req.headers, body: JSON.parse(raw || '{}'), path: req.url }); res.writeHead(status, { 'Content-Type': 'application/json' }); res.end('{"ok":true}'); });
  });
  return new Promise<{ url: string; got: typeof got; close: () => void }>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/inbound/leads`, got, close: () => server.close() })));
}

const lead = {
  name: 'Alex Example', email: 'Alex.Example@example.com', source: 'coming-soon', projectId: 'demo-harbourline', projectName: 'Harbourline Tower (example)',
  consent: { email: true, at: '2026-11-20T12:00:00.000Z', wording: CONSENT_WORDING },
};

test('a coming-soon lead is posted to Zekal with the tenant, source, project id and consent', async () => {
  const z = await fakeZekal();
  const result = await postLeadToZekal(lead, { url: z.url, apiKey: 'test-key', tenant: ZEKAL_TENANT });
  z.close();
  assert.deepEqual(result, { sent: true, status: 201 });
  assert.equal(z.got.length, 1);
  const { headers, body, path } = z.got[0];
  assert.equal(path, '/inbound/leads');
  assert.equal(headers.authorization, 'Bearer test-key');
  assert.equal(headers['content-type'], 'application/json');
  assert.equal(body.tenant, 'Preconstruction Miami');
  assert.equal(body.source, 'coming-soon');
  assert.equal(body.project_id, 'demo-harbourline');
  assert.equal(body.contact.email, 'alex.example@example.com');
  assert.equal(body.consent.email_opt_in, true);
  assert.equal(body.consent.wording, CONSENT_WORDING);
});

test('an ordinary inquiry is posted too, with no consent recorded', async () => {
  const z = await fakeZekal();
  await postLeadToZekal({ name: 'Sam Sample', email: 'sam@example.com', source: 'inquiry', phone: '305-555-0100' }, { url: z.url });
  z.close();
  assert.equal(z.got[0].body.source, 'inquiry');
  assert.equal(z.got[0].body.consent, null);
  assert.equal(z.got[0].headers.authorization, undefined);
});

test('a Zekal failure is reported, not thrown', async () => {
  const z = await fakeZekal(500);
  assert.deepEqual(await postLeadToZekal(lead, { url: z.url }), { sent: false, status: 500, reason: 'rejected' });
  z.close();
  assert.deepEqual(await postLeadToZekal(lead, { url: 'http://127.0.0.1:9/none' }), { sent: false, reason: 'network' });
  assert.deepEqual(await postLeadToZekal(lead, {}), { sent: false, reason: 'not-configured' });
});

test('coming-soon sign-ups need a project and a ticked opt-in box', () => {
  assert.equal(comingSoonProblem({ source: 'coming-soon', projectId: 'demo-harbourline', consent: true }), null);
  assert.match(comingSoonProblem({ source: 'coming-soon', projectId: 'demo-harbourline' }) || '', /tick the box/i);
  assert.match(comingSoonProblem({ source: 'coming-soon', projectId: 'demo-harbourline', consent: false }) || '', /tick the box/i);
  assert.match(comingSoonProblem({ source: 'coming-soon', consent: true }) || '', /project/i);
  assert.equal(comingSoonProblem({ source: 'inquiry' }), null);
});

test('an unsubscribe is passed on to Zekal', async () => {
  const z = await fakeZekal();
  await postUnsubscribeToZekal('Alex.Example@example.com', { url: z.url });
  z.close();
  assert.deepEqual([z.got[0].body.type, z.got[0].body.email, z.got[0].body.tenant], ['unsubscribe', 'alex.example@example.com', 'Preconstruction Miami']);
});

test('the payload never carries more than the form collected', () => {
  assert.deepEqual(Object.keys(buildZekalPayload(lead)).sort(), ['consent', 'contact', 'message', 'neighborhood_id', 'page_url', 'project_id', 'project_name', 'sent_at', 'site', 'source', 'tenant']);
});
