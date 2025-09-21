import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
    valuePath: string;                 // ej. "item/night_vision_goggles"
    file?: File | null;               // archivo temporal
    onChange: (nextPath: string, file: File | null) => void;
    placeholder?: string;
};

export default function TextureDrop({ valuePath, file, onChange, placeholder = "Arrastra imagen .png o haz clic" }: Props) {
    const [isOver, setIsOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        const f = e.dataTransfer.files?.[0];
        if (!f) return;
        if (!f.type.includes("image/")) return;
        // si el path está vacío, sugerimos uno con el nombre del archivo (sin .png)
        const suggested = valuePath?.trim()
            ? valuePath.trim()
            : `item/${(f.name || "texture").replace(/\.(png|jpg|jpeg)$/i, "")}`;
        onChange(suggested, f);
    }, [onChange, valuePath]);

    const onBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const suggested = valuePath?.trim()
            ? valuePath.trim()
            : `item/${(f.name || "texture").replace(/\.(png|jpg|jpeg)$/i, "")}`;
        onChange(suggested, f);
        e.currentTarget.value = "";
    };

    return (
        <div
            className={
                "rounded-xl border px-3 py-2 bg-zinc-900 " +
                (isOver ? "border-emerald-500" : "border-zinc-800")
            }
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={onDrop}
        >
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1 text-sm hover:bg-zinc-800"
                    onClick={() => inputRef.current?.click()}
                >
                    Seleccionar
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onBrowse}
                />
                <input
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none"
                    placeholder={placeholder}
                    value={valuePath}
                    onChange={(e) => onChange(e.target.value, file ?? null)}
                />
            </div>

            <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                    {file ? <>Archivo: <b>{file.name}</b></> : <>Sin archivo</>}
                </div>
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="preview"
                        className="h-10 w-10 object-contain rounded-md border border-zinc-800"
                    />
                )}
            </div>
        </div>
    );
}
