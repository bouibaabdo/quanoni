"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Gavel, ListTodo, Wallet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./ui";
import { HearingForm } from "./forms/hearing-form";
import { TaskForm } from "./forms/task-form";
import { ExpenseForm } from "./forms/expense-form";
import { CaseForm } from "./forms/case-form";
import { api } from "@/lib/client-api";

export function QuickAdd({
  cases,
  members,
  caseId,
}: {
  cases: { id: string; label: string }[];
  members: { id: string; name: string }[];
  caseId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<null | "hearing" | "task" | "expense">(null);
  const titles = { hearing: "إضافة جلسة", task: "إضافة مهمة", expense: "إضافة مصروف" };

  const btns = [
    { key: "hearing" as const, label: "جلسة", icon: Gavel },
    { key: "task" as const, label: "مهمة", icon: ListTodo },
    { key: "expense" as const, label: "مصروف", icon: Wallet },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {btns.map((b) => (
          <button key={b.key} className="btn-outline btn-sm" onClick={() => setOpen(b.key)}>
            <Plus size={14} /> {b.label}
          </button>
        ))}
      </div>
      <Modal open={open !== null} onClose={() => setOpen(null)} title={open ? titles[open] : ""}>
        {open === "hearing" && <HearingForm cases={cases} fixedCaseId={caseId} onDone={() => setOpen(null)} />}
        {open === "task" && <TaskForm cases={cases} members={members} fixedCaseId={caseId} onDone={() => setOpen(null)} />}
        {open === "expense" && <ExpenseForm cases={cases} fixedCaseId={caseId} onDone={() => setOpen(null)} />}
      </Modal>
    </>
  );
}

export function CaseStatusSelect({ caseId, current }: { caseId: string; current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const statuses: Record<string, string> = {
    NEW: "جديد", IN_PROGRESS: "قيد المرافعة", SUSPENDED: "معلق",
    WON: "مكسوب", LOST: "خاسر", CLOSED: "مغلق",
  };

  async function change(status: string) {
    setBusy(true);
    try {
      await api(`/api/cases/${caseId}`, "PATCH", { status });
      toast.success("تم تحديث حالة الملف");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      className="input h-9 w-40 text-sm"
      value={current}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
    >
      {Object.entries(statuses).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  );
}

export { FileText };
