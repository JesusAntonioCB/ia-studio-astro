# IA Studio (Astro) — Generador visual para ItemsAdder

Proyecto base en **Astro + React + Tailwind** para crear **items**, **recipes** y **loots** de ItemsAdder y exportarlos como un **ZIP** con la estructura `contents/<namespace>/`.

## Ejecutar
```bash
npm i
npm run dev
```

## Exporta
```
contents/<namespace>/items.yml
contents/<namespace>/recipes.yml
contents/<namespace>/loots.yml
```

## Materiales vanilla (auto)
Se generan desde [`minecraft-data`](https://www.npmjs.com/package/minecraft-data) agrupados en categorías (armor, tools, weapons, etc.):

```bash
npm run update:vanilla        # usa 1.21.4
# o especifica versión:
MC_VERSION=1.20 npm run update:vanilla
```

El selector de `material` usa `<optgroup>` con esos grupos.

## Roadmap
- Importar YML existentes (edición).
- Selector 3x3 visual para shaped.
- Autocompletado de behaviours/acciones (parsear `ia-vscode`).
- Soporte `graphics` (IA moderno) además de `resource`.
