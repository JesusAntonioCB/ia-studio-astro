import React, { useRef, useState } from "react";

type Props = {
    needed: string[]; // subpaths sin namespace, ej. ["item/night_vision_goggles", ...]
    files: Record<string, File | null>; // subpath -> File
    onChange: (subpath: string, file: File | null) => void;
};

export default function TexturesForModel({ needed, files, onChange }: Props) {
    const inputs = useRef<Record<string, HTMLInputElement | null>>({});
    const [hover, setHover] = useState<Record<string, boolean>>({});

    function pickFile(sub: string, f: File) {
        if (!f.type.includes("image/")) return;
        onChange(sub, f);
    }

    return (
        <div className="space-y-2">
            {needed.length === 0 ? (
                <div className="text-xs text-zinc-400">
                    Este modelo no declara <code>textures.*</code>
                </div>
            ) : (
                needed.map((sub) => (
                    <div
                        key={sub}
                        className={
                            "rounded-xl p-3 border transition-colors " +
                            (hover[sub] ? "border-emerald-500 bg-zinc-900/60" : "border-zinc-800 bg-zinc-900")
                        }
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setHover(h => ({ ...h, [sub]: true })); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setHover(h => ({ ...h, [sub]: false })); }}
                        onDrop={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            setHover(h => ({ ...h, [sub]: false }));
                            const f = e.dataTransfer.files?.[0];
                            if (f) pickFile(sub, f);
                        }}
                        onClick={() => inputs.current[sub]?.click()}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-zinc-400">
                                Textura requerida: <b>{sub}</b>
                            </div>
                            <div className="text-xs text-zinc-500">
                                {files[sub] ? <>Archivo: <b>{files[sub]!.name}</b></> : <>Haz clic o arrastra aquí</>}
                            </div>
                        </div>

                        <input
                            ref={(el) => (inputs.current[sub] = el)}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) pickFile(sub, f);
                                e.currentTarget.value = "";
                            }}
                        />
                    </div>
                ))
            )}
        </div>
    );
}
