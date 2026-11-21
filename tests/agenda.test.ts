import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchItem, proposeStage, suggestFrom, suggestionToStageInput, extractFolios, normalizeAddress, normalizeEntity, type AgendaItem, type MatchProject } from '../src/lib/agenda-match';
import { validateStageInput } from '../src/lib/approval';

// Every project, applicant, folio and agenda below is fictional.
const projects: MatchProject[] = [
  { id: 'demo-harbourline', name: 'Harbourline Tower (example)', address: '1200 Example Bay Drive, Miami, FL', folioNumber: '01-9999-001-0010', applicantEntity: 'Harbourline Holdings, LLC' },
  { id: 'demo-meridian', name: 'Meridian Brickell (example)', address: '45 SW Sample Street, Miami, FL', folioNumber: null, applicantEntity: 'Meridian Sample Owner LLC' },
  { id: 'demo-coral-yard', name: 'Coral Yard Residences (example)', address: null, folioNumber: null, applicantEntity: null },
  { id: 'demo-bayfront', name: 'Bayfront One (example)', address: '9 North Fictional Avenue, Miami', folioNumber: '0199990020030', applicantEntity: null },
];
const today = new Date('2026-11-20T12:00:00Z');
const item = (over: Partial<AgendaItem>): AgendaItem => ({ source: 'Example City', body: 'Example Review Board', meetingDate: '2026-12-16', itemNumber: '4', title: 'Item', text: '', url: 'https://example.com/agendas/2026-12-16#4', ...over });

test('folio numbers are read in either format', () => {
  assert.deepEqual(extractFolios('Folio: 01-9999-001-0010 and 0199990020030; phone 305-555-0100'), ['0199990010010', '0199990020030']);
});

test('addresses and entity names are normalised', () => {
  assert.equal(normalizeAddress('45 Southwest Sample St., Miami, FL 33130'), '45 sw sample st');
  assert.equal(normalizeAddress('Fictional address, Edgewater'), null);
  assert.equal(normalizeEntity('Harbourline Holdings, L.L.C.'), 'harbourline');
  assert.equal(normalizeEntity('Meridian Sample Owner LLC'), 'meridian sample owner');
});

test('folio beats address, applicant and name', () => {
  const m = matchItem(item({ text: 'Applicant Meridian Sample Owner LLC for 45 SW Sample Street. Folio 01-9999-001-0010. Also known as Bayfront One.' }), projects);
  assert.deepEqual([m?.projectId, m?.strength], ['demo-harbourline', 'folio']);
});

test('address is used when there is no folio', () => {
  const m = matchItem(item({ text: 'Exception for a mixed-use tower at 45 Southwest Sample St. Applicant: Somebody Else Inc.' }), projects);
  assert.deepEqual([m?.projectId, m?.strength], ['demo-meridian', 'address']);
  // "145 SW Sample Street" is a different lot
  assert.equal(matchItem(item({ text: 'Warrant at 145 SW Sample Street' }), projects), null);
});

test('applicant legal name is used next, then project name', () => {
  assert.deepEqual([matchItem(item({ text: 'Applicant: HARBOURLINE HOLDINGS LLC, design review' }), projects)?.strength], ['applicant']);
  const byName = matchItem(item({ title: 'Coral Yard Residences', text: 'Design review of a 24-storey building' }), projects);
  assert.deepEqual([byName?.projectId, byName?.strength], ['demo-coral-yard', 'name']);
});

test('an unrelated item matches nothing', () => {
  assert.equal(matchItem(item({ title: 'Sidewalk cafe permit', text: 'A cafe at 800 Other Road' }), projects), null);
});

test('proposed stage: upcoming meeting is a hearing; only a recorded approval is "approved"', () => {
  assert.equal(proposeStage(item({ meetingDate: '2026-12-16' }), today), 'hearing_scheduled');
  assert.equal(proposeStage(item({ meetingDate: '2026-10-01' }), today), 'under_review');
  assert.equal(proposeStage(item({ meetingDate: '2026-10-01', result: 'Approved with conditions' }), today), 'approved');
  assert.equal(proposeStage(item({ meetingDate: '2026-10-01', result: 'Deferred' }), today), 'under_review');
  assert.equal(proposeStage(item({ meetingDate: '2026-10-01', result: 'Denied' }), today), 'under_review');
});

test('matches become pending suggestions, once each, and never without a link', () => {
  const items = [
    item({ text: 'Folio 01-9999-001-0010' }),
    item({ text: 'Folio 01-9999-001-0010' }),                           // the same item seen twice
    item({ text: 'Folio 0199990020030', url: '' }),                     // no public link
    item({ title: 'Nothing of ours', text: 'A sign variance' }),
  ];
  const s = suggestFrom(items, projects, new Set(), today);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0].status, s[0].projectId, s[0].proposedStage, s[0].matchStrength, s[0].itemNumber, s[0].meetingDate], ['pending', 'demo-harbourline', 'hearing_scheduled', 'folio', '4', '2026-12-16']);
  assert.equal(suggestFrom(items, projects, new Set([s[0].key]), today).length, 0, 'already suggested on an earlier run');
});

test('approving a suggestion produces a stage record sourced to the agenda link', () => {
  const [s] = suggestFrom([item({ text: 'Folio 01-9999-001-0010' })], projects, new Set(), today);
  const input = suggestionToStageInput(s, today);
  assert.equal(input.sourceUrl, 'https://example.com/agendas/2026-12-16#4');
  assert.match(input.sourceLabel, /Example Review Board agenda, Dec 16, 2026, item 4/);
  const checked = validateStageInput(input, today);
  assert.equal(checked.ok, true);
});
