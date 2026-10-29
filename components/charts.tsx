"use client";

export function BarMini({
  data,
  unit = "",
}: {
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end justify-between gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-stone-500">
            {d.value > 0 ? `${Math.round(d.value).toLocaleString("en-US")}${unit}` : ""}
          </span>
          <div
            className="w-full max-w-8 rounded-t-md bg-brand-600 transition-all"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[10px] text-stone-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({
  data,
  colorClass = "bg-brand-600",
}: {
  data: { label: string; value: number }[];
  colorClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-stone-500">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${colorClass}`}
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 text-end text-xs font-semibold text-stone-700">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
