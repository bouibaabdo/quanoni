"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { DataTable } from "../data-table";
import { Modal } from "../ui";
import { DeleteButton } from "../delete-button";
import { ClientForm } from "../forms/client-form";
import { fdate } from "@/lib/format";
import { dictLabel, CLIENT_KIND } from "@/lib/labels";

export type ClientRow = {
  id: string; kind: string; name: string; phone?: string | null; city?: string | null;
  cin?: string | null; ice?: string | null; createdAt: string; caseCount: number;
};

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);

  const full = (r: ClientRow) => ({ ...r, createdAt: r.createdAt });
  const editData = editing ? {
    id: editing.id, kind: editing.kind, name: editing.name,
    companyName: null, email: null, phone: editing.phone, address: null,
    city: editing.city, cin: editing.cin, ice: editing.ice, notes: null,
  } : undefined;

  return (
    <>
      <DataTable
        rows={rows.map(full)}
        searchKeys={["name", "phone", "city", "cin", "ice"]}
        searchPlaceholder="ابحث بالاسم، الهاتف، CIN، ICE…"
        onRowClick={(r) => router.push(`/clients/${r.id}`)}
        emptyTitle="لا يوجد موكلون بعد"
        emptySub="أضف أول موكل لبدء تسجيل ملفاته"
        emptyAction={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> إضافة موكل</button>}
        toolbar={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> إضافة موكل
          </button>
        }
        columns={[
          { key: "name", label: "الاسم", render: (r) => <span className="font-semibold text-stone-800">{r.name}</span> },
          { key: "kind", label: "النوع", render: (r) => dictLabel(CLIENT_KIND, r.kind) },
          { key: "phone", label: "الهاتف", render: (r) => r.phone ?? "—" },
          { key: "city", label: "المدينة", render: (r) => r.city ?? "—" },
          { key: "idNo", label: "CIN / ICE", render: (r) => (r.kind === "COMPANY" ? r.ice : r.cin) ?? "—" },
          { key: "caseCount", label: "الملفات" },
          { key: "createdAt", label: "أضيف في", render: (r) => fdate(r.createdAt) },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button className="btn-ghost btn-sm rounded-lg p-2" title="تعديل" onClick={() => setEditing(r)}>
                  <Pencil size={15} />
                </button>
                <DeleteButton endpoint={`/api/clients/${r.id}`} confirmText={`هل تريد حذف الموكل "${r.name}"؟ لا يمكن التراجع.`} />
              </div>
            ),
          },
        ]}
      />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة موكل جديد">
        <ClientForm onDone={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="تعديل بيانات الموكل">
        {editing && <ClientForm initial={editData} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
