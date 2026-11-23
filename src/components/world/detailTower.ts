// A detailed, lit glass model for one tower, drawn inside the map with three.js.
// Geometry comes only from the tower's filed volumes (real outlines, base and top heights);
// this file adds the look: continuous glazing with fine framing, sky reflections, sun and shade.
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';

export type DetailData = {
  id: string;
  center: [number, number];
  volumes: { ring: [number, number][]; baseM: number; topM: number; kind: 'tower' | 'podium' }[];
  colors: { glass?: string; slab?: string; accent?: string };
  podiumWall: string | null;
};
export type Sun = { alt: number; az: number };

const FLOOR_M = 3.4, PANEL_M = 1.5, TILE_PANELS = 8, TILE_FLOORS = 6;

/** One repeating piece of curtain wall: panels with slim mullions, a faint line per floor, slight panel-to-panel variation. */
function glazingTexture(seed: number): THREE.CanvasTexture {
  const W = 512, H = 512, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  let s = seed || 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pw = W / TILE_PANELS, fh = H / TILE_FLOORS;
  for (let f = 0; f < TILE_FLOORS; f++) for (let p = 0; p < TILE_PANELS; p++) {
    const v = 214 + Math.round(rnd() * 38);                    // each pane reflects a little differently
    g.fillStyle = `rgb(${v - 6},${v - 2},${v})`;
    g.fillRect(p * pw, f * fh, pw, fh);
    if (rnd() < 0.07) { g.fillStyle = 'rgba(255,224,170,0.30)'; g.fillRect(p * pw, f * fh + fh * 0.18, pw, fh * 0.62); } // a lit room
  }
  g.fillStyle = 'rgba(40,52,64,0.42)';                          // floor lines: present but subtle
  for (let f = 0; f < TILE_FLOORS; f++) g.fillRect(0, f * fh, W, 3);
  g.fillStyle = 'rgba(40,50,60,0.55)';                          // mullions
  for (let p = 0; p < TILE_PANELS; p++) g.fillRect(p * pw, 0, p % 2 ? 2.5 : 4, H);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / (TILE_PANELS * PANEL_M), 1 / (TILE_FLOORS * FLOOR_M));
  t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Podium glazing: larger panes in a heavier dark frame, as at the base of the tower. */
function finTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e9eef2'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(28,34,42,0.8)';
  for (let i = 0; i < 4; i++) { g.fillRect(i * 64, 0, 5, 256); g.fillRect(0, i * 64, 256, 5); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 12, 1 / 18); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The sky the glass reflects. One side holds the sun and its glow, the other is deeper blue,
 * so the facade facing the sun and the one turned away pick up visibly different reflections.
 * u is the sun's position across the picture (0..1), alt its height in degrees.
 */
