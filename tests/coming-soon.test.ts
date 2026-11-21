import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comingSoonProblem, consentNote, CONSENT_WORDING } from '../src/lib/coming-soon';

test('coming-soon sign-ups need a project and a ticked opt-in box', () => {
  assert.equal(comingSoonProblem({ source: 'coming-soon', projectId: 'demo-harbourline', consent: true }), null);
  assert.match(comingSoonProblem({ source: 'coming-soon', projectId: 'demo-harbourline' }) || '', /tick the box/i);
  assert.match(comingSoonProblem({ source: 'coming-soon', projectId: 'demo-harbourline', consent: false }) || '', /tick the box/i);
  assert.match(comingSoonProblem({ source: 'coming-soon', consent: true }) || '', /project/i);
  assert.equal(comingSoonProblem({ source: 'inquiry' }), null);
});

test('the lead records what was agreed to and when', () => {
  const note = consentNote(new Date('2026-11-21T10:00:00Z'));
  assert.ok(note.includes('2026-11-21') && note.includes(CONSENT_WORDING));
});
