"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/login", "POST", form);
      toast.success("مرحباً بعودتك 👋");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold">تسجيل الدخول</h1>
      <p className="mt-1 text-sm text-stone-500">أدخل بياناتك للوصول إلى مكتبك.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
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
            dir="ltr"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
      <div className="mt-4 rounded-lg border border-dashed border-brand-300 bg-brand-50 p-3 text-xs text-brand-800">
        <p className="font-semibold">حساب تجريبي جاهز:</p>
        <p dir="ltr" className="mt-1 text-start font-mono">admin@demo.ma / Demo@1234</p>
        <button
          type="button"
          className="btn-outline btn-sm mt-2"
          onClick={() => setForm({ email: "admin@demo.ma", password: "Demo@1234" })}
        >
          املأ تلقائياً
        </button>
      </div>
      <p className="mt-6 text-center text-sm text-stone-500">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          أنشئ مكتبك مجاناً
        </Link>
      </p>
    </>
  );
}
