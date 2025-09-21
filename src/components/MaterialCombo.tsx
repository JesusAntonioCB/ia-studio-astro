// src/components/MaterialCombo.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type Groups = Record<string, string[]>;

export default function MaterialCombo({
    value,
    onChange,
    groups,
    placeholder = "Buscar material (ej. helmet, sword...)",
}: {
    value: string;
    onChange: (v: string) => void;
    groups: Groups;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);

    const flatList = useMemo(() => {
        // aplana con “etiqueta de grupo” para renderizar encabezados
        const items: { group: string; value: string }[] = [];
        Object.entries(groups).forEach(([group, list]) => {
            list.forEach((v) => items.push({ group, value: v }));
        });
        return items;
    }, [groups]);

    const filtered = useMemo(() => {
        if (!q.trim()) return flatList;
        const qq = q.trim().toUpperCase();
        return flatList.filter((i) => i.value.includes(qq));
    }, [flatList, q]);

    // índices por grupo para pintar encabezados sólo la primera vez
    const withHeaders = useMemo(() => {
        const rows: Array<
            | { type: "header"; label: string }
            | { type: "item"; group: string; value: string }
        > = [];
        let lastGroup = "";
        filtered.forEach((r) => {
            if (r.group !== lastGroup) {
                lastGroup = r.group;
                rows.push({ type: "header", label: r.group });
            }
            rows.push({ type: "item", group: r.group, value: r.value });
        });
        return rows;
    }, [filtered]);

    // cerrar al hacer clic fuera
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    useEffect(() => {
        // reset de índice al abrir o buscar
        setActiveIdx(0);
    }, [open, q]);

    function commit(val: string) {
        onChange(val);
        setOpen(false);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
        }
        if (!open) return;
        const itemsOnly = withHeaders.filter((r) => r.type === "item") as {
            type: "item";
            group: string;
            value: string;
        }[];

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, itemsOnly.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const pick = itemsOnly[activeIdx];
            if (pick) commit(pick.value);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    const itemsOnly = withHeaders.filter((r) => r.type === "item") as {
        type: "item";
        group: string;
        value: string;
    }[];

    const showCustomRow =
        q.trim().length > 0 &&
        !itemsOnly.some((it) => it.value === q.trim().toUpperCase());

    return (
        <div ref={rootRef} className="relative">
            <div className="flex gap-2">
                <input
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                />
                {value && (
                    <span className="px-2 py-2 text-xs rounded-lg bg-zinc-800 border border-zinc-700">
                        Seleccionado: <b>{value}</b>
                    </span>
                )}
            </div>

            {open && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
                    {withHeaders.length === 0 && !showCustomRow && (
                        <div className="px-3 py-2 text-sm text-zinc-400">Sin resultados</div>
                    )}

                    {showCustomRow && (
                        <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-900"
                            onClick={() => commit(q.trim().toUpperCase())}
                        >
                            Usar <b>{q.trim().toUpperCase()}</b>
                        </button>
                    )}

                    {withHeaders.map((row, idx) =>
                        row.type === "header" ? (
                            <div
                                key={`h-${idx}`}
                                className="px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-500 sticky top-0 bg-zinc-950"
                            >
                                {row.label}
                            </div>
                        ) : (
                            <button
                                key={`${row.group}:${row.value}`}
                                className={
                                    "w-full text-left px-3 py-2 text-sm hover:bg-zinc-900 " +
                                    (itemsOnly[activeIdx]?.value === row.value
                                        ? "bg-zinc-900"
                                        : "")
                                }
                                onMouseEnter={() => {
                                    const pos = itemsOnly.findIndex((i) => i.value === row.value);
                                    if (pos >= 0) setActiveIdx(pos);
                                }}
                                onClick={() => commit(row.value)}
                            >
                                {row.value}
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
