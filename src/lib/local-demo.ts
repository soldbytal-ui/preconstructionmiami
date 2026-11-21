import fs from 'fs';
import path from 'path';

/**
 * Local demo mode: fictional projects, a JSON file instead of the database, a stand-in admin,
 * and leads that are never stored. It exists so new features can be built and photographed
 * without touching production data. It cannot switch on in a Vercel deployment.
 */
export const localDemo = process.env.LOCAL_DEMO === '1' && !process.env.VERCEL;

const SEED = path.join(process.cwd(), 'fixtures', 'approval-demo.json');
const FILE = path.join(process.cwd(), '.local', 'approval-demo.json');

export type DemoProject = { id: string; slug: string; name: string; address: string; latitude: number; longitude: number; floors: number; totalUnits: number; neighborhood: string; developer: string; folioNumber?: string | null; applicantEntity?: string | null };
type DemoData = { projects: DemoProject[]; records: any[]; suppressions: string[]; suggestions?: any[] };

export function readDemo(): DemoData {
  try {
    if (!fs.existsSync(FILE)) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.copyFileSync(SEED, FILE); }
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { projects: [], records: [], suppressions: [] };
  }
}

export function writeDemo(data: DemoData) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

/** A fictional listing shaped like a row of the projects table, for the project page. */
export function demoListing(slug: string): any | null {
  const p = readDemo().projects.find((x) => x.slug === slug);
  if (!p) return null;
  return {
    ...p, status: 'PRE_CONSTRUCTION', category: 'CONDO', soldOut: false, images: [], mainImageUrl: null, floorPlans: null,
    priceMin: null, priceMax: null, estCompletion: null, unitTypes: null, depositStructure: '10% at contract, 10% at groundbreaking, 10% at top-off, balance at closing (example)',
    description: 'A fictional project used to demonstrate the approval-stage tracker. It does not exist.', longDescription: null,
    amenities: [], architect: null, heightM: null, neighborhoodId: null, developerId: null, faqJson: null, websiteUrl: null,
    neighborhood: { name: p.neighborhood, slug: 'demo' }, developer: { name: p.developer, slug: 'demo' }, createdAt: '2026-11-01', updatedAt: '2026-11-20',
  };
}
