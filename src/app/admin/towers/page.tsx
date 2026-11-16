'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { buildTower, type Recipe, RESIDENTIAL_FLOOR_M, PODIUM_FLOOR_M } from '@/lib/massing';
import { thumbUrl } from '@/lib/utils';

const TowerPreview = dynamic(() => import('@/components/admin/TowerPreview'), { ssr: false });

type Row = {
  id: string; name: string; slug: string; status: string; floors: number | null;
  latitude: number; longitude: number; mainImageUrl: string | null;
  footprint: { coordinates: [number, number][][] } | null; footprintSource: string | null;
  heightM: number | null; heightIsPublished: boolean; massing: Recipe | null; massingConfirmed: boolean;
};

const BLANK: Recipe = { towers: 1, podium: true, podiumFloors: 4, shape: 'slab', crown: 'flat', colors: { glass: '#7F9BB0', slab: '#E6E8EA', accent: '#9AA3AB' } };
const SHAPES: [NonNullable<Recipe['shape']>, string][] = [['slab', 'Slab'], ['square', 'Square'], ['curved', 'Curved'], ['tapered', 'Tapered'], ['stepped', 'Stepped'], ['offset-blocks', 'Stacked offset blocks']];
const input = 'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green/50';
const label = 'block text-[11px] text-text-muted uppercase tracking-wider mb-1';

