export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveProjectIds } from '@/lib/agenda-store';
import { normalizeFolio } from '@/lib/agenda-match';

/** Save a project's folio number and applicant legal name, used to match agenda items. */
export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  if (typeof b.projectId !== 'string') return NextResponse.json({ error: 'Choose a project.' }, { status: 400 });
  const folioRaw = typeof b.folioNumber === 'string' ? b.folioNumber.trim() : '';
  if (folioRaw && !normalizeFolio(folioRaw)) return NextResponse.json({ error: 'A folio number has 13 digits, like 01-3137-031-0020.' }, { status: 400 });
  const f = normalizeFolio(folioRaw);
  const folio = f ? `${f.slice(0, 2)}-${f.slice(2, 6)}-${f.slice(6, 9)}-${f.slice(9)}` : null;
  const applicant = typeof b.applicantEntity === 'string' && b.applicantEntity.trim() ? b.applicantEntity.trim().slice(0, 200) : null;
  const saved = await saveProjectIds(b.projectId, folio, applicant);
  return saved.ok ? NextResponse.json({ success: true, folioNumber: folio, applicantEntity: applicant }) : NextResponse.json({ error: `Could not save: ${saved.error}` }, { status: 500 });
}
