export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const agentId = searchParams.get('agentId');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select('*, project:projects(name, slug), neighborhood:neighborhoods(name, slug), assignedAgent:agents(id, name, email)')
      .order('createdAt', { ascending: false });

    // Agents can only see their own leads
    if (session.role !== 'admin') {
      query = query.eq('assignedAgentId', session.id);
    } else if (agentId) {
      query = query.eq('assignedAgentId', agentId);
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (search) {
      // Strip characters that have meaning in PostgREST filter syntax
      const term = search.replace(/[,()%*\\]/g, ' ').trim().slice(0, 80);
      if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Mask phone numbers for agents
    const leads = (data || []).map(lead => ({
      ...lead,
      phone: session.role === 'admin' ? lead.phone : lead.phone ? '***-***-' + lead.phone.slice(-4) : null,
    }));

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    // Only these fields may be changed through the API
    const EDITABLE = ['status', 'priority', 'notes', 'dealValue', 'assignedAgentId', 'phone', 'name', 'email', 'contactedAt'];
    const updates: Record<string, any> = {};
    for (const key of EDITABLE) if (key in body) updates[key] = body[key];

    // Agents can only update their assigned leads
    if (session.role !== 'admin') {
      const { data: lead } = await supabase.from('leads').select('assignedAgentId').eq('id', id).single();
      if (lead?.assignedAgentId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Agents cannot change assignedAgentId or see phone
      delete updates.assignedAgentId;
      delete updates.phone;
    }

    updates.updatedAt = new Date().toISOString();
    if (updates.status === 'contacted' && !updates.contactedAt) {
      updates.contactedAt = new Date().toISOString();
    }
    if (updates.status === 'closed' || updates.status === 'lost') {
      updates.closedAt = new Date().toISOString();
    }

    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Log status change
    if (updates.status) {
      await supabase.from('deal_activities').insert({
        leadId: id,
        agentId: session.id,
        type: 'status_change',
        content: `Status changed to ${updates.status}`,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    await supabase.from('deal_activities').delete().eq('leadId', id);
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
