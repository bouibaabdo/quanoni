"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { PRIORITY, TASK_STATUS } from "@/lib/labels";

export function TaskForm({
  cases,
  members,
  fixedCaseId,
  onDone,
}: {
  cases: { id: string; label: string }[];
  members: { id: string; name: string }[];
  fixedCaseId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    status: "TODO",
    caseId: fixedCaseId ?? "",
    assigneeId: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/tasks", "POST", {
        ...form,
        caseId: form.caseId || null,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      toast.success("تمت إضافة المهمة");
      router.refresh();
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="عنوان المهمة">
        <input className="input" required value={form.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      {!fixedCaseId && (
        <Field label="الملف المرتبط (اختياري)">
          <select className="input" value={form.caseId} onChange={(e) => set("caseId", e.target.value)}>
            <option value="">— بدون —</option>
            {cases.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-3 gap-4">
        <Field label="الاستحقاق">
          <input className="input" type="date" dir="ltr" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
        <Field label="الأهمية">
          <select className="input" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="المكلَّف">
          <select className="input" value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
            <option value="">— غير محدد —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="الوصف">
        <textarea className="input h-20 py-2" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <input type="hidden" value={form.status} onChange={(e) => set("status", e.target.value)} data-status={TASK_STATUS[form.status]?.label} />
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : "إضافة المهمة"}
      </button>
    </form>
  );
}
