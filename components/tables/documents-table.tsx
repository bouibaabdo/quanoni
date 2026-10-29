"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { DataTable } from "../data-table";
import { DeleteButton } from "../delete-button";
import { fdate, fsize } from "@/lib/format";

export type DocumentRow = {
  id: string; name: string; caseRef?: string | null; size?: number | null;
  uploadedBy?: string | null; createdAt: string;
};

export function DocumentsTable({ rows }: { rows: DocumentRow[] }) {
  return (
    <DataTable
      rows={rows}
      searchKeys={["name", "caseRef", "uploadedBy"]}
      searchPlaceholder="ابحث في المستندات…"
      emptyTitle="لا توجد مستندات"
      emptySub="ارفع مقالات، أحكام، سندات… واربطها بملفاتها"
      columns={[
        {
          key: "name", label: "الاسم",
          render: (r) => (
            <a href={`/api/documents/${r.id}`} target="_blank" rel="noopener" className="flex items-center gap-2 font-semibold text-stone-800 hover:text-brand-700">
              <FileText size={16} className="shrink-0 text-brand-600" />
              <span className="truncate">{r.name}</span>
            </a>
          ),
        },
        {
          key: "caseRef", label: "الملف",
          render: (r) => r.caseRef ?? "—",
        },
        { key: "size", label: "الحجم", render: (r) => fsize(r.size) },
        { key: "uploadedBy", label: "رفعه", render: (r) => r.uploadedBy ?? "—" },
        { key: "createdAt", label: "التاريخ", render: (r) => fdate(r.createdAt) },
        {
          key: "actions", label: "",
          render: (r) => (
            <div className="flex justify-end gap-1">
              <a href={`/api/documents/${r.id}`} target="_blank" rel="noopener" className="btn-ghost btn-sm rounded-lg p-2" title="تحميل">
                <Download size={15} />
              </a>
              <DeleteButton endpoint={`/api/documents/${r.id}`} confirmText={`حذف المستند "${r.name}"؟`} />
            </div>
          ),
        },
      ]}
    />
  );
}

export { Link };
