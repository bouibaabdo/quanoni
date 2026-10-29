"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ cabinetName: "", fullName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/register", "POST", form);
      toast.success("تم إنشاء مكتبك 🎉 مرحباً بقانوني");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold">أنشئ مكتبك</h1>
      <p className="mt-1 text-sm text-stone-500">تجربة مجانية 14 يوماً — دون بطاقة بنكية.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">اسم المكتب</label>
          <input
            className="input"
            required
            value={form.cabinetName}
            onChange={(e) => setForm({ ...form, cabinetName: e.target.value })}
            placeholder="مكتب النور للمحاماة"
          />
        </div>
        <div>
          <label className="label">اسمك الكامل</label>
          <input
            className="input"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="الأستاذ كريم العلوي"
          />
        </div>
        <div>
          <label className="label">البريد الإلكتروني</label>
          <input
            className="input"
            type="email"
            required
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@cabinet.ma"
          />
        </div>
        <div>
          <label className="label">كلمة المرور</label>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            dir="ltr"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="8 أحرف على الأقل"
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "جارٍ الإنشاء…" : "إنشاء المكتب وبدء التجربة"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        لديك حساب؟{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </>
  );
}
