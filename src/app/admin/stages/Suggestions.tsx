'use client';

import { useEffect, useState } from 'react';
import { STAGES, formatDay } from '@/lib/approval';
import { STRENGTH_LABEL, type Suggestion, type MatchStrength } from '@/lib/agenda-match';

type P = { id: string; name: string; slug: string; folioNumber: string | null; applicantEntity: string | null; hasAddress: boolean; folioOk: boolean };
const TONE: Record<MatchStrength, string> = { folio: 'bg-emerald-100 text-emerald-900', address: 'bg-sky-100 text-sky-900', applicant: 'bg-amber-100 text-amber-900', name: 'bg-rose-100 text-rose-900' };
const NOTE: Record<MatchStrength, string> = { folio: 'Strongest match', address: 'Strong match', applicant: 'Check the address', name: 'Weakest match: check carefully' };
const input = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green/50';

export default function Suggestions({ onChange }: { onChange: () => void }) {
  const [pending, setPending] = useState<Suggestion[] | null>(null);
  const [projects, setProjects] = useState<P[]>([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [showAll, setShowAll] = useState(false);

  const load = () => fetch('/api/admin/suggestions').then((r) => r.json()).then((d) => { setPending(d.pending || []); setProjects(d.projects || []); });
  useEffect(() => { load(); }, []);
  const names = new Map(projects.map((p) => [p.id, p.name]));

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusy(id); setMsg('');
    const res = await fetch('/api/admin/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
    const j = await res.json().catch(() => ({}));
    setBusy('');
    setMsg(res.ok ? (action === 'approve' ? 'Approved. The stage is now on the site with that agenda as its source.' : 'Rejected. Nothing changed on the site.') : j.error || 'That did not work.');
    await load(); if (res.ok && action === 'approve') onChange();
  }
  async function check() {
    setBusy('check'); setMsg('');
    const j = await fetch('/api/cron/agenda-watch').then((r) => r.json()).catch(() => null);
    setBusy('');
    setMsg(!j ? 'The check did not run.' : j.sources?.length ? `Read ${j.read} agenda items from ${j.sources.join(', ')}; ${j.added} new ${j.added === 1 ? 'suggestion' : 'suggestions'}.` : 'No agenda sources are switched on yet, so there was nothing to read.');
    load();
  }
  async function saveIds(e: React.FormEvent<HTMLFormElement>, projectId: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/project-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, folioNumber: f.get('folio'), applicantEntity: f.get('applicant') }) });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? `Saved for ${names.get(projectId)}.` : j.error || 'Could not save.');
    if (res.ok) load();
  }

  const missing = projects.filter((p) => !p.folioOk || !p.applicantEntity);
  const noFolio = projects.filter((p) => !p.folioOk).length;
  const noApplicant = projects.filter((p) => !p.applicantEntity).length;

  return (
    <>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Suggestions from agendas <span className="text-text-muted font-normal text-sm">({pending?.length ?? 0} waiting)</span></h2>
          <button onClick={check} disabled={busy === 'check'} className="rounded-md border border-border px-3 py-1.5 text-xs text-text-primary disabled:opacity-50">{busy === 'check' ? 'Checking…' : 'Check agendas now'}</button>
        </div>
        <p className="text-sm text-text-muted mb-3">Each suggestion is an agenda item that looks like one of our projects. Nothing here is on the public site until you approve it.</p>
        {msg && <p role="status" className="mb-3 rounded-lg bg-surface2 px-3 py-2 text-sm text-text-primary">{msg}</p>}
        <ul className="space-y-3">
          {(pending || []).map((s) => (
            <li key={s.id} className="bg-surface border border-border rounded-2xl p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="min-w-0 flex-1 basis-72">
                  <p className="text-base font-semibold text-text-primary">{names.get(s.projectId) || s.projectId}</p>
                  <p className="mt-1 text-sm text-text-primary">Proposed stage: <strong>{STAGES.find((x) => x.key === s.proposedStage)?.label}</strong></p>
                  <p className="mt-2 text-sm text-text-muted">{s.source} · {s.body} · meeting {formatDay(s.meetingDate)}{s.itemNumber ? ` · item ${s.itemNumber}` : ''}</p>
                  <p className="mt-1 text-sm text-text-muted">“{s.itemTitle}”</p>
                  <p className="mt-2 text-sm"><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline text-text-primary break-all">Open the agenda item</a></p>
                </div>
                <div className="basis-56 shrink-0">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[s.matchStrength]}`}>Matched by: {STRENGTH_LABEL[s.matchStrength]}</span>
                  <p className="mt-1.5 text-xs text-text-muted">{NOTE[s.matchStrength]}. {s.matchDetail}.</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => decide(s.id, 'approve')} disabled={busy === s.id} className="flex-1 rounded-lg bg-accent-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Approve</button>
                    <button onClick={() => decide(s.id, 'reject')} disabled={busy === s.id} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary disabled:opacity-50">Reject</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {pending && !pending.length && <li className="bg-surface border border-border rounded-2xl p-6 text-center text-sm text-text-muted">No suggestions waiting.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">Matching details</h2>
        <p className="text-sm text-text-muted mt-1 mb-3">
          Agenda items are matched by folio number first, then street address, then the applicant’s legal name, then the project name.
          {' '}{noFolio} of {projects.length} projects have no folio number and {noApplicant} have no applicant name.
        </p>
        <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
          {(showAll ? missing : missing.slice(0, 6)).map((p) => (
            <form key={p.id} onSubmit={(e) => saveIds(e, p.id)} className="grid gap-2 p-3 md:grid-cols-[1.2fr_1fr_1.2fr_auto] md:items-center">
              <div className="text-sm text-text-primary font-medium">{p.name}
                <span className="block text-xs font-normal text-text-muted">Missing: {[!p.folioOk && 'folio', !p.applicantEntity && 'applicant', !p.hasAddress && 'street address'].filter(Boolean).join(', ')}</span>
              </div>
              <label><span className="sr-only">Folio number for {p.name}</span><input name="folio" defaultValue={p.folioNumber || ''} placeholder="Folio, e.g. 01-3137-031-0020" className={input} /></label>
              <label><span className="sr-only">Applicant legal name for {p.name}</span><input name="applicant" defaultValue={p.applicantEntity || ''} placeholder="Applicant legal name" className={input} /></label>
              <button className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary">Save</button>
            </form>
          ))}
          {!missing.length && <p className="p-4 text-sm text-text-muted">Every project has a folio number and an applicant name.</p>}
        </div>
        {missing.length > 6 && <button onClick={() => setShowAll(!showAll)} className="mt-2 text-xs underline text-text-muted">{showAll ? 'Show fewer' : `Show all ${missing.length} projects missing details`}</button>}
      </section>
    </>
  );
}
