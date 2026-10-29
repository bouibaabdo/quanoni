"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import { Modal, EmptyState, PageHeader } from "./ui";
import { HearingForm } from "./forms/hearing-form";
import { DeleteButton } from "./delete-button";
import { Badge } from "./status-badge";
import { fdate, ftime, dateKey } from "@/lib/format";
import { dictLabel, badgeClass, HEARING_STATUS, TASK_STATUS, PRIORITY } from "@/lib/labels";
import { MONTHS_AR, WEEKDAYS_AR } from "@/lib/format";

export type CalendarEvent = {
  id: string; kind: "hearing" | "task"; dateKey: string; time: string; title: string;
  sub: string; href: string; statusLabel?: string; statusCls?: string; extraLabel?: string; extraCls?: string;
};

export function CalendarView({
  events,
  cases,
}: {
  events: CalendarEvent[];
  cases: { id: string; label: string }[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(dateKey(today));
  const [addOpen, setAddOpen] = useState(false);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Monday start
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const pad = (n: number) => String(n).padStart(2, "0");
  const keyOf = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const todayKey = dateKey(today);

  const prev = () => (month === 0 ? (setMonth(11), setYear(year - 1)) : setMonth(month - 1));
  const next = () => (month === 11 ? (setMonth(0), setYear(year + 1)) : setMonth(month + 1));
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelected(todayKey);
  };

  const selectedEvents = events.filter((e) => e.dateKey === selected);
  const isPast = selected < todayKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm" onClick={prev}><ChevronRight size={14} /></button>
          <span className="min-w-36 text-center font-display text-lg font-bold">
            {MONTHS_AR[month]} {year}
          </span>
          <button className="btn-outline btn-sm" onClick={next}><ChevronLeft size={14} /></button>
          <button className="btn-ghost btn-sm" onClick={goToday}>اليوم</button>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> جلسة جديدة
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-semibold text-stone-500">
            {WEEKDAYS_AR.map((d) => <div key={d} className="py-2.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className="min-h-20 border-b border-e border-stone-100 bg-stone-50/40" />;
              const k = keyOf(day);
              const evs = events.filter((e) => e.dateKey === k);
              const isToday = k === todayKey;
              const isSelected = k === selected;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(k)}
                  className={`min-h-20 border-b border-e border-stone-100 p-1.5 text-start transition-colors hover:bg-brand-50/40 ${
                    isSelected ? "bg-brand-50 ring-1 ring-inset ring-brand-500" : ""
                  }`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday ? "bg-brand-700 text-white" : "text-stone-600"
                  }`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {evs.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                          e.kind === "hearing" ? "bg-gold-500/15 text-amber-800" : "bg-blue-50 text-blue-700"
                        }`}
                        title={e.title}
                      >
                        {e.time} {e.title}
                      </div>
                    ))}
                    {evs.length > 2 && <div className="text-[10px] text-stone-400">+{evs.length - 2} أخرى</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card h-fit p-4">
          <h3 className="flex items-center gap-2 font-display font-bold">
            <CalendarDays size={17} className="text-brand-700" />
            {selectedEvents.length > 0 ? `مواعيد ${selected}` : "لا مواعيد في هذا اليوم"}
          </h3>
          <div className="mt-3 space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-400">
                اختر يوماً من التقويم أو أضف جلسة جديدة.
              </p>
            ) : (
              selectedEvents.map((e) => (
                <Link key={e.id} href={e.href} className="block rounded-lg border border-stone-100 p-3 transition hover:border-brand-300 hover:bg-brand-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" dir="ltr">{e.time}</span>
                    {e.statusLabel && <Badge text={e.statusLabel} cls={e.statusCls} />}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-stone-800">{e.title}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{e.sub}</p>
                  {e.extraLabel && <div className="mt-2"><Badge text={e.extraLabel} cls={e.extraCls} /></div>}
                </Link>
              ))
            )}
          </div>
          {isPast && <p className="mt-3 text-center text-[11px] text-stone-400">يوم سابق</p>}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة جلسة">
        <HearingForm cases={cases} onDone={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}

export function HearingStatusBadge({ status }: { status: string }) {
  return <Badge text={dictLabel(HEARING_STATUS, status)} cls={badgeClass(HEARING_STATUS, status)} />;
}

export function TaskStatusBadge({ status }: { status: string }) {
  return <Badge text={dictLabel(TASK_STATUS, status)} cls={badgeClass(TASK_STATUS, status)} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge text={dictLabel(PRIORITY, priority)} cls={badgeClass(PRIORITY, priority)} />;
}

export function EmptyHearings() {
  return <EmptyState icon={<CalendarDays size={40} />} title="لا توجد جلسات" sub="ستظهر الجلسات هنا وفي التقويم" />;
}

export { fdate, ftime };
