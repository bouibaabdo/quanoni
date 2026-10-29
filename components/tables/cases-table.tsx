"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { DataTable } from "../data-table";
import { Modal } from "../ui";
import { DeleteButton } from "../delete-button";
import { CaseForm } from "../forms/case-form";
import { Badge } from "../status-badge";
import { fdate } from "@/lib/format";
import { dictLabel, badgeClass, CASE_TYPES, CASE_STATUS, PRIORITY } from "@/lib/labels";

export type CaseRow = {
  id: string; reference: string; title: string; type: string; status: string; priority: string;
  clientId: string; clientName: string; lawyerName?: string | null; courtName?: string | null; openedAt: string; feesAgreed: number;
};

export function CasesTable({
  rows,
  clients,
  lawyers,
}: {
  rows: CaseRow[];
  clients: { id: string; name: string }[];
  lawyers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CaseRow | null>(null);

  return (
    <>
      <DataTable
        rows={rows}
        searchKeys={["reference", "title", "clientName", "opposing"]}
        searchPlaceholder="ابحث بالمرجع، العنوان، الموكل…"
        onRowClick={(r) => router.push(`/cases/${r.id}`)}
        emptyTitle="لا توجد ملفات بعد"
        emptySub="افتح أول ملف لتبدأ تتبع قضاياك"
        emptyAction={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> فتح ملف</button>}
        toolbar={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> فتح ملف جديد
          </button>
        }
        columns={[
          { key: "reference", label: "المرجع", render: (r) => <span className="font-mono text-xs font-semibold" dir="ltr">{r.reference}</span> },
          { key: "title", label: "العنوان", render: (r) => <span className="font-semibold text-stone-800">{r.title}</span> },
          { key: "clientName", label: "الموكل" },
          { key: "type", label: "النوع", render: (r) => dictLabel(CASE_TYPES, r.type) },
          { key: "status", label: "الحالة", render: (r) => <Badge text={dictLabel(CASE_STATUS, r.status)} cls={badgeClass(CASE_STATUS, r.status)} /> },
          { key: "priority", label: "الأهمية", render: (r) => <Badge text={dictLabel(PRIORITY, r.priority)} cls={badgeClass(PRIORITY, r.priority)} /> },
          { key: "courtName", label: "المحكمة", render: (r) => r.courtName ?? "—" },
          { key: "openedAt", label: "تاريخ الفتح", render: (r) => fdate(r.openedAt) },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button className="btn-ghost btn-sm rounded-lg p-2" title="تعديل" onClick={() => setEditing(r)}>
                  <Pencil size={15} />
                </button>
                <DeleteButton endpoint={`/api/cases/${r.id}`} confirmText={`هل تريد حذف الملف "${r.reference} — ${r.title}"؟ ستُحذف جلساته ومهامه ومصاريفه.`} />
              </div>
            ),
          },
        ]}
      />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="فتح ملف جديد" wide>
        <CaseForm clients={clients} lawyers={lawyers} onDone={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`تعديل الملف ${editing?.reference ?? ""}`} wide>
        {editing && (
          <CaseForm
            initial={{ ...editing, feesAgreed: editing.feesAgreed }}
            clients={clients}
            lawyers={lawyers}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}
