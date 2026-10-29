"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "../data-table";
import { Modal } from "../ui";
import { DeleteButton } from "../delete-button";
import { ExpenseForm } from "../forms/expense-form";
import { mad, fdate } from "@/lib/format";
import { dictLabel, EXPENSE_CATEGORY } from "@/lib/labels";

export type ExpenseRow = {
  id: string; label: string; category: string; amount: number; date: string;
  caseRef?: string | null; reimbursable: boolean;
};

export function ExpensesTable({
  rows,
  cases,
}: {
  rows: ExpenseRow[];
  cases: { id: string; label: string }[];
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <DataTable
        rows={rows}
        searchKeys={["label", "caseRef"]}
        searchPlaceholder="ابحث في المصاريف…"
        emptyTitle="لا توجد مصاريف مسجلة"
        emptySub="سجّل الرسوم والطوابع والتنقلات لمعرفة ما يُسترجع من الموكل"
        emptyAction={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> إضافة مصروف</button>}
        toolbar={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> إضافة مصروف
          </button>
        }
        columns={[
          { key: "label", label: "الوصف", render: (r) => <span className="font-semibold text-stone-800">{r.label}</span> },
          { key: "category", label: "الفئة", render: (r) => dictLabel(EXPENSE_CATEGORY, r.category) },
          { key: "caseRef", label: "الملف", render: (r) => r.caseRef ? <span className="font-mono text-xs" dir="ltr">{r.caseRef}</span> : "—" },
          { key: "amount", label: "المبلغ", render: (r) => <span className="font-semibold" dir="ltr">{mad(r.amount)}</span> },
          { key: "date", label: "التاريخ", render: (r) => fdate(r.date) },
          {
            key: "reimbursable", label: "قابل للاسترجاع",
            render: (r) => (r.reimbursable ? <span className="badge bg-brand-50 text-brand-700">نعم</span> : <span className="text-stone-400">لا</span>),
          },
          {
            key: "actions", label: "",
            render: (r) => (
              <div className="flex justify-end">
                <DeleteButton endpoint={`/api/expenses/${r.id}`} confirmText={`حذف المصروف "${r.label}"؟`} />
              </div>
            ),
          },
        ]}
      />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة مصروف">
        <ExpenseForm cases={cases} onDone={() => setAddOpen(false)} />
      </Modal>
    </>
  );
}
