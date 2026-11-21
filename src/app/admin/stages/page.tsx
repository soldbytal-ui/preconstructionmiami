'use client';

import { useEffect, useMemo, useState } from 'react';
import Suggestions from './Suggestions';
import { STAGES, formatDay, sourceHost, isPublicUrl, type StageRecord } from '@/lib/approval';

type Current = StageRecord & { recheck: boolean };
type Data = { projects: { id: string; name: string; slug: string }[]; current: Current[] };

const input = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green/50';
const label = 'block text-[11px] text-text-muted uppercase tracking-wider mb-1';
const today = () => new Date().toISOString().slice(0, 10);

// Public pages to look for a project's record. Opened by hand; nothing here is fetched automatically.
const WHERE = [
  ['City of Miami', 'Meeting portal: PZAB, UDRB and City Commission agendas', 'https://miamifl.iqm2.com/Citizens/'],
  ['Miami-Dade County', 'Zoning hearing and Board of County Commissioners agendas', 'https://www.miamidade.gov/govaction/agendas.asp?Action=Agendas&Oper=DisplayList'],
  ['Miami Beach', 'Meetings and agendas: Design Review Board, Planning Board', 'https://www.miamibeachfl.gov/city-hall/city-clerk/meetings-and-agendas/'],
  ['Fort Lauderdale', 'Development Review Committee schedule and agendas (find from the city site)', 'https://www.fortlauderdale.gov/'],
];

export default function StagesAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ projectId: '', stage: '', sourceUrl: '', sourceLabel: '', confirmedOn: today(), note: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [only, setOnly] = useState<'all' | 'recheck'>('all');

  const load = () => fetch('/api/admin/stages').then((r) => r.json()).then((d) => setData(d.projects ? d : { projects: [], current: [] }));
  useEffect(() => { load(); }, []);

  const names = useMemo(() => new Map((data?.projects || []).map((p) => [p.id, p.name])), [data]);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.projects || []).filter((p) => !t || p.name.toLowerCase().includes(t)).slice(0, 8);
  }, [data, q]);
  const rows = (data?.current || []).filter((r) => only === 'all' || r.recheck).sort((a, b) => Number(b.recheck) - Number(a.recheck) || a.confirmedOn.localeCompare(b.confirmedOn));
  const due = (data?.current || []).filter((r) => r.recheck).length;
  const urlOk = isPublicUrl(form.sourceUrl);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await fetch('/api/admin/stages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setMsg({ ok: false, text: j.error || 'Could not save.' }); return; }
    setMsg({ ok: true, text: `Saved: ${names.get(form.projectId)} is now ${STAGES.find((s) => s.key === form.stage)?.label}.` });
    setForm({ projectId: '', stage: '', sourceUrl: '', sourceLabel: '', confirmedOn: today(), note: '' }); setQ('');
    load();
  }

  const recheck = (r: Current) => { setForm({ projectId: r.projectId, stage: r.stage, sourceUrl: r.sourceUrl, sourceLabel: r.sourceLabel || '', confirmedOn: today(), note: r.note || '' }); setQ(names.get(r.projectId) || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Approval stages</h1>
        <p className="text-sm text-text-muted mt-1">Paste the public record for a project and the stage it shows. A stage cannot be saved without a link, and the site never shows one without it.</p>
      </div>

      <Suggestions onChange={load} />

      <h2 className="text-lg font-semibold text-text-primary !mb-[-1rem]">Add a stage by hand</h2>
      <form onSubmit={save} className="bg-surface border border-border rounded-2xl p-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label} htmlFor="st-q">Project</label>
          <input id="st-q" className={input} placeholder="Search by name" value={q} onChange={(e) => { setQ(e.target.value); setForm({ ...form, projectId: '' }); }} />
          {q && !form.projectId && (
            <ul className="mt-1 border border-border rounded-lg divide-y divide-border overflow-hidden">
              {matches.map((p) => (
                <li key={p.id}><button type="button" className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface2" onClick={() => { setForm({ ...form, projectId: p.id }); setQ(p.name); }}>{p.name}</button></li>
              ))}
              {!matches.length && <li className="px-3 py-2 text-sm text-text-muted">No project with that name.</li>}
            </ul>
          )}
        </div>
        <div className="md:col-span-2">
          <label className={label} htmlFor="st-url">Link to the agenda or record</label>
          <input id="st-url" className={input} type="url" required placeholder="https://…" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
          {form.sourceUrl && !urlOk && <p className="text-xs text-red-500 mt-1">That is not a link a reader could open.</p>}
        </div>
        <div>
          <label className={label} htmlFor="st-stage">Stage shown in that record</label>
          <select id="st-stage" className={input} required value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            <option value="">Choose…</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="st-date">Date you confirmed it</label>
          <input id="st-date" className={input} type="date" required max={today()} value={form.confirmedOn} onChange={(e) => setForm({ ...form, confirmedOn: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="st-label">Name of the record (shown as the link text)</label>
          <input id="st-label" className={input} placeholder="e.g. UDRB agenda, 16 Dec 2026, item 4" value={form.sourceLabel} onChange={(e) => setForm({ ...form, sourceLabel: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="st-note">Note for readers (optional)</label>
          <input id="st-note" className={input} placeholder="e.g. Hearing set for 16 Dec." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button disabled={saving || !form.projectId || !form.stage || !urlOk} className="rounded-lg bg-accent-green px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Saving…' : 'Save stage'}</button>
          {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-accent-green' : 'text-red-500'}`}>{msg.text}</p>}
        </div>
      </form>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Stages on the site <span className="text-text-muted font-normal text-sm">({data?.current.length ?? 0})</span></h2>
          <div className="flex gap-1 text-xs">
            {([['all', 'All'], ['recheck', `Needs re-check (${due})`]] as const).map(([v, t]) => (
              <button key={v} onClick={() => setOnly(v)} className={`rounded-md border px-3 py-1.5 ${only === v ? 'border-accent-green text-accent-green' : 'border-border text-text-muted'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-text-muted border-b border-border">
              <th className="px-4 py-3">Project</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Confirmed</th><th className="px-4 py-3">Record</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.projectId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-primary font-medium">{names.get(r.projectId) || r.projectId}</td>
                  <td className="px-4 py-3 text-text-primary">{STAGES.find((s) => s.key === r.stage)?.label}</td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    {formatDay(r.confirmedOn)}
                    {r.recheck && <span className="ml-2 inline-block rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[11px] font-semibold">Needs re-check</span>}
                  </td>
                  <td className="px-4 py-3"><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-text-primary">{r.sourceLabel || sourceHost(r.sourceUrl)}</a></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => recheck(r)} className="text-xs underline text-text-muted hover:text-text-primary">Re-check</button></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">{only === 'recheck' ? 'Nothing is due for a re-check.' : 'No stages yet. Add the first one above.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted mt-2">A stage is flagged 30 days after it was last confirmed. Re-check opens the form with today’s date; open the record, confirm or change the stage, and save.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Where to look</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {WHERE.map(([place, what, url]) => (
            <li key={place} className="bg-surface border border-border rounded-xl p-4">
              <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-text-primary underline">{place}</a>
              <p className="text-sm text-text-muted mt-1">{what}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
