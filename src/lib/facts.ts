import { formatPrice } from '@/lib/utils';

/**
 * Plain facts about a set of listings (an area's, or a developer's), worked out
 * from the listings themselves so the page text can never drift from the data.
 */
export type FactProject = {
  name: string; slug: string; status: string; soldOut?: boolean | null;
  floors: number | null; totalUnits: number | null; priceMin: number | null; estCompletion: string | null;
  developer?: { name: string; slug: string } | null;
  neighborhood?: { name: string; slug: string } | null;
};

export const STAGE: Record<string, string> = {
  PRE_LAUNCH: 'Planned', PRE_CONSTRUCTION: 'Planned', UNDER_CONSTRUCTION: 'Under construction',
  NEAR_COMPLETION: 'Nearly finished', COMPLETED: 'Completed',
};

// Names that contain commas themselves (joint ventures) are separated with semicolons so the list still reads clearly
const list = (xs: string[]) => {
  if (xs.length <= 2) return xs.join(' and ');
  const semi = xs.some((x) => x.includes(','));
  return semi ? `${xs.slice(0, -1).join('; ')}; and ${xs[xs.length - 1]}` : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
};
const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const year = (p: FactProject) => { const m = (p.estCompletion || '').match(/20\d\d/); return m ? Number(m[0]) : null; };

