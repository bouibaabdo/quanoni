"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "../data-table";
import { Modal } from "../ui";
import { UserForm } from "../forms/user-form";
import { PermissionEditor } from "../permission-editor";
import { Badge } from "../status-badge";
import { api } from "@/lib/client-api";
import { fdate } from "@/lib/format";
import { dictLabel, ROLES } from "@/lib/labels";

export type UserRow = {
  id: string; fullName: string; email: string; role: string; isActive: boolean;
  phone?: string | null; barNumber?: string | null; createdAt: string; isSelf?: boolean;
};

export function TeamTable({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [permFor, setPermFor] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(u: UserRow) {
    setBusyId(u.id);
    try {
      await api(`/api/users/${u.id}`, "PATCH", { isActive: !u.isActive });
      toast.success(u.isActive ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <DataTable
        rows={rows}
        searchKeys={["fullName", "email"]}
        searchPlaceholder="ابحث في الفريق…"
        emptyTitle="لا يوجد أعضاء"
        toolbar={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> إضافة عضو
          </button>
        }
        columns={[
          {
            key: "fullName", label: "الاسم",
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                  {r.fullName.split(" ").slice(-2).map((w) => w[0]).join("")}
                </span>
                <div>
                  <p className="font-semibold text-stone-800">{r.fullName}</p>
                  <p className="text-xs text-stone-400" dir="ltr">{r.email}</p>
                </div>
              </div>
            ),
          },
          { key: "role", label: "الدور", render: (r) => dictLabel(ROLES, r.role) },
          { key: "phone", label: "الهاتف", render: (r) => r.phone ?? "—" },
          { key: "barNumber", label: "هيئة المحامين", render: (r) => r.barNumber ?? "—" },
          {
            key: "isActive", label: "الحالة",
            render: (r) => (r.isActive ? <Badge text="نشط" cls="bg-emerald-50 text-emerald-700" /> : <Badge text="موقوف" cls="bg-red-50 text-red-600" />),
          },
          { key: "createdAt", label: "انضم في", render: (r) => fdate(r.createdAt) },
          {
            key: "actions", label: "",
            render: (r) => (
              <div className="flex justify-end gap-1">
                {!r.isSelf && (
                  <>
                    <button
                      className="btn-ghost btn-sm rounded-lg p-2 text-brand-700"
                      title="صلاحيات العضو"
                      onClick={() => setPermFor(r)}
                    >
                      <SlidersHorizontal size={15} />
                    </button>
                    <button
                      className={`btn-ghost btn-sm rounded-lg p-2 ${r.isActive ? "text-amber-600" : "text-emerald-600"}`}
                      title={r.isActive ? "إيقاف الحساب" : "تفعيل"}
                      disabled={busyId === r.id}
                      onClick={() => toggle(r)}
                    >
                      <Power size={15} />
                    </button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="إضافة عضو للفريق">
        <UserForm onDone={() => setAddOpen(false)} />
      </Modal>
      {permFor && (
        <PermissionEditor
          userId={permFor.id}
          memberName={permFor.fullName}
          role={dictLabel(ROLES, permFor.role)}
          open={!!permFor}
          onClose={() => setPermFor(null)}
        />
      )}
    </>
  );
}
