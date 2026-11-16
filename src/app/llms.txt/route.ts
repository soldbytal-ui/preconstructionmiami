import { buildLlms } from '@/lib/llms';

export const revalidate = 3600;

export async function GET() {
  return new Response(await buildLlms(false), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
