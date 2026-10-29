"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { EXPENSE_CATEGORY } from "@/lib/labels";

export function ExpenseForm({
  cases,
  fixedCaseId,
  onDone,
}: {
  cases: { id: string; label: string }[];
  fixedCaseId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    label: "",
    category: "COURT_FEES",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    caseId: fixedCaseId ?? "",
    reimbursable: true,
    notes: "",
  });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/expenses", "POST", {
        ...form,
        amount: Number(form.amount),
        caseId: form.caseId || null,
        date: new Date(form.date).toISOString(),
      });
      toast.success("تم تسجيل المصروف");
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
      <Field label="الوصف">
        <input className="input" required value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="مثال: رسوم تسجيل مقال" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="الفئة">
          <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {Object.entries(EXPENSE_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="المبلغ (د.م.)">
          <input className="input" type="number" min={0} step="0.01" required dir="ltr" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="التاريخ">
          <input className="input" type="date" required dir="ltr" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        {!fixedCaseId && (
          <Field label="الملف (اختياري)">
            <select className="input" value={form.caseId} onChange={(e) => set("caseId", e.target.value)}>
              <option value="">— بدون —</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={form.reimbursable} onChange={(e) => set("reimbursable", e.target.checked)} className="h-4 w-4 accent-brand-700" />
        قابل للاسترجاع من الموكل
      </label>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : "تسجيل المصروف"}
      </button>
    </form>
  );
}
