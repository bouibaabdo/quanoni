"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Field } from "../ui";

export function UploadForm({ cases }: { cases: { id: string; label: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caseId, setCaseId] = useState("");
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("اختر ملفاً للرفع");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (caseId) fd.append("caseId", caseId);
      if (name) fd.append("name", name);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "تعذر رفع الملف");
      toast.success("تم رفع المستند");
      setFile(null);
      setName("");
      setCaseId("");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
      <Field label="الملف (حتى 5 ميغابايت)">
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 text-sm text-stone-500 hover:border-brand-500">
          <UploadCloud size={16} />
          <span className="truncate">{file ? file.name : "اختر ملفاً…"}</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
          />
        </label>
      </Field>
      <Field label="اربطه بملف (اختياري)">
        <select className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
          <option value="">— بدون —</option>
          {cases.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <button className="btn-primary h-10" disabled={busy}>
        {busy ? "جارٍ الرفع…" : "رفع"}
      </button>
    </form>
  );
}
