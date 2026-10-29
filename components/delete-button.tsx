"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./ui";
import { api } from "@/lib/client-api";

export function DeleteButton({
  endpoint,
  confirmText,
  title = "تأكيد الحذف",
  redirectTo,
  small = true,
}: {
  endpoint: string;
  confirmText: string;
  title?: string;
  redirectTo?: string;
  small?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    setBusy(true);
    try {
      await api(endpoint, "DELETE");
      toast.success("تم الحذف بنجاح");
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${small ? "btn-ghost btn-sm" : "btn-ghost"} rounded-lg p-2 text-red-500 hover:bg-red-50`}
        title="حذف"
      >
        <Trash2 size={15} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-stone-600">{confirmText}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>
            إلغاء
          </button>
          <button className="btn-danger" onClick={doDelete} disabled={busy}>
            {busy ? "جارٍ الحذف…" : "حذف نهائي"}
          </button>
        </div>
      </Modal>
    </>
  );
}
