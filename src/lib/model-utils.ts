export type ParsedModel = {
    jsonText: string;
    textures: Record<string, string>; // layer -> "ns:path" ó "path" (sin ns)
};

/**
 * Lee un JSON de modelo (texto), retorna sus textures (sin validar existencia de archivos).
 */
export function parseModelJson(raw: string): ParsedModel {
    let obj: any;
    try { obj = JSON.parse(raw); } catch { throw new Error("Modelo JSON inválido"); }
    const map: Record<string, string> = {};
    const tx = obj?.textures;
    if (tx && typeof tx === 'object') {
        for (const [k, v] of Object.entries(tx)) {
            if (typeof v === 'string') map[k] = v;
        }
    }
    return { jsonText: raw, textures: map };
}

/**
 * Reescribe el namespace de todas las entradas textures.* a newNS.
 * - Acepta valores "oldNS:subpath" o "subpath" (sin namespace).
 * - Conserva el subpath, NO agrega extensión (ItemsAdder/MC usan paths sin .png).
 */
export function rewriteModelNamespace(raw: string, newNS: string): string {
    const obj = JSON.parse(raw);
    if (!obj.textures || typeof obj.textures !== 'object') return raw;

    const out: Record<string, string> = {};
    for (const [layer, val] of Object.entries<string>(obj.textures)) {
        const parts = val.includes(':') ? val.split(':', 2) : ['', val];
        const sub = parts[1] || parts[0]; // toma lo que haya como "path"
        out[layer] = `${newNS}:${sub}`;
    }
    obj.textures = out;
    return JSON.stringify(obj, null, 2);
}

/**
 * Extrae lista de subpaths (sin namespace) a partir de las textures del modelo.
 * Devuelve rutas tipo "item/night_vision_goggles", que luego guardarás como
 * contents/<ns>/textures/<subpath>.png
 */
export function neededTextureSubpaths(raw: string): string[] {
    const obj = JSON.parse(raw);
    const tx = obj?.textures;
    if (!tx || typeof tx !== 'object') return [];
    const subs: string[] = [];
    for (const v of Object.values<string>(tx)) {
        const sub = v.includes(':') ? v.split(':', 2)[1] : v;
        if (sub && !subs.includes(sub)) subs.push(sub);
    }
    return subs;
}
