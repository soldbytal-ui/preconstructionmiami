'use client';

import MapSkeleton from './MapSkeleton';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MapRef } from 'react-map-gl/mapbox';
import MapTooltip from './MapTooltip';
import MapPropertyCard from './MapPropertyCard';
import { useAccount } from '@/components/account/AccountProvider';
import {
  type MapProject, type BuildingsData,
  LEGEND, STATUS_COLOR_EXPR, TOWER_COLOR_EXPR, shortPrice, loadBuildings, addCityBuildings, hideBaseBuildings,
} from './mapShared';

export type { MapProject } from './mapShared';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Towers whose names are always labelled; everything else is labelled on zoom.
const SIGNATURE_SLUGS = new Set([
  'waldorf-astoria-residences-miami',
  'mercedes-benz-places-miami',
  '888-brickell-by-dolce-and-gabbana',
  'baccarat-residences-miami',
  'ora-by-casa-tua',
]);

type HoverInfo = { x: number; y: number; object: MapProject } | null;

const AREAS = [
  { name: 'Brickell & Downtown', lng: -80.1915, lat: 25.772, zoom: 14.2, bearing: -20 },
  { name: 'Edgewater & Midtown', lng: -80.1895, lat: 25.8015, zoom: 14.4, bearing: -15 },
  { name: 'Miami Beach', lng: -80.1315, lat: 25.795, zoom: 13.6, bearing: 20 },
  { name: 'Coconut Grove', lng: -80.2395, lat: 25.7305, zoom: 14.6, bearing: 0 },
  { name: 'Coral Gables', lng: -80.2585, lat: 25.748, zoom: 14.4, bearing: 0 },
  { name: 'Surfside & Bay Harbor', lng: -80.127, lat: 25.884, zoom: 14.4, bearing: 15 },
  { name: 'Sunny Isles & Aventura', lng: -80.127, lat: 25.945, zoom: 13.6, bearing: 15 },
  { name: 'Fort Lauderdale', lng: -80.118, lat: 26.123, zoom: 13.2, bearing: 0 },
  { name: 'Palm Beach', lng: -80.051, lat: 26.708, zoom: 13.8, bearing: 0 },
] as const;

