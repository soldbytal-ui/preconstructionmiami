import { cookies } from 'next/headers';
import { supabaseAdmin, hasServiceRole } from '@/lib/supabase';
import { authConfigured, getUserSession, signUserToken, USER_COOKIE } from '@/lib/auth';

export const SITE = 'https://preconstructionmiami.net';

/** Accounts need a server key for the private tables and a signing secret. */
export const accountsReady = hasServiceRole && authConfigured;

export type SiteUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  phoneConsent: boolean;
  emailVerifiedAt: string | null;
};

const COLS = 'id, email, name, phone, phoneConsent, emailVerifiedAt';

export async function currentUser(): Promise<SiteUser | null> {
  if (!accountsReady) return null;
  const s = await getUserSession();
  if (!s) return null;
  const { data } = await supabaseAdmin.from('site_users').select(COLS).eq('id', s.uid).maybeSingle();
  return (data as SiteUser) || null;
}

export async function userByEmail(email: string): Promise<SiteUser | null> {
  const { data } = await supabaseAdmin.from('site_users').select(COLS).eq('email', email).maybeSingle();
  return (data as SiteUser) || null;
}

export async function startSession(uid: string) {
  const store = await cookies();
  store.set(USER_COOKIE, signUserToken(uid, 'session', '60d'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 24 * 3600,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

export function linkUrl(uid: string, firstTime: boolean): string {
  return `${SITE}/api/account/verify?token=${encodeURIComponent(signUserToken(uid, 'link', firstTime ? '7d' : '30m'))}`;
}
