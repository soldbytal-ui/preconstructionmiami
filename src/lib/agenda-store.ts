import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';
import { localDemo, readDemo, writeDemo } from '@/lib/local-demo';
import { type AgendaItem, type MatchProject, type Suggestion, suggestFrom, suggestionToStageInput } from '@/lib/agenda-match';
import { validateStageInput } from '@/lib/approval';
import { saveStageRecord } from '@/lib/approval-store';

const T = 'stage_suggestions';

export async function matchableProjects(): Promise<(MatchProject & { slug: string })[]> {
  if (localDemo) return readDemo().projects.map((p) => ({ id: p.id, slug: p.slug, name: p.name, address: p.address, folioNumber: p.folioNumber, applicantEntity: p.applicantEntity, developer: p.developer }));
  // Until the migration adds the two columns, fall back to what exists so the screen still loads
  const full = await supabaseAdmin.from('projects').select('id, slug, name, address, folioNumber, applicantEntity').order('name').limit(2000);
  if (!full.error) return (full.data || []) as any;
  const basic = await supabaseAdmin.from('projects').select('id, slug, name, address').order('name').limit(2000);
  return ((basic.data || []) as any[]).map((p) => ({ ...p, folioNumber: null, applicantEntity: null }));
}

export async function listSuggestions(status?: Suggestion['status']): Promise<Suggestion[]> {
  if (localDemo) return ((readDemo().suggestions || []) as Suggestion[]).filter((s) => !status || s.status === status);
  let q = supabaseAdmin.from(T).select('*').order('createdAt', { ascending: false }).limit(500);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  return error ? [] : ((data || []) as any[]).map((s) => ({ ...s, meetingDate: String(s.meetingDate).slice(0, 10) }));
}

/** Match a batch of agenda items and file any new findings as pending suggestions. Changes nothing public. */
export async function fileSuggestions(items: AgendaItem[]): Promise<{ read: number; added: number }> {
  const [projects, existing] = await Promise.all([matchableProjects(), listSuggestions()]);
  const fresh = suggestFrom(items, projects, new Set(existing.map((s) => s.key)));
  if (fresh.length) {
    if (localDemo) { const d = readDemo(); d.suggestions = [...(d.suggestions || []), ...fresh]; writeDemo(d); }
    else await supabaseAdmin.from(T).upsert(fresh, { onConflict: 'key', ignoreDuplicates: true });
  }
  return { read: items.length, added: fresh.length };
}

async function setStatus(id: string, status: 'approved' | 'rejected', by: string) {
  const decided = { status, decidedAt: new Date().toISOString(), decidedBy: by };
  if (localDemo) { const d = readDemo(); d.suggestions = (d.suggestions || []).map((s: any) => (s.id === id ? { ...s, ...decided } : s)); writeDemo(d); }
  else await supabaseAdmin.from(T).update(decided).eq('id', id);
}

/** Approve: write the stage record with the agenda link as its source. Reject: just close the suggestion. */
export async function decideSuggestion(id: string, action: 'approve' | 'reject', by: string): Promise<{ ok: boolean; error?: string }> {
  const s = (await listSuggestions('pending')).find((x) => x.id === id);
  if (!s) return { ok: false, error: 'That suggestion is no longer pending.' };
  if (action === 'reject') { await setStatus(id, 'rejected', by); return { ok: true }; }
  const checked = validateStageInput(suggestionToStageInput(s));
  if (!checked.ok) return { ok: false, error: checked.error };
  const saved = await saveStageRecord(checked.record, by);
  if (!saved.ok) return saved;
  await setStatus(id, 'approved', by);
  return { ok: true };
}

export async function saveProjectIds(projectId: string, folioNumber: string | null, applicantEntity: string | null): Promise<{ ok: boolean; error?: string }> {
  if (localDemo) { const d = readDemo(); d.projects = d.projects.map((p) => (p.id === projectId ? { ...p, folioNumber, applicantEntity } : p)); writeDemo(d); return { ok: true }; }
  const { error } = await supabaseAdmin.from('projects').update({ folioNumber, applicantEntity }).eq('id', projectId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Where agenda items come from. No live source is switched on yet: each one is added only after
 * its robots.txt and terms have been checked and Tal has agreed. In local demo mode the items
 * come from a file of fictional agendas.
 */
export async function collectAgendaItems(): Promise<{ items: AgendaItem[]; sources: string[] }> {
  if (localDemo) {
    const f = path.join(process.cwd(), 'fixtures', 'agendas-demo.json');
    return { items: JSON.parse(fs.readFileSync(f, 'utf8')).items, sources: ['fictional demo agendas'] };
  }
  return { items: [], sources: [] };
}
