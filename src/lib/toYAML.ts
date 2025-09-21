import { stringify } from 'yaml';
import type { IAProject } from './types';

// genera items.yml, recipes.yml, loots.yml
export function generateYAML(project: IAProject) {
  const info = { info: { namespace: project.namespace } };

  const itemsEntries: Record<string, any> = {};
  for (const it of project.items) {
    const isModel = it.assetMode === 'model' && it.modelPath;
    const entry: any = {
      display_name: it.displayName,
      resource: {
        material: it.material,
      }
    };

    if (isModel) {
      // Opción moderna (IA4):
      entry.graphics = { model: `${project.namespace}:${it.modelPath}` };
      // (Opcional compatibilidad clásica)
      entry.resource.model_path = it.modelPath;
    } else {
      // Textura clásica (generate + textures)
      entry.resource.generate = !!it.texture;
      if (it.texture) entry.resource.textures = [it.texture];
    }

    itemsEntries[it.id] = entry;
  }
  const itemsYml = stringify({ ...info, items: itemsEntries });

  const recipesArr = project.recipes.map(r => {
    const base: any = { name: r.name, result: r.result };
    if (r.amount) base.amount = r.amount;
    if (r.shapeless) {
      base.ingredients = Object.values(r.keys ?? {});
    } else {
      base.shape = r.shape ?? ['A B C','D E F','G H I'];
      base.ingredients = r.keys ?? {};
    }
    return { [r.type]: base };
  });
  const recipesYml = stringify({ ...info, recipes: recipesArr });

  const lootsArr = project.loots.map(l => ({
    [l.target]: {
      id: l.targetId,
      result: l.result,
      ...(l.min ? { min: l.min } : {}),
      ...(l.max ? { max: l.max } : {}),
      ...(typeof l.chance === 'number' ? { chance: l.chance } : {})
    }
  }));
  const lootsYml = stringify({ ...info, loots: lootsArr });
  return { itemsYml, recipesYml, lootsYml };
}
