import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const out = path.resolve('src/data/vanilla-items.json');
const ver = process.argv[2] || process.env.MC_VERSION || '1.21.4';

const toMaterial = (s: string) => s.toUpperCase();

(async () => {
  try {
    const mcdMod = await import('minecraft-data');
    const minecraftData = (mcdMod as any).default;
    const mcd = minecraftData(ver);
    if (!mcd) throw new Error(`No se pudo cargar minecraft-data para versión ${ver}`);

    const itemsArr = (mcd.itemsArray ?? Object.values(mcd.items ?? {})) as any[];
    const blocksArr = (mcd.blocksArray ?? Object.values(mcd.blocks ?? {})) as any[];

    const items: string[] = itemsArr.map(i => i?.name).filter(Boolean);
    const blocks: string[] = blocksArr.map(b => b?.name).filter(Boolean);

    const armorKeys = ['helmet','chestplate','leggings','boots','elytra','turtle_shell','horse_armor','shield'];
    const toolKeys  = ['pickaxe','axe','shovel','hoe','shears','fishing_rod','flint_and_steel','brush'];
    const weaponKeys= ['sword','bow','crossbow','trident','mace'];
    const foodKeys  = ['apple','bread','beef','porkchop','mutton','chicken','potato','carrot','cookie','cake','pie','melon','pumpkin','beetroot','berries','suspicious_stew','honey','golden_apple'];
    const redstoneKeys = ['redstone','repeater','comparator','piston','observer','dispenser','dropper','hopper','lever','button','pressure_plate','tripwire','target','daylight_detector','note_block','sculk_sensor'];

    const groups: Record<string, string[]> = { basics: [], armor: [], tools: [], weapons: [], food: [], redstone: [], blocks: [], misc: [] };

    const inList = (name: string, arr: string[]) => arr.some(s => name.includes(s));
    function push(name: string) {
      const mat = toMaterial(name);
      if (inList(name, armorKeys)) groups.armor.push(mat);
      else if (inList(name, toolKeys)) groups.tools.push(mat);
      else if (inList(name, weaponKeys)) groups.weapons.push(mat);
      else if (inList(name, foodKeys)) groups.food.push(mat);
      else if (inList(name, redstoneKeys)) groups.redstone.push(mat);
      else if (name.endsWith('_block') || name.endsWith('_planks') || name.endsWith('_log') || name.endsWith('_stone') || name.endsWith('_ore')) groups.blocks.push(mat);
      else groups.basics.push(mat);
    }

    items.forEach(push);
    blocks.forEach(name => {
      const mat = toMaterial(name);
      if (!Object.values(groups).some(arr => arr.includes(mat))) {
        if (name.endsWith('_block') || ['grass_block','dirt','sand','gravel','glass','crafting_table','furnace','anvil','smithing_table'].includes(name)) {
          groups.blocks.push(mat);
        }
      }
    });

    for (const k of Object.keys(groups)) {
      const uniq = Array.from(new Set(groups[k]));
      uniq.sort();
      groups[k] = uniq;
    }

    fs.writeFileSync(out, JSON.stringify(groups, null, 2), 'utf8');
    console.log('Generado', out, 'para versión', ver);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