export default function TowersAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'draft' | 'confirmed'>('all');
  const [q, setQ] = useState('');
  const [recipe, setRecipe] = useState<Recipe>(BLANK);
  const [floors, setFloors] = useState<string>('');
  const [heightM, setHeightM] = useState<string>('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    fetch('/api/admin/massing').then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : []));
  }, []);

  const sel = rows.find((r) => r.id === selId) || null;
  useEffect(() => {
    if (!sel) return;
    setRecipe(sel.massing ? { ...BLANK, ...sel.massing, colors: { ...BLANK.colors, ...(sel.massing.colors || {}) } } : BLANK);
    setFloors(sel.floors ? String(sel.floors) : '');
    setHeightM(sel.heightM ? String(sel.heightM) : '');
    setPublished(!!sel.heightIsPublished);
    setSaving('');
  }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = rows.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'todo') return !r.massing;
    if (filter === 'draft') return !!r.massing && !r.massingConfirmed;
    if (filter === 'confirmed') return r.massingConfirmed;
    return true;
  });
  const counts = { todo: rows.filter((r) => !r.massing).length, draft: rows.filter((r) => r.massing && !r.massingConfirmed).length, confirmed: rows.filter((r) => r.massingConfirmed).length };

  const lot = sel?.footprint?.coordinates?.[0] || null;
  const floorsN = floors ? Number(floors) : null;
  const heightN = heightM ? Number(heightM) : null;
  const built = useMemo(
    () => (lot ? buildTower({ lot, floors: floorsN, heightM: heightN, recipe }) : null),
    [lot, floorsN, heightN, recipe]
  );
  const computedHeight = floorsN
    ? Math.round(((recipe.podium ? recipe.podiumFloors || 0 : 0) * PODIUM_FLOOR_M + (floorsN - (recipe.podium ? recipe.podiumFloors || 0 : 0)) * RESIDENTIAL_FLOOR_M) * 10) / 10
    : null;

  const set = (patch: Partial<Recipe>) => setRecipe((r) => ({ ...r, ...patch }));
  const setManual = (patch: NonNullable<Recipe['manual']>) => setRecipe((r) => ({ ...r, manual: { ...(r.manual || {}), ...patch } }));
  const setColor = (k: 'glass' | 'slab' | 'accent', v: string) => setRecipe((r) => ({ ...r, colors: { ...(r.colors || {}), [k]: v } }));

  const save = async (confirmed: boolean) => {
    if (!sel) return;
    setSaving('Saving…');
    const res = await fetch('/api/admin/massing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sel.id, massing: recipe, massingConfirmed: confirmed, floors: floors || null, heightM: heightM || null, heightIsPublished: published && !!heightM }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setSaving(data.error || 'Could not save.'); return; }
    setRows((prev) => prev.map((r) => (r.id === sel.id ? { ...r, ...data } : r)));
    setSaving(confirmed ? 'Saved and confirmed. The map updates within 5 minutes.' : 'Saved as draft. The map updates within 5 minutes.');
  };

  const remove = async () => {
    if (!sel || !window.confirm(`Remove the recipe for ${sel.name}? It goes back to the simple status-coloured tower.`)) return;
    const res = await fetch('/api/admin/massing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sel.id, massing: null, massingConfirmed: false }) });
    if (res.ok) { const data = await res.json(); setRows((prev) => prev.map((r) => (r.id === sel.id ? { ...r, ...data } : r))); setSaving('Recipe removed.'); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Map Towers</h1>
        <p className="text-sm text-text-muted mt-1">
          Shape and colour come from the recipe. Size always comes from the lot outline and the height or storey count.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
        {/* Project list */}
        <div className="glass-panel rounded-xl p-3 xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto">
          <input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} className={input} />
          <div className="flex flex-wrap gap-1.5 my-3 text-xs">
            {([['all', `All ${rows.length}`], ['todo', `No recipe ${counts.todo}`], ['draft', `Draft ${counts.draft}`], ['confirmed', `Confirmed ${counts.confirmed}`]] as const).map(([k, t]) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded-full border ${filter === k ? 'border-accent-green text-accent-green' : 'border-border text-text-muted'}`}>{t}</button>
            ))}
          </div>
          <ul className="space-y-1">
            {list.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelId(r.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 ${selId === r.id ? 'bg-accent-green/10 text-accent-green' : 'text-text-primary hover:bg-surface2'}`}>
                  <span className="truncate">{r.name}</span>
                  <span className={`text-[10px] flex-shrink-0 ${r.massingConfirmed ? 'text-accent-green' : r.massing ? 'text-accent-orange' : 'text-text-muted/50'}`}>
                    {r.massingConfirmed ? 'confirmed' : r.massing ? 'draft' : '—'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        {!sel ? (
          <div className="glass-panel rounded-xl p-10 text-center text-text-muted text-sm">Pick a project to edit its tower.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="glass-panel rounded-xl overflow-hidden h-[380px]">
                {built ? <TowerPreview key={sel.id} parts={built.parts} pad={built.pad} center={[sel.longitude, sel.latitude]} status={sel.status} />
                  : <div className="h-full flex items-center justify-center text-sm text-text-muted">This project has no outline yet.</div>}
              </div>
              {sel.mainImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(sel.mainImageUrl) || ''} alt={`${sel.name} rendering`} className="w-full rounded-xl border border-border max-h-[300px] object-cover" />
              )}
              <p className="text-xs text-text-muted">
                Outline source: <span className="text-text-primary">{sel.footprintSource === 'parcel' ? 'county lot record' : sel.footprintSource === 'generated' ? 'placeholder rectangle (not the real lot)' : sel.footprintSource || 'unknown'}</span>
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5 space-y-5">
              <h2 className="text-lg font-semibold text-text-primary">{sel.name}</h2>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Size (data)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label><span className={label}>Storeys</span><input type="number" min={1} max={200} value={floors} onChange={(e) => setFloors(e.target.value)} className={input} /></label>
                  <label><span className={label}>Height (m)</span><input type="number" min={5} max={1000} step={0.1} value={heightM} onChange={(e) => setHeightM(e.target.value)} placeholder={computedHeight ? `${computedHeight} from storeys` : ''} className={input} /></label>
                </div>
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} disabled={!heightM} />
                  This height is a published figure (otherwise it is treated as an estimate)
                </label>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Shape (recipe)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label><span className={label}>Tower shape</span>
                    <select value={recipe.shape} onChange={(e) => set({ shape: e.target.value as Recipe['shape'] })} className={input}>
                      {SHAPES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  </label>
                  <label><span className={label}>Crown</span>
                    <select value={recipe.crown} onChange={(e) => set({ crown: e.target.value as Recipe['crown'] })} className={input}>
                      <option value="flat">Flat</option><option value="stepped">Stepped</option><option value="spire">Spire</option>
                    </select>
                  </label>
                  <label><span className={label}>Towers</span><input type="number" min={1} max={3} value={recipe.towers || 1} onChange={(e) => set({ towers: Number(e.target.value) })} className={input} /></label>
                  {recipe.shape === 'offset-blocks' && (
                    <label><span className={label}>Blocks</span><input type="number" min={2} max={12} value={recipe.blocks || 6} onChange={(e) => set({ blocks: Number(e.target.value) })} className={input} /></label>
                  )}
                  <label className="flex items-center gap-2 text-sm text-text-muted col-span-2">
                    <input type="checkbox" checked={!!recipe.podium} onChange={(e) => set({ podium: e.target.checked })} /> Has a podium
                    {recipe.podium && <input type="number" min={1} max={20} value={recipe.podiumFloors || 4} onChange={(e) => set({ podiumFloors: Number(e.target.value) })} className={`${input} !w-20 ml-2`} aria-label="Podium floors" />}
                    {recipe.podium && <span>floors</span>}
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Facade colours</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(['glass', 'slab', 'accent'] as const).map((k) => (
                    <label key={k}><span className={label}>{k}</span>
                      <input type="color" value={recipe.colors?.[k] || '#888888'} onChange={(e) => setColor(k, e.target.value)} className="w-full h-10 bg-surface2 border border-border rounded-lg cursor-pointer" />
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Position on the lot (hand-entered)</h3>
                <label><span className={label}>Along the lot: {(recipe.manual?.offsetAlong || 0).toFixed(2)}</span>
                  <input type="range" min={-1} max={1} step={0.05} value={recipe.manual?.offsetAlong || 0} onChange={(e) => setManual({ offsetAlong: Number(e.target.value) })} className="w-full" /></label>
                <label><span className={label}>Across the lot: {(recipe.manual?.offsetAcross || 0).toFixed(2)}</span>
                  <input type="range" min={-1} max={1} step={0.05} value={recipe.manual?.offsetAcross || 0} onChange={(e) => setManual({ offsetAcross: Number(e.target.value) })} className="w-full" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label><span className={label}>Tower width (m)</span><input type="number" min={8} max={150} value={recipe.manual?.plateWidthM || ''} placeholder="auto" onChange={(e) => setManual({ plateWidthM: e.target.value ? Number(e.target.value) : undefined })} className={input} /></label>
                  <label><span className={label}>Tower depth (m)</span><input type="number" min={8} max={150} value={recipe.manual?.plateDepthM || ''} placeholder="auto" onChange={(e) => setManual({ plateDepthM: e.target.value ? Number(e.target.value) : undefined })} className={input} /></label>
                </div>
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input type="checkbox" checked={!!recipe.manual?.rotate90} onChange={(e) => setManual({ rotate90: e.target.checked })} /> Turn the tower a quarter turn
                </label>
              </section>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                <button onClick={() => save(true)} className="btn-primary text-sm">Confirm and save</button>
                <button onClick={() => save(false)} className="btn-secondary text-sm">Save as draft</button>
                {sel.massing && <button onClick={remove} className="text-xs text-red-400/80 hover:text-red-400 ml-auto">Remove recipe</button>}
              </div>
              {saving && <p className="text-sm text-text-muted">{saving}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
