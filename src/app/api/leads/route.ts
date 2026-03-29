import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  projectId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        projectId: data.projectId || null,
        neighborhoodId: data.neighborhoodId || null,
        message: data.message || null,
        source: data.source || 'inquiry',
      },
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
