import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStageInput, publicStage, latestByProject, needsRecheck, isPublicUrl, EARLY_STAGES, STAGES } from '../src/lib/approval';

// All projects here are fictional.
const good = { projectId: 'demo-harbourline', stage: 'under_review', sourceUrl: 'https://example.com/agenda/item-4', confirmedOn: '2026-11-10' };
const now = new Date('2026-11-20T12:00:00Z');

test('there are eight stages, in order', () => {
  assert.deepEqual(STAGES.map((s) => s.key), ['proposed', 'pre_application', 'under_review', 'hearing_scheduled', 'approved', 'permitted', 'under_construction', 'completed']);
  assert.deepEqual(EARLY_STAGES, ['proposed', 'pre_application', 'under_review', 'hearing_scheduled']);
});

test('a stage with a source link is accepted', () => {
  const r = validateStageInput(good, now);
  assert.equal(r.ok, true);
});

test('no stage without a source: saving is refused', () => {
  for (const sourceUrl of [undefined, '', '   ', 'n/a', 'agenda item 4', 'javascript:alert(1)', 'ftp://example.com/x', 'https://localhost']) {
    const r = validateStageInput({ ...good, sourceUrl }, now);
    assert.equal(r.ok, false, `accepted ${JSON.stringify(sourceUrl)}`);
  }
});

test('no stage without a source: a stored record with no link is never shown', () => {
  assert.equal(publicStage({ ...good, sourceUrl: '' } as any), null);
  assert.equal(publicStage({ ...good, sourceUrl: undefined } as any), null);
  assert.equal(publicStage({ ...good, sourceUrl: 'see city website' } as any), null);
  assert.equal(publicStage(null), null);
  assert.equal(publicStage({ ...good, stage: 'rumoured' } as any), null);
  assert.equal(publicStage({ ...good, confirmedOn: '' } as any), null);
  assert.equal(publicStage(good as any)?.stage, 'under_review');
});

test('unknown stages and future dates are refused', () => {
  assert.equal(validateStageInput({ ...good, stage: 'sold_out' }, now).ok, false);
  assert.equal(validateStageInput({ ...good, confirmedOn: '2027-01-01' }, now).ok, false);
  assert.equal(validateStageInput({ ...good, projectId: '' }, now).ok, false);
});

test('the newest record for a project wins', () => {
  const latest = latestByProject([
    { ...good, stage: 'under_review', confirmedOn: '2026-10-01' },
    { ...good, stage: 'hearing_scheduled', confirmedOn: '2026-11-10' },
    { ...good, projectId: 'demo-meridian', stage: 'proposed', confirmedOn: '2026-09-01' },
  ] as any);
  assert.equal(latest['demo-harbourline'].stage, 'hearing_scheduled');
  assert.equal(latest['demo-meridian'].stage, 'proposed');
});

test('a stage is flagged for a re-check after 30 days, unless completed', () => {
  assert.equal(needsRecheck({ ...good, confirmedOn: '2026-11-10' } as any, now), false);
  assert.equal(needsRecheck({ ...good, confirmedOn: '2026-10-20' } as any, now), true);
  assert.equal(needsRecheck({ ...good, stage: 'completed', confirmedOn: '2025-01-01' } as any, now), false);
});

test('only http and https links count as public', () => {
  assert.equal(isPublicUrl('https://miamifl.iqm2.com/Citizens/Detail_Meeting.aspx?ID=1'), true);
  assert.equal(isPublicUrl('http://www.miamidade.gov/govaction/agendas.asp'), true);
  assert.equal(isPublicUrl('data:text/html,hi'), false);
});
