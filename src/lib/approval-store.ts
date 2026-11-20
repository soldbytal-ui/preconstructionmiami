import { supabase, supabaseAdmin } from '@/lib/supabase';
import { localDemo, readDemo, writeDemo } from '@/lib/local-demo';
import { type StageRecord, latestByProject, publicStage, isEarly } from '@/lib/approval';

const TABLE = 'project_stage_records';
const COLS = 'id, projectId, stage, sourceUrl, sourceLabel, confirmedOn, note, createdAt, createdBy';

/** Every record, newest first. Until the table exists this is simply empty and every project reads "Stage not confirmed". */
export async function allStageRecords(fresh = false): Promise<StageRecord[]> {
  if (localDemo) return readDemo().records as StageRecord[];
  const { data, error } = await (fresh ? supabaseAdmin : supabase).from(TABLE).select(COLS).order('confirmedOn', { ascending: false }).limit(5000);
  if (error || !data) return [];
  return data.map((r: any) => ({ ...r, confirmedOn: String(r.confirmedOn).slice(0, 10) }));
}

/** Current stage for each project, already passed through the no-source rule. */
export async function currentStages(fresh = false): Promise<Record<string, StageRecord>> {
  const latest = latestByProject(await allStageRecords(fresh));
  const out: Record<string, StageRecord> = {};
  for (const [id, r] of Object.entries(latest)) { const ok = publicStage(r); if (ok) out[id] = ok; }
  return out;
}

export async function stageFor(projectId: string): Promise<StageRecord | null> {
  if (localDemo) return (await currentStages())[projectId] || null;
  const { data, error } = await supabase.from(TABLE).select(COLS).eq('projectId', projectId).order('confirmedOn', { ascending: false }).order('createdAt', { ascending: false }).limit(1);
  if (error || !data?.[0]) return null;
  return publicStage({ ...data[0], confirmedOn: String(data[0].confirmedOn).slice(0, 10) } as any);
}

export async function saveStageRecord(record: StageRecord, by: string): Promise<{ ok: boolean; error?: string }> {
  const row = { ...record, createdBy: by, createdAt: new Date().toISOString() };
  if (localDemo) {
    const d = readDemo();
    d.records.push({ id: `r${Date.now()}`, ...row });
    writeDemo(d);
    return { ok: true };
  }
  const { error } = await supabaseAdmin.from(TABLE).insert(row);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export type ComingSoonProject = { id: string; slug: string; name: string; latitude: number; longitude: number; floors: number | null; area: string | null; developer: string | null; record: StageRecord };

/** Projects that are proposed, in pre-application, under review or waiting for a hearing. */
export async function comingSoonProjects(): Promise<ComingSoonProject[]> {
  const early = Object.values(await currentStages()).filter((r) => isEarly(r.stage));
  if (!early.length) return [];
  if (localDemo) {
    const byId = new Map(readDemo().projects.map((p) => [p.id, p]));
    return early.flatMap((record) => { const p = byId.get(record.projectId); return p ? [{ id: p.id, slug: p.slug, name: p.name, latitude: p.latitude, longitude: p.longitude, floors: p.floors, area: p.neighborhood, developer: p.developer, record }] : []; });
  }
  const { data } = await supabase.from('projects').select('id, slug, name, latitude, longitude, floors, neighborhood:neighborhoods(name), developer:developers(name)').in('id', early.map((r) => r.projectId));
  const byId = new Map((data || []).map((p: any) => [p.id, p]));
  return early.flatMap((record) => {
    const p: any = byId.get(record.projectId);
    return p && p.latitude && p.longitude ? [{ id: p.id, slug: p.slug, name: p.name, latitude: p.latitude, longitude: p.longitude, floors: p.floors, area: p.neighborhood?.name || null, developer: p.developer?.name || null, record }] : [];
  });
}

/** Projects the admin can attach a stage to. */
export async function stageableProjects(): Promise<{ id: string; name: string; slug: string }[]> {
  if (localDemo) return readDemo().projects.map(({ id, name, slug }) => ({ id, name, slug }));
  const { data } = await supabaseAdmin.from('projects').select('id, name, slug').order('name').limit(2000);
  return data || [];
}
