import { supabase } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import { BUILDING_COLUMNS, type Building } from '@/lib/buildings';
import { splitArchitects, architectSlug } from '@/lib/architect-names';

export { splitArchitects, architectSlug };

export type Architect = { name: string; slug: string; projects: any[]; buildings: Building[] };

/** A firm gets its own page once it has two or more works on the site. */
export const hasProfile = (a: Architect) => a.projects.length + a.buildings.length >= 2;

/** Every architect named on a new project or a finished building, with their work. */
export async function allArchitects(): Promise<Architect[]> {
  const [{ data: ps }, { data: bs }] = await Promise.all([
    supabase.from('projects').select(`${CARD_COLUMNS}, architect, heightM`).not('architect', 'is', null).limit(2000),
    supabase.from('buildings').select(BUILDING_COLUMNS).not('architect', 'is', null).limit(2000),
  ]);
  const by = new Map<string, Architect>();
  const get = (name: string) => {
    const slug = architectSlug(name);
    if (!by.has(slug)) by.set(slug, { name, slug, projects: [], buildings: [] });
    return by.get(slug)!;
  };
  for (const p of (ps || []) as any[]) for (const n of splitArchitects(p.architect)) get(n).projects.push(p);
  for (const b of (bs || []) as unknown as Building[]) for (const n of splitArchitects(b.architect)) get(n).buildings.push(b);
  return [...by.values()].sort((a, b) => b.projects.length + b.buildings.length - (a.projects.length + a.buildings.length) || a.name.localeCompare(b.name));
}

export async function architectBySlug(slug: string): Promise<Architect | null> {
  return (await allArchitects()).find((a) => a.slug === slug) || null;
}

/** Slugs of the firms that have a page, for linking a name only when its page exists. */
export async function architectProfileSlugs(): Promise<Set<string>> {
  return new Set((await allArchitects()).filter(hasProfile).map((a) => a.slug));
}
