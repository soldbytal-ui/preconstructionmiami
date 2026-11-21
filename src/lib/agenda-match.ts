// Matches public agenda items to our projects and proposes a stage. Pure functions, no imports
// beyond the stage list: shared with tests. Nothing here writes anything.
import { type StageKey } from './approval';

export type AgendaItem = {
  source: string;            // e.g. "City of Miami"
  body: string;              // e.g. "Urban Development Review Board"
  meetingDate: string;       // YYYY-MM-DD
  itemNumber: string | null; // e.g. "PZ.4" or "4"
  title: string;
  text: string;              // the item's full public text
  url: string;               // link to the agenda item or agenda
  result?: string | null;    // e.g. "Approved", "Deferred", when the minutes say
};

export type MatchProject = { id: string; name: string; address?: string | null; folioNumber?: string | null; applicantEntity?: string | null; developer?: string | null };

export type MatchStrength = 'folio' | 'address' | 'applicant' | 'name';
export const STRENGTH_LABEL: Record<MatchStrength, string> = { folio: 'Folio number', address: 'Street address', applicant: 'Applicant name', name: 'Project name' };
/** Strongest first. Folio is exact; name alone is the weakest and most likely to be wrong. */
export const STRENGTH_ORDER: MatchStrength[] = ['folio', 'address', 'applicant', 'name'];

export type Match = { projectId: string; strength: MatchStrength; detail: string };

/** Miami-Dade folios are 13 digits, written 01-3137-031-0020 or 0131370310020. */
export function normalizeFolio(v: string | null | undefined): string | null {
  const d = (v || '').replace(/\D/g, '');
  return d.length === 13 ? d : null;
}
export function extractFolios(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b\d{2}[- ]?\d{4}[- ]?\d{3}[- ]?\d{4}\b/g)) { const f = normalizeFolio(m[0]); if (f) out.add(f); }
  return [...out];
}

