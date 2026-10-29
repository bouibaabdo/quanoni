"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "../data-table";
import { Modal } from "../ui";
import { TaskForm } from "../forms/task-form";
import { DeleteButton } from "../delete-button";
import { Badge } from "../status-badge";
import { api } from "@/lib/client-api";
import { fdate } from "@/lib/format";
import { dictLabel, badgeClass, TASK_STATUS, PRIORITY } from "@/lib/labels";
import { CalendarDays } from "lucide-react";

export type TaskRow = {
  id: string; title: string; status: string; priority: string; dueDate: string | null;
  caseRef: string | null; assigneeName: string | null; overdue: boolean;
};

const FILTERS = [
  { key: "", label: "الكل" },
  { key: "TODO", label: "قيد الانتظار" },
  { key: "IN_PROGRESS", label: "قيد التنفيذ" },
  { key: "DONE", label: "مكتملة" },
];

export function TasksTable({
  rows,
  cases,
  members,
}: {
  rows: TaskRow[];
  cases: { id: string; label: string }[];
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = filter ? rows.filter((r) => r.status === filter) : rows;

  async function cycle(row: TaskRow) {
    setBusyId(row.id);
    const order = ["TODO", "IN_PROGRESS", "DONE"];
    const next = order[(order.indexOf(row.status) + 1) % order.length];
    try {
      await api(`/api/tasks/${row.id}`, "PATCH", { status: next });
      toast.success(next === "DONE" ? "أُنجزت المهمة ✅" : "تم تحديث المهمة");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<TaskRow>[] = [
    {
      key: "title", label: "المهمة",
      render: (r) => (
        <div>
          <p className={`font-semibold ${r.status === "DONE" ? "text-stone-400 line-through" : "text-stone-800"}`}>{r.title}</p>
          <div className="mt-1 flex gap-2">
            <Badge text={dictLabel(PRIORITY, r.priority)} cls={badgeClass(PRIORITY, r.priority)} />
            {r.dueDate && (
              <span className={`text-xs ${r.overdue && r.status !== "DONE" ? "font-bold text-red-600" : "text-stone-400"}`}>
                {r.overdue && r.status !== "DONE" ? "متأخرة — " : ""}{fdate(r.dueDate)}
              </span>
            )}
          </div>
        </div>
      ),
    },
    { key: "caseRef", label: "الملف", render: (r) => r.caseRef ? <span className="font-mono text-xs" dir="ltr">{r.caseRef}</span> : "—" },
    { key: "assigneeName", label: "المكلَّف", render: (r) => r.assigneeName ?? "—" },
    { key: "status", label: "الحالة", render: (r) => <Badge text={dictLabel(TASK_STATUS, r.status)} cls={badgeClass(TASK_STATUS, r.status)} /> },
    {
      key: "actions", label: "",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            className="btn-ghost btn-sm rounded-lg p-2 text-brand-700"
            title="تغيير الحالة"
            disabled={busyId === r.id}
            onClick={() => cycle(r)}
          >
            {r.status === "TODO" ? <Play size={14} /> : r.status === "IN_PROGRESS" ? <Check size={14} /> : <RotateCcw size={14} />}
          </button>
          <DeleteButton endpoint={`/api/tasks/${r.id}`} confirmText={`حذف المهمة "${r.title}"؟`} />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key ? "bg-brand-700 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <DataTable
        rows={filtered}
        searchKeys={["title", "caseRef", "assigneeName"]}
        searchPlaceholder="ابحث في المهام…"
        emptyTitle="لا مهام هنا"
        emptySub="أنشئ مهام مكتبك وتتبع إنجازها"
        emptyAction={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> مهمة جديدة</button>}
        toolbar={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> مهمة جديدة
          </button>
        }
        columns={columns}
      />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="مهمة جديدة">
        <TaskForm cases={cases} members={members} onDone={() => setAddOpen(false)} />
      </Modal>
    </>
  );
}