function skyTexture(night: boolean, u: number, alt: number): THREE.CanvasTexture {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, H);
  if (night) { grad.addColorStop(0, '#070c1c'); grad.addColorStop(0.5, '#1d2742'); grad.addColorStop(0.52, '#2c2832'); grad.addColorStop(1, '#101116'); }
  else { grad.addColorStop(0, '#1f5fae'); grad.addColorStop(0.3, '#4f8fd0'); grad.addColorStop(0.5, '#a9cbe6'); grad.addColorStop(0.515, '#a3bccf'); grad.addColorStop(1, '#7c95aa'); }
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  if (!night) {
    const low = alt < 14;
    for (const dx of [-W, 0, W]) {                                   // drawn three times so the glow wraps round the seam
      const x = u * W + dx;
      const shade = g.createRadialGradient(x + W / 2, H * 0.5, 0, x + W / 2, H * 0.5, W * 0.42);   // away from the sun: darker
      shade.addColorStop(0, 'rgba(12,38,84,0.55)'); shade.addColorStop(1, 'rgba(12,38,84,0)');
      g.fillStyle = shade; g.fillRect(0, 0, W, H);
      const glow = g.createRadialGradient(x, H * 0.5, 0, x, H * 0.5, W * 0.36);                    // towards the sun: bright
      glow.addColorStop(0, low ? 'rgba(255,214,160,0.95)' : 'rgba(255,255,255,0.90)'); glow.addColorStop(0.45, low ? 'rgba(255,200,150,0.40)' : 'rgba(235,245,255,0.42)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glow; g.fillRect(0, 0, W, H);
    }
    let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 30; i++) {
      const x = rnd() * W, y = 70 + rnd() * 170, r = 36 + rnd() * 70;
      const cg = g.createRadialGradient(x, y, 0, x, y, r);
      cg.addColorStop(0, 'rgba(255,255,255,0.38)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, r * 1.9, r * 0.5, 0, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createDetailLayer(id: string, data: DetailData, opts: { night: boolean; sun: Sun }) {
  const [lng0, lat0] = data.center;
  const mPerLng = 111320 * Math.cos((lat0 * Math.PI) / 180), mPerLat = 110540;
  const merc = mapboxgl.MercatorCoordinate.fromLngLat([lng0, lat0], 0);
  const s = merc.meterInMercatorCoordinateUnits();
  // The scene is in metres with x east, y up, z south; this places it on the map. The flip mirrors it, so materials are double-sided
  const place = new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z || 0).scale(new THREE.Vector3(s, -s, s)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  const model = new THREE.Group();
  model.rotation.x = -Math.PI / 2;   // footprints are drawn flat (x east, y north) and stood up

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const full = new THREE.Matrix4(), inv = new THREE.Matrix4(), shift = new THREE.Matrix4();
  let renderer: THREE.WebGLRenderer | null = null;
  let map: mapboxgl.Map | null = null;
  const disposables: { dispose: () => void }[] = [];

  const hemi = new THREE.HemisphereLight(0xe2efff, 0x8d8676, opts.night ? 0.35 : 1.0);
  const sunLight = new THREE.DirectionalLight(0xfff4e2, 2.4);
  const fill = new THREE.DirectionalLight(0xbfd6ff, 0.35);   // sky light from the opposite side, so the shaded faces stay readable
  scene.add(model, hemi, sunLight, sunLight.target, fill, fill.target);

  const top = Math.max(...data.volumes.map((v) => v.topM));
  let pm: THREE.PMREMGenerator | null = null;
  let skyKey = '';
  function setSun(sun: Sun, night: boolean) {
    const alt = (Math.max(6, sun.alt) * Math.PI) / 180, az = (sun.az * Math.PI) / 180;
    const d = new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));
    sunLight.target.position.set(0, top * 0.5, 0);
    sunLight.position.copy(d.clone().multiplyScalar(900)).add(sunLight.target.position);
    fill.target.position.set(0, top * 0.5, 0);
    fill.position.set(-d.x * 600, top * 0.9, -d.z * 600);
    const up = sun.alt > 0 && !night;
    sunLight.intensity = up ? 1.5 + Math.min(1, sun.alt / 25) * 1.1 : 0.1;
    sunLight.color.set(up && sun.alt < 14 ? 0xffd2a0 : 0xfff4e2);   // warm, low sun early and late
    hemi.intensity = night ? 0.3 : up ? 0.85 : 0.4;
    // Repaint the reflected sky when the sun has moved enough to notice
    const u = Math.atan2(d.z, d.x) / (2 * Math.PI) + 0.5;
    const key = `${night || !up ? 'n' : 'd'}${Math.round(u * 48)}${sun.alt < 14 ? 'l' : 'h'}`;
    if (pm && key !== skyKey) {
      skyKey = key;
      const sky = skyTexture(night || !up, u, sun.alt);
      const old = scene.environment;
      scene.environment = pm.fromEquirectangular(sky).texture;
      sky.dispose(); old?.dispose();
    }
  }

  function build() {
    const glassMap = glazingTexture(data.id.length * 31 + 7);
    const fins = finTexture();
    const tint = new THREE.Color(data.colors.glass || '#7FA8C2').lerp(new THREE.Color('#c4ccd2'), 0.5);
    const glass = new THREE.MeshStandardMaterial({ color: tint, map: glassMap, metalness: 0.72, roughness: 0.16, envMapIntensity: opts.night ? 0.8 : 1.0, side: THREE.DoubleSide });
    const recess = new THREE.MeshStandardMaterial({ color: 0x1b222a, metalness: 0.5, roughness: 0.35, envMapIntensity: 0.5, side: THREE.DoubleSide });   // the dark reveal between cubes
    const soffit = new THREE.MeshStandardMaterial({ color: 0x3a342c, metalness: 0.35, roughness: 0.55, side: THREE.DoubleSide });                        // bronze underside of each overhang
    const cap = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    const screen = new THREE.MeshStandardMaterial({ color: tint.clone().multiplyScalar(0.9), map: fins, metalness: 0.7, roughness: 0.2, side: THREE.DoubleSide });
    const lobby = new THREE.MeshStandardMaterial({ color: 0x9fbccd, map: glassMap, metalness: 0.6, roughness: 0.2, emissive: 0xffd9a0, emissiveIntensity: opts.night ? 0.5 : 0.1, side: THREE.DoubleSide });
    const edge = new THREE.MeshStandardMaterial({ color: 0xe6eaed, roughness: 0.55, metalness: 0.25, side: THREE.DoubleSide });
    disposables.push(glassMap, fins, glass, recess, soffit, cap, screen, lobby, edge);

    const shapeOf = (ring: [number, number][], grow = 0) => {
      const pts = ring.slice(0, -1).map(([lng, lat]) => new THREE.Vector2((lng - lng0) * mPerLng, (lat - lat0) * mPerLat));
      if (grow) { const c = pts.reduce((a, p) => a.add(p), new THREE.Vector2()).multiplyScalar(1 / pts.length); pts.forEach((p) => p.add(p.clone().sub(c).setLength(grow))); }
      return new THREE.Shape(pts);
    };
    const add = (ring: [number, number][], base: number, topM: number, side: THREE.Material, capM: THREE.Material, grow = 0) => {
      const geo = new THREE.ExtrudeGeometry(shapeOf(ring, grow), { depth: topM - base, bevelEnabled: false });
      const mesh = new THREE.Mesh(geo, [capM, side]);
      mesh.position.z = base; mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      model.add(mesh); disposables.push(geo);
    };

    const towers = data.volumes.filter((v) => v.kind !== 'podium');
    for (const v of data.volumes) {
      if (v.kind === 'podium') {
        const lobbyH = Math.min(9, (v.topM - v.baseM) * 0.25);
        add(v.ring, v.baseM, v.baseM + lobbyH, lobby, cap, -0.6);          // glazed street level, set in under the screen
        add(v.ring, v.baseM + lobbyH, v.topM, screen, cap);                // the podium cube above, glazed with a heavier frame
        add(v.ring, v.topM, v.topM + 0.5, edge, cap, 0.25);                // roof edge
      } else {
        const first = v === towers[0];
        const reveal = first ? 0 : 3.2;                                    // each cube sits on a dark recessed floor, as in the renderings
        if (reveal) {
          add(v.ring, v.baseM, v.baseM + reveal, recess, soffit, -1.6);
          add(v.ring, v.baseM + reveal, v.baseM + reveal + 0.45, soffit, soffit, 0.05);   // the underside of the overhang
        }
        add(v.ring, v.baseM + reveal + (reveal ? 0.45 : 0), v.topM - 0.6, glass, cap);
        add(v.ring, v.topM - 0.6, v.topM, edge, cap, 0.12);                // a thin bright edge where each cube ends
      }
    }
  }

  const layer: mapboxgl.CustomLayerInterface = {
    id, type: 'custom', renderingMode: '3d',
    onAdd(m, gl) {
      map = m;
      renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl as WebGLRenderingContext, antialias: true });
      renderer.autoClear = false;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.night ? 0.8 : 0.95;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      pm = new THREE.PMREMGenerator(renderer);
      // Each projecting cube shades the one below it
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      const cam = sunLight.shadow.camera; cam.left = -top * 0.6; cam.right = top * 0.6; cam.top = top * 0.6; cam.bottom = -top * 0.6; cam.near = 100; cam.far = 2200; cam.updateProjectionMatrix();
      sunLight.shadow.bias = -0.0015; sunLight.shadow.normalBias = 0.6;
      build(); setSun(opts.sun, opts.night);
      renderer.resetState();
    },
    render(_gl, matrix) {
      if (!renderer) return;
      // The map hands over one combined matrix. Recover where the eye is, so reflections and highlights are worked out
      // from the viewer's real position, and leave the rest as the projection.
      full.fromArray(matrix as unknown as number[]).multiply(place);
      const e = new THREE.Vector4(0, 0, 1, 0).applyMatrix4(inv.copy(full).invert());
      camera.position.set(e.x / e.w, e.y / e.w, e.z / e.w);
      camera.projectionMatrix.copy(full).multiply(shift.makeTranslation(camera.position.x, camera.position.y, camera.position.z));
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      renderer.resetState();
      renderer.render(scene, camera);
    },
    onRemove() {
      disposables.forEach((d) => d.dispose());
      (scene.environment as THREE.Texture | null)?.dispose(); pm?.dispose(); pm = null;
      renderer?.resetState();
      renderer = null; map = null;
    },
  };

  /** Is this screen point (CSS pixels from the map's top left) on the tower? */
  function hit(x: number, y: number): boolean {
    if (!map) return false;
    const c = map.getCanvas();
    const inv = full.clone().invert();
    const nx = (x / c.clientWidth) * 2 - 1, ny = 1 - (y / c.clientHeight) * 2;
    const a = new THREE.Vector3(nx, ny, -1).applyMatrix4(inv), b = new THREE.Vector3(nx, ny, 1).applyMatrix4(inv);
    const ray = new THREE.Raycaster(a, b.sub(a).normalize());
    return ray.intersectObjects(model.children, false).length > 0;
  }

  return { layer, hit, setSun: (sun: Sun, night: boolean) => { setSun(sun, night); map?.triggerRepaint(); } };
}
