'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
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

const AREAS: { name: string; center: [number, number]; zoom: number; bearing: number }[] = [
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

export default function MiamiWorld() {
  const mapRef = useRef<MapRef>(null);
  const [data, setData] = useState<BuildingsData | null>(null);
  const [selected, setSelected] = useState<MapProject | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [floor, setFloor] = useState(10);
  const [view, setView] = useState<{ bearing: number } | null>(null);
  const [area, setArea] = useState(0);
  const [isTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

  useEffect(() => {
    let alive = true;
    loadBuildings().then((d) => { if (alive) setData(d); });
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

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    (window as any).__pcmWorld = map;
    map.setFog({ color: '#e6edf2', 'high-color': '#bcd3e6', 'horizon-blend': 0.08, 'space-color': '#dce8f2', 'star-intensity': 0 } as any);
    map.setLight({ anchor: 'map', position: [1.4, 210, 38], intensity: 0.55, color: '#ffffff' } as any);
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
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#e9ecef', 60, '#f1f3f5', 200, '#fafbfc'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 1,
            'fill-extrusion-vertical-gradient': true,
            'fill-extrusion-ambient-occlusion-intensity': 0.35,
            'fill-extrusion-ambient-occlusion-radius': 4,
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
    const ids = data.hiddenBaseIds || [];
    map.setFilter('city', ids.length ? ['all', base, ['!', ['in', ['id'], ['literal', ids]]]] : base);
  }, [data]);

  const pick = useCallback((e: MapMouseEvent) => {
    const id = (e.features?.[0]?.properties as any)?.id;
    return (id && data?.projects[id]) || null;
  }, [data]);

  const onClick = useCallback((e: MapMouseEvent) => {
    if (view) return;
    const p = pick(e);
    setSelected(p);
    if (p && data) {
      const floors = p.floors || Math.max(4, Math.round(heightOf(data, p.id) / RESIDENTIAL_FLOOR_M));
      setFloor(Math.max(2, Math.round(floors / 2)));
    }
  }, [pick, data, view]);

  const selHeight = selected && data ? heightOf(data, selected.id) : 0;
  const selFloors = selected ? selected.floors || Math.max(4, Math.round(selHeight / RESIDENTIAL_FLOOR_M)) : 0;
  const eyeM = selFloors ? Math.round((floor / selFloors) * selHeight) : 0;

  const closer = () => {
    if (!selected) return;
    mapRef.current?.getMap().flyTo({ center: [selected.longitude, selected.latitude], zoom: selHeight > 150 ? 16 : 16.8, pitch: 62, duration: 1600 });
  };

  // Stand inside the tower at the chosen floor and look out
  const lookFrom = useCallback((bearing: number) => {
    const map = mapRef.current?.getMap();
    if (!map || !selected) return;
    const cam = map.getFreeCameraOptions();
    cam.position = mapboxgl.MercatorCoordinate.fromLngLat([selected.longitude, selected.latitude], Math.max(6, eyeM) + 1.6);
    cam.setPitchBearing(84, bearing); // near-level gaze, slightly down toward the city
    map.setFreeCameraOptions(cam);
  }, [selected, eyeM]);

  useEffect(() => { if (view) lookFrom(view.bearing); }, [view, lookFrom]);

  const exitView = () => {
    setView(null);
    if (selected) mapRef.current?.getMap().easeTo({ center: [selected.longitude, selected.latitude], zoom: 15.8, pitch: 60, bearing: -25, duration: 900 });
  };

  const goArea = (i: number) => {
    setArea(i);
    setView(null);
    const a = AREAS[i];
    mapRef.current?.getMap().flyTo({ center: a.center, zoom: a.zoom, bearing: a.bearing, pitch: 60, duration: 2200 });
  };

  const active = selected?.id || hovered;
  // In view mode the tower you are standing in is hidden so it does not block the view
  const towerFilter: any = view && selected ? ['!=', ['get', 'id'], selected.id] : ['has', 'id'];
  const towerColor: any = active ? ['case', ['==', ['get', 'id'], active], ['case', ['==', ['get', 'c'], OFFPLAN_SOFT], '#B8F0E3', '#00C9A0'], ['get', 'c']] : ['get', 'c'];
  const compass = (b: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((b % 360) + 360) % 360) / 45) % 8];

  return (
    <div className="absolute inset-0 bg-[#e9eef2] text-[#1c2530]">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: AREAS[0].center[0], latitude: AREAS[0].center[1], zoom: isTouch ? 14.4 : AREAS[0].zoom, pitch: 60, bearing: AREAS[0].bearing }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={onLoad}
        onClick={onClick}
        onMouseMove={(e) => setHovered(view ? null : pick(e)?.id || null)}
        onMouseLeave={() => setHovered(null)}
        interactiveLayerIds={towers ? ['w-towers'] : []}
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
            <Layer id="w-lot-fill" type="fill" paint={{ 'fill-color': OFFPLAN, 'fill-opacity': 0.14 }} />
            <Layer id="w-lot-line" type="line" paint={{ 'line-color': OFFPLAN_LINE, 'line-width': 1.6, 'line-dasharray': [2, 2] }} />
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
          </Source>
        )}
      </Map>

      {/* Area picker and legend */}
      {!view && (
        <div className="absolute top-4 left-4 z-10 w-[230px] rounded-2xl bg-white/95 backdrop-blur shadow-lg border border-black/5 p-4">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#00896E] uppercase">Miami · 3D map</p>
          <label className="block mt-2 text-xs text-[#5b6770]">
            Jump to
            <select value={area} onChange={(e) => goArea(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#1c2530]">
              {AREAS.map((a, i) => <option key={a.name} value={i}>{a.name}</option>)}
            </select>
          </label>
          <ul className="mt-3 space-y-1.5 text-xs text-[#3d4852]">
            <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#f1f3f5] border border-black/15" /> Existing buildings</li>
            <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: OFFPLAN }} /> Pre-construction and under construction</li>
          </ul>
          <p className="mt-3 text-[11px] text-[#7a8791] leading-snug">Click a green tower for details and the view from any floor.</p>
        </div>
      )}

      {/* Project card */}
      {selected && !view && (
        <div className="absolute top-4 right-4 z-10 w-[min(340px,calc(100%-2rem))] rounded-2xl bg-white shadow-xl border border-black/5 overflow-hidden">
          <div className="relative h-36 bg-[#dfe6ea]">
            {selected.mainImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl(selected.mainImageUrl) || ''} alt={`${selected.name} rendering`} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <button onClick={() => setSelected(null)} aria-label="Close" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[#1c2530] text-lg leading-none">×</button>
          </div>
          <div className="p-4 space-y-3">
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
            <Link href={`/properties/${selected.slug}`} className="block text-center rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: OFFPLAN }}>
              See full details →
            </Link>
          </div>
        </div>
      )}

      {/* View-from-floor mode */}
      {selected && view && (
        <>
          <div className="absolute top-4 right-4 z-10 w-[min(320px,calc(100%-2rem))] rounded-2xl bg-white shadow-xl border border-black/5 p-4 space-y-3">
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E3F7F2] text-[#00755E]">Floor {floor} · about {eyeM} m up</span>
            <h2 className="text-lg font-semibold leading-tight">{selected.name}</h2>
            <p className="text-sm text-[#3d4852]">Looking {compass(view.bearing)}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView({ bearing: view.bearing - 30 })} className="rounded-xl border border-black/10 py-2 text-sm">← Turn left</button>
              <button onClick={() => setView({ bearing: view.bearing + 30 })} className="rounded-xl border border-black/10 py-2 text-sm">Turn right →</button>
            </div>
            <input type="range" min={1} max={Math.max(2, selFloors)} value={Math.min(floor, selFloors)} onChange={(e) => setFloor(Number(e.target.value))} className="w-full accent-[#00A886]" aria-label="Floor" />
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
