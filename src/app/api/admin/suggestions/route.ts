export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listSuggestions, decideSuggestion, matchableProjects } from '@/lib/agenda-store';
import { normalizeFolio } from '@/lib/agenda-match';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [pending, projects] = await Promise.all([listSuggestions('pending'), matchableProjects()]);
  return NextResponse.json({
    pending,
    projects: projects.map((p) => ({ id: p.id, name: p.name, slug: p.slug, folioNumber: p.folioNumber || null, applicantEntity: p.applicantEntity || null, hasAddress: Boolean(p.address), folioOk: Boolean(normalizeFolio(p.folioNumber)) })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !['approve', 'reject'].includes(body.action)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const done = await decideSuggestion(body.id, body.action, session.email);
  return done.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: done.error }, { status: 400 });
}
