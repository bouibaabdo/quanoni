"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api } from "@/lib/client-api";

type Notif = { type: string; title: string; body: string; href: string; severity: string; date: string };

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api("/api/notifications")
      .then((d: unknown) => setItems(d as Notif[]))
      .catch(() => {});
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost relative rounded-full p-2.5"
        title="التنبيهات"
      >
        <Bell size={19} />
        {items.length > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="card absolute end-0 top-12 z-50 w-80 overflow-hidden p-0 shadow-lg">
          <div className="border-b border-stone-100 px-4 py-3 text-sm font-bold">التنبيهات</div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-400">لا توجد تنبيهات حالياً 👌</p>
            ) : (
              items.map((n, i) => (
                <Link
                  key={i}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-stone-50 px-4 py-3 hover:bg-stone-50"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.severity === "danger" ? "bg-red-500" : n.severity === "warning" ? "bg-amber-500" : "bg-brand-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{n.title}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-stone-400">{n.date}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
