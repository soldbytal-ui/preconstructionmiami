'use client';

import { useMemo } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { Part } from '@/lib/massing';
import { STATUS_HEX } from '@/components/map/mapShared';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** Live preview of one generated tower on its lot. Drag with right mouse (or two fingers) to rotate. */
export default function TowerPreview({ parts, pad, center, status }: { parts: Part[]; pad: [number, number][]; center: [number, number]; status: string }) {
  const towers = useMemo(
    (): GeoJSON.FeatureCollection => ({
      type: 'FeatureCollection',
      features: parts.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [p.ring] },
        properties: { base: p.base, height: p.height, color: p.color },
      })),
    }),
    [parts]
  );
  const padData = useMemo(
    (): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [pad] }, properties: {} }] }),
    [pad]
  );
  const statusColor = STATUS_HEX[status] || '#8A9098';
  const top = parts.reduce((m, p) => Math.max(m, p.height), 0);

  return (
    <Map
      initialViewState={{ longitude: center[0], latitude: center[1], zoom: top > 250 ? 14.9 : top > 150 ? 15.4 : top > 60 ? 16.3 : 17.2, pitch: 60, bearing: -25 }}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      attributionControl={false}
      maxPitch={75}
    >
      <NavigationControl position="bottom-right" />
      <Source id="pad" type="geojson" data={padData}>
        <Layer id="pad-fill" type="fill" paint={{ 'fill-color': statusColor, 'fill-opacity': 0.25 }} />
        <Layer id="pad-line" type="line" paint={{ 'line-color': statusColor, 'line-width': 3 }} />
      </Source>
      <Source id="tower" type="geojson" data={towers}>
        <Layer
          id="tower-ext"
          type="fill-extrusion"
          paint={{
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base'],
            'fill-extrusion-opacity': 0.97,
          }}
        />
      </Source>
    </Map>
  );
}
