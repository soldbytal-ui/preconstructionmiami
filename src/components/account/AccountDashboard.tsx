'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from './AccountProvider';
import SafeImage from '@/components/ui/SafeImage';
import { thumbUrl, formatPrice } from '@/lib/utils';

type Row = {
  id: string; slug: string; name: string; status: string; priceMin: number | null; floors: number | null;
  totalUnits: number | null; estCompletion: string | null; mainImageUrl: string | null; heightM: number | null;
  neighborhood: { name: string; slug: string } | null;
};

const STAGE: Record<string, string> = {
  PRE_LAUNCH: 'Planned', PRE_CONSTRUCTION: 'Planned', UNDER_CONSTRUCTION: 'Under construction', NEAR_COMPLETION: 'Near completion', COMPLETED: 'Completed',
};
const INPUT =
  'w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green outline-none transition-colors';

export default function AccountDashboard() {
  const { ready, loaded, user, follows, openSignup, toggleFollow, signOut, refresh } = useAccount();
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [emailReady, setEmailReady] = useState(true);
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState<'' | 'saving' | 'saved' | 'error'>('');

  const load = useCallback(async () => {
    const r = await fetch('/api/account/me?full=1', { cache: 'no-store' });
    const d = await r.json();
    setRows(d.projects || []);
    setEmailReady(d.emailReady !== false);
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);
  useEffect(() => { if (user) { setPhone(user.phone || ''); setConsent(user.phoneConsent); } }, [user]);

  if (!loaded) return <p className="text-text-muted">Loading your account…</p>;

  if (!ready) {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">Accounts are coming soon</h1>
        <p className="mt-3 text-text-muted">You will be able to follow towers and get an email when something changes. For now, <Link href="/contact-us" className="text-accent-green underline">contact us</Link> about any project.</p>
      </div>
    );
  }

  if (!user) {
    const expired = params.get('link') === 'expired';
    return (
      <div>
        <div className="max-w-xl">
          <h1 className="display-big text-text-primary">
            {expired ? 'That link has expired' : 'Follow the towers you care about'}
          </h1>
          <p className="mt-4 text-text-muted">
            {expired
              ? 'Sign-in links only work for a short time. Ask for a new one below.'
              : 'Create a free account to keep the towers you are watching in one list, with their prices, heights and completion dates side by side.'}
          </p>
          <button className="btn-primary mt-6" onClick={() => openSignup({ source: 'account-page' })}>Create account or sign in</button>
        </div>
        {!expired && (
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {[
              ['Find a tower', 'Open any project on the list or the 3D map.', '/new-condos', 'Browse new condos'],
              ['Press Follow', 'It takes a name and an email. No password to remember.', '/preconstruction-3d', 'Open the 3D map'],
              ['Compare them here', 'Your towers sit together on this page, and you can ask for prices on any of them.', '/tallest-buildings', 'See the tallest'],
            ].map(([t, d, href, label]) => (
              <div key={t} className="bg-surface p-6">
                <h2 className="text-lg font-semibold text-text-primary">{t}</h2>
                <p className="mt-2 text-sm text-text-muted">{d}</p>
                <Link href={href} className="mt-4 inline-block text-sm font-medium text-accent-green link-underline">{label}</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const savePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved('saving');
    const r = await fetch('/api/account/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, phoneConsent: consent }) });
    setSaved(r.ok ? 'saved' : 'error');
    if (r.ok) refresh();
  };

  const list = (rows || []).filter((p) => follows.has(p.id));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">Hi {user.name.split(' ')[0]}</h1>
          <p className="mt-2 text-text-muted">{user.email}</p>
        </div>
        <button onClick={signOut} className="btn-secondary !py-2 !px-4 text-sm">Sign out</button>
      </div>

      {params.get('confirmed') === '1' && (
        <p className="mt-6 rounded-xl border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm text-accent-green">Your email is confirmed.</p>
      )}
      {!user.emailVerifiedAt && params.get('confirmed') !== '1' && (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          {emailReady
            ? `Confirm your email with the link we sent to ${user.email}. Until you do, we cannot send you updates and you cannot sign in on another device.`
            : 'Your towers are saved on this device. Email confirmation and sign-in from other devices will be switched on shortly.'}
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-text-primary">Towers you follow</h2>
        {rows === null ? (
          <p className="mt-4 text-text-muted">Loading…</p>
        ) : list.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
            <p className="text-text-muted">You are not following any towers yet. Open a tower on the map or its page and press Follow.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/miami-3d" className="btn-primary text-sm">Open the 3D map</Link>
              <Link href="/new-condos" className="btn-secondary text-sm">Browse all projects</Link>
            </div>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id} className="card overflow-hidden flex flex-col">
                <Link href={`/properties/${p.slug}`} className="block h-40 bg-surface2">
                  <SafeImage src={thumbUrl(p.mainImageUrl)} alt={p.name} fallbackLabel={p.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link href={`/properties/${p.slug}`} className="text-lg font-semibold leading-tight text-text-primary hover:underline underline-offset-4">{p.name}</Link>
                  <p className="mt-1 text-sm text-text-muted">{[p.neighborhood?.name, STAGE[p.status] || p.status].filter(Boolean).join(', ')}</p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><dt className="text-xs text-text-muted">From</dt><dd className="tabular-nums text-text-primary">{p.priceMin ? formatPrice(p.priceMin) : 'On request'}</dd></div>
                    <div><dt className="text-xs text-text-muted">Height</dt><dd className="tabular-nums text-text-primary">{p.heightM ? `${Math.round(p.heightM * 3.28084).toLocaleString('en-US')} ft` : p.floors ? `${p.floors} fl` : 'n/a'}</dd></div>
                    <div><dt className="text-xs text-text-muted">Due</dt><dd className="tabular-nums text-text-primary">{p.estCompletion && /^\d{4}$/.test(p.estCompletion) ? p.estCompletion : 'TBD'}</dd></div>
                  </dl>
                  <div className="mt-4 flex gap-2 pt-1">
                    <Link href={`/properties/${p.slug}#inquire`} className="btn-primary flex-1 !py-2 text-sm">Ask for prices</Link>
                    <button onClick={() => toggleFollow(p.id)} className="btn-secondary !py-2 !px-3 text-sm">Unfollow</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 max-w-xl">
        <h2 className="text-xl font-semibold text-text-primary">Calls and texts</h2>
        <p className="mt-2 text-sm text-text-muted">Optional. Add a number if you would like a licensed agent to call or text you about the towers you follow.</p>
        <form onSubmit={savePhone} className="mt-4 space-y-3">
          <label className="block">
            <span className="sr-only">Phone number</span>
            <input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(''); }} type="tel" autoComplete="tel" placeholder="Phone number" className={INPUT} />
          </label>
          <label className="flex items-start gap-2.5 text-xs text-text-muted">
            <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setSaved(''); }} className="mt-0.5 h-4 w-4 accent-[#00E5B4]" />
            <span>I agree to receive calls and text messages from PreConstruction Miami at this number about the properties I follow. Consent is not a condition of any purchase. Message and data rates may apply. Reply STOP to opt out.</span>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saved === 'saving'} className="btn-secondary !py-2 text-sm disabled:opacity-50">{saved === 'saving' ? 'Saving…' : 'Save'}</button>
            {saved === 'saved' && <span className="text-sm text-accent-green">Saved</span>}
            {saved === 'error' && <span className="text-sm text-accent-orange">Check the number and try again.</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