export function projectFacts(projects: FactProject[]) {
  const live = projects.filter((p) => p.status !== 'COMPLETED');
  const planned = live.filter((p) => p.status === 'PRE_LAUNCH' || p.status === 'PRE_CONSTRUCTION');
  const building = live.filter((p) => p.status === 'UNDER_CONSTRUCTION');
  const near = live.filter((p) => p.status === 'NEAR_COMPLETION');
  const done = projects.filter((p) => p.status === 'COMPLETED');
  const byFloors = [...projects].filter((p) => p.floors).sort((a, b) => (b.floors || 0) - (a.floors || 0));
  const priced = [...live].filter((p) => p.priceMin && !p.soldOut).sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
  const units = projects.reduce((s, p) => s + (p.totalUnits || 0), 0);
  const devs = new Map<string, { name: string; slug: string; count: number }>();
  for (const p of projects) if (p.developer?.slug) {
    const d = devs.get(p.developer.slug) || { ...p.developer, count: 0 };
    d.count++; devs.set(p.developer.slug, d);
  }
  const topDevs = [...devs.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const years = live.map(year).filter((y): y is number => Boolean(y));
  const thisYear = new Date().getFullYear();
  const nextUp = [...live].filter((p) => (year(p) || 0) >= thisYear).sort((a, b) => (year(a) || 0) - (year(b) || 0));
  return {
    total: projects.length, live, planned, building, near, done, byFloors, priced, units, topDevs, nextUp,
    tallest: byFloors[0] || null, cheapest: priced[0] || null, dearest: priced[priced.length - 1] || null,
    firstYear: years.length ? Math.min(...years) : null, lastYear: years.length ? Math.max(...years) : null,
  };
}

/** Two or three sentences that state the numbers. Used at the top of area and developer pages. */
export function summarySentences(where: string, f: ReturnType<typeof projectFacts>): string[] {
  const out: string[] = [];
  if (!f.total) return out;
  const parts = [
    f.planned.length && `${f.planned.length} planned`,
    f.building.length && `${f.building.length} under construction`,
    f.near.length && `${f.near.length} nearly finished`,
    f.done.length && `${f.done.length} completed`,
  ].filter(Boolean) as string[];
  out.push(`We track ${n(f.total, 'new condo project')} ${where}: ${list(parts)}.`);
  if (f.units) out.push(`Together they account for about ${f.units.toLocaleString()} residences.`);
  if (f.tallest?.floors) {
    const tied = f.byFloors.filter((p) => p.floors === f.tallest!.floors);
    out.push(tied.length > 1 ? `The tallest are ${list(tied.map((p) => p.name))}, each ${f.tallest.floors} storeys.` : `The tallest is ${f.tallest.name} at ${f.tallest.floors} storeys.`);
  }
  if (f.cheapest?.priceMin) {
    out.push(f.dearest && f.dearest !== f.cheapest
      ? `Published starting prices run from ${formatPrice(f.cheapest.priceMin)} at ${f.cheapest.name} to ${formatPrice(f.dearest.priceMin)} at ${f.dearest.name}.`
      : `The published starting price is ${formatPrice(f.cheapest.priceMin)} at ${f.cheapest.name}.`);
  }
  if (f.firstYear && f.lastYear) out.push(f.firstYear === f.lastYear ? `Expected completion is ${f.firstYear}.` : `Expected completion dates run from ${f.firstYear} to ${f.lastYear}.`);
  return out;
}

/** Questions a buyer or an AI assistant would ask about this set of projects, answered from the data. */
export function factFaqs(place: string, f: ReturnType<typeof projectFacts>): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  if (!f.total) return faqs;
  const names = (ps: FactProject[], k = 5) => (ps.length > k ? `${ps.slice(0, k).map((p) => p.name).join(', ')} and ${ps.length - k} more` : list(ps.map((p) => p.name)));
  faqs.push({
    question: `How many new condo projects are there in ${place}?`,
    answer: `PreConstructionMiami tracks ${n(f.total, 'new condo project')} in ${place}. ${f.planned.length ? `${n(f.planned.length, 'is', 'are')} planned` : 'None are still at the planning stage'}, ${f.building.length} under construction${f.near.length ? `, ${f.near.length} nearly finished` : ''}${f.done.length ? ` and ${f.done.length} recently completed` : ''}.`,
  });
  if (f.tallest?.floors) {
    const tied = f.byFloors.filter((p) => p.floors === f.tallest!.floors);
    const top = f.byFloors.slice(0, 3).map((p) => `${p.name} (${p.floors} storeys)`);
    faqs.push({
      question: `What is the tallest new tower in ${place}?`,
      answer: tied.length > 1
        ? `${list(tied.map((p) => p.name))} share the top spot at ${f.tallest.floors} storeys each.`
        : `${f.tallest.name} is the tallest at ${f.tallest.floors} storeys${f.tallest.developer ? `, developed by ${f.tallest.developer.name}` : ''}.${top.length > 1 ? ` The tallest in order are ${list(top)}.` : ''}`,
    });
  }
  if (f.cheapest?.priceMin) {
    const low = f.priced.slice(0, 3).map((p) => `${p.name} from ${formatPrice(p.priceMin)}`);
    faqs.push({ question: `How much do new condos in ${place} cost?`, answer: `The lowest published starting prices are ${list(low)}.${f.dearest && f.priced.length > 3 ? ` At the top end, ${f.dearest.name} starts from ${formatPrice(f.dearest.priceMin)}.` : ''} Developers change prices as buildings sell, so treat these as a guide and ask for the current price list.` });
  }
  if (f.building.length || f.near.length) {
    const under = [...f.near, ...f.building];
    faqs.push({ question: `Which condo towers are under construction in ${place}?`, answer: `${names(under, 8)} ${under.length === 1 ? 'is' : 'are'} being built now.${f.planned.length ? ` ${names(f.planned, 5)} ${f.planned.length === 1 ? 'has' : 'have'} not started construction.` : ''}` });
  }
  if (f.nextUp.length) {
    const soon = f.nextUp.slice(0, 4).map((p) => `${p.name} (${p.estCompletion})`);
    faqs.push({ question: `When will the new condos in ${place} be finished?`, answer: `The next expected completions are ${list(soon)}.${f.lastYear ? ` The latest date on our list is ${f.lastYear}.` : ''} Completion dates are developer estimates and often move.` });
  }
  if (f.topDevs.length) {
    const d = f.topDevs.slice(0, 5).map((x) => (x.count > 1 ? `${x.name} (${x.count} projects)` : x.name));
    faqs.push({ question: `Which developers are building in ${place}?`, answer: `${list(d)}${f.topDevs.length > 5 ? `, among ${f.topDevs.length} developers in total` : ''}.` });
  }
  return faqs;
}