// `focus` opens the map on one neighbourhood (used on the area pages)
export default function MiamiMap({ focus }: { focus?: { lng: number; lat: number; zoom?: number; name: string } } = {}) {
  const [data, setData] = useState<BuildingsData | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapProject | null>(null);
  // This component only ever renders in the browser (see DynamicMap), so the
  // pointer type can be read up front.
  const [area, setArea] = useState<string>('Brickell & Downtown');
  // After a visitor has opened a few towers, offer a free account once per visit.
  const { ready: accountsReady, user: accountUser, openSignup } = useAccount();
  const openedCount = useRef(0);
  const nudge = useCallback(() => {
    if (!accountsReady || accountUser) return;
    openedCount.current += 1;
    if (openedCount.current < 5) return;
    try {
      if (sessionStorage.getItem('pcm_map_ask') === '1') return;
      sessionStorage.setItem('pcm_map_ask', '1');
    } catch { return; }
    openSignup({ source: 'map', reason: 'Keep track of the towers you like' });
  }, [accountsReady, accountUser, openSignup]);
  const stopOrbit = useRef(false);
  const [ready, setReady] = useState(false);
  // The placeholder stays over the canvas until the first complete frame, then fades
  const [painted, setPainted] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  // Base map look. ?look=dusk|dawn|day|night|classic in the address overrides it.
  const [look] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const v = new URLSearchParams(window.location.search).get('look');
    if (v === 'classic') return null;
    if (v && ['dusk', 'dawn', 'day', 'night'].includes(v)) return v;
    // Lit city with shadows on computers; phones keep the lighter classic map
    return window.matchMedia('(pointer: coarse)').matches ? null : 'night';
  });
  const [isTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    let alive = true;
    loadBuildings().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);

  // One label point per project
  const labels = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!data) return null;
    return {
      type: 'FeatureCollection',
      features: Object.values(data.projects).map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
        properties: {
          id: p.id,
          status: p.status,
          signature: SIGNATURE_SLUGS.has(p.slug) ? 1 : 0,
          rank: -(p.floors || 0),
          label: p.priceMin ? `${p.name}\nFrom ${shortPrice(p.priceMin)}` : p.name,
        },
      })),
    };
  }, [data]);

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      (window as any).__pcmMap = map; // handle for automated visual checks
      setReady(true);
      const reveal = () => { setPainted(true); window.setTimeout(() => setVeilGone(true), 800); };
      // 'load' means the first full frame is on screen
      requestAnimationFrame(reveal);
      if (!look) {
        addCityBuildings(map, '3d-buildings');
        hideBaseBuildings(map, '3d-buildings', data?.hiddenBaseIds);
      }
    }
  }, [data, look]);

  // Data can arrive after the map has loaded
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && data && map.isStyleLoaded()) hideBaseBuildings(map, '3d-buildings', data.hiddenBaseIds);
  }, [data]);

  const projectAt = useCallback(
    (e: MapMouseEvent): MapProject | null => {
      const id = e.features?.[0]?.properties?.id;
      return (id && data?.projects[id]) || null;
    },
    [data]
  );

  const onMouseMove = useCallback((e: MapMouseEvent) => {
    const p = projectAt(e);
    setHoveredId(p ? p.id : null);
    setHoverInfo(p ? { x: e.point.x, y: e.point.y, object: p } : null);
  }, [projectAt]);

  const onMouseLeave = useCallback(() => { setHoveredId(null); setHoverInfo(null); }, []);

  const onClick = useCallback((e: MapMouseEvent) => {
    stopOrbit.current = true;
    const p = projectAt(e);
    if (!p) { setSelected(null); return; }
    setSelected(p);
    setHoverInfo(null);
    nudge();
    const map = mapRef.current?.getMap();
    map?.flyTo({
      center: [p.longitude, p.latitude],
      zoom: Math.max(map.getZoom(), 15.2),
      pitch: 60,
      duration: 1400,
      essential: true,
    });
  }, [projectAt, nudge]);

  // Quick jumps between districts
  const flyToArea = useCallback((a: (typeof AREAS)[number]) => {
    stopOrbit.current = true;
    setArea(a.name);
    setSelected(null);
    mapRef.current?.getMap()?.flyTo({ center: [a.lng, a.lat], zoom: a.zoom, pitch: 60, bearing: a.bearing, duration: 2200, essential: true });
  }, []);

  // A slow drift around the skyline until the visitor touches the map
  useEffect(() => {
    if (!data || !ready || isTouch) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    let raf = 0;
    let last = performance.now();
    const stop = () => { stopOrbit.current = true; };
    const events = ['mousedown', 'wheel', 'touchstart', 'dragstart', 'keydown'] as const;
    events.forEach((ev) => map.getCanvas().addEventListener(ev, stop, { passive: true }));
    const tick = (now: number) => {
      if (stopOrbit.current) return;
      const dt = Math.min(64, now - last);
      last = now;
      if (!document.hidden && !map.isMoving()) map.setBearing(map.getBearing() + dt * 0.0012);
      raf = requestAnimationFrame(tick);
    };
    const start = window.setTimeout(() => { last = performance.now(); raf = requestAnimationFrame(tick); }, 2500);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      events.forEach((ev) => map.getCanvas().removeEventListener(ev, stop));
    };
  }, [data, ready, isTouch]);

  // On the lit map, charcoal and black towers disappear into the dark city, so lift them
  // toward a steel blue while keeping their own banding contrast.
  const towersData = useMemo(() => {
    if (!data || !look) return data;
    const lift = (hex: string) => {
      if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum >= 0.34) return hex;
      const t = Math.min(0.6, (0.34 - lum) * 1.9 + 0.18); // darker colours move further
      const mix = (c: number, to: number) => Math.round(c + (to - c) * t);
      return '#' + [mix(r, 0x6f), mix(g, 0x8a), mix(b, 0xa6)].map((v) => v.toString(16).padStart(2, '0')).join('');
    };
    return { ...data, features: data.features.map((f: any) => ({ ...f, properties: { ...f.properties, color: lift(f.properties.color) } })) };
  }, [data, look]);

  const activeId = selected?.id || hoveredId;
  const towerColor: any = activeId
    ? ['case', ['==', ['get', 'id'], activeId], '#ffffff', TOWER_COLOR_EXPR]
    : TOWER_COLOR_EXPR;

  const labelLayout = {
    // On the lit map the ground pad can sit behind a neighbouring building, so each label carries its status colour
    'text-field': look ? ['format', '● ', { 'text-color': STATUS_COLOR_EXPR }, ['get', 'label'], {}] : ['get', 'label'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 13],
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-max-width': 11,
    'text-variable-anchor': ['bottom', 'top', 'left', 'right'],
    'text-radial-offset': 1.1,
    'text-justify': 'auto',
    'symbol-sort-key': ['get', 'rank'],
  } as any;
  const labelPaint: any = {
    ...(look ? { 'text-emissive-strength': 1 } : {}),
    'text-color': '#F0EDE8',
    'text-halo-color': 'rgba(10, 12, 15, 0.92)',
    'text-halo-width': 1.6,
  };

  return (
    <div className="theme-dark relative w-full h-full">
      {!veilGone && <div className="absolute inset-0 z-10 pointer-events-none"><MapSkeleton fading={painted} /></div>}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: focus ? focus.lng : -80.1915,
          latitude: focus ? focus.lat : 25.772,
          zoom: focus ? (focus.zoom ?? 14.6) - (isTouch ? 0.9 : 0) : isTouch ? 12.9 : 14.6,
          pitch: 60,
          bearing: -20,
          // Keep the skyline clear of the headline card on wide screens
          padding: !focus && !isTouch && typeof window !== 'undefined' && window.innerWidth >= 1024
            ? { left: 460, top: 60, right: 0, bottom: 0 }
            : undefined,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={look ? 'mapbox://styles/mapbox/standard' : 'mapbox://styles/mapbox/dark-v11'}
        {...(look ? { config: { basemap: { lightPreset: look, showPointOfInterestLabels: false, showTransitLabels: false } } } : {})}
        onLoad={onLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        interactiveLayerIds={ready && data ? ['towers'] : []}
        cursor={hoveredId ? 'pointer' : 'grab'}
        cooperativeGestures={isTouch}
        maxPitch={70}
        minZoom={9}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Status pad: realistic towers stand on a footprint in their status colour */}
        {ready && data?.pads && (
          <Source id="pads-src" type="geojson" data={data.pads}>
            {/* On the lit base map, clear the existing buildings and trees off each project's lot */}
            {look && <Layer id="pad-clip" {...({ type: 'clip', layout: { 'clip-layer-types': ['model', 'symbol'], 'clip-layer-scope': ['basemap'] } } as any)} />}
            <Layer id="pad-fill" type="fill" {...(look ? ({ slot: 'middle' } as any) : {})} paint={{ 'fill-color': STATUS_COLOR_EXPR, 'fill-opacity': look ? 0.45 : 0.28, ...(look ? { 'fill-emissive-strength': look === 'night' ? 1 : 0.5 } : {}) } as any} />
            <Layer
              id="pad-line"
              type="line"
              {...(look ? ({ slot: 'middle' } as any) : {})}
              paint={{
                'line-color': STATUS_COLOR_EXPR,
                'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 4],
                'line-blur': 1,
                ...(look ? { 'line-emissive-strength': look === 'night' ? 1 : 0.5 } : {}),
              } as any}
            />
          </Source>
        )}

        {ready && data && (
          <Source id="towers-src" type="geojson" data={towersData as any} tolerance={0} buffer={64}>
            <Layer
              id="towers"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': towerColor,
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': look ? 1 : 0.96,
                'fill-extrusion-vertical-gradient': true,
                // Under night lighting the new towers stay bright against the existing city
                ...(look ? { 'fill-extrusion-emissive-strength': look === 'night' ? 0.7 : look === 'day' ? 0 : 0.4 } : {}),
              }}
            />
          </Source>
        )}

        {ready && labels && (
          <Source id="labels-src" type="geojson" data={labels}>
            {/* Soft glow on the ground under each project */}
            <Layer
              id="tower-glow"
              type="circle"
              {...(look ? ({ slot: 'middle' } as any) : {})}
              beforeId={ready && data ? 'towers' : undefined}
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 14, 18, 30],
                'circle-color': STATUS_COLOR_EXPR,
                'circle-opacity': look ? 0.5 : 0.22,
                'circle-blur': 1,
                ...(look ? { 'circle-emissive-strength': look === 'night' ? 1 : 0.5 } : {}),
              } as any}
            />
            <Layer
              id="signature-labels"
              type="symbol"
              minzoom={11.5}
              filter={['==', ['get', 'signature'], 1]}
              layout={labelLayout}
              paint={labelPaint}
            />
            <Layer
              id="project-labels"
              type="symbol"
              minzoom={15.1}
              filter={['==', ['get', 'signature'], 0]}
              layout={labelLayout}
              paint={labelPaint}
            />
          </Source>
        )}
      </Map>

      {/* Legend */}
      <div className={`absolute ${focus ? 'top-4' : 'top-20'} right-4 z-10 glass-panel rounded-xl px-3 py-2.5 hidden sm:block pointer-events-none`}>
        <ul className="space-y-1.5">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-2 text-[11px] text-text-muted">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      {/* District quick jumps, or on an area page the area name and a way to the full map */}
      {focus ? (
        <div className="absolute left-3 bottom-3 z-10 glass-panel rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-3">
          <span className="text-[13px] font-medium text-text-primary">{focus.name}</span>
          <a href="/preconstruction-3d" className="rounded-full bg-accent-green px-3 py-1.5 text-[12px] font-medium text-bg">Open the full 3D map</a>
        </div>
      ) : (
      <div className="absolute left-0 right-0 bottom-3 z-10 pl-3 pr-16 lg:pr-3 pointer-events-none">
          <div className="mx-auto max-w-max flex gap-1.5 overflow-x-auto pointer-events-auto glass-panel rounded-full px-1.5 py-1.5 [scrollbar-width:none]">
            {AREAS.map((a) => (
              <button
                key={a.name}
                type="button"
                onClick={() => flyToArea(a)}
                aria-pressed={area === a.name}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                  area === a.name ? 'bg-accent-green text-bg' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {hoverInfo && !selected && <MapTooltip info={hoverInfo} />}

      {selected && <MapPropertyCard project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
