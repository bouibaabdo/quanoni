"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Scale, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Field } from "./ui";

export type OnboardingState = {
  done: number;
  total: number;
  items: { key: string; label: string; done: boolean }[];
  tenant: {
    city: string; address: string; phone: string; email: string;
    ice: string; ifNumber: string; rcNumber: string; cnssNumber: string;
    tpNumber: string; tvaRate: number;
  };
};

export function OnboardingWizard({ state }: { state: OnboardingState }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(state.done >= state.total);
  const [form, setForm] = useState(state.tenant);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const dismissed = localStorage.getItem("qanoni_onboarding_dismissed");
    if (state.done < state.total && !dismissed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [state.done, state.total]);

  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("qanoni:open-onboarding", fn);
    return () => window.removeEventListener("qanoni:open-onboarding", fn);
  }, []);

  function dismiss() {
    localStorage.setItem("qanoni_onboarding_dismissed", "1");
    setOpen(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/settings", "PATCH", {
        city: form.city,
        address: form.address,
        phone: form.phone,
        email: form.email,
        ice: form.ice,
        ifNumber: form.ifNumber,
        rcNumber: form.rcNumber,
        cnssNumber: form.cnssNumber,
        tpNumber: form.tpNumber,
        tvaRate: Number(form.tvaRate) || 20,
      });
      toast.success("اكتمل ملف مكتبك 🎉 الفواتير الرسمية جاهزة");
      setFinished(true);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const remaining = state.items.filter((i) => !i.done);
  const pct = Math.round((state.done / state.total) * 100);

  if (open) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
        <div className="card w-full max-w-lg p-0">
          {/* Header */}
          <div className="border-b border-stone-100 p-6 pb-5 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Scale size={26} />
            </span>
            <h2 className="mt-3 font-display text-xl font-extrabold">مرحباً بك في قانوني 👋</h2>
            <p className="mt-1 text-sm text-stone-500">
              أكمل ملف مكتبك من إعدادات الفواتير بشكل صحيح
            </p>
          </div>

          <div className="p-6">
            {/* Progress */}
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-stone-700">اكتمال الملف</span>
              <span dir="ltr" className="font-bold text-brand-700">{state.done} / {state.total}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            <p className="mt-1.5 text-center text-xs text-stone-400">{pct}% مكتمل</p>

            {/* Checklist */}
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-stone-700">
                <Sparkles size={14} className="text-gold-500" /> البيانات المطلوبة للفواتير
              </p>
              <ul className="space-y-2 text-sm">
                {state.items.map((it) => (
                  <li key={it.key} className="flex items-center gap-2">
                    <span className={`flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-full border ${
                      it.done ? "border-brand-600 bg-brand-600 text-white" : "border-amber-400 bg-white"
                    }`}>
                      {it.done && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className={it.done ? "text-stone-400 line-through" : "text-stone-700"}>{it.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            {step === 0 && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="المدينة"><input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="الدار البيضاء" /></Field>
                  <Field label="الهاتف"><input className="input" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0522-000000" /></Field>
                </div>
                <Field label="عنوان المكتب"><input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
                <Field label="البريد الإلكتروني للمكتب"><input className="input" type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              </div>
            )}
            {step === 1 && (
              <div className="mt-4 space-y-3">
                <Field label="التعريف الموحد للمقاولة (ICE)"><input className="input" dir="ltr" value={form.ice} onChange={(e) => set("ice", e.target.value)} placeholder="001234567000089" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الرقم التعريفي الضريبي (IF)"><input className="input" dir="ltr" value={form.ifNumber} onChange={(e) => set("ifNumber", e.target.value)} /></Field>
                  <Field label="السجل التجاري (RC)"><input className="input" dir="ltr" value={form.rcNumber} onChange={(e) => set("rcNumber", e.target.value)} /></Field>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الانتماء للضمان الاجتماعي (CNSS)"><input className="input" dir="ltr" value={form.cnssNumber} onChange={(e) => set("cnssNumber", e.target.value)} /></Field>
                  <Field label="الضريبة المهنية / الباتنت (TP)"><input className="input" dir="ltr" value={form.tpNumber} onChange={(e) => set("tpNumber", e.target.value)} /></Field>
                </div>
                <Field label="نسبة TVA على الفواتير (%)"><input className="input" type="number" min={0} max={100} dir="ltr" value={form.tvaRate} onChange={(e) => set("tvaRate", Number(e.target.value))} /></Field>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex items-center gap-2">
              {step > 0 && (
                <button className="btn-outline" onClick={() => setStep(step - 1)} disabled={busy}>
                  <ChevronRight size={15} /> السابق
                </button>
              )}
              {step < 2 ? (
                <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>
                  التالي <ChevronLeft size={15} />
                </button>
              ) : (
                <button className="btn-primary flex-1" onClick={submit} disabled={busy}>
                  {busy ? "جارٍ الحفظ…" : "إنهاء الإعداد ←"}
                </button>
              )}
            </div>
            <button className="mt-2 w-full py-2 text-sm text-stone-400 hover:text-stone-600" onClick={dismiss}>
              لاحقاً
            </button>
          </div>
        </div>
      </div>
    );
  }

  // بطاقة التذكير أعلى الصفحات حين يبقى شيء ناقص
  if (finished) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Sparkles size={17} /></span>
        <div>
          <p className="text-sm font-semibold text-amber-900">أكمل ملف مكتبك — متبقي {remaining.length} من {state.total}</p>
          <p className="text-xs text-amber-700">{remaining.slice(0, 3).map((r) => r.label).join(" · ")}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary btn-sm" onClick={() => setOpen(true)}>إكمال الآن</button>
        <button className="btn-ghost btn-sm text-amber-700" onClick={dismiss}>إخفاء</button>
      </div>
    </div>
  );
}
