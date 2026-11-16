import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyNewLead } from '@/lib/notify';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  projectId: z.string().max(60).optional(),
  neighborhoodId: z.string().max(60).optional(),
  message: z.string().trim().max(4000).optional(),
  source: z.string().max(60).optional(),
  // Anti-bot fields. `company` is a hidden honeypot real visitors never fill;
  // `elapsedMs` is how long the form was on screen before submit.
  company: z.string().max(200).optional(),
  elapsedMs: z.number().optional(),
});

/** Heuristics for the junk that hits unprotected forms. */
function looksLikeSpam(data: z.infer<typeof leadSchema>): boolean {
  if (data.company) return true;
  if (typeof data.elapsedMs === 'number' && data.elapsedMs < 1500) return true;
  // Bot signature seen on this site: name AND message are both a single random
  // mixed-case token such as "qKxYtRbnMZ". Requiring both keeps real one-word
  // names (e.g. "MacAllister") safe.
  const gibberish = (v: string) =>
    /^[A-Za-z]{10,}$/.test(v) && (v.match(/[A-Z]/g) || []).length >= 3 && /[a-z]/.test(v);
  if (gibberish(data.name) && (!data.message || gibberish(data.message))) return true;
  // Second bot signature: a throwaway Gmail address broken up with dots
  // ("a.z.o.q.ex.ip16@gmail.com") paired with a name that has no vowels pattern
  // of a real name ("Vxfs Usscv").
  const local = data.email.split('@')[0];
  const dottedGmail = /@gmail\.com$/i.test(data.email) && (local.match(/\./g) || []).length >= 4;
  const vowelRatio = (data.name.match(/[aeiou]/gi) || []).length / Math.max(1, data.name.replace(/[^a-z]/gi, '').length);
  if (dottedGmail && vowelRatio < 0.3) return true;
  if (/https?:\/\/|www\./i.test(data.name)) return true;
  if (data.message && (data.message.match(/https?:\/\//gi) || []).length >= 2) return true;
  return false;
}

async function autoAssignAgent(neighborhoodId: string | null | undefined): Promise<string | null> {
  if (!neighborhoodId) return null;

  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('slug')
    .eq('id', neighborhoodId)
    .single();
  if (!neighborhood) return null;

  const { data: agents } = await supabase
    .from('agents')
    .select('id, neighborhoods')
    .eq('isActive', true)
    .eq('role', 'agent');

  const matchingAgents = (agents || []).filter(
    (a: any) => Array.isArray(a.neighborhoods) && a.neighborhoods.includes(neighborhood.slug)
  );
  if (matchingAgents.length === 0) return null;

  const { data: leadCounts } = await supabase
    .from('leads')
    .select('assignedAgentId')
    .in('assignedAgentId', matchingAgents.map((a: any) => a.id));

  const counts: Record<string, number> = {};
  for (const a of matchingAgents) counts[a.id] = 0;
  for (const l of leadCounts || []) {
    if (l.assignedAgentId) counts[l.assignedAgentId] = (counts[l.assignedAgentId] || 0) + 1;
  }
  const sorted = matchingAgents.sort((a: any, b: any) => (counts[a.id] || 0) - (counts[b.id] || 0));
  return sorted[0]?.id || null;
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`lead:${clientIp(request)}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const body = await request.json();
    const data = leadSchema.parse(body);

    // Pretend success to bots so they do not adapt, but store nothing.
    if (looksLikeSpam(data)) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    let neighborhoodId = data.neighborhoodId;
    let projectName: string | null = null;
    if (data.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('name, neighborhoodId')
        .eq('id', data.projectId)
        .single();
      if (project) {
        projectName = project.name;
        if (!neighborhoodId) neighborhoodId = project.neighborhoodId;
      }
    }

    const assignedAgentId = await autoAssignAgent(neighborhoodId);

    // The id is generated here so the insert does not need to read the row back.
    const { error } = await supabase.from('leads').insert({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      projectId: data.projectId || null,
      neighborhoodId: data.neighborhoodId || null,
      message: data.message || null,
      source: data.source || 'inquiry',
      assignedAgentId,
      status: 'new',
      priority: 'warm',
    });
    if (error) throw error;

    // Alert the site owner. Never let a notification failure lose the lead.
    await notifyNewLead({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message || null,
      source: data.source || 'inquiry',
      projectName,
    }).catch((err) => console.error('Lead notification failed:', err));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
