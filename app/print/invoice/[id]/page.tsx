import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { mad, fdate, INVOICE_TEXTS, type InvoiceLang } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "طباعة الفاتورة" };

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, tenantId: session.tid },
    include: {
      client: true,
      case: { select: { reference: true } },
      items: true,
      payments: true,
      tenant: { include: { settings: true } },
    },
  });
  if (!invoice) notFound();

  const t = invoice.tenant;
  const lang: InvoiceLang = (t.settings?.invoiceLanguage as InvoiceLang) ?? "AR";
  const L = INVOICE_TEXTS[lang];
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, invoice.total - paid);

  // الترويسة: اسم المكتب قد يتضمن شعارًا باسم خاص
  return (
    <div className="min-h-screen bg-stone-200 py-8 print:bg-white print:py-0">
      <div className="print-page mx-auto w-[210mm] bg-white p-10 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-brand-800 pb-6">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-brand-900">{t.name}</h1>
            <p className="mt-1 text-sm text-stone-500">{t.address ?? ""}{t.city ? ` — ${t.city}` : ""}</p>
            <p className="text-sm text-stone-500" dir="ltr">
              {[t.phone, t.email].filter(Boolean).join(" · ")}
            </p>
            {t.ice && <p className="mt-0.5 text-xs text-stone-400" dir="ltr">ICE: {t.ice}</p>}
            {(t.ifNumber || t.rcNumber || t.cnssNumber || t.tpNumber) && (
              <p className="text-xs text-stone-400" dir="ltr">
                {[t.ifNumber && `IF: ${t.ifNumber}`, t.rcNumber && `RC: ${t.rcNumber}`, t.cnssNumber && `CNSS: ${t.cnssNumber}`, t.tpNumber && `TP: ${t.tpNumber}`].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="text-end">
            <p className="font-display text-3xl font-black text-brand-900">{L.title}</p>
            <p className="mt-1 font-mono text-lg font-bold" dir="ltr">{invoice.number}</p>
            <p className="mt-2 text-sm text-stone-500">{L.date}: {fdate(invoice.issueDate)}</p>
            {invoice.dueDate && <p className="text-sm text-stone-500">{L.due}: {fdate(invoice.dueDate)}</p>}
          </div>
        </div>

        {/* Client */}
        <div className="mt-6 rounded-lg bg-stone-50 p-4">
          <p className="text-xs font-semibold text-stone-400">{L.for}</p>
          <p className="mt-1 font-display text-lg font-bold">{invoice.client.name}</p>
          <p className="text-sm text-stone-500">
            {[invoice.client.kind === "COMPANY" ? `ICE: ${invoice.client.ice ?? "—"}` : `CIN: ${invoice.client.cin ?? "—"}`, invoice.client.phone, invoice.client.city].filter(Boolean).join(" · ")}
          </p>
          {invoice.case && <p className="mt-1 text-xs text-stone-400" dir="ltr">{L.case}: {invoice.case.reference}</p>}
        </div>

        {/* Items */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-stone-300 text-xs text-stone-500">
              <th className="py-2 text-start">{L.item}</th>
              <th className="w-16 py-2 text-center">{L.qty}</th>
              <th className="w-28 py-2 text-center">{L.unit}</th>
              <th className="w-32 py-2 text-end">{L.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {invoice.items.map((it) => (
              <tr key={it.id}>
                <td className="py-2.5 font-medium">{it.description}</td>
                <td className="py-2.5 text-center" dir="ltr">{it.qty}</td>
                <td className="py-2.5 text-center" dir="ltr">{mad(it.unitPrice)}</td>
                <td className="py-2.5 text-end font-semibold" dir="ltr">{mad(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-between gap-8">
          <div className="max-w-sm flex-1 text-xs leading-6 text-stone-500">
            <p className="font-semibold text-stone-700">{lang === "FR" ? "Cachet et signature" : "التوقيع والخاتم"}</p>
            <div className="mt-8 border-t border-dashed border-stone-300" />
            {t.settings?.footerNote && <p className="mt-3">{t.settings.footerNote}</p>}
          </div>
          <div className="w-72">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-stone-600"><span>{L.subtotal}</span><span dir="ltr">{mad(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-stone-600"><span>{L.tva} ({invoice.tvaRate}%)</span><span dir="ltr">{mad(invoice.tvaAmount)}</span></div>
              <div className="flex justify-between border-t-2 border-stone-800 pt-1.5 font-display text-lg font-black"><span>{L.total}</span><span dir="ltr">{mad(invoice.total)}</span></div>
              {paid > 0 && (
                <>
                  <div className="flex justify-between pt-1 text-brand-700"><span>{L.paid}</span><span dir="ltr">{mad(paid)}</span></div>
                  <div className="flex justify-between font-bold"><span>{L.remaining}</span><span dir="ltr">{mad(remaining)}</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tafqit باللغة المختارة */}
        <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50/60 p-4 text-sm">
          <span className="font-semibold text-brand-900">{L.inWords} </span>
          <span className="text-brand-900" dir={lang === "FR" ? "ltr" : "rtl"}>{L.tafqitLabel(invoice.total)}</span>
        </div>
        {paid > 0 && remaining > 0 && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm">
            <span className="font-semibold text-amber-900">{L.inWords2} </span>
            <span className="text-amber-900" dir={lang === "FR" ? "ltr" : "rtl"}>{L.tafqitLabel(remaining)}</span>
          </div>
        )}

        <p className="mt-6 text-center text-[10px] text-stone-400">{L.footerCredit}</p>
      </div>
      <PrintButton />
    </div>
  );
}