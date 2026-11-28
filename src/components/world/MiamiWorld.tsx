'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EXISTING_DETAIL } from '@/lib/existing-detail';
import mapboxgl from 'mapbox-gl';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MapRef } from 'react-map-gl/mapbox';
import { type BuildingsData, type MapProject, loadBuildings, shortPrice } from '@/components/map/mapShared';
import { thumbUrl, STATUS_LABELS } from '@/lib/utils';
import { RESIDENTIAL_FLOOR_M } from '@/lib/massing';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// One colour family marks everything that is not built yet
const OFFPLAN = '#00A886';
const OFFPLAN_LINE = '#007F66';
const OFFPLAN_SOFT = '#62CDB6';

// The first entry is the opening view: from over Biscayne Bay looking at the mouth of the Miami River,
// Brickell on the left, Downtown on the right, Brickell Key in front. Close enough to tell towers apart.
const AREAS: { name: string; center: [number, number]; zoom: number; bearing: number; pitch?: number; phoneZoom?: number }[] = [
  { name: 'Brickell & Downtown, from the bay', center: [-80.1905, 25.7702], zoom: 15.02, bearing: -82, pitch: 62, phoneZoom: 15.0 },
  { name: 'All of Miami', center: [-80.1870, 25.7830], zoom: 12.4, bearing: -30, pitch: 48, phoneZoom: 11.6 },
  { name: 'Downtown Miami', center: [-80.1895, 25.7765], zoom: 15.2, bearing: -30 },
  { name: 'Brickell', center: [-80.1925, 25.7635], zoom: 15.2, bearing: -20 },
  { name: 'Edgewater', center: [-80.1885, 25.7985], zoom: 15, bearing: -70 },
  { name: 'Midtown & Wynwood', center: [-80.1945, 25.8055], zoom: 15, bearing: -30 },
  { name: 'Miami Beach', center: [-80.1325, 25.7935], zoom: 14.3, bearing: 60 },
  { name: 'Coconut Grove', center: [-80.2385, 25.7285], zoom: 15, bearing: -20 },
  { name: 'Coral Gables', center: [-80.2595, 25.7495], zoom: 14.8, bearing: -10 },
  { name: 'Sunny Isles Beach', center: [-80.1225, 25.9435], zoom: 14.6, bearing: 70 },
  { name: 'Fort Lauderdale', center: [-80.1375, 26.1205], zoom: 14.2, bearing: -20 },
];

/** Perceived brightness of a hex colour, 0..1. */
function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function heightOf(data: BuildingsData, id: string): number {
  let top = 0;
  for (const f of data.features) if ((f.properties as any).id === id) top = Math.max(top, (f.properties as any).height);
  return top;
}

/** Sun direction for a place and time (standard low-precision solar formulas). */
function sunAt(lat: number, lng: number, date: Date): { alt: number; az: number } {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545; // days since J2000
  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const ha = ((gmst * 15 + lng) * rad - ra);
  const la = lat * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
  return { alt: alt / rad, az: ((az / rad) % 360 + 360) % 360 };
}

/** Hours of direct sun on a facade facing `bearing`, before any shading by other buildings. */
function sunHours(lat: number, lng: number, bearing: number, month: number): number {
  let minutes = 0;
  for (let m = 0; m < 1440; m += 10) {
    const s = sunAt(lat, lng, new Date(Date.UTC(2026, month, 21, 0, m)));
    if (s.alt <= 2) continue;
    const diff = Math.abs(((s.az - bearing + 540) % 360) - 180);
    if (diff < 80) minutes += 10;
  }
  return Math.round((minutes / 60) * 2) / 2;
}

/** Sun and sky light for the whole scene. Buildings cast real shadows on the ground and on each other. */
function applyLights(map: any, o: { az: number; alt: number; night: boolean; shadows?: boolean }) {
  const up = o.alt > 0 && !o.night;
  const low = Math.max(0, Math.min(1, o.alt / 18));
  const warm = up && low < 1 ? `rgb(255, ${Math.round(226 + 24 * low)}, ${Math.round(196 + 44 * low)})` : '#fff6e8';
  try {
    map.setLights([
      { id: 'sky', type: 'ambient', properties: { color: o.night ? '#aab6e0' : '#f3f1ee', intensity: o.night ? 0.5 : up ? 0.66 : 0.3 } },
      {
        id: 'sun', type: 'directional',
        properties: {
          color: o.night ? '#c9d2ff' : warm,
          intensity: o.night ? 0.25 : up ? 0.5 + 0.2 * low : 0.12,
          direction: [up ? o.az : 200, up ? Math.min(78, Math.max(18, 90 - o.alt)) : 40],
          'cast-shadows': !o.night && !!o.shadows, 'shadow-intensity': up ? 0.5 : 0.15,
        },
      },
    ]);
  } catch { /* older engines keep the flat light */ }
}

/** Day colours for the base map: warm ground, asphalt streets, green parks, still water. Distant labels are dropped when the map is tilted. */
function paintScene(map: any) {
  for (const l of map.getStyle()?.layers || []) {
    const id: string = l.id, src: string = (l as any)['source-layer'] || '';
    if (id.startsWith('w-') || id === 'city') continue;
    try {
      if (l.type === 'background') map.setPaintProperty(id, 'background-color', '#E7E1D3');
      else if (l.type === 'fill' && (src === 'water' || id === 'water')) map.setPaintProperty(id, 'fill-color', '#8DBCD8');
      else if (l.type === 'fill' && /park|landuse|landcover|national|pitch|grass/.test(id + src)) map.setPaintProperty(id, 'fill-color', '#C5D6AC');
      else if (l.type === 'fill' && src === 'building') map.setPaintProperty(id, 'fill-color', '#E4DED0');
      else if (l.type === 'line' && /road|bridge|tunnel|street/.test(id)) map.setPaintProperty(id, 'line-color', /case/.test(id) ? '#D3CDBF' : /pedestrian|path|steps/.test(id) ? '#D9D3C6' : '#A8A49B');
      else if (l.type === 'symbol') {
        // With the map tilted, names far from the centre pile up along the horizon; keep the near ones
        const f = map.getFilter(id);
        const near = ['case', ['<', ['pitch'], 35], true, ['<', ['distance-from-center'], 0.35]];
        map.setFilter(id, f ? ['all', f, near] : near);
      }
    } catch { /* a layer without this property */ }
  }
}

