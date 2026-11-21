// One name per architecture firm. Listings spell the same firm several ways; this maps each
// spelling to one profile. No imports: shared with tests.

const CANON: Record<string, string> = {
  'adrian smith + gordon gill': 'Adrian Smith + Gordon Gill Architecture',
  'adrian smith + gordon gill architecture': 'Adrian Smith + Gordon Gill Architecture',
  'acpv architects antonio citterio patricia viel': 'ACPV Architects (Antonio Citterio Patricia Viel)',
  'behar font and partners': 'Behar Font & Partners',
  'behar font': 'Behar Font & Partners',
  'cohen freedman encinosa & associates': 'CFE Architects',
  'cohen freedman encinosa & associates architects': 'CFE Architects',
  'cube3': 'CUBE 3',
  'fsmy architects': 'FSMY Architects + Planners',
  'kobi karp': 'Kobi Karp Architecture & Interior Design',
  'kobi karp architects': 'Kobi Karp Architecture & Interior Design',
  'kohn pedersen fox': 'Kohn Pedersen Fox (KPF)',
  'kpf': 'Kohn Pedersen Fox (KPF)',
  'luis revuelta': 'Revuelta Architecture International',
  'revuelta': 'Revuelta Architecture International',
  'revuelta architecture': 'Revuelta Architecture International',
  'mc+g architecture': 'Studio MC+G Architecture',
  'odp architects': 'ODP Architecture & Design',
  'odp architecture': 'ODP Architecture & Design',
  'rem koolhaas': 'OMA',
  'robert a.m. stern': 'Robert A.M. Stern Architects',
  'sieger suarez': 'Sieger Suarez Architects',
  'sieger suárez': 'Sieger Suarez Architects',
  'j scott architecture': 'J. Scott Architecture',
  'som (skidmore, owings & merrill)': 'Skidmore, Owings & Merrill (SOM)',
};

// Names that contain a separator and must not be split
const WHOLE = ['SOM (Skidmore, Owings & Merrill)'];

export function canonicalArchitect(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ');
  return CANON[t.toLowerCase()] || t;
}

/** "Carlos Ott / Sieger Suarez" → ["Carlos Ott", "Sieger Suarez Architects"]. Order kept, repeats dropped. */
export function splitArchitects(field: string | null | undefined): string[] {
  if (!field) return [];
  let s = field;
  const held: string[] = [];
  for (const w of WHOLE) if (s.includes(w)) { s = s.replace(w, `\u0000${held.length}`); held.push(w); }
  const parts = s.split(/\s+\/\s+|,\s+|\s+with\s+/i).map((p) => p.replace(/\u0000(\d+)/, (_, i) => held[Number(i)]));
  const out: string[] = [];
  for (const p of parts) { const c = canonicalArchitect(p); if (c && !out.includes(c)) out.push(c); }
  return out;
}

export function architectSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\+/g, ' ').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