const DIR: Record<string, string> = { north: 'n', south: 's', east: 'e', west: 'w', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw' };
const TYPE: Record<string, string> = { street: 'st', avenue: 'ave', boulevard: 'blvd', drive: 'dr', road: 'rd', court: 'ct', terrace: 'ter', place: 'pl', lane: 'ln', highway: 'hwy', way: 'way' };
const words = (s: string) => s.toLowerCase().replace(/[.,#]/g, ' ').replace(/(\d+)(st|nd|rd|th)\b/g, '$1').split(/\s+/).filter(Boolean).map((w) => DIR[w] || TYPE[w] || w);

/** "300 Biscayne Boulevard Way, Miami, FL 33131" → "300 biscayne blvd way". Street number and name only. */
export function normalizeAddress(v: string | null | undefined): string | null {
  if (!v) return null;
  const first = v.split(',')[0];
  const w = words(first);
  return w.length >= 2 && /^\d+$/.test(w[0]) ? w.join(' ') : null;
}

const ENTITY_NOISE = /\b(llc|l\.l\.c|inc|incorporated|corp|corporation|company|co|ltd|lp|llp|lllp|pllc|trust|holdings|the)\b/g;
export function normalizeEntity(v: string | null | undefined): string | null {
  const s = (v || '').toLowerCase().replace(/\b([a-z])\.(?=[a-z]\.)/g, '$1').replace(/&/g, ' and ').replace(/[^a-z0-9 ]/g, ' ').replace(ENTITY_NOISE, ' ').replace(/\s+/g, ' ').trim();
  return s.length >= 4 ? s : null;
}

const hasPhrase = (hay: string, phrase: string) => new RegExp(`(^| )${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(hay);

/** The single best match for an item, trying folio, then address, then applicant, then name. Null if none. */
export function matchItem(item: AgendaItem, projects: MatchProject[]): Match | null {
  const raw = `${item.title} ${item.text}`;
  const folios = extractFolios(raw);
  for (const p of projects) { const f = normalizeFolio(p.folioNumber); if (f && folios.includes(f)) return { projectId: p.id, strength: 'folio', detail: `Folio ${f} appears in the item` }; }

  const addrText = words(raw).join(' ');
  for (const p of projects) { const a = normalizeAddress(p.address); if (a && hasPhrase(addrText, a)) return { projectId: p.id, strength: 'address', detail: `Address "${p.address!.split(',')[0]}" appears in the item` }; }

  const entText = normalizeEntity(raw) || '';
  for (const p of projects) { const e = normalizeEntity(p.applicantEntity); if (e && hasPhrase(entText, e)) return { projectId: p.id, strength: 'applicant', detail: `Applicant "${p.applicantEntity}" appears in the item` }; }

  // Name: the weakest signal. Needs a distinctive name (two words or 8+ letters) to count at all.
  const nameText = raw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
  let best: { p: MatchProject; len: number } | null = null;
  for (const p of projects) {
    const n = p.name.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if ((n.includes(' ') || n.length >= 8) && hasPhrase(nameText, n) && (!best || n.length > best.len)) best = { p, len: n.length };
  }
  return best ? { projectId: best.p.id, strength: 'name', detail: `Project name "${best.p.name}" appears in the item` } : null;
}

/** What the item suggests about the project's stage. Deliberately cautious: only a recorded approval moves past "hearing". */
export function proposeStage(item: AgendaItem, today = new Date()): StageKey {
  const result = (item.result || '').toLowerCase();
  if (/\b(approved|approval granted|granted|adopted)\b/.test(result) && !/\b(not approved|denied)\b/.test(result)) return 'approved';
  const upcoming = Date.parse(item.meetingDate) >= Date.parse(today.toISOString().slice(0, 10));
  return upcoming ? 'hearing_scheduled' : 'under_review';
}

export type Suggestion = {
  id: string; key: string; projectId: string; proposedStage: StageKey;
  sourceUrl: string; sourceLabel: string; itemNumber: string | null; meetingDate: string; body: string; source: string;
  matchStrength: MatchStrength; matchDetail: string; itemTitle: string;
  status: 'pending' | 'approved' | 'rejected'; createdAt: string; decidedAt?: string | null; decidedBy?: string | null;
};

const label = (item: AgendaItem) => `${item.body} agenda, ${new Date(item.meetingDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}${item.itemNumber ? `, item ${item.itemNumber}` : ''}`;

/** Turn agenda items into pending suggestions. Skips items with no link, no match, or already suggested. */
export function suggestFrom(items: AgendaItem[], projects: MatchProject[], existingKeys: Set<string>, today = new Date()): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set(existingKeys);
  for (const item of items) {
    if (!/^https?:\/\/[^ ]+\.[^ ]+/.test(item.url || '')) continue; // a suggestion without a public link could never become a stage
    const m = matchItem(item, projects);
    if (!m) continue;
    const proposedStage = proposeStage(item, today);
    const key = `${m.projectId}|${item.url}|${item.itemNumber || ''}|${proposedStage}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `sg_${Math.abs(hash(key)).toString(36)}`, key, projectId: m.projectId, proposedStage,
      sourceUrl: item.url, sourceLabel: label(item), itemNumber: item.itemNumber, meetingDate: item.meetingDate, body: item.body, source: item.source,
      matchStrength: m.strength, matchDetail: m.detail, itemTitle: item.title.slice(0, 240), status: 'pending', createdAt: today.toISOString(),
    });
  }
  return out;
}
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }

/** What approving a suggestion writes: a stage record whose source is the agenda link. */
export function suggestionToStageInput(s: Suggestion, today = new Date()) {
  const future = Date.parse(s.meetingDate) > today.getTime();
  return {
    projectId: s.projectId, stage: s.proposedStage, sourceUrl: s.sourceUrl, sourceLabel: s.sourceLabel,
    confirmedOn: today.toISOString().slice(0, 10),
    note: s.proposedStage === 'hearing_scheduled' && future ? `Hearing set for ${new Date(s.meetingDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}.` : null,
  };
}
