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

// Featured building slugs — these get permanent floating labels
const FEATURED_SLUGS = new Set([
  'waldorf-astoria-residences-miami',
  'mercedes-benz-places-miami',
  '888-brickell-by-dolce-and-gabbana',
  'baccarat-residences-miami',
  'ora-by-casa-tua',
]);

const STATUS_BEAM_COLORS: Record<string, string> = {
  PRE_LAUNCH: '#00E5B4',
  PRE_CONSTRUCTION: '#00E5B4',
  UNDER_CONSTRUCTION: '#38B6FF',
  NEAR_COMPLETION: '#FF7A3D',
  COMPLETED: '#8A9098',
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

/** Beam marker — featured buildings get persistent labels, others get hover-only labels */
function BeamMarker({
  project,
  isHovered,
  isFeatured,
  onHover,
  onClick,
  scale = 1,
}: {
  project: MapProject;
  isHovered: boolean;
  isFeatured: boolean;
  onHover: (p: MapProject | null, e: React.MouseEvent) => void;
  onClick: (p: MapProject) => void;
  scale?: number;
}) {
  const color = STATUS_BEAM_COLORS[project.status] || '#8A9098';
  const showLabel = isFeatured || isHovered;

  return (
    <Marker
      longitude={project.longitude!}
      latitude={project.latitude!}
      anchor="bottom"
    >
      <div
        className="beam-marker-container cursor-pointer"
        style={{ transform: `scale(${scale})` }}
        onMouseEnter={(e) => onHover(project, e)}
        onMouseLeave={() => onHover(null, null as any)}
        onClick={(e) => { e.stopPropagation(); onClick(project); }}
      >
        {/* Floating label — always for featured, hover-only for others */}
        {showLabel && (
          <div className={`beam-label ${isHovered ? 'beam-label-hover' : ''}`}>
            <span className="beam-label-name">{project.name}</span>
            {project.priceMin && (
              <span className="beam-label-price">From {formatPrice(project.priceMin)}</span>
            )}
          </div>
        )}

        {/* Beam of light — colored by status */}
        <div
          className={isFeatured ? 'beam-shaft-featured' : 'beam-shaft-small'}
          style={{
            background: `linear-gradient(to top, ${color}, ${color}99 30%, ${color}33 70%, transparent)`,
            boxShadow: isHovered
              ? `0 0 15px ${color}99, 0 0 40px ${color}44`
              : `0 0 6px ${color}66`,
          }}
        />

        {/* Ground glow */}
        <div
          className="beam-ground-glow"
          style={{ background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }}
        />

        {/* Pulse rings — only for featured */}
        {isFeatured && (
          <>
            <div className="beam-pulse-ring beam-pulse-ring-1" style={{ borderColor: `${color}88` }} />
            <div className="beam-pulse-ring beam-pulse-ring-2" style={{ borderColor: `${color}88` }} />
          </>
        )}

        {/* Center dot */}
        <div
          className="beam-dot"
          style={{ background: color, boxShadow: `0 0 6px ${color}, 0 0 12px ${color}88` }}
        />
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

  // ALL projects with coordinates get beam markers
  const markerProjects = useMemo(() => {
    return projects.filter((p) => p.latitude && p.longitude && p.latitude !== 0);
  }, [projects]);

  // Scale beam markers based on zoom
  const beamScale = Math.max(0.4, Math.min(1.2, (viewState.zoom - 11) / 5));

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
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'height'],
              0, '#16181e', 50, '#1e2028', 100, '#252730', 200, '#2d3040',
            ],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.75,
          },
        },
        labelLayerId
      );
    }

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

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features;
    if (features && features.length > 0) {
      const props = features[0].properties;
      if (!props) return;
      setHoveredId(props.id);
      setHoverInfo({ x: e.point.x, y: e.point.y, object: buildProjectFromProps(props) });
    } else if (!hoveredId) {
      setHoverInfo(null);
    }
  }, [buildProjectFromProps, hoveredId]);

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

  const onMarkerHover = useCallback((p: MapProject | null, e: React.MouseEvent | null) => {
    if (p) {
      setHoveredId(p.id);
      if (e) {
        setHoverInfo({ x: e.clientX, y: e.clientY, object: p });
      }
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

        {/* Beam markers for ALL 130 buildings */}
        {markerProjects.map((p) => (
          <BeamMarker
            key={p.id}
            project={p}
            isHovered={hoveredId === p.id}
            isFeatured={FEATURED_SLUGS.has(p.slug)}
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
