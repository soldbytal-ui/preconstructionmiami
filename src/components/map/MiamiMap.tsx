'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ColumnLayer } from '@deck.gl/layers';
import MapTooltip from './MapTooltip';
import MapPropertyCard from './MapPropertyCard';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -80.1937,
  latitude: 25.7740,
  zoom: 13.5,
  pitch: 55,
  bearing: -20,
  transitionDuration: 0,
};

const STATUS_COLORS: Record<string, [number, number, number, number]> = {
  PRE_LAUNCH: [0, 229, 180, 220],
  PRE_CONSTRUCTION: [0, 229, 180, 220],
  UNDER_CONSTRUCTION: [56, 182, 255, 220],
  NEAR_COMPLETION: [255, 122, 61, 220],
  COMPLETED: [138, 144, 152, 220],
};

export type MapProject = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  floors: number | null;
  totalUnits: number | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  category: string;
  address: string | null;
  developer: { name: string } | null;
  neighborhood: { name: string; slug: string } | null;
  estCompletion: string | null;
  description: string | null;
  mainImageUrl: string | null;
};

type HoverInfo = {
  x: number;
  y: number;
  object: MapProject;
} | null;

export default function MiamiMap({ projects }: { projects: MapProject[] }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const mapRef = useRef<any>(null);

  const validProjects = projects.filter(
    (p) => p.latitude && p.longitude && p.latitude !== 0 && p.longitude !== 0
  );

  const onHover = useCallback((info: any) => {
    if (info.object) {
      setHoverInfo({ x: info.x, y: info.y, object: info.object });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const onClick = useCallback((info: any) => {
    if (info.object) {
      setSelectedProject(info.object);
      setHoverInfo(null);
      setViewState((prev: any) => ({
        ...prev,
        longitude: info.object.longitude,
        latitude: info.object.latitude,
        zoom: 15,
        transitionDuration: 800,
      }));
    }
  }, []);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const layers = map.getStyle()?.layers;
    if (!layers) return;

    const labelLayerId = layers.find(
      (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    if (!map.getLayer('3d-buildings')) {
      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': '#1a1d23',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.5,
          },
        },
        labelLayerId
      );
    }
  }, []);

  const columnLayer = new ColumnLayer({
    id: 'projects-columns',
    data: validProjects,
    getPosition: (d: MapProject) => [d.longitude!, d.latitude!],
    diskResolution: 12,
    radius: 30,
    extruded: true,
    getElevation: (d: MapProject) => (d.floors || 10) * 5,
    getFillColor: (d: MapProject) => {
      if (selectedProject && d.id === selectedProject.id) {
        return [255, 255, 255, 255];
      }
      return STATUS_COLORS[d.status] || [138, 144, 152, 220];
    },
    material: {
      ambient: 0.4,
      diffuse: 0.7,
      shininess: 50,
    },
    pickable: true,
    onHover,
    onClick,
    updateTriggers: {
      getFillColor: [selectedProject?.id],
    },
  } as any);

  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }: any) => setViewState(vs)}
        controller={true}
        layers={[columnLayer]}
        getCursor={({ isHovering }: any) => (isHovering ? 'pointer' : 'grab')}
      >
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          onLoad={onMapLoad}
          reuseMaps
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
        </Map>
      </DeckGL>

      {hoverInfo && !selectedProject && <MapTooltip info={hoverInfo} />}

      {selectedProject && (
        <MapPropertyCard
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
