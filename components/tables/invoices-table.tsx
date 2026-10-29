"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Printer, Eye } from "lucide-react";
import { DataTable } from "../data-table";
import { Modal } from "../ui";
import { DeleteButton } from "../delete-button";
import { InvoiceForm, PaymentForm } from "../forms/invoice-form";
import { Badge } from "../status-badge";
import { mad, fdate } from "@/lib/format";

export type InvoiceRow = {
  id: string; number: string; clientName: string; caseRef?: string | null;
  total: number; paid: number; displayStatus: string; displayCls: string;
  dueDate?: string | null; issueDate: string;
};

export function InvoicesTable({
  rows,
  clients,
  cases,
  tvaRate,
}: {
  rows: InvoiceRow[];
  clients: { id: string; name: string }[];
  cases: { id: string; label: string; clientId: string }[];
  tvaRate: number;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [payFor, setPayFor] = useState<InvoiceRow | null>(null);

  return (
    <>
      <DataTable
        rows={rows}
        searchKeys={["number", "clientName", "caseRef"]}
        searchPlaceholder="ابحث برقم الفاتورة أو الموكل…"
        emptyTitle="لا توجد فواتير بعد"
        emptySub="أنشئ فاتورة أتعاب لموكل من ملفاته"
        emptyAction={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> فاتورة جديدة</button>}
        toolbar={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> فاتورة جديدة
          </button>
        }
        columns={[
          { key: "number", label: "الرقم", render: (r) => <span className="font-mono text-xs font-bold" dir="ltr">{r.number}</span> },
          { key: "clientName", label: "الموكل" },
          { key: "caseRef", label: "الملف", render: (r) => r.caseRef ? <span className="font-mono text-xs" dir="ltr">{r.caseRef}</span> : "—" },
          { key: "total", label: "الإجمالي", render: (r) => <span className="font-semibold" dir="ltr">{mad(r.total)}</span> },
          { key: "paid", label: "المدفوع", render: (r) => <span dir="ltr">{mad(r.paid)}</span> },
          {
            key: "displayStatus", label: "الحالة",
            render: (r) => <Badge text={r.displayStatus} cls={r.displayCls} />,
          },
          { key: "dueDate", label: "آخر أجل", render: (r) => fdate(r.dueDate) },
          {
            key: "actions", label: "",
            render: (r) => (
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Link href={`/invoices/${r.id}`} className="btn-ghost btn-sm rounded-lg p-2" title="عرض">
                  <Eye size={15} />
                </Link>
                {r.paid < r.total && r.displayStatus !== "CANCELLED" && r.displayStatus !== "DRAFT" && (
                  <button className="btn-ghost btn-sm rounded-lg p-2 text-brand-700" title="تسجيل دفعة" onClick={() => setPayFor(r)}>
                    <span className="text-xs font-bold">دفعة</span>
                  </button>
                )}
                <DeleteButton
                  endpoint={`/api/invoices/${r.id}`}
                  confirmText={`حذف الفاتورة ${r.number}؟`}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="فاتورة جديدة" wide>
        <InvoiceForm clients={clients} cases={cases} tvaRate={tvaRate} onDone={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={`تسجيل دفعة — ${payFor?.number ?? ""}`}>
        {payFor && (
          <PaymentForm invoiceId={payFor.id} remaining={Math.max(0, payFor.total - payFor.paid)} onDone={() => setPayFor(null)} />
        )}
      </Modal>
    </>
  );
}

export function PrintLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="btn-outline">
      <Printer size={16} /> طباعة / PDF
    </a>
  );
}

export { useRouter };
