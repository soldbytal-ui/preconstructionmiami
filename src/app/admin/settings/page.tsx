'use client';

import { useState } from 'react';

function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: 'Password updated.' }); setCurrent(''); setNext(''); }
    else setMsg({ ok: false, text: data.error || 'Could not update the password.' });
  };

  const field = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary mt-1 focus:outline-none focus:border-accent-green/50';
  return (
    <form onSubmit={submit} className="glass-panel p-5 rounded-xl space-y-4 max-w-md">
      <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
      <label className="block text-xs text-text-muted uppercase tracking-wider">
        Current password
        <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required className={field} />
      </label>
      <label className="block text-xs text-text-muted uppercase tracking-wider">
        New password (12+ characters)
        <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} className={field} />
      </label>
      {msg && <p className={`text-sm ${msg.ok ? 'text-accent-green' : 'text-red-400'}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="btn-primary text-sm disabled:opacity-60">{busy ? 'Saving…' : 'Update password'}</button>
    </form>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>

      <ChangePassword />

      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Lead Routing</h2>
        <p className="text-sm text-text-muted">New leads are automatically assigned to agents based on their neighborhood coverage using round-robin distribution.</p>
        <div className="bg-surface2 rounded-lg p-4 text-sm text-text-muted">
          <p>Auto-routing is active. When a lead comes in from a specific project/neighborhood, it will be assigned to the next available agent who covers that area.</p>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Twilio Integration</h2>
        <p className="text-sm text-text-muted">Configure Twilio for masked calling and SMS.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Account SID</label>
            <input type="password" placeholder="Set TWILIO_ACCOUNT_SID in .env" disabled className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-muted mt-1" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Auth Token</label>
            <input type="password" placeholder="Set TWILIO_AUTH_TOKEN in .env" disabled className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-muted mt-1" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">Proxy Service SID</label>
            <input type="password" placeholder="Set TWILIO_PROXY_SERVICE_SID in .env" disabled className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-muted mt-1" />
          </div>
        </div>
        <p className="text-xs text-text-muted">Add these environment variables to enable Click to Call and Click to Text functionality.</p>
      </div>

      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">PWA</h2>
        <p className="text-sm text-text-muted">This dashboard can be installed as a Progressive Web App on mobile devices.</p>
        <p className="text-xs text-text-muted">Open this page on your phone and tap &quot;Add to Home Screen&quot; to install the agent portal.</p>
      </div>
    </div>
  );
}
