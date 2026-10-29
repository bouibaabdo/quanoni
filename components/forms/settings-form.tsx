"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";

export function SettingsForm({
  tenant,
}: {
  tenant: {
    name: string; phone?: string | null; email?: string | null; address?: string | null;
    city?: string | null; ice?: string | null; ifNumber?: string | null; rcNumber?: string | null;
    cnssNumber?: string | null; tpNumber?: string | null;
    settings: { invoicePrefix: string; tvaRate: number; invoiceLanguage: string; reminderDays: number; footerNote?: string | null } | null;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: tenant.name,
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    address: tenant.address ?? "",
    city: tenant.city ?? "",
    ice: tenant.ice ?? "",
    ifNumber: tenant.ifNumber ?? "",
    rcNumber: tenant.rcNumber ?? "",
    cnssNumber: tenant.cnssNumber ?? "",
    tpNumber: tenant.tpNumber ?? "",
    invoicePrefix: tenant.settings?.invoicePrefix ?? "FAC",
    invoiceLanguage: tenant.settings?.invoiceLanguage ?? "AR",
    tvaRate: tenant.settings?.tvaRate ?? 20,
    reminderDays: tenant.settings?.reminderDays ?? 7,
    footerNote: tenant.settings?.footerNote ?? "",
  });
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/settings", "PATCH", form);
      toast.success("تم حفظ الإعدادات");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المكتب">
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="المدينة">
          <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="الهاتف">
          <input className="input" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="البريد الإلكتروني">
          <input className="input" type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="العنوان" className="sm:col-span-2">
          <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="ICE (التعريف الموحد للمقاولة)">
          <input className="input" dir="ltr" value={form.ice} onChange={(e) => set("ice", e.target.value)} />
        </Field>
        <Field label="الرقم التعريفي الضريبي (IF)">
          <input className="input" dir="ltr" value={form.ifNumber} onChange={(e) => set("ifNumber", e.target.value)} />
        </Field>
        <Field label="السجل التجاري (RC)">
          <input className="input" dir="ltr" value={form.rcNumber} onChange={(e) => set("rcNumber", e.target.value)} />
        </Field>
        <Field label="الانتماء للضمان الاجتماعي (CNSS)">
          <input className="input" dir="ltr" value={form.cnssNumber} onChange={(e) => set("cnssNumber", e.target.value)} />
        </Field>
        <Field label="الضريبة المهنية / الباتنت (TP)">
          <input className="input" dir="ltr" value={form.tpNumber} onChange={(e) => set("tpNumber", e.target.value)} />
        </Field>
      </div>

      <h3 className="border-t border-stone-200 pt-4 font-display font-bold">إعدادات الفوترة</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="بادئة أرقام الفواتير">
          <input className="input" dir="ltr" value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} />
        </Field>
        <Field label="لغة الفاتورة">
          <select className="input" value={form.invoiceLanguage} onChange={(e) => set("invoiceLanguage", e.target.value)}>
            <option value="AR">العربية</option>
            <option value="FR">الفرنسية</option>
            <option value="BI">عربية + فرنسية</option>
          </select>
        </Field>
        <Field label="نسبة TVA (%)">
          <input className="input" type="number" min={0} max={100} dir="ltr" value={form.tvaRate} onChange={(e) => set("tvaRate", Number(e.target.value))} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="تنبيه الجلسات قبل (أيام)">
          <input className="input" type="number" min={1} max={30} dir="ltr" value={form.reminderDays} onChange={(e) => set("reminderDays", Number(e.target.value))} />
        </Field>
        <Field label="ملاحظة أسفل الفاتورة">
          <input className="input" value={form.footerNote ?? ""} onChange={(e) => set("footerNote", e.target.value)} placeholder="شكراً لثقتكم — الأتعاب مستحقة فور التبليغ" />
        </Field>
      </div>
      <button className="btn-primary" disabled={busy}>
        {busy ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
