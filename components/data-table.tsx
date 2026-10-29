"use client";

import { useMemo, useState } from "react";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { EmptyState } from "./ui";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  searchKeys = [],
  searchPlaceholder = "بحث…",
  onRowClick,
  emptyTitle = "لا توجد بيانات بعد",
  emptySub,
  emptyAction,
  toolbar,
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptySub?: string;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!q.trim() || searchKeys.length === 0) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => String((r as Record<string, unknown>)[k] ?? "").toLowerCase().includes(needle))
    );
  }, [rows, q, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="card overflow-hidden">
      {(searchKeys.length > 0 || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-3">
          {searchKeys.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="input pe-9"
                placeholder={searchPlaceholder}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}
      {slice.length === 0 ? (
        <EmptyState title={q ? "لا نتائج مطابقة للبحث" : emptyTitle} sub={q ? undefined : emptySub} action={q ? undefined : emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-stone-50">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`table-th ${c.className ?? ""}`}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {slice.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-brand-50/50" : "hover:bg-stone-50"}`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`table-td ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm">
          <span className="text-stone-500">
            {filtered.length} نتيجة — صفحة {safePage + 1} من {pages}
          </span>
          <div className="flex gap-1">
            <button className="btn-outline btn-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              <ChevronRight size={14} /> السابق
            </button>
            <button className="btn-outline btn-sm" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
              التالي <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
