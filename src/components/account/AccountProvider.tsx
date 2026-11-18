'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type User = { id: string; email: string; name: string; phone: string | null; phoneConsent: boolean; emailVerifiedAt: string | null };
type Ask = { projectId?: string; projectName?: string; source: string; reason?: string };

type Ctx = {
  ready: boolean;
  loaded: boolean;
  user: User | null;
  follows: Set<string>;
  refresh: () => Promise<void>;
  openSignup: (ask: Ask) => void;
  toggleFollow: (projectId: string, projectName?: string, source?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<Ctx | null>(null);

export function useAccount(): Ctx {
  const c = useContext(AccountContext);
  if (!c) throw new Error('useAccount must be used inside AccountProvider');
  return c;
}

const INPUT =
  'w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green outline-none transition-colors';

export default function AccountProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [ask, setAsk] = useState<Ask | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/account/me', { cache: 'no-store' });
      const d = await r.json();
      setReady(Boolean(d.ready));
      setUser(d.user || null);
      setFollows(new Set<string>(d.follows || []));
    } catch {
      setReady(false);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleFollow = useCallback(
    async (projectId: string, projectName?: string, source = 'follow') => {
      if (!user) { setAsk({ projectId, projectName, source }); return; }
      const on = !follows.has(projectId);
      setFollows((prev) => { const n = new Set(prev); if (on) n.add(projectId); else n.delete(projectId); return n; });
      const r = await fetch('/api/account/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, on }) });
      if (!r.ok) await refresh();
    },
    [user, follows, refresh]
  );

  const signOut = useCallback(async () => {
    await fetch('/api/account/logout', { method: 'POST' });
    setUser(null);
    setFollows(new Set());
  }, []);

  const value = useMemo<Ctx>(
    () => ({ ready, loaded, user, follows, refresh, openSignup: setAsk, toggleFollow, signOut }),
    [ready, loaded, user, follows, refresh, toggleFollow, signOut]
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
      {ask && ready && <SignupDialog ask={ask} onClose={() => setAsk(null)} onDone={refresh} />}
    </AccountContext.Provider>
  );
}

function SignupDialog({ ask, onClose, onDone }: { ask: Ask; onClose: () => void; onDone: () => Promise<void> }) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step, setStep] = useState<'form' | 'phone' | 'check' | 'done'>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState('');
  const openedAt = useRef(Date.now());
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch(mode === 'signup' ? '/api/account/signup' : '/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup'
            ? { name, email, projectId: ask.projectId, source: ask.source, company, elapsedMs: Date.now() - openedAt.current }
            : { email }
        ),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong. Try again.'); return; }
      setEmailSent(d.emailSent !== false);
      if (d.status === 'created') { await onDone(); setStep('phone'); } else setStep('check');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const savePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setStep('done'); return; }
    setBusy(true);
    setError('');
    const r = await fetch('/api/account/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, phoneConsent: consent }) });
    setBusy(false);
    if (!r.ok) { setError((await r.json()).error || 'Check the phone number.'); return; }
    await onDone();
    setStep('done');
  };

  const title =
    step === 'phone' ? 'You’re in. Want a call or text too?'
    : step === 'check' ? (emailSent ? 'Check your email' : 'We could not send the email')
    : step === 'done' ? 'Your account is ready'
    : mode === 'login' ? 'Sign in'
    : ask.projectName ? `Follow ${ask.projectName}`
    : ask.reason || 'Create a free account';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-6 sm:p-7">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-text-muted hover:text-text-primary">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <h2 className="pr-10 text-xl font-semibold text-text-primary leading-tight">{title}</h2>

        {step === 'form' && (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              {mode === 'login'
                ? 'Enter your email and we will send you a sign-in link.'
                : 'Follow towers and get an email when a price, construction stage or completion date changes. Free, and no password to remember.'}
            </p>
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Company<input value={company} onChange={(e) => setCompany(e.target.value)} type="text" tabIndex={-1} autoComplete="off" /></label>
            </div>
            {mode === 'signup' && (
              <label className="block">
                <span className="sr-only">Full name</span>
                <input ref={first} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Full name" className={INPUT} />
              </label>
            )}
            <label className="block">
              <span className="sr-only">Email address</span>
              <input ref={mode === 'login' ? first : undefined} value={email} onChange={(e) => setEmail(e.target.value)} required type="email" autoComplete="email" placeholder="Email address" className={INPUT} />
            </label>
            {error && <p className="text-accent-orange text-sm">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
              {busy ? 'One moment…' : mode === 'login' ? 'Email me a sign-in link' : 'Create account'}
            </button>
            <p className="text-xs text-text-muted">
              {mode === 'signup' ? (
                <>Already have an account? <button type="button" className="text-accent-green underline" onClick={() => { setMode('login'); setError(''); }}>Sign in</button>. By creating an account you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</>
              ) : (
                <>New here? <button type="button" className="text-accent-green underline" onClick={() => { setMode('signup'); setError(''); }}>Create an account</button>.</>
              )}
            </p>
          </form>
        )}

        {step === 'phone' && (
          <form onSubmit={savePhone} className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              {ask.projectName ? `You are now following ${ask.projectName}. ` : ''}
              {emailSent ? 'We sent a link to confirm your email. ' : ''}
              Add a number if you would like a licensed agent to call or text you about the towers you follow. You can skip this.
            </p>
            <label className="block">
              <span className="sr-only">Phone number</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="Phone number (optional)" className={INPUT} />
            </label>
            <label className="flex items-start gap-2.5 text-xs text-text-muted">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#00E5B4]" />
              <span>I agree to receive calls and text messages from PreConstruction Miami at this number about the properties I follow. Consent is not a condition of any purchase. Message and data rates may apply. Reply STOP to opt out.</span>
            </label>
            {error && <p className="text-accent-orange text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy || (Boolean(phone.trim()) && !consent)} className="btn-primary flex-1 disabled:opacity-50">{busy ? 'Saving…' : 'Save number'}</button>
              <button type="button" onClick={() => setStep('done')} className="btn-secondary">Skip</button>
            </div>
          </form>
        )}

        {step === 'check' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-text-muted">
              {emailSent
                ? <>If <span className="text-text-primary">{email}</span> has an account, a sign-in link is on its way. It works for 30 minutes.</>
                : 'Sign-in emails are not switched on yet. Please try again later, or contact us and we will help.'}
            </p>
            <button onClick={onClose} className="btn-secondary w-full">Close</button>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-text-muted">Use the Follow button on any tower, on the map or on its page. Everything you follow is kept in your account.</p>
            <div className="flex gap-2">
              <Link href="/account" onClick={onClose} className="btn-primary flex-1 text-center">Open my account</Link>
              <button onClick={onClose} className="btn-secondary">Keep browsing</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
