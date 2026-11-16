export type MapProject = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  floors: number | null;
  totalUnits: number | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  category: string;
  address: string | null;
  developer: { name: string } | null;
  neighborhood: { name: string; slug: string } | null;
  neighborhoodId?: string | null;
  estCompletion: string | null;
  description: string | null;
  mainImageUrl: string | null;
  featured?: boolean;
};

export type BuildingsData = GeoJSON.FeatureCollection & { projects: Record<string, MapProject> };

export const STATUS_HEX: Record<string, string> = {
  PRE_LAUNCH: '#00E5B4',
  PRE_CONSTRUCTION: '#00E5B4',
  UNDER_CONSTRUCTION: '#38B6FF',
  NEAR_COMPLETION: '#FF7A3D',
  COMPLETED: '#8A9098',
};

export const LEGEND: { label: string; color: string }[] = [
  { label: 'Pre-construction', color: '#00E5B4' },
  { label: 'Under construction', color: '#38B6FF' },
  { label: 'Near completion', color: '#FF7A3D' },
  { label: 'Completed', color: '#8A9098' },
];

/** Mapbox expression: building colour by status. */
export const STATUS_COLOR_EXPR: any = [
  'match', ['get', 'status'],
  'PRE_LAUNCH', '#00E5B4', 'PRE_CONSTRUCTION', '#00E5B4',
  'UNDER_CONSTRUCTION', '#38B6FF', 'NEAR_COMPLETION', '#FF7A3D',
  'COMPLETED', '#8A9098', '#8A9098',
];

export function shortPrice(val: number | null | undefined): string {
  if (!val) return '';
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `$${Math.round(val / 1000)}K`;
}

let cache: Promise<BuildingsData | null> | null = null;

/** One shared request for every map on the page. */
export function loadBuildings(): Promise<BuildingsData | null> {
  if (!cache) {
    cache = fetch('/api/buildings-geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data && data.type === 'FeatureCollection' && data.projects ? (data as BuildingsData) : null))
      .catch(() => null);
    cache.then((d) => { if (!d) cache = null; });
  }
  return cache;
}

/** Dark context buildings from Mapbox's own data, under our coloured towers. */
export function addCityBuildings(map: any, id: string) {
  if (map.getLayer(id)) return;
  const layers = map.getStyle()?.layers || [];
  const labelLayerId = layers.find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])?.id;
  map.addLayer(
    {
      id,
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#16181e', 50, '#1e2028', 100, '#252730', 200, '#2d3040'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.7,
      },
    },
    labelLayerId
  );
}
