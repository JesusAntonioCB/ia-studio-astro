import React, { useState } from 'react';
import type { IAProject, IAItem, IACraftingRecipe, IALoot } from '../lib/types';
import vanilla from '../data/vanilla-items.json';
import MaterialCombo from "../components/MaterialCombo";
import TextureDrop from "../components/TextureDrop";
import ModelDrop from "../components/ModelDrop";
import TexturesForModel from "../components/TexturesForModel";
import { rewriteModelNamespace } from "../lib/model-utils";
import JSZip from 'jszip';
import { generateYAML } from '../lib/toYAML';

type Groups = { [k: string]: string[] };

const empty: IAProject = { namespace: 'myitems', items: [], recipes: [], loots: [] };

export default function Builder() {
  const [project, setProject] = useState<IAProject>(empty);
  const [dlUrl, setDlUrl] = useState<string | null>(null);
  const [textureFiles, setTextureFiles] = useState<Record<string, File | null>>({});
  const [modelFiles, setModelFiles] = useState<Record<string, File | null>>({});
  const [modelTextureFiles, setModelTextureFiles] = useState<Record<string, Record<string, File | null>>>({});
  const [modelNeeded, setModelNeeded] = useState<Record<string, string[]>>({});

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
    const base = `contents/${project.namespace}`;

    const { itemsYml, recipesYml, lootsYml } = generateYAML(project);
    zip.file(`${base}/items.yml`, itemsYml);
    zip.file(`${base}/recipes.yml`, recipesYml);
    zip.file(`${base}/loots.yml`, lootsYml);

    // Assets por ítem
    for (const it of project.items) {
      const mode = it.assetMode ?? 'texture';

      if (mode === 'texture') {
        // PNG simple
        const file = textureFiles[it.id];
        if (file && it.texture) {
          const clean = it.texture.replace(/^\/+/, "");
          zip.file(`${base}/textures/${clean}.png`, file);
        }
      } else if (mode === 'model') {
        // modelo .json + texturas declaradas
        const modelFile = modelFiles[it.id];
        if (modelFile && it.modelPath) {
          const raw = await modelFile.text();
          // reescribe namespace en textures.* -> "<namespace>:<subpath>"
          const rewritten = rewriteModelNamespace(raw, project.namespace);
          const modelOut = `${base}/models/${it.modelPath.replace(/^\/+/, "")}.json`;
          zip.file(modelOut, rewritten);

          // ahora empaqueta las texturas necesarias, si el usuario las subió
          const needed = modelNeeded[it.id] ?? [];
          const selected = modelTextureFiles[it.id] ?? {};
          for (const sub of needed) {
            const tex = selected[sub];
            if (tex) {
              // guardamos como .png (aunque venga jpg, IA usa rutas sin ext; el empaquetado puede tolerar png recomendada)
              const clean = sub.replace(/^\/+/, "");
              zip.file(`${base}/textures/${clean}.png`, tex);
            }
          }
        }
      }
    }

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
            <MaterialCombo
              value={it.material}
              groups={groups as any}
              onChange={(val) => {
                const items = [...project.items];
                items[idx] = { ...items[idx], material: val };
                setProject((p) => ({ ...p, items }));
              }}
            />
            {/* selector de modo */}
            <div className="col-span-4 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`assetMode-${it.id}`}
                  checked={(it.assetMode ?? 'texture') === 'texture'}
                  onChange={() => {
                    const items = [...project.items];
                    items[idx] = { ...items[idx], assetMode: 'texture' };
                    setProject(p => ({ ...p, items }));
                  }}
                />
                <span>Usar textura (PNG)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`assetMode-${it.id}`}
                  checked={(it.assetMode ?? 'texture') === 'model'}
                  onChange={() => {
                    const items = [...project.items];
                    items[idx] = { ...items[idx], assetMode: 'model' };
                    setProject(p => ({ ...p, items }));
                  }}
                />
                <span>Usar modelo 3D (.json)</span>
              </label>
            </div>

            {/* BLOQUE: textura simple */}
            {(it.assetMode ?? 'texture') === 'texture' && (
              <TextureDrop
                valuePath={it.texture ?? ""}
                file={textureFiles[it.id] ?? null}
                onChange={(nextPath, file) => {
                  let p = (nextPath || "").trim().replace(/^\/+/, "").replace(/\.(png|jpg|jpeg)$/i, "");
                  const items = [...project.items];
                  items[idx] = { ...items[idx], texture: p };
                  setProject(pj => ({ ...pj, items }));
                  setTextureFiles(tf => ({ ...tf, [it.id]: file ?? null }));
                }}
              />
            )}

            {/* BLOQUE: modelo 3D */}
            {(it.assetMode ?? 'texture') === 'model' && (
              <div className="space-y-3 col-span-4">
                <ModelDrop
                  valuePath={it.modelPath ?? ""}
                  file={modelFiles[it.id] ?? null}
                  onChange={(nextPath, file, needed) => {
                    // normaliza path sin extensión:
                    let p = (nextPath || "").trim().replace(/^\/+/, "").replace(/\.json$/i, "");
                    const items = [...project.items];
                    items[idx] = { ...items[idx], modelPath: p };
                    setProject(pj => ({ ...pj, items }));
                    if (file) setModelFiles(m => ({ ...m, [it.id]: file }));
                    if (needed.length) {
                      setModelNeeded(prev => ({ ...prev, [it.id]: needed }));
                      // inicializa registro de files si no existe
                      setModelTextureFiles(prev => ({ ...prev, [it.id]: prev[it.id] ?? {} }));
                    }
                  }}
                />
                {/* si el modelo requiere textures.* mostramos inputs/dropzones por subpath */}
                <TexturesForModel
                  needed={modelNeeded[it.id] ?? []}
                  files={modelTextureFiles[it.id] ?? {}}
                  onChange={(subpath, file) => {
                    setModelTextureFiles(prev => ({
                      ...prev,
                      [it.id]: { ...(prev[it.id] ?? {}), [subpath]: file }
                    }));
                  }}
                />
              </div>
            )}
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
