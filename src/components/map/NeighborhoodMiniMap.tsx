'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox';
import Link from 'next/link';
import { type MapProject, type BuildingsData, STATUS_COLOR_EXPR, STATUS_HEX, loadBuildings, addCityBuildings } from './mapShared';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type MiniProject = MapProject;

export default function NeighborhoodMiniMap({
  center,
  neighborhoodName,
  neighborhoodId,
}: {
  center: [number, number];
  neighborhoodName: string;
  neighborhoodId: string;
}) {
  const mapRef = useRef<MapRef>(null);
  const [geojsonData, setGeojsonData] = useState<BuildingsData | null>(null);
  const [selectedProject, setSelectedProject] = useState<MiniProject | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

  useEffect(() => {
    let alive = true;
    loadBuildings().then((d) => { if (alive) setGeojsonData(d); });
    return () => { alive = false; };
  }, [neighborhoodId]);

  const projects: MiniProject[] = geojsonData ? Object.values(geojsonData.projects) : [];

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) addCityBuildings(map, '3d-buildings-mini');
  }, []);

  const colorExpr: any = STATUS_COLOR_EXPR;

  const onMapClick = useCallback((e: MapMouseEvent) => {
    const id = e.features?.[0]?.properties?.id;
    setSelectedProject((id && geojsonData?.projects[id]) || null);
  }, [geojsonData]);

  const statusColor = (status: string) => STATUS_HEX[status] || '#8A9098';

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
        onClick={onMapClick}
        interactiveLayerIds={geojsonData ? ['mini-extrusions'] : []}
        cooperativeGestures={isTouch}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {geojsonData && (
          <Source id="mini-buildings" type="geojson" data={geojsonData}>
            <Layer
              id="mini-extrusions"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': colorExpr,
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Dot markers with larger click targets */}
        {projects.map((p) => (
          <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} anchor="center">
            <div
              className="relative cursor-pointer flex items-center justify-center"
              style={{ width: 32, height: 32 }}
              onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="mini-map-dot"
                style={{
                  background: statusColor(p.status),
                  boxShadow: `0 0 10px ${statusColor(p.status)}88`,
                  transform: hoveredId === p.id ? 'scale(1.4)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </div>
          </Marker>
        ))}

        {/* Popup on click */}
        {selectedProject && (
          <Popup
            longitude={selectedProject.longitude}
            latitude={selectedProject.latitude}
            anchor="bottom"
            onClose={() => setSelectedProject(null)}
            closeButton={false}
            className="mini-map-popup"
          >
            <div className="p-3 min-w-[180px]">
              <h4 className="text-sm font-semibold text-text-primary leading-tight">{selectedProject.name}</h4>
              <p className="text-xs text-text-muted mt-1">
                {selectedProject.floors ? `${selectedProject.floors} floors` : 'New development'}
                {selectedProject.priceMin && selectedProject.priceMin >= 1000000
                  ? ` · From $${(selectedProject.priceMin / 1000000).toFixed(1)}M`
                  : selectedProject.priceMin ? ` · From $${(selectedProject.priceMin / 1000).toFixed(0)}K` : ''}
              </p>
              <Link
                href={`/properties/${selectedProject.slug}`}
                className="inline-block mt-2 text-xs text-accent-green font-medium hover:underline"
              >
                View Listing &rarr;
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Neighborhood overlay */}
      <div className="absolute bottom-4 left-4 glass-panel rounded-lg px-4 py-2 pointer-events-none">
        <span className="text-xs text-text-muted uppercase tracking-wider">Explore</span>
        <h3 className="text-sm font-semibold text-text-primary">{neighborhoodName}</h3>
      </div>

      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-bg to-transparent pointer-events-none" />
    </div>
  );
}
