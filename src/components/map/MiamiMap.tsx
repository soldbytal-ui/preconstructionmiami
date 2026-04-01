'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer, useControl } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import MapTooltip from './MapTooltip';
import MapPropertyCard from './MapPropertyCard';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -80.1937,
  latitude: 25.7740,
  zoom: 13.5,
  pitch: 55,
  bearing: -20,
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

type ModelBuilding = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  floors: number;
  status: string;
  modelUrl: string;
};

// Deck.gl overlay component that integrates with react-map-gl
function DeckGLOverlay({ layers }: { layers: any[] }) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: true }));
  overlay.setProps({ layers });
  return null;
}

export default function MiamiMap({ projects }: { projects: MapProject[] }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [modelBuildings, setModelBuildings] = useState<ModelBuilding[]>([]);
  const mapRef = useRef<MapRef>(null);

  // Fetch GeoJSON data from API
  useEffect(() => {
    fetch('/api/buildings-geojson')
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
        // Extract buildings that have custom 3D models
        const withModels: ModelBuilding[] = [];
        for (const feature of data.features || []) {
          const p = feature.properties;
          if (p?.modelUrl) {
            withModels.push({
              id: p.id,
              name: p.name,
              slug: p.slug,
              latitude: p.latitude,
              longitude: p.longitude,
              floors: p.floors,
              status: p.status,
              modelUrl: p.modelUrl,
            });
          }
        }
        setModelBuildings(withModels);
      })
      .catch(console.error);
  }, []);

  // Filter out buildings with models from fill-extrusion layer
  const filteredGeojson = useMemo(() => {
    if (!geojsonData || modelBuildings.length === 0) return geojsonData;
    const modelIds = new Set(modelBuildings.map((b) => b.id));
    return {
      ...geojsonData,
      features: geojsonData.features.filter(
        (f: any) => !modelIds.has(f.properties?.id)
      ),
    };
  }, [geojsonData, modelBuildings]);

  const projectLookup = useRef<Record<string, MapProject>>({});
  useEffect(() => {
    const lookup: Record<string, MapProject> = {};
    for (const p of projects) lookup[p.id] = p;
    projectLookup.current = lookup;
  }, [projects]);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
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

  const buildProjectFromProps = useCallback((props: any): MapProject => {
    return projectLookup.current[props.id] || {
      id: props.id,
      name: props.name,
      slug: props.slug,
      latitude: props.latitude,
      longitude: props.longitude,
      floors: props.floors,
      totalUnits: props.totalUnits,
      priceMin: props.priceMin,
      priceMax: props.priceMax,
      status: props.status,
      category: props.category,
      address: props.address,
      developer: props.developer ? { name: props.developer } : null,
      neighborhood: props.neighborhood
        ? { name: props.neighborhood, slug: props.neighborhoodSlug || '' }
        : null,
      estCompletion: props.estCompletion,
      description: props.description,
      mainImageUrl: props.mainImageUrl,
    };
  }, []);

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features;
    if (features && features.length > 0) {
      const props = features[0].properties;
      if (!props) return;
      setHoveredId(props.id);
      setHoverInfo({ x: e.point.x, y: e.point.y, object: buildProjectFromProps(props) });
    } else {
      setHoveredId(null);
      setHoverInfo(null);
    }
  }, [buildProjectFromProps]);

  const onMouseLeave = useCallback(() => {
    setHoveredId(null);
    setHoverInfo(null);
  }, []);

  const onBuildingClick = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features;
    if (!features || features.length === 0) return;
    const props = features[0].properties;
    if (!props) return;
    setSelectedProject(buildProjectFromProps(props));
    setHoverInfo(null);
    setViewState((prev) => ({ ...prev, longitude: props.longitude, latitude: props.latitude, zoom: 15 }));
  }, [buildProjectFromProps]);

  // Color expression for fill-extrusion
  const colorExpression: any = [
    'match', ['get', 'status'],
    'PRE_LAUNCH', '#00E5B4',
    'PRE_CONSTRUCTION', '#00E5B4',
    'UNDER_CONSTRUCTION', '#38B6FF',
    'NEAR_COMPLETION', '#FF7A3D',
    'COMPLETED', '#8A9098',
    '#8A9098',
  ];

  const fillColor: any = hoveredId
    ? ['case', ['==', ['get', 'id'], hoveredId], '#ffffff', colorExpression]
    : colorExpression;

  // Status color for Deck.gl models
  const statusToColor: Record<string, [number, number, number]> = {
    PRE_LAUNCH: [0, 229, 180],
    PRE_CONSTRUCTION: [0, 229, 180],
    UNDER_CONSTRUCTION: [56, 182, 255],
    NEAR_COMPLETION: [255, 122, 61],
    COMPLETED: [138, 144, 152],
  };

  // ScenegraphLayer for buildings with custom 3D models
  const scenegraphLayer = useMemo(() => {
    if (modelBuildings.length === 0) return null;
    return new ScenegraphLayer({
      id: 'building-models',
      data: modelBuildings,
      scenegraph: (d: ModelBuilding) => d.modelUrl,
      getPosition: (d: ModelBuilding) => [d.longitude, d.latitude, 0],
      getOrientation: () => [0, -20, 90] as [number, number, number], // Match Brickell street grid
      sizeScale: (viewState.zoom > 14 ? 1.2 : 0.8),
      _lighting: 'pbr',
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          const d = info.object as ModelBuilding;
          const proj = projectLookup.current[d.id];
          if (proj) {
            setHoveredId(d.id);
            setHoverInfo({ x: info.x, y: info.y, object: proj });
          }
        } else {
          setHoveredId(null);
          setHoverInfo(null);
        }
      },
      onClick: (info: any) => {
        if (info.object) {
          const d = info.object as ModelBuilding;
          const proj = projectLookup.current[d.id];
          if (proj) {
            setSelectedProject(proj);
            setHoverInfo(null);
            setViewState((prev) => ({ ...prev, longitude: d.longitude, latitude: d.latitude, zoom: 15 }));
          }
        }
      },
      getColor: (d: ModelBuilding) => {
        if (hoveredId === d.id) return [255, 255, 255] as [number, number, number];
        return statusToColor[d.status] || [138, 144, 152];
      },
      updateTriggers: {
        getColor: [hoveredId],
      },
    } as any);
  }, [modelBuildings, hoveredId, viewState.zoom]);

  const deckLayers = useMemo(() => {
    return scenegraphLayer ? [scenegraphLayer] : [];
  }, [scenegraphLayer]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={onMapLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onBuildingClick}
        interactiveLayerIds={filteredGeojson ? ['project-extrusions'] : []}
        cursor={hoveredId ? 'pointer' : 'grab'}
        reuseMaps
        attributionControl={false}
        pitch={viewState.pitch}
        bearing={viewState.bearing}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Fill-extrusion for buildings WITHOUT custom models */}
        {filteredGeojson && (
          <Source id="project-buildings" type="geojson" data={filteredGeojson}>
            <Layer
              id="project-extrusions"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': fillColor,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.85,
              }}
            />
          </Source>
        )}

        {/* Deck.gl ScenegraphLayer for buildings WITH custom 3D models */}
        <DeckGLOverlay layers={deckLayers} />
      </Map>

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
