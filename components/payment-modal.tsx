"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./ui";
import { api } from "@/lib/client-api";
import { Field } from "./ui";
import { mad } from "@/lib/format";

export function PaymentModalButton({
  invoiceId,
  number,
  remaining,
}: {
  invoiceId: string;
  number: string;
  remaining: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ amount: String(remaining), method: "CASH", reference: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/invoices/${invoiceId}/payments`, "POST", { ...form, amount: Number(form.amount) });
      toast.success("تم تسجيل الدفعة");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <PlusCircle size={16} /> تسجيل دفعة
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`دفعة — ${number}`}>
        <form onSubmit={submit} className="space-y-4">
          <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">المتبقي: <b dir="ltr">{mad(remaining)}</b></p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="المبلغ (د.م.)">
              <input className="input" type="number" min={0.01} step="0.01" max={remaining} required dir="ltr" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="طريقة الدفع">
              <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="CASH">نقداً</option>
                <option value="CHECK">شيك</option>
                <option value="TRANSFER">تحويل بنكي</option>
                <option value="CARD">بطاقة</option>
              </select>
            </Field>
          </div>
          <Field label="مرجع (اختياري)">
            <input className="input" dir="ltr" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? "جارٍ التسجيل…" : "تسجيل"}</button>
        </form>
      </Modal>
    </>
  );
}
