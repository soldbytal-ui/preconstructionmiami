export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { validateStageInput, latestByProject, needsRecheck } from '@/lib/approval';
import { allStageRecords, saveStageRecord, stageableProjects } from '@/lib/approval-store';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [records, projects] = await Promise.all([allStageRecords(true), stageableProjects()]);
  const latest = latestByProject(records);
  return NextResponse.json({
    projects,
    current: Object.values(latest).map((r) => ({ ...r, recheck: needsRecheck(r) })),
    history: records.length,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const checked = validateStageInput(await request.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const saved = await saveStageRecord(checked.record, session.email);
  if (!saved.ok) return NextResponse.json({ error: `Could not save: ${saved.error}` }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
