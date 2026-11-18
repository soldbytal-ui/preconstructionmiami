import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { currentUser } from '@/lib/account';
import { notifyNewLead } from '@/lib/notify';

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).regex(/^[0-9+()\-.\s]*$/).optional(),
  phoneConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    const data = schema.parse(await request.json());
    const patch: Record<string, unknown> = {};
    if (data.name) patch.name = data.name;
    if (data.phone !== undefined) {
      patch.phone = data.phone || null;
      // Calls and texts are only ever allowed with a number and an explicit yes.
      patch.phoneConsent = Boolean(data.phone) && data.phoneConsent === true;
    }
    if (!Object.keys(patch).length) return NextResponse.json({ ok: true });
    const { error } = await supabaseAdmin.from('site_users').update(patch).eq('id', user.id);
    if (error) throw error;
    if (data.phone && data.phone !== user.phone) {
      await supabaseAdmin.from('leads').insert({
        name: data.name || user.name,
        email: user.email,
        phone: data.phone,
        message: `Added a phone number to their account. Calls and texts: ${patch.phoneConsent ? 'agreed' : 'not agreed'}.`,
        source: 'account-phone',
        status: 'new',
        priority: 'hot',
      });
      await notifyNewLead({ name: user.name, email: user.email, phone: data.phone, message: `Added a phone number. Calls and texts: ${patch.phoneConsent ? 'agreed' : 'not agreed'}.`, source: 'account-phone', projectName: null }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Check the phone number.' }, { status: 400 });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
