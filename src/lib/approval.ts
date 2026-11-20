// Where a project is in its public approval process. No imports: this file is shared by the
// server, the browser and the tests.

export const STAGES = [
  { key: 'proposed', label: 'Proposed', hint: 'Announced or reported, with no application on file yet' },
  { key: 'pre_application', label: 'Pre-application', hint: 'The developer has met city staff before filing' },
  { key: 'under_review', label: 'Under review', hint: 'An application (ASPR, Warrant, Exception or similar) is with the city or county' },
  { key: 'hearing_scheduled', label: 'Hearing scheduled', hint: 'The project is on a published board or commission agenda' },
  { key: 'approved', label: 'Approved (entitled)', hint: 'The zoning approval has been granted' },
  { key: 'permitted', label: 'Permitted', hint: 'A building permit has been issued' },
  { key: 'under_construction', label: 'Under construction', hint: 'Work has started on site' },
  { key: 'completed', label: 'Completed', hint: 'A certificate of occupancy has been issued' },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];

/** Stages before a project is entitled: these make up the "coming soon" layer on the map. */
export const EARLY_STAGES: StageKey[] = ['proposed', 'pre_application', 'under_review', 'hearing_scheduled'];

export const RECHECK_DAYS = 30;

export type StageRecord = {
  id?: string;
  projectId: string;
  stage: StageKey;
  /** The public record this stage was read from. Required: a stage is never shown without it. */
  sourceUrl: string;
  sourceLabel?: string | null;
  /** The day the stage was last confirmed against the source, as YYYY-MM-DD. */
  confirmedOn: string;
  note?: string | null;
  createdAt?: string;
  createdBy?: string | null;
};

export const isStage = (v: unknown): v is StageKey => STAGES.some((s) => s.key === v);
export const stageIndex = (k: StageKey) => STAGES.findIndex((s) => s.key === k);
export const stageLabel = (k: StageKey) => STAGES[stageIndex(k)].label;
export const isEarly = (k: StageKey) => EARLY_STAGES.includes(k);

/** A link a reader can open: http or https, with a real host. */
export function isPublicUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 600) return false;
  try {
    const u = new URL(v.trim());
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function sourceHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'source'; }
}

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Check an entry from the admin screen. Returns the cleaned record, or the reason it was refused. */
export function validateStageInput(input: any, today = new Date()): { ok: true; record: StageRecord } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Nothing to save.' };
  if (typeof input.projectId !== 'string' || !input.projectId.trim()) return { ok: false, error: 'Choose a project.' };
  if (!isStage(input.stage)) return { ok: false, error: 'Choose a stage.' };
  if (!isPublicUrl(input.sourceUrl)) return { ok: false, error: 'Paste the link to the public record. A stage cannot be saved without one.' };
  if (!isDay(input.confirmedOn)) return { ok: false, error: 'Enter the date you confirmed the stage.' };
  if (Date.parse(input.confirmedOn) > today.getTime() + 86_400_000) return { ok: false, error: 'The confirmed date cannot be in the future.' };
  const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  return {
    ok: true,
    record: {
      projectId: input.projectId.trim(),
      stage: input.stage,
      sourceUrl: input.sourceUrl.trim(),
      sourceLabel: text(input.sourceLabel, 160),
      confirmedOn: input.confirmedOn,
      note: text(input.note, 600),
    },
  };
}

/**
 * The only way a stage reaches a page. A record with no usable source link, an unknown stage
 * or no confirmed date comes back as null, and the page shows "Stage not confirmed".
 */
export function publicStage(record: Partial<StageRecord> | null | undefined): StageRecord | null {
  if (!record || !isStage(record.stage) || !isPublicUrl(record.sourceUrl) || !isDay(record.confirmedOn) || !record.projectId) return null;
  return record as StageRecord;
}

/** The newest record for each project. */
export function latestByProject(records: StageRecord[]): Record<string, StageRecord> {
  const out: Record<string, StageRecord> = {};
  for (const r of records) {
    const cur = out[r.projectId];
    const newer = !cur || r.confirmedOn > cur.confirmedOn || (r.confirmedOn === cur.confirmedOn && (r.createdAt || '') > (cur.createdAt || ''));
    if (newer) out[r.projectId] = r;
  }
  return out;
}

export function daysSince(day: string, now = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(day)) / 86_400_000);
}

/** A stage still in motion should be looked at again 30 days after it was last confirmed. */
export function needsRecheck(record: StageRecord, now = new Date()): boolean {
  return record.stage !== 'completed' && daysSince(record.confirmedOn, now) > RECHECK_DAYS;
}

export function formatDay(day: string): string {
  const d = new Date(day + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
