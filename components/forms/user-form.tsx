"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { ROLES } from "@/lib/labels";

export function UserForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "LAWYER", phone: "", barNumber: "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/users", "POST", form);
      toast.success("تمت إضافة العضو — شاركه بيانات الدخول");
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="الاسم الكامل">
          <input className="input" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="البريد الإلكتروني">
          <input className="input" type="email" required dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="كلمة المرور المؤقتة">
          <input className="input" type="text" required minLength={8} dir="ltr" value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field label="الدور">
          <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="الهاتف">
          <input className="input" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="رقم هيئة المحامين (اختياري)">
          <input className="input" dir="ltr" value={form.barNumber} onChange={(e) => set("barNumber", e.target.value)} />
        </Field>
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الإضافة…" : "إضافة العضو"}
      </button>
    </form>
  );
}
