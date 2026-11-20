import { getPipeline, yearOf, STAGE_OF } from '@/lib/pipeline';

export const revalidate = 3600;

const cell = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function GET() {
  const { rows } = await getPipeline();
  const head = ['project', 'area', 'developer', 'stage', 'expected_completion_year', 'storeys', 'residences', 'starting_price_usd', 'url'];
  const lines = rows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => [p.name, p.neighborhood?.name, p.developer?.name, STAGE_OF[p.status] || p.status, yearOf(p), p.floors, p.totalUnits, p.soldOut ? '' : p.priceMin, `https://preconstructionmiami.net/properties/${p.slug}`].map(cell).join(','));
  return new Response([head.join(','), ...lines].join('\n') + '\n', {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="miami-condo-pipeline.csv"' },
  });
}
