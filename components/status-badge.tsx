"use client";

export function Badge({ text, cls }: { text: string; cls?: string }) {
  if (!text || text === "—") return <span className="text-stone-400">—</span>;
  return <span className={`badge ${cls ?? "bg-stone-100 text-stone-700"}`}>{text}</span>;
}
