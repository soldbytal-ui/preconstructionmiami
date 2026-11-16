export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId, message } = await request.json();
    if (!leadId || !message) return NextResponse.json({ error: 'leadId and message required' }, { status: 400 });

    const { data: lead } = await supabase.from('leads').select('id, name, phone, assignedAgentId').eq('id', leadId).single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (session.role !== 'admin' && lead.assignedAgentId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Twilio is not wired in yet. Say so rather than logging an activity that never happened.
    return NextResponse.json(
      { success: false, error: 'Texting from the CRM is not connected yet. Use the number on the lead for now.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('SMS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
