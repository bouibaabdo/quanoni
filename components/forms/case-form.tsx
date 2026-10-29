"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { CASE_TYPES, CASE_STATUS, PRIORITY, COURTS } from "@/lib/labels";

export type CaseInitial = {
  id: string; title: string; clientId: string; type: string; status: string; priority: string;
  reference?: string | null; description?: string | null; opposingParty?: string | null;
  courtName?: string | null; courtCity?: string | null; lawyerId?: string | null; feesAgreed?: number;
};

export function CaseForm({
  initial,
  clients,
  lawyers,
  onDone,
}: {
  initial?: CaseInitial;
  clients: { id: string; name: string }[];
  lawyers: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    clientId: initial?.clientId ?? "",
    type: initial?.type ?? "CIVIL",
    status: initial?.status ?? "NEW",
    priority: initial?.priority ?? "MEDIUM",
    description: initial?.description ?? "",
    opposingParty: initial?.opposingParty ?? "",
    courtName: initial?.courtName ?? "",
    courtCity: initial?.courtCity ?? "",
    lawyerId: initial?.lawyerId ?? "",
    feesAgreed: initial?.feesAgreed ?? 0,
  });
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, lawyerId: form.lawyerId || null, feesAgreed: Number(form.feesAgreed) || 0 };
      if (initial) await api(`/api/cases/${initial.id}`, "PATCH", payload);
      else await api("/api/cases", "POST", payload);
      toast.success(initial ? "تم تحديث الملف" : "تم فتح الملف بنجاح");
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
      <Field label="عنوان الملف">
        <input className="input" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="مثال: مطالبة بأداء دين" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="الموكل">
          <select className="input" required value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
            <option value="">— اختر —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="المحامي المسؤول">
          <select className="input" value={form.lawyerId ?? ""} onChange={(e) => set("lawyerId", e.target.value)}>
            <option value="">— غير محدد —</option>
            {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="النوع">
          <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {Object.entries(CASE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="الحالة">
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(CASE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="الأهمية">
          <select className="input" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="المحكمة">
          <input className="input" list="courts-list" value={form.courtName ?? ""} onChange={(e) => set("courtName", e.target.value)} />
          <datalist id="courts-list">
            {COURTS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="مدينة المحكمة">
          <input className="input" value={form.courtCity ?? ""} onChange={(e) => set("courtCity", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="الطرف الخصم">
          <input className="input" value={form.opposingParty ?? ""} onChange={(e) => set("opposingParty", e.target.value)} />
        </Field>
        <Field label="الأتعاب المتفق عليها (د.م.)">
          <input className="input" type="number" min={0} step="0.01" dir="ltr" value={form.feesAgreed} onChange={(e) => set("feesAgreed", e.target.value)} />
        </Field>
      </div>
      <Field label="وصف الملف">
        <textarea className="input h-24 py-2" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : initial ? "حفظ التعديلات" : "فتح الملف"}
      </button>
    </form>
  );
}
