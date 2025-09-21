import React, { useEffect, useRef, useState } from "react";
import { parseModelJson, neededTextureSubpaths } from "../lib/model-utils";

type Props = {
    valuePath: string;                        // ej. "item/night_vision_goggles" (sin extensión)
    file?: File | null;                       // modelo.json temporal
    onChange: (nextPath: string, file: File | null, needed: string[]) => void;
};

export default function ModelDrop({ valuePath, file, onChange }: Props) {
    const [name, setName] = useState(valuePath);
    const inputRef = useRef<HTMLInputElement>(null);
    const [modelError, setModelError] = useState<string | null>(null);

    useEffect(() => setName(valuePath), [valuePath]);

    async function handleFiles(f: File) {
        if (!f.name.endsWith(".json")) {
            setModelError("El modelo debe ser un archivo .json");
            return;
        }
        setModelError(null);
        const text = await f.text();
        try {
            parseModelJson(text); // valida JSON
        } catch (e: any) {
            setModelError(e?.message || "JSON inválido");
            return;
        }
        const suggested = name?.trim()
            ? name.trim()
            : `item/${(f.name || "model").replace(/\.json$/i, "")}`;
        const needed = neededTextureSubpaths(text); // subpaths sin namespace
        onChange(suggested, f, needed);
    }

    return (
        <div
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) await handleFiles(f);
            }}
        >
            <div className="flex gap-2 items-center">
                <button
                    type="button"
                    className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1 text-sm hover:bg-zinc-800"
                    onClick={() => inputRef.current?.click()}
                >
                    Seleccionar .json
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) await handleFiles(f);
                        e.currentTarget.value = "";
                    }}
                />
                <input
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
                    placeholder="Ruta del modelo (sin .json), ej. item/night_vision_goggles"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        // No cambiamos el file aquí, sólo el path
                        onChange(e.target.value, file ?? null, []);
                    }}
                />
            </div>
            <div className="mt-2 text-xs text-zinc-400">
                {file ? <>Modelo: <b>{file.name}</b></> : <>Sin modelo</>}
                {modelError && <div className="text-red-400 mt-1">{modelError}</div>}
            </div>
        </div>
    );
}
