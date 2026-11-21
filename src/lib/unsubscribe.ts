import { createHmac, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { localDemo, readDemo, writeDemo } from '@/lib/local-demo';
import { sendEmail, emailConfigured } from '@/lib/notify';

const SITE = 'https://preconstructionmiami.net';
const secret = () => process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || (localDemo ? 'local-demo-only' : '');
const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (email: string) => createHmac('sha256', secret()).update(`unsub:${email}`).digest('base64url');

/** A link that unsubscribes one address without a login. */
export function unsubscribeUrl(email: string, base = SITE): string {
  const e = email.trim().toLowerCase();
  return `${base}/unsubscribe?e=${b64(e)}&t=${sign(e)}`;
}

export function emailFromToken(e: string | null, t: string | null): string | null {
  if (!e || !t || !secret()) return null;
  try {
    const email = Buffer.from(e, 'base64url').toString('utf8');
    const want = Buffer.from(sign(email)); const got = Buffer.from(t);
    return want.length === got.length && timingSafeEqual(want, got) ? email : null;
  } catch { return null; }
}

export async function isSuppressed(email: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (localDemo) return readDemo().suppressions.includes(e);
  const { data } = await supabaseAdmin.from('email_suppressions').select('email').eq('email', e).limit(1);
  return Boolean(data?.length);
}

export async function suppress(email: string): Promise<void> {
  const e = email.trim().toLowerCase();
  if (localDemo) { const d = readDemo(); if (!d.suppressions.includes(e)) { d.suppressions.push(e); writeDemo(d); } }
  else await supabaseAdmin.from('email_suppressions').upsert({ email: e });
}

/** The footer every marketing email carries: who sent it, a postal address and a one-click unsubscribe. */
export function emailFooter(email: string, postalAddress: string): string {
  return `<p style="margin-top:28px;padding-top:14px;border-top:1px solid #e3e6ea;font:12px/1.5 Arial,sans-serif;color:#5b6770">
You are receiving this because you asked Preconstruction Miami to email you about this project.<br>
<a href="${unsubscribeUrl(email)}" style="color:#111B33">Unsubscribe</a> at any time; it takes effect straight away.<br>
Preconstruction Miami, ${postalAddress}</p>`;
}

/**
 * Confirms a coming-soon sign-up. Sent only when email is set up AND a postal address is
 * configured (CAN-SPAM and CASL both require one), and never to an address that unsubscribed.
 */
export async function sendComingSoonConfirmation(email: string, projectName: string): Promise<boolean> {
  const postal = process.env.MAILING_ADDRESS;
  if (!emailConfigured || !postal || localDemo || (await isSuppressed(email))) return false;
  return sendEmail(email, `You are on the list for ${projectName}`,
    `<div style="font:15px/1.6 Arial,sans-serif;color:#1c2530"><p>Thanks for signing up. We will email you when sales open for <strong>${projectName}</strong>.</p>${emailFooter(email, postal)}</div>`);
}
