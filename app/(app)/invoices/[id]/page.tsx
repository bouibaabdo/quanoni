import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, userCan } from "@/lib/auth";
import { mad, fdate } from "@/lib/format";
import { ArrowRight, Printer, Download, PlusCircle } from "lucide-react";
import { Badge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { PaymentModalButton } from "@/components/payment-modal";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!(await userCan(user.id, user.role, "INVOICES", "VIEW"))) redirect("/dashboard");
  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      client: true,
      case: { select: { id: true, reference: true, title: true } },
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, invoice.total - paid);
  const overdue = invoice.status === "SENT" && remaining > 0 && invoice.dueDate && invoice.dueDate < new Date();
  const statusLabel = invoice.status === "DRAFT" ? "مسودة" : invoice.status === "CANCELLED" ? "ملغاة" : paid >= invoice.total - 0.01 ? "مدفوعة" : paid > 0 ? "مدفوعة جزئياً" : overdue ? "متأخرة" : "مرسلة";
  const statusCls = invoice.status === "CANCELLED" ? "bg-stone-100 text-stone-400" : paid >= invoice.total - 0.01 ? "bg-emerald-50 text-emerald-700" : overdue ? "bg-red-50 text-red-700" : paid > 0 ? "bg-blue-50 text-blue-700" : "bg-brand-50 text-brand-700";

  const methodLabels: Record<string, string> = { CASH: "نقداً", CHECK: "شيك", TRANSFER: "تحويل بنكي", CARD: "بطاقة" };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-700">
          <ArrowRight size={15} /> عودة للفواتير
        </Link>
        <div className="flex items-center gap-2">
          <a href={`/print/invoice/${invoice.id}?dl=1`} target="_blank" rel="noopener" className="btn-primary">
            <Download size={16} /> تنزيل PDF
          </a>
          <a href={`/print/invoice/${invoice.id}`} target="_blank" rel="noopener" className="btn-outline">
            <Printer size={16} /> طباعة
          </a>
          {remaining > 0 && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && (
            <PaymentModalButton invoiceId={invoice.id} number={invoice.number} remaining={remaining} />
          )}
          <DeleteButton small={false} endpoint={`/api/invoices/${invoice.id}`} confirmText={`حذف الفاتورة ${invoice.number}؟`} redirectTo="/invoices" />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <h1 className="font-display text-2xl font-extrabold" dir="ltr">{invoice.number}</h1>
            <p className="mt-1 text-sm text-stone-500">
              الموكل: <b className="text-stone-700">{invoice.client.name}</b>
              {invoice.case && (
                <> · الملف: <Link href={`/cases/${invoice.case.id}`} className="text-brand-700 hover:underline" dir="ltr">{invoice.case.reference}</Link></>
              )}
            </p>
          </div>
          <div className="text-end">
            <Badge text={statusLabel} cls={statusCls} />
            <p className="mt-2 text-xs text-stone-400">أُصدرت: {fdate(invoice.issueDate)}</p>
            {invoice.dueDate && <p className="text-xs text-stone-400">الاستحقاق: {fdate(invoice.dueDate)}</p>}
          </div>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-start text-xs text-stone-400">
              <th className="table-th">البند</th>
              <th className="table-th w-20 text-center">الكمية</th>
              <th className="table-th w-28 text-center">سعر الوحدة</th>
              <th className="table-th w-28 text-end">المبلغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {invoice.items.map((it) => (
              <tr key={it.id}>
                <td className="table-td font-medium">{it.description}</td>
                <td className="table-td text-center" dir="ltr">{it.qty}</td>
                <td className="table-td text-center" dir="ltr">{mad(it.unitPrice)}</td>
                <td className="table-td text-end font-semibold" dir="ltr">{mad(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-500"><span>المجموع دون ضريبة</span><span dir="ltr">{mad(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-stone-500"><span>TVA ({invoice.tvaRate}%)</span><span dir="ltr">{mad(invoice.tvaAmount)}</span></div>
            <div className="flex justify-between border-t border-stone-200 pt-2 font-display text-base font-extrabold"><span>الإجمالي</span><span dir="ltr">{mad(invoice.total)}</span></div>
            <div className="flex justify-between pt-1 text-brand-700"><span>المدفوع</span><span dir="ltr">{mad(paid)}</span></div>
            <div className="flex justify-between font-bold text-amber-700"><span>المتبقي</span><span dir="ltr">{mad(remaining)}</span></div>
          </div>
        </div>

        {invoice.notes && <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">{invoice.notes}</p>}
      </div>

      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-display font-bold">
          <PlusCircle size={17} className="text-brand-700" /> الدفعات ({invoice.payments.length})
        </h3>
        {invoice.payments.length === 0 ? (
          <p className="py-4 text-center text-sm text-stone-400">لا دفعات مسجلة بعد</p>
        ) : (
          <div className="space-y-2">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-100 p-3 text-sm">
                <span className="font-semibold text-emerald-700" dir="ltr">+ {mad(p.amount)}</span>
                <span className="text-stone-500">{methodLabels[p.method] ?? p.method}{p.reference ? ` — ${p.reference}` : ""}</span>
                <span className="text-xs text-stone-400">{fdate(p.paidAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
