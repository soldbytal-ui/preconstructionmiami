import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { accountsReady, userByEmail, linkUrl } from '@/lib/account';
import { sendEmail, linkEmail, emailConfigured } from '@/lib/notify';

export async function POST(request: Request) {
  try {
    if (!accountsReady) return NextResponse.json({ error: 'Accounts are not available yet.' }, { status: 503 });
    if (!rateLimit(`login:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
    }
    const { email } = z.object({ email: z.string().trim().email().max(200) }).parse(await request.json());
    const user = await userByEmail(email.toLowerCase());
    if (user) await sendEmail(user.email, 'Your PreConstruction Miami sign-in link', linkEmail(user.name, linkUrl(user.id, false), false));
    // Same answer whether or not the address has an account.
    return NextResponse.json({ status: 'check_email', emailSent: emailConfigured });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
