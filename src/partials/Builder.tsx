import React, { useState } from 'react';
import type { IAProject, IAItem, IACraftingRecipe, IALoot } from '../lib/types';
import vanilla from '../data/vanilla-items.json';
import JSZip from 'jszip';
import { generateYAML } from '../lib/toYAML';

type Groups = { [k: string]: string[] };

const empty: IAProject = { namespace: 'myitems', items: [], recipes: [], loots: [] };

export default function Builder() {
  const [project, setProject] = useState<IAProject>(empty);
  const [dlUrl, setDlUrl] = useState<string | null>(null);

  const groups = vanilla as unknown as Groups;

  function addItem() {
    const n = project.items.length + 1;
    const it: IAItem = { id: `item_${n}`, displayName: `Item ${n}`, material: 'PAPER', texture: '' };
    setProject(p => ({ ...p, items: [...p.items, it] }));
  }
  function addRecipe() {
    const n = project.recipes.length + 1;
    const r: IACraftingRecipe = {
      name: `recipe_${n}`, type: 'crafting_table',
      shape: ['A B C','D E F','G H I'], keys: { A: 'STICK' }, result: 'itemsadder:myitems/item_1', amount: 1
    };
    setProject(p => ({ ...p, recipes: [...p.recipes, r] }));
  }
  function addLoot() {
    const n = project.loots.length + 1;
    const l: IALoot = { name: `loot_${n}`, target: 'block', targetId: 'minecraft:grass', result: 'itemsadder:myitems/item_1', chance: 0.25 };
    setProject(p => ({ ...p, loots: [...p.loots, l] }));
  }

  async function exportZip() {
    const zip = new JSZip();
    const { itemsYml, recipesYml, lootsYml } = generateYAML(project);
    const base = `contents/${project.namespace}`;
    zip.file(`${base}/items.yml`, itemsYml);
    zip.file(`${base}/recipes.yml`, recipesYml);
    zip.file(`${base}/loots.yml`, lootsYml);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    setDlUrl(url);
  }

  function update<K extends keyof IAProject>(k: K, v: IAProject[K]) {
    setProject(p => ({ ...p, [k]: v }));
  }

  return (
    <div className="space-y-6">
      <fieldset className="grid md:grid-cols-3 gap-3">
        <label className="col-span-2">
          <span className="text-xs uppercase text-zinc-400">Namespace</span>
          <input value={project.namespace}
                 onChange={e => update('namespace', e.target.value)}
                 className="w-full mt-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none" />
        </label>
        <div className="flex items-end gap-2">
          <button onClick={addItem} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">+ Item</button>
          <button onClick={addRecipe} className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500">+ Recipe</button>
          <button onClick={addLoot} className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500">+ Loot</button>
        </div>
      </fieldset>

      {/* Items */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Items ({project.items.length})</h2>
        {project.items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border border-zinc-800 p-3 grid md:grid-cols-4 gap-3">
            <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2"
                   value={it.id}
                   onChange={e => {
                     const items = [...project.items]; items[idx] = { ...items[idx], id: e.target.value }; setProject(p => ({ ...p, items }));
                   }}
                   placeholder="id interno (snake_case)" />
            <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2"
                   value={it.displayName}
                   onChange={e => { const items = [...project.items]; items[idx] = { ...items[idx], displayName: e.target.value }; setProject(p => ({ ...p, items })); }}
                   placeholder="Display name" />
            <select className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2"
                    value={it.material}
                    onChange={e => { const items = [...project.items]; items[idx] = { ...items[idx], material: e.target.value }; setProject(p => ({ ...p, items })); }}>
              {Object.entries(groups).map(([label, list]) => (
                list?.length ? (
                  <optgroup key={label} label={label}>
                    {list.map((m: string) => <option key={m} value={m}>{m}</option>)}
                  </optgroup>
                ) : null
              ))}
            </select>
            <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2"
                   value={it.texture ?? ''}
                   onChange={e => { const items = [...project.items]; items[idx] = { ...items[idx], texture: e.target.value }; setProject(p => ({ ...p, items })); }}
                   placeholder="textures path (opcional) ej. item/my_item" />
          </div>
        ))}
      </section>

      {/* Recipes */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recipes ({project.recipes.length})</h2>
        {project.recipes.map((r, idx) => (
          <div key={idx} className="rounded-2xl border border-zinc-800 p-3 space-y-2">
            <div className="grid md:grid-cols-4 gap-3">
              <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={r.name}
                onChange={e => { const recipes = [...project.recipes]; recipes[idx] = { ...recipes[idx], name: e.target.value }; setProject(p => ({ ...p, recipes })); }}
                placeholder="Nombre interno" />
              <select className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={r.type}
                onChange={e => { const recipes = [...project.recipes]; recipes[idx] = { ...recipes[idx], type: e.target.value as any }; setProject(p => ({ ...p, recipes })); }}>
                <option>crafting_table</option>
                <option>cooking</option>
                <option>anvil</option>
                <option>smithing</option>
                <option>stonecutter</option>
              </select>
              <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={r.result}
                onChange={e => { const recipes = [...project.recipes]; recipes[idx] = { ...recipes[idx], result: e.target.value }; setProject(p => ({ ...p, recipes })); }}
                placeholder="Resultado (itemsadder:ns/item o VANILLA)" />
              <input type="number" min={1} className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={r.amount ?? 1}
                onChange={e => { const recipes = [...project.recipes]; recipes[idx] = { ...recipes[idx], amount: Number(e.target.value) || 1 }; setProject(p => ({ ...p, recipes })); }}
                placeholder="Cantidad" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex gap-2 items-center">
                <input type="checkbox" checked={!!r.shapeless}
                  onChange={e => { const recipes = [...project.recipes]; recipes[idx] = { ...recipes[idx], shapeless: e.target.checked }; setProject(p => ({ ...p, recipes })); }} />
                <span>Shapeless</span>
              </label>
              {!r.shapeless && (
                <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2"
                  value={(r.shape ?? ['A B C','D E F','G H I']).join(' | ')}
                  onChange={e => { const shape = e.target.value.split('|').map(s => s.trim()); const recipes = [...project.recipes]; recipes[idx] = { ...recipes[idx], shape }; setProject(p => ({ ...p, recipes })); }}
                  placeholder="Forma (ej. 'A B C | D E F | G H I')" />
              )}
            </div>
            <div className="grid md:grid-cols-9 gap-2">
              {['A','B','C','D','E','F','G','H','I'].map(k => (
                <input key={k} className="rounded-xl bg-zinc-900 border border-zinc-800 px-2 py-1"
                  value={r.keys?.[k] ?? ''}
                  onChange={e => { const recipes = [...project.recipes]; const keys = { ...(recipes[idx].keys ?? {}) }; keys[k] = e.target.value; recipes[idx] = { ...recipes[idx], keys }; setProject(p => ({ ...p, recipes })); }}
                  placeholder={`${k} -> material o itemsadder:ns/id`} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Loots */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Loots ({project.loots.length})</h2>
        {project.loots.map((l, idx) => (
          <div key={idx} className="rounded-2xl border border-zinc-800 p-3 grid md:grid-cols-6 gap-3">
            <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={l.name}
              onChange={e => { const loots = [...project.loots]; loots[idx] = { ...loots[idx], name: e.target.value }; setProject(p => ({ ...p, loots })); }}
              placeholder="Nombre interno" />
            <select className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={l.target}
              onChange={e => { const loots = [...project.loots]; loots[idx] = { ...loots[idx], target: e.target.value as any }; setProject(p => ({ ...p, loots })); }}>
              <option>block</option><option>entity</option><option>container</option>
            </select>
            <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={l.targetId}
              onChange={e => { const loots = [...project.loots]; loots[idx] = { ...loots[idx], targetId: e.target.value }; setProject(p => ({ ...p, loots })); }}
              placeholder="Objetivo (ej. minecraft:grass, minecraft:zombie)" />
            <input className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={l.result}
              onChange={e => { const loots = [...project.loots]; loots[idx] = { ...loots[idx], result: e.target.value }; setProject(p => ({ ...p, loots })); }}
              placeholder="Resultado (itemsadder:ns/item o VANILLA)" />
            <input type="number" min={0} step="1" className="rounded-2xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={l.min ?? 0}
              onChange={e => { const loots = [...project.loots]; loots[idx] = { ...loots[idx], min: Number(e.target.value) || 0 }; setProject(p => ({ ...p, loots })); }}
              placeholder="Mín." />
            <input type="number" min={0} step="1" className="rounded-2xl bg-zinc-900 border border-zinc-800 px-3 py-2" value={l.max ?? 1}
              onChange={e => { const loots = [...project.loots]; loots[idx] = { ...loots[idx], max: Number(e.target.value) || 1 }; setProject(p => ({ ...p, loots })); }}
              placeholder="Máx." />
          </div>
        ))}
      </section>

      <div className="flex gap-3 pt-3">
        <button onClick={exportZip} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold">Exportar ZIP</button>
        {dlUrl && <a download={`${project.namespace}.zip`} href={dlUrl} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700">Descargar {project.namespace}.zip</a>}
      </div>
    </div>
  );
}
