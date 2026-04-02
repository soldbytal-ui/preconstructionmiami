'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer, Marker } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/mapbox';
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

function formatPrice(val: number | null) {
  if (!val) return '';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${(val / 1000).toFixed(0)}K`;
}

/** Pulsing light beam marker for pre-construction buildings */
function BeamMarker({
  project,
  isHovered,
  onHover,
  onClick,
  scale = 1,
}: {
  project: MapProject;
  isHovered: boolean;
  onHover: (p: MapProject | null) => void;
  onClick: (p: MapProject) => void;
  scale?: number;
}) {
  return (
    <Marker
      longitude={project.longitude!}
      latitude={project.latitude!}
      anchor="bottom"
    >
      <div
        className="beam-marker-container cursor-pointer"
        style={{ transform: `scale(${scale})` }}
        onMouseEnter={() => onHover(project)}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onClick(project); }}
      >
        {/* Floating label */}
        <div className={`beam-label ${isHovered ? 'beam-label-hover' : ''}`}>
          <span className="beam-label-name">{project.name}</span>
          {project.priceMin && (
            <span className="beam-label-price">From {formatPrice(project.priceMin)}</span>
          )}
          {project.floors && (
            <span className="beam-label-floors">{project.floors} floors</span>
          )}
        </div>

        {/* Beam of light */}
        <div className={`beam-shaft ${isHovered ? 'beam-shaft-hover' : ''}`} />

        {/* Ground glow */}
        <div className="beam-ground-glow" />

        {/* Pulse rings */}
        <div className="beam-pulse-ring beam-pulse-ring-1" />
        <div className="beam-pulse-ring beam-pulse-ring-2" />
        <div className="beam-pulse-ring beam-pulse-ring-3" />

        {/* Center dot */}
        <div className="beam-dot" />
      </div>
    </Marker>
  );
}

export default function MiamiMap({ projects }: { projects: MapProject[] }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    fetch('/api/buildings-geojson')
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch(console.error);
  }, []);

  const projectLookup = useRef<Record<string, MapProject>>({});
  useEffect(() => {
    const lookup: Record<string, MapProject> = {};
    for (const p of projects) lookup[p.id] = p;
    projectLookup.current = lookup;
  }, [projects]);

  // Only show beam markers for featured buildings (ones with known pre-construction status and coords)
  // At high zoom, markers can overlap — limit to key projects
  const markerProjects = useMemo(() => {
    return projects.filter(
      (p) => p.latitude && p.longitude && p.latitude !== 0
    );
  }, [projects]);

  // Scale beam markers based on zoom to prevent distortion
  const beamScale = Math.max(0.5, Math.min(1.2, (viewState.zoom - 12) / 4));

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const layers = map.getStyle()?.layers;
    if (!layers) return;
    const labelLayerId = layers.find(
      (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    // Enhanced 3D city buildings — brighter, more visible
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
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'height'],
              0, '#16181e',
              50, '#1e2028',
              100, '#252730',
              200, '#2d3040',
            ],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.75,
          },
        },
        labelLayerId
      );
    }

    // Ambient light on building edges — subtle highlight
    if (!map.getLayer('3d-buildings-edges')) {
      map.addLayer(
        {
          id: '3d-buildings-edges',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#00E5B4',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.02,
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

  // Fill-extrusion interactions
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features;
    if (features && features.length > 0) {
      const props = features[0].properties;
      if (!props) return;
      setHoveredId(props.id);
      setHoverInfo({ x: e.point.x, y: e.point.y, object: buildProjectFromProps(props) });
    } else {
      // Don't clear hover if we're hovering a marker (handled by marker events)
      if (!hoveredId || !markerProjects.find(p => p.id === hoveredId)) {
        setHoveredId(null);
        setHoverInfo(null);
      }
    }
  }, [buildProjectFromProps, hoveredId, markerProjects]);

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

  // Marker handlers
  const onMarkerHover = useCallback((p: MapProject | null) => {
    if (p) {
      setHoveredId(p.id);
    } else {
      setHoveredId(null);
      setHoverInfo(null);
    }
  }, []);

  const onMarkerClick = useCallback((p: MapProject) => {
    setSelectedProject(p);
    setHoverInfo(null);
    setViewState((prev) => ({ ...prev, longitude: p.longitude!, latitude: p.latitude!, zoom: 15 }));
  }, []);

  // Fill-extrusion color with status mapping + hover
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

  // Glow layer — slightly larger footprint with transparency for halo effect
  const glowOpacity: any = hoveredId
    ? ['case', ['==', ['get', 'id'], hoveredId], 0.4, 0.08]
    : 0.08;

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
        interactiveLayerIds={geojsonData ? ['project-extrusions'] : []}
        cursor={hoveredId ? 'pointer' : 'grab'}
        reuseMaps
        attributionControl={false}
        pitch={viewState.pitch}
        bearing={viewState.bearing}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {geojsonData && (
          <Source id="project-buildings" type="geojson" data={geojsonData}>
            {/* Glow/halo layer underneath — taller, transparent */}
            <Layer
              id="project-glow"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': colorExpression,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4.5],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': glowOpacity as any,
              }}
            />
            {/* Main building extrusions */}
            <Layer
              id="project-extrusions"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': fillColor,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Pulsing beam markers for all buildings with coordinates */}
        {markerProjects.map((p) => (
          <BeamMarker
            key={p.id}
            project={p}
            isHovered={hoveredId === p.id}
            onHover={onMarkerHover}
            onClick={onMarkerClick}
            scale={beamScale}
          />
        ))}
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