export default function MiamiWorld() {
  const mapRef = useRef<MapRef>(null);
  const [data, setData] = useState<BuildingsData | null>(null);
  const [selected, setSelected] = useState<MapProject | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [floor, setFloor] = useState(10);
  const [view, setView] = useState<{ bearing: number; pitch?: number } | null>(null);
  const [mix, setMix] = useState<{ water: number; existing: number; future: number; open: number } | null>(null);
  const drag = useRef<{ x: number; y: number; bearing: number; pitch: number } | null>(null);
  const [area, setArea] = useState(0);
  // A phone-width screen gets a one-line panel; the rest opens on request
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;
  const [more, setMore] = useState(false);       // phone: the rest of the panel
  const [sunOpen, setSunOpen] = useState(false); // sun study, tucked away until wanted
  const [q, setQ] = useState('');
  // Time of day for the sun: Miami clock hour, and June (5) or December (11)
  const [sunHour, setSunHour] = useState(13);
  const [sunMonth, setSunMonth] = useState(5);
  const [loaded, setLoaded] = useState(false);
  // Night view: the same city after dark, with the new towers in their real colours
  const [night, setNight] = useState(false);
  // Aerial imagery in place of the drawn base map. Same map, same camera: only the ground changes
  const [sat, setSat] = useState(false);
  const [fx, setFx] = useState(false);   // cast shadows, once the first view has been drawn
  const satHidden = useRef<string[]>([]);
  // Finished towers that have a profile page, and which stage of building the map is showing
  const [existing, setExisting] = useState<GeoJSON.FeatureCollection | null>(null);
  const [selB, setSelB] = useState<{ name: string; slug: string; floors?: number; yearBuilt?: number; heightM?: number; developer?: string } | null>(null);
  const [stage, setStage] = useState<'all' | 'planned' | 'building' | 'done'>('all');
  // The base-map building under the selected existing tower, painted in the accent colour so it can be told apart
  const [hlId, setHlId] = useState<number | string | null>(null);
  // Towers with a detailed glass model, and the one currently shown that way (selected, or the nearest when zoomed in)
  const [detail, setDetail] = useState<Record<string, any>>({});
  const [nearDetail, setNearDetail] = useState<string | null>(null);
  const [detailBase, setDetailBase] = useState<number[]>([]);   // base-map shapes the shown model stands in for
  const detailRef = useRef<{ id: string; setSun: (s: { alt: number; az: number }, night: boolean) => void; hit: (x: number, y: number) => boolean } | null>(null);
  const dayPaint = useRef<Record<string, Record<string, any>>>({});
  const [isTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

  useEffect(() => {
    let alive = true;
    loadBuildings().then((d) => { if (alive) setData(d); });
    if (new URLSearchParams(window.location.search).get('detail') !== '0') {
      // Finished towers with a hand-built model are keyed "b:<slug>" beside the new projects
      const built = Object.fromEntries(Object.entries(EXISTING_DETAIL).map(([slug, d]) => [`b:${slug}`, { id: `b:${slug}`, slug, ...d }]));
      setDetail(built);
      fetch('/api/tower-detail').then((r) => r.json()).then((d) => { if (alive && d && typeof d === 'object') setDetail({ ...d, ...built }); }).catch(() => {});
    }
    fetch('/api/existing-buildings').then((r) => r.json()).then((d) => { if (alive) setExisting(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Recolour every tower part into the off-plan family, keeping the banding
  const towers = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!data) return null;
    return {
      type: 'FeatureCollection',
      features: data.features.map((f) => {
        const p = f.properties as any;
        const c = p.color ? (lum(p.color) > 0.62 ? OFFPLAN_SOFT : lum(p.color) < 0.3 ? OFFPLAN_LINE : OFFPLAN) : OFFPLAN;
        return { ...f, properties: { ...p, c } };
      }),
    };
  }, [data]);

  // A dashed lot outline under every project
  const lots = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!data) return null;
    const seen = new Set<string>();
    const feats: GeoJSON.Feature[] = [...(data.pads?.features || [])];
    for (const f of feats) seen.add((f.properties as any).id);
    for (const f of data.features) {
      const p = f.properties as any;
      if (seen.has(p.id) || p.base !== 0) continue;
      seen.add(p.id);
      feats.push({ type: 'Feature', geometry: f.geometry, properties: { id: p.id } });
    }
    return { type: 'FeatureCollection', features: feats };
  }, [data]);

  // Set the scene up as soon as the map's style has arrived, not after every tile has been drawn. Doing it late meant
  // the city was drawn once in the stock grey, then drawn again with our colours, buildings and labels.
  const started = useRef(false);
  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || started.current || !(map as any).style?._loaded) return;
    started.current = true;
    (window as any).__pcmWorld = map;
    setLoaded(true);
    map.setFog({ color: '#e6edf2', 'high-color': '#bcd3e6', 'horizon-blend': 0.08, 'space-color': '#dce8f2', 'star-intensity': 0 } as any);
    applyLights(map, { az: 135, alt: 60, night: false });
    // Shadows are the costly part of the scene: draw the city first, then switch them on. Phones go without
    if (!isTouch) map.once('idle', () => setFx(true));
    paintScene(map);
    if (!map.getLayer('city')) {
      const labelId = (map.getStyle()?.layers || []).find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])?.id;
      map.addLayer(
        {
          id: 'city',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', ['get', 'extrude'], 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#F6F1E6', 60, '#FAF7EF', 200, '#FFFDF8'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 1,
            'fill-extrusion-vertical-gradient': true,
            'fill-extrusion-ambient-occlusion-intensity': 0.55,
            'fill-extrusion-ambient-occlusion-radius': 5,
            'fill-extrusion-ambient-occlusion-ground-radius': 8,
            'fill-extrusion-ambient-occlusion-wall-radius': 5,
          } as any,
        },
        labelId
      );
    }
  }, []);

  // Old base-map buildings on project lots are hidden
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !data || !map.getLayer('city')) return;
    const base: any = ['==', ['get', 'extrude'], 'true'];
    const ids = [...(data.hiddenBaseIds || []), ...(hlId != null ? [hlId] : []), ...detailBase];
    map.setFilter('city', ids.length ? ['all', base, ['!', ['in', ['id'], ['literal', ids]]]] : base);
  }, [data, hlId, detailBase]);

  // Find the base-map building that stands on the selected existing tower's spot
  useEffect(() => {
    const map = mapRef.current?.getMap();
    const f = selB && existing?.features.find((x) => (x.properties as any).slug === selB.slug);
    if (!map || !f) { setHlId(null); return; }
    const [lng, lat] = (f.geometry as any).coordinates as [number, number];
    const inside = (ring: number[][]) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c; } return c; };
    let cancelled = false;
    const find = () => {
      if (cancelled) return;
      let best: { id: any; h: number } | null = null;
      for (const b of map.querySourceFeatures('composite', { sourceLayer: 'building' })) {
        if (b.id == null || (b.properties as any)?.extrude !== 'true') continue;
        const polys = b.geometry.type === 'Polygon' ? [b.geometry.coordinates] : b.geometry.type === 'MultiPolygon' ? b.geometry.coordinates : [];
        if (polys.some((poly: any) => inside(poly[0]))) { const h = Number((b.properties as any).height) || 0; if (!best || h > best.h) best = { id: b.id, h }; }
      }
      setHlId(best ? best.id : null);
    };
    find();
    map.on('idle', find); // tiles for the spot may still be loading while the camera flies in
    return () => { cancelled = true; map.off('idle', find); };
  }, [selB, existing]);

  const pick = useCallback((e: MapMouseEvent) => {
    let id = (e.features?.[0]?.properties as any)?.id;
    // The detailed tower is drawn by its own layer, so it is hit-tested against its real shape
    if (!id && detailRef.current?.hit(e.point.x, e.point.y)) id = detailRef.current.id;
    return (id && data?.projects[id]) || null;
  }, [data]);

  const onClick = useCallback((e: MapMouseEvent) => {
    if (view) return;
    const f = e.features?.[0];
    if (f && (f.layer?.id === 'w-ex-pad' || f.layer?.id === 'w-ex-label')) { setSelected(null); setSelB(f.properties as any); return; }
    // A finished tower drawn as a detailed model is clicked on its real shape
    const shown = detailRef.current;
    if (!f && shown?.id.startsWith('b:') && shown.hit(e.point.x, e.point.y)) {
      const b = existing?.features.find((x) => `b:${(x.properties as any).slug}` === shown.id);
      if (b) { setSelected(null); setSelB(b.properties as any); return; }
    }
    setSelB(null);
    const p = pick(e);
    setSelected(p);
    if (p && data) {
      const floors = p.floors || Math.max(4, Math.round(heightOf(data, p.id) / RESIDENTIAL_FLOOR_M));
      setFloor(Math.max(2, Math.round(floors / 2)));
    }
  }, [pick, data, view, existing]);

  // /miami-3d?project=<slug> opens the map on that tower
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || !data || !loaded) return;
    const slug = new URLSearchParams(window.location.search).get('project');
    if (!slug) return;
    const p = Object.values(data.projects).find((x) => x.slug === slug);
    deepLinked.current = true;
    if (!p) return;
    setSelected(p);
    const h = heightOf(data, p.id);
    const floors = p.floors || Math.max(4, Math.round(h / RESIDENTIAL_FLOOR_M));
    setFloor(Math.max(2, Math.round(floors / 2)));
    mapRef.current?.getMap().flyTo({ center: [p.longitude, p.latitude], zoom: h > 150 ? 16 : 16.8, pitch: 62, duration: 1800 });
  }, [data, loaded]);

  // /miami-3d?building=<slug> opens the map on that existing tower and highlights it
  const deepLinkedB = useRef(false);
  useEffect(() => {
    if (deepLinkedB.current || !existing || !loaded) return;
    const slug = new URLSearchParams(window.location.search).get('building');
    if (!slug) return;
    deepLinkedB.current = true;
    const f = existing.features.find((x) => (x.properties as any).slug === slug);
    if (!f) return;
    setSelected(null); setSelB(f.properties as any);
    const h = Number((f.properties as any).heightM) || 0;
    mapRef.current?.getMap().flyTo({ center: (f.geometry as any).coordinates, zoom: h > 150 ? 16 : 16.6, pitch: 62, bearing: -20, duration: 1800 });
  }, [existing, loaded]);

  const selHeight = selected && data ? heightOf(data, selected.id) : 0;
  const selFloors = selected ? selected.floors || Math.max(4, Math.round(selHeight / RESIDENTIAL_FLOOR_M)) : 0;
  const eyeM = selFloors ? Math.round((floor / selFloors) * selHeight) : 0;

  // Closer look: frame the whole tower, base included, from the side with the least standing in front of it
  const closer = () => {
    const map = mapRef.current?.getMap();
    if (!selected || !map) return;
    const h = Math.max(30, selHeight), lat = selected.latitude, lng = selected.longitude;
    const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110540;
    // Buildings between a camera and the tower hide its base. Score eight directions by what stands in each.
    const score = new Array(8).fill(0);
    const seen = new Set<any>();
    for (const b of map.querySourceFeatures('composite', { sourceLayer: 'building' })) {
      if (b.id == null || seen.has(b.id) || (b.properties as any)?.extrude !== 'true') continue;
      seen.add(b.id);
      const ring: any = b.geometry.type === 'Polygon' ? b.geometry.coordinates[0] : b.geometry.type === 'MultiPolygon' ? b.geometry.coordinates[0][0] : null;
      if (!ring) continue;
      const dx = (ring[0][0] - lng) * kx, dy = (ring[0][1] - lat) * ky, d = Math.hypot(dx, dy);
      if (d < 45 || d > 420) continue;
      const dir = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;                 // compass direction of the building from the tower
      for (let i = 0; i < 8; i++) { const off = Math.abs(((dir - i * 45 + 540) % 360) - 180); if (off < 32) score[i] += (Number((b.properties as any).height) || 10) / d; }
    }
    if (data) for (const f of data.features as any[]) {                       // our own towers block the view as well
      const pr = f.properties; if (!pr || pr.id === selected.id || seen.has('t' + pr.id)) continue;
      seen.add('t' + pr.id);
      const c = f.geometry.coordinates[0][0], dx = (c[0] - lng) * kx, dy = (c[1] - lat) * ky, d = Math.hypot(dx, dy);
      if (d < 45 || d > 420) continue;
      const dir = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      for (let i = 0; i < 8; i++) { const off = Math.abs(((dir - i * 45 + 540) % 360) - 180); if (off < 32) score[i] += heightOf(data, pr.id) / d; }
    }
    const side = score.indexOf(Math.min(...score));                                    // the camera stands on this side...
    const bearing = (side * 45 + 180) % 360;                                           // ...and looks back at the tower
    const mapH = map.getContainer().clientHeight, pitch = 76;
    const pxPerM = ((2 ** 16 * 512) / 40075016 / Math.cos((lat * Math.PI) / 180)) * Math.sin((pitch * Math.PI) / 180);
    const zoom = Math.max(15, Math.min(18, 16 + Math.log2((mapH * 0.36) / (h * pxPerM))));   // the tower stands nearer the eye than the ground it is measured on, hence the small share
    map.flyTo({ center: [lng, lat], zoom, pitch, bearing, offset: [isTouch ? 0 : -40, mapH * 0.34], duration: 1800 });
  };

  // Stand inside the tower at the chosen floor and look out
  const lookFrom = useCallback((bearing: number, pitch = 84) => {
    const map = mapRef.current?.getMap();
    if (!map || !selected) return;
    const cam = map.getFreeCameraOptions();
    cam.position = mapboxgl.MercatorCoordinate.fromLngLat([selected.longitude, selected.latitude], Math.max(6, eyeM) + 1.6);
    cam.setPitchBearing(pitch, bearing); // 84 is a near-level gaze, slightly down toward the city
    map.setFreeCameraOptions(cam);
  }, [selected, eyeM]);

  useEffect(() => { if (view) lookFrom(view.bearing, view.pitch); }, [view, lookFrom]);

  // Drag (or swipe) to look around from the floor
  const onLookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!view) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, bearing: view.bearing, pitch: view.pitch ?? 84 };
  };
  const lookAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current!;
    return {
      bearing: d.bearing - (e.clientX - d.x) * 0.22,
      pitch: Math.max(55, Math.min(88, d.pitch + (e.clientY - d.y) * 0.12)),
    };
  };
  const onLookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const v = lookAt(e);
    lookFrom(v.bearing, v.pitch);
  };
  const onLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const v = lookAt(e);
    drag.current = null;
    setView(v);
  };

  // What fills the view in this direction: sample the screen and see what each point lands on
  useEffect(() => {
    if (!view) { setMix(null); return; }
    const map = mapRef.current?.getMap();
    if (!map) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled || drag.current) return;
      const c = map.getCanvas();
      const w = c.clientWidth, h = c.clientHeight;
      const waterLayers = (map.getStyle()?.layers || []).filter((l: any) => l['source-layer'] === 'water' || l.id === 'water').map((l: any) => l.id);
      const n = { water: 0, existing: 0, future: 0, open: 0 };
      const COLS = 28, ROWS = 14;
      for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
        const pt: [number, number] = [((i + 0.5) / COLS) * w, ((j + 0.5) / ROWS) * h];
        if (map.queryRenderedFeatures(pt, { layers: ['w-towers'] }).length) n.future++;
        else if (map.getLayer('city') && map.queryRenderedFeatures(pt, { layers: ['city'] }).length) n.existing++;
        else if (waterLayers.length && map.queryRenderedFeatures(pt, { layers: waterLayers }).length) n.water++;
        else n.open++;
      }
      const t = COLS * ROWS;
      setMix({ water: Math.round((n.water / t) * 100), existing: Math.round((n.existing / t) * 100), future: Math.round((n.future / t) * 100), open: Math.round((n.open / t) * 100) });
    };
    map.once('idle', measure);
    const fallback = window.setTimeout(measure, 2500);
    return () => { cancelled = true; window.clearTimeout(fallback); map.off('idle', measure); };
  }, [view, floor]);

  const exitView = () => {
    setView(null);
    if (selected) mapRef.current?.getMap().easeTo({ center: [selected.longitude, selected.latitude], zoom: 15.8, pitch: 60, bearing: -25, duration: 900 });
  };

  const goArea = (i: number) => {
    setArea(i);
    setView(null);
    const a = AREAS[i];
    mapRef.current?.getMap().flyTo({ center: a.center, zoom: narrow && a.phoneZoom ? a.phoneZoom : a.zoom, bearing: a.bearing, pitch: a.pitch ?? 60, duration: 2200 });
  };

  useEffect(() => {
    if (selected || selB) document.body.dataset.mapcard = '1'; else delete document.body.dataset.mapcard;
    return () => { delete document.body.dataset.mapcard; };
  }, [selected, selB]);

  // Search: an area name jumps there, a project name selects that tower
  const names = useMemo(() => (data ? Object.values(data.projects).map((p) => p.name).sort() : []), [data]);
  const search = (text: string) => {
    setQ(text);
    const t = text.trim().toLowerCase();
    if (t.length < 3) return;
    const ai = AREAS.findIndex((a) => a.name.toLowerCase() === t);
    if (ai >= 0) { goArea(ai); setQ(''); return; }
    const p = data && Object.values(data.projects).find((x) => x.name.toLowerCase() === t);
    if (p && p.latitude && p.longitude) {
      setView(null); setSelB(null); setSelected(p); setStage('all'); setQ(''); setMore(false);
      mapRef.current?.getMap().flyTo({ center: [p.longitude, p.latitude], zoom: 16, pitch: 62, duration: 1800 });
    }
  };

  const active = selected?.id || hovered;
  // In view mode the tower you are standing in is hidden so it does not block the view
  const PLANNED = ['PRE_LAUNCH', 'PRE_CONSTRUCTION'];
  const stageSet = stage === 'planned' ? PLANNED : stage === 'building' ? ['UNDER_CONSTRUCTION', 'NEAR_COMPLETION'] : stage === 'done' ? ['COMPLETED'] : null;
  const inStage: any = stageSet ? ['in', ['get', 'status'], ['literal', stageSet]] : ['has', 'id'];
  const notSelected: any = view && selected ? ['!=', ['get', 'id'], selected.id] : ['has', 'id'];
  // Towers that have not broken ground are drawn slightly see-through; everything else is solid
  const isPlanned: any = ['in', ['get', 'status'], ['literal', PLANNED]];
  // The tower shown as a detailed model: the selected one if it has a model, otherwise the nearest when zoomed in
  const detailId = view ? null : selected && detail[selected.id] ? selected.id : selB && !selected && detail[`b:${selB.slug}`] ? `b:${selB.slug}` : nearDetail;
  useEffect(() => { setDetailBase((detailId && detail[detailId]?.baseIds) || []); }, [detailId, detail]);
  const notDetail: any = detailId ? ['!=', ['get', 'id'], detailId] : ['has', 'id'];
  const towerFilter: any = ['all', notSelected, notDetail, inStage, ['!', isPlanned]];
  const plannedFilter: any = ['all', notSelected, notDetail, inStage, isPlanned];
  const stageIds = data && stageSet ? Object.values(data.projects).filter((p) => stageSet.includes(p.status)).map((p) => p.id) : null;
  const lotFilter: any = stageIds ? ['in', ['get', 'id'], ['literal', stageIds]] : ['has', 'id'];
  const showExisting = !view && (stage === 'all' || stage === 'done');
  // Towers are always drawn in the tones read from their own rendering; stage and selection show at the base, on the lot outline
  const towerColor: any = ['coalesce', ['get', 'color'], ['get', 'c']];
  // Move the light with the chosen time, so each facade brightens and darkens as it would through the day
  const sun = useMemo(() => {
    const c = AREAS[area].center;
    const utc = sunHour + (sunMonth === 5 ? 4 : 5); // Miami is UTC-4 in June, UTC-5 in December
    return sunAt(c[1], c[0], new Date(Date.UTC(2026, sunMonth, 21, Math.floor(utc), Math.round((utc % 1) * 60))));
  }, [area, sunHour, sunMonth]);
  // When zoomed in, the nearest tower with a detailed model switches to it without needing a click
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !loaded) return;
    const pickNear = () => {
      const ids = Object.keys(detail);
      if (!ids.length || map.getZoom() < 15.3) { setNearDetail(null); return; }
      const c = map.getCenter();
      let best: string | null = null, bd = 900; // metres
      for (const id of ids) {
        const [lng, lat] = detail[id].center;
        const d = Math.hypot((lng - c.lng) * 111320 * Math.cos((lat * Math.PI) / 180), (lat - c.lat) * 110540);
        if (d < bd) { bd = d; best = id; }
      }
      setNearDetail(best);
    };
    pickNear();
    map.on('moveend', pickNear);
    return () => { map.off('moveend', pickNear); };
  }, [detail, loaded]);

  // Load the detailed model only when it is needed, and swap it in for the simple tower
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !loaded) return;
    let cancelled = false;
    const remove = () => { if (map.getLayer('w-detail')) map.removeLayer('w-detail'); detailRef.current = null; };
    if (!detailId || !detail[detailId]) { remove(); return; }
    import('./detailTower').then(({ createDetailLayer }) => {
      if (cancelled) return;
      remove();
      const made = createDetailLayer('w-detail', detail[detailId], { night, sun });
      map.addLayer(made.layer, map.getLayer('w-ex-pad') ? 'w-ex-pad' : undefined);
      detailRef.current = { id: detailId, setSun: made.setSun, hit: made.hit };
    }).catch((e) => { console.warn('detail tower', e); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId, detail, loaded, night]);
  useEffect(() => { detailRef.current?.setSun(sun, night); }, [sun, night]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!loaded || !map || night) return;
    const up = sun.alt > 0;
    const low = Math.max(0, Math.min(1, sun.alt / 18)); // 0 at the horizon, 1 once the sun is well up
    const mix = (a: number, b: number) => Math.round(a + (b - a) * low);
    const color = up ? `rgb(255, ${mix(236, 255)}, ${mix(214, 255)})` : '#aebbd8';
    applyLights(map, { az: sun.az, alt: sun.alt, night: false, shadows: fx });
    map.setFog(
      (up
        ? { color: low < 1 ? `rgb(${mix(243, 230)}, ${mix(214, 237)}, ${mix(190, 242)})` : '#e6edf2', 'high-color': '#bcd3e6', 'horizon-blend': 0.08, 'space-color': '#dce8f2', 'star-intensity': 0 }
        : { color: '#3a4763', 'high-color': '#1f2a44', 'horizon-blend': 0.1, 'space-color': '#141c30', 'star-intensity': 0.4 }) as any
    );
  }, [loaded, sun, night, fx]);

  // Repaint the base map for night and put the day colours back afterwards
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!loaded || !map) return;
    const set = (id: string, prop: string, value: any) => {
      try {
        const saved = (dayPaint.current[id] ||= {});
        if (!(prop in saved)) saved[prop] = map.getPaintProperty(id, prop as any) ?? null;
        map.setPaintProperty(id, prop as any, value);
      } catch { /* a layer without this property */ }
    };
    if (night) {
      for (const l of map.getStyle()?.layers || []) {
        const id = l.id, src = (l as any)['source-layer'] || '';
        if (id.startsWith('w-')) continue;
        if (l.type === 'background') set(id, 'background-color', '#1D2233');
        else if (l.type === 'fill' && (src === 'water' || id === 'water')) set(id, 'fill-color', '#14234A');
        else if (l.type === 'fill' && /landuse|park|landcover|national/.test(id + src)) set(id, 'fill-color', '#232B3C');
        else if (l.type === 'fill') set(id, 'fill-color', '#222839');
        else if (l.type === 'line' && /road|bridge|tunnel|street/.test(id)) set(id, 'line-color', /case/.test(id) ? '#1A1F2E' : '#3D4666');
        else if (l.type === 'line') set(id, 'line-color', '#2B3248');
        else if (l.type === 'symbol') { set(id, 'text-color', '#C3C9DC'); set(id, 'text-halo-color', '#151927'); }
      }
      set('city', 'fill-extrusion-color', ['interpolate', ['linear'], ['get', 'height'], 0, '#2C3349', 60, '#353D57', 200, '#434C6A']);
      applyLights(map, { az: 200, alt: 40, night: true });
      map.setFog({ color: '#262E46', 'high-color': '#141B30', 'horizon-blend': 0.12, 'space-color': '#0C1122', 'star-intensity': 0.5 } as any);
    } else {
      for (const [id, props] of Object.entries(dayPaint.current)) {
        if (!map.getLayer(id)) continue;
        for (const [prop, value] of Object.entries(props)) { try { map.setPaintProperty(id, prop as any, value ?? undefined); } catch { /* ignore */ } }
      }
      dayPaint.current = {};
    }
  }, [loaded, night]);

  // Satellite: lay the aerial imagery down and take the drawn ground, water and street lines off it
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!loaded || !map) return;
    if (sat) {
      // Two copies of the photo. The base uses large tiles: a quarter of the downloads, so it is on screen almost at once
      // and stays in memory as you move. On sharp screens a finer copy is drawn over it. While the fine tiles for a new
      // view are still arriving you see the base, slightly soft, instead of a far-away blurry stand-in.
      const tiles = [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.webp?access_token=${MAPBOX_TOKEN}`];
      const fine = !isTouch && window.devicePixelRatio >= 1.5;
      if (!map.getSource('w-sat')) map.addSource('w-sat', { type: 'raster', tileSize: 512, maxzoom: 19, tiles, attribution: '© Mapbox © Maxar' });
      if (fine && !map.getSource('w-sat-fine')) map.addSource('w-sat-fine', { type: 'raster', tileSize: 256, maxzoom: 19, tiles });
      if (!map.getLayer('w-sat')) {
        const layers = map.getStyle()?.layers || [];
        const above = layers.find((l) => l.type !== 'background')?.id;
        const paint = { 'raster-fade-duration': 0, 'raster-saturation': -0.08 };
        map.addLayer({ id: 'w-sat', type: 'raster', source: 'w-sat', paint }, above);
        if (fine) map.addLayer({ id: 'w-sat-fine', type: 'raster', source: 'w-sat-fine', paint: { ...paint, 'raster-fade-duration': 150 } }, above);
      }
      if (map.getLayer('w-sat-fine')) map.setLayoutProperty('w-sat-fine', 'visibility', 'visible');
      map.setLayoutProperty('w-sat', 'visibility', 'visible');
      const hidden: string[] = [];
      for (const l of map.getStyle()?.layers || []) {
        if (l.id.startsWith('w-') || l.id === 'city') continue;
        if ((l.type === 'fill' || l.type === 'line') && (l.layout as any)?.visibility !== 'none') { map.setLayoutProperty(l.id, 'visibility', 'none'); hidden.push(l.id); }
      }
      satHidden.current = hidden;
    } else {
      for (const id of ['w-sat', 'w-sat-fine']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
      for (const id of satHidden.current) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
      satHidden.current = [];
    }
  }, [loaded, sat]);

  const compass = (b: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((b % 360) + 360) % 360) / 45) % 8];

  return (
    <div className={`w-world absolute inset-0 text-[#1c2530] ${night ? 'bg-[#1D2233]' : 'bg-[#e9eef2]'}`}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: AREAS[0].center[0], latitude: AREAS[0].center[1], zoom: narrow ? AREAS[0].phoneZoom! : AREAS[0].zoom, pitch: AREAS[0].pitch, bearing: AREAS[0].bearing }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        antialias={!isTouch}
        projection="mercator"
        maxTileCacheSize={isTouch ? 150 : 400}
        onLoad={onLoad}
        onStyleData={onLoad}
        onClick={onClick}
        onMouseMove={(e) => setHovered(view ? null : pick(e)?.id || (e.features?.[0]?.layer?.id?.startsWith('w-ex') ? 'existing' : null))}
        onMouseLeave={() => setHovered(null)}
        interactiveLayerIds={[...(towers ? ['w-towers', 'w-towers-planned'] : []), ...(existing && showExisting ? ['w-ex-pad', 'w-ex-label'] : [])]}
        cursor={hovered ? 'pointer' : 'grab'}
        cooperativeGestures={isTouch}
        maxPitch={85}
        minZoom={10}
        attributionControl={false}
        dragPan={!view}
        scrollZoom={!view}
        dragRotate={!view}
      >
        {!view && <NavigationControl position="bottom-right" visualizePitch />}

        {lots && (
          <Source id="w-lots" type="geojson" data={lots}>
            <Layer id="w-lot-fill" type="fill" filter={lotFilter} paint={{ 'fill-color': ['case', ['==', ['get', 'id'], active || ''], '#E8563F', night ? '#00E5B4' : OFFPLAN] as any, 'fill-opacity': ['case', ['==', ['get', 'id'], detailId || ''], 0, night ? 0.22 : 0.2] as any }} />
            <Layer id="w-lot-line" type="line" filter={lotFilter} paint={{ 'line-color': ['case', ['==', ['get', 'id'], active || ''], '#E8563F', night ? '#00E5B4' : OFFPLAN_LINE] as any, 'line-width': ['case', ['==', ['get', 'id'], active || ''], 3.5, 1.8] as any, 'line-dasharray': [2, 2] }} />
            {/* The selected parcel, outlined on the ground: a white edge under coral so it reads on the map and on imagery */}
            <Layer id="w-lot-sel-edge" type="line" filter={['==', ['get', 'id'], selected?.id || ''] as any} layout={{ 'line-join': 'round' }} paint={{ 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.9 }} />
            <Layer id="w-lot-sel" type="line" filter={['==', ['get', 'id'], selected?.id || ''] as any} layout={{ 'line-join': 'round' }} paint={{ 'line-color': '#E8563F', 'line-width': 3 }} />
          </Source>
        )}

        {towers && (
          <Source id="w-towers-src" type="geojson" data={towers}>
            <Layer
              id="w-towers"
              type="fill-extrusion"
              filter={towerFilter}
              paint={{
                'fill-extrusion-color': towerColor,
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': 1,
                'fill-extrusion-vertical-gradient': true,
              }}
            />
            <Layer
              id="w-towers-planned"
              type="fill-extrusion"
              filter={plannedFilter}
              paint={{
                'fill-extrusion-color': towerColor,
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': 0.72,
                'fill-extrusion-vertical-gradient': true,
              }}
            />

          </Source>
        )}

        {/* The selected existing tower, in the accent colour */}
        {hlId != null && !view && !(detailId || '').startsWith('b:') && (
          <Layer id="w-hl" type="fill-extrusion" source="composite" source-layer="building" filter={['==', ['id'], hlId] as any}
            paint={{ 'fill-extrusion-color': '#E8563F', 'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['get', 'min_height'], 'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true } as any} />
        )}

        {/* Finished towers with a profile: a grey ring at the base and a name that appears as you zoom in */}
        {existing && showExisting && (
          <Source id="w-existing" type="geojson" data={existing}>
            <Layer
              id="w-ex-pad"
              type="circle"
              minzoom={13}
              paint={{
                'circle-pitch-alignment': 'map',
                'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 13, 2.5, 16, 14, 18, 52],
                'circle-color': night ? '#C9CED8' : '#6F7782',
                'circle-opacity': ['case', ['==', ['get', 'slug'], selB?.slug || ''], 0.55, 0.22],
                'circle-stroke-color': night ? '#E6E9EF' : '#4A515B',
                'circle-stroke-width': 1.5,
              }}
            />
            <Layer
              id="w-ex-label"
              type="symbol"
              minzoom={14.3}
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 14.3, 10.5, 17, 13],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-offset': [0, 1.1],
                'text-anchor': 'top',
                'text-max-width': 8,
                'symbol-sort-key': ['-', 0, ['coalesce', ['get', 'floors'], 0]],
              }}
              paint={{ 'text-color': night ? '#E6E9EF' : '#2B323B', 'text-halo-color': night ? '#1D2233' : '#ffffff', 'text-halo-width': 1.4 }}
            />
          </Source>
        )}
      </Map>

      {/* Controls: search, ground, status. Sun study and the legend open on request. On a phone it is one line. */}
      {!view && (
        <div className="absolute top-3 left-3 z-10 w-[calc(100%-1.5rem)] sm:w-[236px] rounded-2xl bg-white/95 backdrop-blur shadow-lg border border-black/5 p-2.5 sm:p-3.5">
          <div className="flex items-center gap-2">
            <input
              type="search" list="w-search" value={q} onChange={(e) => search(e.target.value)}
              placeholder="Search a project or area" aria-label="Search a project or area"
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#1c2530] placeholder:text-[#8a96a0]"
            />
            <datalist id="w-search">
              {AREAS.map((a) => <option key={a.name} value={a.name} />)}
              {names.map((n) => <option key={n} value={n} />)}
            </datalist>
            <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} aria-label="Map options" className="sm:hidden shrink-0 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-[#1c2530]">{more ? 'Close' : 'Options'}</button>
          </div>
          <div className={`${more ? 'block' : 'hidden'} sm:block`}>
            <select value={area} onChange={(e) => { goArea(Number(e.target.value)); setMore(false); }} aria-label="Jump to an area" className="mt-2 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#1c2530]">
              {AREAS.map((a, i) => <option key={a.name} value={i}>{a.name}</option>)}
            </select>
            <div role="group" aria-label="Ground" className="mt-2 flex rounded-lg border border-black/10 p-0.5 text-xs font-medium">
              {[[false, 'Map'], [true, 'Satellite']].map(([v, label]) => (
                <button key={label as string} type="button" aria-pressed={sat === v} onClick={() => { setSat(v as boolean); if (v) setNight(false); }} className={`flex-1 rounded-md py-1.5 ${sat === v ? 'bg-[#1c2530] text-white' : 'text-[#3d4852]'}`}>{label}</button>
              ))}
            </div>
            <div role="group" aria-label="Show" className="mt-2 grid grid-cols-4 sm:grid-cols-2 gap-1 text-[11px] font-medium">
              {([['all', 'All'], ['planned', 'Planned'], ['building', 'Being built'], ['done', 'Completed']] as const).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={stage === v} onClick={() => { setStage(v); setSelected(null); setSelB(null); }} className={`rounded-md border py-1.5 ${stage === v ? 'border-[#1c2530] bg-[#1c2530] text-white' : 'border-black/10 text-[#3d4852]'}`}>{label}</button>
              ))}
            </div>
            <button type="button" onClick={() => setSunOpen((v) => !v)} aria-expanded={sunOpen} className="mt-2 flex w-full items-center justify-between rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-[#1c2530]">
              <span>Sun study</span>
              <span className="text-[#5b6770] font-normal">{night ? 'Night' : `${Math.floor(sunHour)}:${sunHour % 1 ? '30' : '00'}, ${sunMonth === 5 ? 'June' : 'December'}`}</span>
            </button>
            {sunOpen && (
              <div className="mt-2">
                <div role="group" aria-label="Time of day" className="flex rounded-lg border border-black/10 p-0.5 text-xs font-medium">
                  {[[false, 'Day'], [true, 'Night']].map(([v, label]) => (
                    <button key={label as string} type="button" aria-pressed={night === v} onClick={() => { setNight(v as boolean); if (v) setSat(false); }} className={`flex-1 rounded-md py-1.5 ${night === v ? 'bg-[#1c2530] text-white' : 'text-[#3d4852]'}`}>{label}</button>
                  ))}
                </div>
                <div className={`mt-2 ${night ? 'hidden' : ''}`}>
                  <p className="text-[11px] text-[#3d4852]">{sun.alt > 0 ? `Sun in the ${compass(sun.az)} sky, ${Math.round(sun.alt)}° up` : 'Sun below the horizon'}</p>
                  <input
                    type="range" min={5} max={21} step={0.5} value={sunHour}
                    onChange={(e) => setSunHour(Number(e.target.value))}
                    aria-label="Hour of the day"
                    className="mt-1 w-full accent-[#0f9d7a]"
                  />
                  <div className="mt-1 flex gap-1.5">
                    {[[5, 'June'], [11, 'December']].map(([m, label]) => (
                      <button key={label as string} onClick={() => setSunMonth(m as number)} className={`flex-1 rounded-md px-2 py-1 text-[11px] border ${sunMonth === m ? 'bg-[#1c2530] text-white border-[#1c2530]' : 'bg-white text-[#3d4852] border-black/10'}`}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <ul className="mt-2.5 space-y-1 text-[11px] text-[#3d4852]">
              <li className="flex items-center gap-2"><span className="w-3 h-3 shrink-0 rounded-sm" style={{ background: 'linear-gradient(135deg,#8aa3b3,#cfc6b8)', outline: `2px dashed ${OFFPLAN_LINE}`, outlineOffset: 1 }} /> New project, click for details</li>
              <li className="flex items-center gap-2"><span className="w-3 h-3 shrink-0 rounded-full border-[1.5px] border-[#4A515B] bg-[#6F7782]/25" /> Finished tower with a profile</li>
            </ul>
          </div>
        </div>
      )}

      {/* Existing building card */}
      {selB && !selected && !view && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-auto sm:left-auto sm:top-4 sm:right-4 z-10 sm:w-[320px] rounded-2xl bg-white shadow-xl border border-black/5 p-4">
          <button onClick={() => setSelB(null)} aria-label="Close" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#f4f6f8] text-[#1c2530] text-lg leading-none">×</button>
          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EEF0F2] text-[#4A515B]">Completed</span>
          <h2 className="text-lg font-semibold mt-1.5 leading-tight pr-8">{selB.name}</h2>
          {selB.developer && <p className="text-xs text-[#5b6770] mt-0.5">by {selB.developer}</p>}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[['Built', selB.yearBuilt ? String(selB.yearBuilt) : ''], ['Floors', selB.floors ? String(selB.floors) : ''], ['Height', selB.heightM ? `${Math.round(Number(selB.heightM))} m` : '']].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-[#f4f6f8] py-2">
                <div className="text-[10px] uppercase tracking-wide text-[#7a8791]">{k}</div>
                <div className="text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <Link href={`/buildings/${selB.slug}`} className="mt-3 block text-center rounded-xl py-2.5 text-sm font-semibold text-white bg-[#1c2530]">Open building profile</Link>
        </div>
      )}

      {/* Project card */}
      {selected && !view && (
        <div className="absolute bottom-3 left-3 right-3 max-h-[58%] flex flex-col sm:block sm:max-h-none sm:bottom-auto sm:left-auto sm:top-4 sm:right-4 z-10 sm:w-[340px] rounded-2xl bg-white shadow-xl border border-black/5 overflow-hidden">
          <div className="relative h-24 sm:h-36 shrink-0 bg-[#dfe6ea]">
            {selected.mainImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl(selected.mainImageUrl) || ''} alt={`${selected.name} rendering`} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <button onClick={() => setSelected(null)} aria-label="Close" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[#1c2530] text-lg leading-none">×</button>
          </div>
          <div className="p-4 space-y-3 min-h-0 overflow-y-auto sm:overflow-visible">
            <div>
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E3F7F2] text-[#00755E]">{STATUS_LABELS[selected.status] || selected.status}</span>
              <h2 className="text-lg font-semibold mt-1.5 leading-tight">{selected.name}</h2>
              <p className="text-xs text-[#5b6770] mt-0.5">
                {selected.developer ? `by ${selected.developer.name} · ` : ''}{selected.neighborhood?.name || 'South Florida'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Completion', selected.estCompletion || 'TBD'], ['Floors', selected.floors ? String(selected.floors) : 'TBD'], ['Height', selHeight ? `~${Math.round(selHeight)} m` : 'TBD']].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-[#f4f6f8] py-2">
                  <div className="text-[10px] uppercase tracking-wide text-[#7a8791]">{k}</div>
                  <div className="text-sm font-semibold">{v}</div>
                </div>
              ))}
            </div>
            {selected.priceMin ? <p className="text-sm">From <span className="font-semibold text-[#00755E]">{shortPrice(selected.priceMin)}</span></p> : null}
            <div className="rounded-xl bg-[#f4f6f8] p-3">
              <div className="flex items-center justify-between text-xs text-[#5b6770]">
                <span>View from</span>
                <span className="font-semibold text-[#1c2530]">Floor {floor} <span className="font-normal text-[#7a8791]">· about {eyeM} m up</span></span>
              </div>
              <input type="range" min={1} max={Math.max(2, selFloors)} value={Math.min(floor, selFloors)} onChange={(e) => setFloor(Number(e.target.value))} className="w-full mt-2 accent-[#00A886]" aria-label="Floor" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={closer} className="rounded-xl border border-black/10 py-2.5 text-sm font-medium hover:bg-[#f4f6f8]">Closer look</button>
              <button onClick={() => setView({ bearing: 90 })} className="rounded-xl border border-black/10 py-2.5 text-sm font-medium hover:bg-[#f4f6f8]">See the view</button>
            </div>
          </div>
          {/* Always in view, also when the details above scroll on a phone */}
          <div className="shrink-0 px-4 pb-4 pt-2 sm:pt-0">
            <Link href={`/properties/${selected.slug}`} className="block text-center rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: OFFPLAN }}>
              See full details →
            </Link>
          </div>
        </div>
      )}

      {/* View-from-floor mode */}
      {selected && view && (
        <>
          <div
            className="absolute inset-0 z-[5] cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={onLookDown}
            onPointerMove={onLookMove}
            onPointerUp={onLookUp}
            onPointerCancel={() => { drag.current = null; }}
            aria-label="Drag to look around"
          />
          <div className="absolute top-4 right-4 z-10 w-[min(320px,calc(100%-2rem))] rounded-2xl bg-white shadow-xl border border-black/5 p-4 space-y-3">
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E3F7F2] text-[#00755E]">Floor {floor} · about {eyeM} m up</span>
            <h2 className="text-lg font-semibold leading-tight">{selected.name}</h2>
            <p className="text-sm text-[#3d4852]">Looking {compass(view.bearing)} · drag the view to look around</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView({ bearing: view.bearing - 30 })} className="rounded-xl border border-black/10 py-2 text-sm">← Turn left</button>
              <button onClick={() => setView({ bearing: view.bearing + 30 })} className="rounded-xl border border-black/10 py-2 text-sm">Turn right →</button>
            </div>
            <input type="range" min={1} max={Math.max(2, selFloors)} value={Math.min(floor, selFloors)} onChange={(e) => setFloor(Number(e.target.value))} className="w-full accent-[#00A886]" aria-label="Floor" />
            {mix && (
              <div>
                <p className="text-[11px] font-medium text-[#3d4852] mb-1.5">What fills this view</p>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#eef1f4]">
                  <span style={{ width: `${mix.water}%`, background: '#4FA3D9' }} />
                  <span style={{ width: `${mix.open}%`, background: '#D5DEE5' }} />
                  <span style={{ width: `${mix.existing}%`, background: '#8E9AA6' }} />
                  <span style={{ width: `${mix.future}%`, background: OFFPLAN }} />
                </div>
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#3d4852]">
                  <li><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: '#4FA3D9' }} />Water {mix.water}%</li>
                  <li><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: '#D5DEE5' }} />Sky and open land {mix.open}%</li>
                  <li><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: '#8E9AA6' }} />Existing buildings {mix.existing}%</li>
                  <li><span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ background: OFFPLAN }} />Future buildings {mix.future}%</li>
                </ul>
              </div>
            )}
            <p className="text-[11px] text-[#3d4852] leading-snug">
              <span className="font-medium">Direct sun on this side:</span>{' '}
              about {sunHours(selected.latitude, selected.longitude, view.bearing, 5)} h a day in June, {sunHours(selected.latitude, selected.longitude, view.bearing, 11)} h in December, before shading by other buildings.
            </p>
            <button onClick={exitView} className="w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: OFFPLAN }}>Back to map</button>
            <p className="text-[11px] text-[#7a8791] leading-snug">
              For illustration only. Shown from the centre of the building at this floor, not a specific residence. Buildings, heights and views are approximate and not guaranteed. Always confirm with the developer.
            </p>
          </div>
        </>
      )}

      <p className="absolute bottom-2 left-3 z-10 text-[10px] text-[#5b6770] bg-white/70 rounded px-1.5 py-0.5">© Mapbox © OpenStreetMap</p>
    </div>
  );
}
