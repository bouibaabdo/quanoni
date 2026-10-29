"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { HEARING_STATUS } from "@/lib/labels";

export type HearingInitial = {
  id: string; caseId: string; dateTime: string; courtName?: string | null; room?: string | null; status: string; notes?: string | null;
};

export function HearingForm({
  initial,
  cases,
  fixedCaseId,
  onDone,
}: {
  initial?: HearingInitial;
  cases: { id: string; label: string }[];
  fixedCaseId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toLocal = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [form, setForm] = useState({
    caseId: fixedCaseId ?? initial?.caseId ?? "",
    dateTime: toLocal(initial?.dateTime),
    courtName: initial?.courtName ?? "",
    room: initial?.room ?? "",
    status: initial?.status ?? "SCHEDULED",
    notes: initial?.notes ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, dateTime: form.dateTime ? new Date(form.dateTime).toISOString() : "", courtName: form.courtName || null };
      if (initial) await api(`/api/hearings/${initial.id}`, "PATCH", payload);
      else await api("/api/hearings", "POST", payload);
      toast.success(initial ? "تم تحديث الجلسة" : "تمت إضافة الجلسة");
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
      {!fixedCaseId && (
        <Field label="الملف">
          <select className="input" required value={form.caseId} onChange={(e) => set("caseId", e.target.value)}>
            <option value="">— اختر الملف —</option>
            {cases.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="التاريخ والوقت">
          <input className="input" type="datetime-local" required dir="ltr" value={form.dateTime} onChange={(e) => set("dateTime", e.target.value)} />
        </Field>
        <Field label="الحالة">
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(HEARING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="المحكمة">
          <input className="input" value={form.courtName ?? ""} onChange={(e) => set("courtName", e.target.value)} />
        </Field>
        <Field label="القاعة">
          <input className="input" value={form.room ?? ""} onChange={(e) => set("room", e.target.value)} />
        </Field>
      </div>
      <Field label="ملاحظات">
        <textarea className="input h-20 py-2" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : initial ? "حفظ التعديلات" : "إضافة الجلسة"}
      </button>
    </form>
  );
}
