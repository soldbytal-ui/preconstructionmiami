'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MapRef } from 'react-map-gl/mapbox';
import MapTooltip from './MapTooltip';
import MapPropertyCard from './MapPropertyCard';
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

export default function MiamiMap() {
  const [data, setData] = useState<BuildingsData | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapProject | null>(null);
  // This component only ever renders in the browser (see DynamicMap), so the
  // pointer type can be read up front.
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
      addCityBuildings(map, '3d-buildings');
      hideBaseBuildings(map, '3d-buildings', data?.hiddenBaseIds);
    }
  }, [data]);

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
    const p = projectAt(e);
    if (!p) { setSelected(null); return; }
    setSelected(p);
    setHoverInfo(null);
    const map = mapRef.current?.getMap();
    map?.flyTo({
      center: [p.longitude, p.latitude],
      zoom: Math.max(map.getZoom(), 15.2),
      pitch: 60,
      duration: 1400,
      essential: true,
    });
  }, [projectAt]);

  const activeId = selected?.id || hoveredId;
  const towerColor: any = activeId
    ? ['case', ['==', ['get', 'id'], activeId], '#ffffff', TOWER_COLOR_EXPR]
    : TOWER_COLOR_EXPR;

  const labelLayout = {
    'text-field': ['get', 'label'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 13],
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-max-width': 11,
    'text-variable-anchor': ['bottom', 'top', 'left', 'right'],
    'text-radial-offset': 1.1,
    'text-justify': 'auto',
    'symbol-sort-key': ['get', 'rank'],
  } as any;
  const labelPaint = {
    'text-color': '#F0EDE8',
    'text-halo-color': 'rgba(10, 12, 15, 0.92)',
    'text-halo-width': 1.6,
  };

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -80.1915,
          latitude: 25.772,
          zoom: isTouch ? 12.9 : 13.6,
          pitch: 58,
          bearing: -20,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={onLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        interactiveLayerIds={data ? ['towers'] : []}
        cursor={hoveredId ? 'pointer' : 'grab'}
        cooperativeGestures={isTouch}
        maxPitch={70}
        minZoom={9}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Status pad: realistic towers stand on a footprint in their status colour */}
        {data?.pads && (
          <Source id="pads-src" type="geojson" data={data.pads}>
            <Layer id="pad-fill" type="fill" paint={{ 'fill-color': STATUS_COLOR_EXPR, 'fill-opacity': 0.28 }} />
            <Layer
              id="pad-line"
              type="line"
              paint={{
                'line-color': STATUS_COLOR_EXPR,
                'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 4],
                'line-blur': 1,
              }}
            />
          </Source>
        )}

        {data && (
          <Source id="towers-src" type="geojson" data={data}>
            <Layer
              id="towers"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': towerColor,
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': 0.96,
                'fill-extrusion-vertical-gradient': true,
              }}
            />
          </Source>
        )}

        {labels && (
          <Source id="labels-src" type="geojson" data={labels}>
            {/* Soft glow on the ground under each project */}
            <Layer
              id="tower-glow"
              type="circle"
              beforeId={data ? 'towers' : undefined}
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 14, 18, 30],
                'circle-color': STATUS_COLOR_EXPR,
                'circle-opacity': 0.22,
                'circle-blur': 1,
              }}
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
              minzoom={14.3}
              filter={['==', ['get', 'signature'], 0]}
              layout={labelLayout}
              paint={labelPaint}
            />
          </Source>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute top-20 right-4 z-10 glass-panel rounded-xl px-3 py-2.5 hidden sm:block pointer-events-none">
        <ul className="space-y-1.5">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-2 text-[11px] text-text-muted">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      {hoverInfo && !selected && <MapTooltip info={hoverInfo} />}

      {selected && <MapPropertyCard project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
