'use client';

import { useState } from 'react';

export default function UnsubscribeButton({ e, t }: { e: string; t: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'bad'>('idle');
  async function go() {
    setState('busy');
    const res = await fetch('/api/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e, t }) }).catch(() => null);
    setState(res?.ok ? 'done' : 'bad');
  }
  if (state === 'done') return <p role="status" className="mt-4 text-text-primary">You are unsubscribed. We will not email you again.</p>;
  return (
    <div className="mt-4 space-y-4">
      <p className="text-text-muted">Stop all emails from Preconstruction Miami to this address.</p>
      <button onClick={go} disabled={state === 'busy'} className="btn-primary">{state === 'busy' ? 'Unsubscribing…' : 'Unsubscribe me'}</button>
      {state === 'bad' && <p role="alert" className="text-sm text-red-600">This link did not work. Write to us from the contact page and we will remove you by hand.</p>}
    </div>
  );
}
