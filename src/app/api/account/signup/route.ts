import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { accountsReady, userByEmail, startSession, linkUrl } from '@/lib/account';
import { notifyNewLead, sendEmail, linkEmail } from '@/lib/notify';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  projectId: z.string().max(60).optional(),
  source: z.string().max(40).optional(),
  company: z.string().max(200).optional(), // honeypot
  elapsedMs: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    if (!accountsReady) return NextResponse.json({ error: 'Accounts are not available yet.' }, { status: 503 });
    if (!rateLimit(`signup:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
    }
    const data = schema.parse(await request.json());
    if (data.company || (typeof data.elapsedMs === 'number' && data.elapsedMs < 1200) || /https?:\/\/|www\./i.test(data.name)) {
      return NextResponse.json({ status: 'check_email', emailSent: true });
    }
    const email = data.email.toLowerCase();

    // An address that already has an account is never signed in from the form:
    // only the emailed link proves who owns it.
    const existing = await userByEmail(email);
    if (existing) {
      const sent = await sendEmail(email, 'Your PreConstruction Miami sign-in link', linkEmail(existing.name, linkUrl(existing.id, false), false));
      return NextResponse.json({ status: 'check_email', emailSent: sent });
    }

    const { data: created, error } = await supabaseAdmin
      .from('site_users')
      .insert({ email, name: data.name, lastSeenAt: new Date().toISOString() })
      .select('id')
      .single();
    if (error || !created) throw error || new Error('insert failed');

    let projectName: string | null = null;
    if (data.projectId) {
      const { data: project } = await supabaseAdmin.from('projects').select('id, name').eq('id', data.projectId).maybeSingle();
      if (project) {
        projectName = project.name;
        await supabaseAdmin.from('site_follows').insert({ userId: created.id, projectId: project.id });
      }
    }

    await startSession(created.id);

    // The signup is also a lead, so it shows up in the admin with everything else.
    await supabaseAdmin.from('leads').insert({
      name: data.name,
      email,
      projectId: projectName ? data.projectId : null,
      message: projectName ? `Created an account and followed ${projectName}.` : 'Created an account.',
      source: `account-${data.source || 'site'}`,
      status: 'new',
      priority: 'warm',
    });
    await notifyNewLead({ name: data.name, email, phone: null, message: 'Created an account', source: `account-${data.source || 'site'}`, projectName }).catch(() => {});

    const sent = await sendEmail(email, 'Confirm your PreConstruction Miami account', linkEmail(data.name, linkUrl(created.id, true), true));
    return NextResponse.json({ status: 'created', emailSent: sent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Check your name and email address.' }, { status: 400 });
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
