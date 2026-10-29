"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { CLIENT_KIND } from "@/lib/labels";

export type ClientInitial = {
  id: string; kind: string; name: string; companyName?: string | null; email?: string | null;
  phone?: string | null; address?: string | null; city?: string | null; cin?: string | null; ice?: string | null; notes?: string | null;
};

export function ClientForm({ initial, onDone }: { initial?: ClientInitial; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    kind: initial?.kind ?? "INDIVIDUAL",
    name: initial?.name ?? "",
    companyName: initial?.companyName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    cin: initial?.cin ?? "",
    ice: initial?.ice ?? "",
    notes: initial?.notes ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (initial) await api(`/api/clients/${initial.id}`, "PATCH", form);
      else await api("/api/clients", "POST", form);
      toast.success(initial ? "تم تحديث بيانات الموكل" : "تمت إضافة الموكل بنجاح");
      router.refresh();
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isCompany = form.kind === "COMPANY";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="نوع الموكل">
          <select className="input" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
            {Object.entries(CLIENT_KIND).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label={isCompany ? "جهة الاتصال" : "الاسم الكامل"}>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
      </div>
      {isCompany && (
        <Field label="اسم الشركة">
          <input className="input" value={form.companyName ?? ""} onChange={(e) => set("companyName", e.target.value)} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="الهاتف">
          <input className="input" dir="ltr" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="البريد الإلكتروني">
          <input className="input" type="email" dir="ltr" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label={isCompany ? "ICE" : "رقم البطاقة الوطنية (CIN)"}>
          <input className="input" dir="ltr" value={isCompany ? form.ice ?? "" : form.cin ?? ""} onChange={(e) => set(isCompany ? "ice" : "cin", e.target.value)} />
        </Field>
        <Field label="المدينة">
          <input className="input" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>
      <Field label="العنوان">
        <input className="input" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <Field label="ملاحظات">
        <textarea className="input h-20 py-2" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : initial ? "حفظ التعديلات" : "إضافة الموكل"}
      </button>
    </form>
  );
}
