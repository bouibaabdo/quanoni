"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { Field } from "../ui";
import { mad } from "@/lib/format";

type Item = { description: string; qty: number; unitPrice: number };

export function InvoiceForm({
  clients,
  cases,
  tvaRate,
  onDone,
}: {
  clients: { id: string; name: string }[];
  cases: { id: string; label: string; clientId: string }[];
  tvaRate: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    clientId: "",
    caseId: "",
    status: "DRAFT",
    issueDate: today,
    dueDate: "",
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([{ description: "", qty: 1, unitPrice: 0 }]);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  const tvaAmount = subtotal * (tvaRate / 100);
  const total = subtotal + tvaAmount;

  const setItem = (i: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/invoices", "POST", {
        ...form,
        caseId: form.caseId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        issueDate: new Date(form.issueDate).toISOString(),
        tvaRate,
        items: items.map((it) => ({ description: it.description, qty: Number(it.qty), unitPrice: Number(it.unitPrice) })),
      });
      toast.success("تم إنشاء الفاتورة");
      router.refresh();
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const clientCases = form.clientId ? cases.filter((c) => c.clientId === form.clientId) : cases;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="الموكل">
          <select className="input" required value={form.clientId} onChange={(e) => { set("clientId", e.target.value); set("caseId", ""); }}>
            <option value="">— اختر —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="الملف المرتبط (اختياري)">
          <select className="input" value={form.caseId} onChange={(e) => set("caseId", e.target.value)}>
            <option value="">— بدون —</option>
            {clientCases.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="تاريخ الإصدار">
          <input className="input" type="date" required dir="ltr" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
        </Field>
        <Field label="آخر أجل للدفع">
          <input className="input" type="date" dir="ltr" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
        <Field label="الحالة">
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="DRAFT">مسودة</option>
            <option value="SENT">مرسلة</option>
          </select>
        </Field>
      </div>

      <div>
        <label className="label">البنود</label>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input flex-1"
                required
                placeholder="الوصف (مثال: أتعاب المحاماة)"
                value={it.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
              />
              <input
                className="input w-20"
                type="number" min={0.01} step="0.01" dir="ltr"
                value={it.qty}
                onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                title="الكمية"
              />
              <input
                className="input w-28"
                type="number" min={0} step="0.01" dir="ltr"
                value={it.unitPrice}
                onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })}
                title="سعر الوحدة"
              />
              <button type="button" className="btn-ghost rounded-lg p-2 text-red-500" onClick={() => setItems((arr) => arr.filter((_, idx) => idx !== i))} disabled={items.length === 1}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-outline btn-sm mt-2" onClick={() => setItems((arr) => [...arr, { description: "", qty: 1, unitPrice: 0 }])}>
          <Plus size={14} /> إضافة بند
        </button>
      </div>

      <div className="rounded-lg bg-stone-50 p-4 text-sm">
        <div className="flex justify-between py-0.5 text-stone-600"><span>المجموع دون ضريبة</span><span dir="ltr">{mad(subtotal)}</span></div>
        <div className="flex justify-between py-0.5 text-stone-600"><span>TVA ({tvaRate}%)</span><span dir="ltr">{mad(tvaAmount)}</span></div>
        <div className="mt-1 flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900"><span>الإجمالي</span><span dir="ltr">{mad(total)}</span></div>
      </div>

      <Field label="ملاحظات">
        <textarea className="input h-16 py-2" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ الإنشاء…" : "إنشاء الفاتورة"}
      </button>
    </form>
  );
}

export function PaymentForm({ invoiceId, remaining, onDone }: { invoiceId: string; remaining: number; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    amount: String(remaining > 0 ? remaining : ""),
    method: "CASH",
    reference: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/invoices/${invoiceId}/payments`, "POST", { ...form, amount: Number(form.amount) });
      toast.success("تم تسجيل الدفعة");
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
      <Field label="مرجع (رقم شيك / تحويل)">
        <input className="input" dir="ltr" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
      </Field>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "جارٍ التسجيل…" : "تسجيل الدفعة"}
      </button>
    </form>
  );
}
