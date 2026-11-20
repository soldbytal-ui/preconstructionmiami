import { NextResponse } from 'next/server';
import { currentStages } from '@/lib/approval-store';

export const revalidate = 300;

/** Current, sourced approval stage for each project that has one. */
export async function GET() {
  return NextResponse.json(await currentStages());
}
