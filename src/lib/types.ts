export type IAItem = {
  id: string;
  displayName: string;
  material: string;
  texture?: string;
};

export type IACraftingRecipe = {
  name: string;
  type: 'crafting_table'|'stonecutter'|'smithing'|'anvil'|'cooking';
  shape?: string[];
  shapeless?: boolean;
  keys?: Record<string, string>;
  result: string;
  amount?: number;
};

export type IALoot = {
  name: string;
  target: 'block'|'entity'|'container';
  targetId: string;
  result: string;
  min?: number;
  max?: number;
  chance?: number;
};

export type IAProject = {
  namespace: string;
  items: IAItem[];
  recipes: IACraftingRecipe[];
  loots: IALoot[];
};
