'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CONSENT_WORDING, COMING_SOON_SOURCE } from '@/lib/coming-soon';

/** "Get notified when sales open": name, email and an opt-in box that starts unticked. */
export default function ComingSoonForm({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [consent, setConsent] = useState(false);
  const [problem, setProblem] = useState('');
  const mountedAt = useRef(Date.now());

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!consent) { setProblem('Tick the box so we are allowed to email you.'); return; }
    setProblem(''); setState('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'), email: f.get('email'), company: f.get('company') || undefined,
          projectId, source: COMING_SOON_SOURCE, consent: true, elapsedMs: Date.now() - mountedAt.current, pageUrl: window.location.href,
        }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); setProblem(j.error || 'That did not go through. Please try again.'); setState('error'); return; }
      setState('done');
    } catch { setProblem('That did not go through. Please try again.'); setState('error'); }
  }

  if (state === 'done') {
    return <p role="status" className="rounded-xl bg-[#E9F6EF] p-3 text-sm text-[#14532D]">You are on the list for {projectName}. We will email you when sales open. Every email has an unsubscribe link.</p>;
  }
  const field = 'w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-[#1c2530] placeholder:text-[#7a8791] focus:outline-none focus:ring-2 focus:ring-[#111B33]';
  return (
    <form onSubmit={submit} className="space-y-2.5" noValidate={false}>
      <p className="text-sm font-semibold text-[#1c2530]">Get notified when sales open</p>
      <label className="block"><span className="sr-only">Your name</span><input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your name" className={field} /></label>
      <label className="block"><span className="sr-only">Email address</span><input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="Email address" className={field} /></label>
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-2.5 text-xs leading-snug text-[#3d4852]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#111B33]" />
        <span>{CONSENT_WORDING}</span>
      </label>
      {problem && <p role="alert" className="text-xs font-medium text-[#B42318]">{problem}</p>}
      <button type="submit" disabled={state === 'sending'} className="w-full rounded-xl bg-[#111B33] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {state === 'sending' ? 'Adding you…' : 'Notify me'}
      </button>
      <p className="text-[11px] text-[#7a8791]">Sent by Preconstruction Miami. See our <Link href="/privacy" className="underline">privacy policy</Link>.</p>
    </form>
  );
}
