"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "./ui";
import { api } from "@/lib/client-api";
import { ACTIONS } from "@/lib/permissions";

type Cell = { action: string; actionLabel: string; base: boolean; allowed: boolean; overridden: boolean };
type Row = { module: string; moduleLabel: string; actions: Cell[] };

export function PermissionEditor({
  userId,
  memberName,
  role,
  open,
  onClose,
}: {
  userId: string;
  memberName: string;
  role: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    api(`/api/users/${userId}/permissions`)
      .then((d) => setRows((d as { matrix: Row[] }).matrix))
      .catch((e) => toast.error((e as Error).message));
  }, [open, userId]);

  function toggle(rIdx: number, aIdx: number) {
    setRows((prev) =>
      prev.map((r, ri) =>
        ri === rIdx
          ? {
              ...r,
              actions: r.actions.map((c, ai) =>
                ai === aIdx ? { ...c, allowed: !c.allowed, overridden: true } : c
              ),
            }
          : r
      )
    );
  }

  async function save() {
    setBusy(true);
    const overrides: { module: string; action: string; allowed: boolean }[] = [];
    for (const r of rows) {
      for (const c of r.actions) {
        if (c.overridden && c.allowed !== c.base) overrides.push({ module: r.module, action: c.action, allowed: c.allowed });
      }
    }
    try {
      await api(`/api/users/${userId}/permissions`, "PUT", { overrides });
      toast.success("تم حفظ صلاحيات العضو");
      router.refresh();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`صلاحيات: ${memberName}`} wide>
      <p className="mb-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
        الدور: <b>{role}</b> — الخانات الملونة هي الافتراضي من الدور؛ غيّر أي خانة لتخصيص الصلاحية لهذا العضو تحديداً.
      </p>
      <div className="max-h-96 overflow-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-stone-50">
            <tr className="border-b border-stone-200">
              <th className="table-th">الوحدة</th>
              {ACTIONS.map((a) => (
                <th key={a.key} className="table-th text-center">{a.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((r, ri) => (
              <tr key={r.module}>
                <td className="table-td font-semibold text-stone-700">{r.moduleLabel}</td>
                {r.actions.map((c, ai) => (
                  <td key={c.action} className="table-td text-center">
                    <button
                      type="button"
                      onClick={() => toggle(ri, ai)}
                      title={`${r.moduleLabel} — ${c.actionLabel}`}
                      className={`inline-flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
                        c.allowed ? "justify-end bg-brand-600" : "justify-start bg-stone-300"
                      } ${c.overridden ? "ring-2 ring-gold-400" : ""}`}
                    >
                      <span className="h-5 w-5 rounded-full bg-white shadow" />
                    </button>
                    {c.overridden && c.allowed !== c.base && (
                      <span className="ms-1 text-[10px] text-gold-500" title="مخصص">●</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>إلغاء</button>
        <button className="btn-primary" onClick={save} disabled={busy}>
          {busy ? "جارٍ الحفظ…" : "حفظ الصلاحيات"}
        </button>
      </div>
    </Modal>
  );
}