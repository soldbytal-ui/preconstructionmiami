'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type MiniMapProject = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  floors: number;
  status: string;
};

export default function NeighborhoodMiniMap({
  center,
  neighborhoodName,
  neighborhoodId,
}: {
  center: [number, number]; // [lat, lng]
  neighborhoodName: string;
  neighborhoodId: string;
}) {
  const mapRef = useRef<MapRef>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [projects, setProjects] = useState<MiniMapProject[]>([]);

  // Fetch neighborhood-specific buildings
  useEffect(() => {
    fetch('/api/buildings-geojson')
      .then((res) => res.json())
      .then((data) => {
        // Filter to this neighborhood's buildings
        const filtered = {
          ...data,
          features: (data.features || []).filter(
            (f: any) => f.properties?.neighborhoodSlug || true // show all for now
          ),
        };
        setGeojsonData(filtered);

        // Extract project markers for this neighborhood
        const projs: MiniMapProject[] = [];
        for (const f of data.features || []) {
          const p = f.properties;
          if (p) {
            projs.push({
              id: p.id,
              name: p.name,
              latitude: p.latitude,
              longitude: p.longitude,
              floors: p.floors,
              status: p.status,
            });
          }
        }
        setProjects(projs);
      })
      .catch(console.error);
  }, [neighborhoodId]);

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const layers = map.getStyle()?.layers;
    if (!layers) return;
    const labelLayerId = layers.find(
      (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    if (!map.getLayer('3d-buildings-mini')) {
      map.addLayer(
        {
          id: '3d-buildings-mini',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'height'],
              0, '#16181e', 50, '#1e2028', 100, '#252730', 200, '#2d3040',
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7,
          },
        },
        labelLayerId
      );
    }
  }, []);

  const colorExpression: any = [
    'match', ['get', 'status'],
    'PRE_LAUNCH', '#00E5B4',
    'PRE_CONSTRUCTION', '#00E5B4',
    'UNDER_CONSTRUCTION', '#38B6FF',
    'NEAR_COMPLETION', '#FF7A3D',
    'COMPLETED', '#8A9098',
    '#8A9098',
  ];

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-border relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: 15,
          pitch: 55,
          bearing: -20,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={onLoad}
        interactive={false}
        attributionControl={false}
      >
        {geojsonData && (
          <Source id="mini-buildings" type="geojson" data={geojsonData}>
            <Layer
              id="mini-glow"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': colorExpression,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4.5],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.1,
              }}
            />
            <Layer
              id="mini-extrusions"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': colorExpression,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Simple dot markers for projects */}
        {projects.map((p) => (
          <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} anchor="center">
            <div className="mini-map-dot" />
          </Marker>
        ))}
      </Map>

      {/* Neighborhood name overlay */}
      <div className="absolute bottom-4 left-4 glass-panel rounded-lg px-4 py-2">
        <span className="text-xs text-text-muted uppercase tracking-wider">Explore</span>
        <h3 className="text-sm font-semibold text-text-primary">{neighborhoodName}</h3>
      </div>

      {/* Gradient fade at top edge */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-bg to-transparent pointer-events-none" />
    </div>
  );
}
