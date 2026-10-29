import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mad, fdate, fdt, fsize } from "@/lib/format";
import { dictLabel, badgeClass, CASE_TYPES, CASE_STATUS, PRIORITY, EXPENSE_CATEGORY, HEARING_STATUS } from "@/lib/labels";
import { Badge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui";
import { QuickAdd, CaseStatusSelect } from "@/components/quick-add";
import { DeleteButton } from "@/components/delete-button";
import { ArrowRight, Scale, FileText, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const record = await db.case.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      client: true,
      lawyer: { select: { id: true, fullName: true } },
      hearings: { orderBy: { dateTime: "desc" } },
      tasks: { orderBy: { createdAt: "desc" }, include: { assignee: { select: { fullName: true } } } },
      expenses: { orderBy: { date: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!record) notFound();

  const [allCases, members] = await Promise.all([
    db.case.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, reference: true, title: true },
      orderBy: { openedAt: "desc" },
    }),
    db.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, fullName: true },
    }),
  ]);

  const totalExpenses = record.expenses.reduce((s, e) => s + e.amount, 0);
  const casesOptions = allCases.map((c) => ({ id: c.id, label: `${c.reference} — ${c.title}` }));

  return (
    <div className="space-y-6">
      <Link href="/cases" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-700">
        <ArrowRight size={15} /> عودة للملفات
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-stone-400" dir="ltr">{record.reference}</span>
              <Badge text={dictLabel(CASE_TYPES, record.type)} />
              <Badge text={dictLabel(PRIORITY, record.priority)} cls={badgeClass(PRIORITY, record.priority)} />
            </div>
            <h1 className="mt-2 text-2xl font-bold">{record.title}</h1>
            <p className="mt-1 text-sm text-stone-500">
              الموكل:{" "}
              <Link href={`/clients/${record.clientId}`} className="font-semibold text-brand-700 hover:underline">
                {record.client.name}
              </Link>
              {record.lawyer && <> · المحامي: {record.lawyer.fullName}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CaseStatusSelect caseId={record.id} current={record.status} />
            <QuickAdd cases={casesOptions} members={members.map((m) => ({ id: m.id, name: m.fullName }))} caseId={record.id} />
            <DeleteButton
              small={false}
              endpoint={`/api/cases/${record.id}`}
              confirmText={`حذف الملف "${record.reference}" نهائياً؟`}
              redirectTo="/cases"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-stone-100 pt-5 text-sm sm:grid-cols-4">
          {[
            ["المحكمة", record.courtName ?? "—"],
            ["مدينة المحكمة", record.courtCity ?? "—"],
            ["الطرف الخصم", record.opposingParty ?? "—"],
            ["الأتعاب المتفق عليها", mad(record.feesAgreed)],
            ["تاريخ الفتح", fdate(record.openedAt)],
            record.closedAt ? ["تاريخ الإغلاق", fdate(record.closedAt)] : null,
            ["المصاريف المسجلة", mad(totalExpenses)],
            ["الحالة", dictLabel(CASE_STATUS, record.status)],
          ].filter(Boolean).map((pair) => {
            const [k, v] = pair as [string, string];
            return (
              <div key={k}>
                <p className="text-xs text-stone-400">{k}</p>
                <p className="mt-0.5 font-semibold text-stone-800">{v}</p>
              </div>
            );
          })}
        </div>

        {record.description && (
          <div className="mt-4 rounded-lg bg-stone-50 p-4 text-sm leading-7 text-stone-600">
            <Scale size={15} className="mb-1 inline text-brand-600" /> {record.description}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* الجلسات */}
        <div className="card p-5">
          <h3 className="mb-4 font-display font-bold">الجلسات ({record.hearings.length})</h3>
          {record.hearings.length === 0 ? (
            <EmptyState title="لا جلسات مسجلة" sub="أضف الجلسة القادمة من زر «جلسة»" />
          ) : (
            <div className="space-y-2.5">
              {record.hearings.map((h) => (
                <div key={h.id} className="rounded-lg border border-stone-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-stone-800">{fdt(h.dateTime)}</span>
                    <Badge text={dictLabel(HEARING_STATUS, h.status)} cls={badgeClass(HEARING_STATUS, h.status)} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{h.courtName ?? "—"} · {h.room ?? "—"}</p>
                  {h.decision && <p className="mt-2 rounded bg-brand-50/60 p-2 text-xs text-brand-900">قرار: {h.decision}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* المهام */}
          <div className="card p-5">
            <h3 className="mb-4 font-display font-bold">المهام ({record.tasks.length})</h3>
            {record.tasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">لا مهام</p>
            ) : (
              <div className="space-y-2">
                {record.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${t.status === "DONE" ? "bg-emerald-500" : t.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-stone-300"}`} />
                    <span className={`flex-1 ${t.status === "DONE" ? "text-stone-400 line-through" : "text-stone-700"}`}>{t.title}</span>
                    <span className="text-xs text-stone-400">{t.dueDate ? fdate(t.dueDate) : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* المصاريف */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold">المصاريف</h3>
              <span className="text-sm font-bold text-brand-700" dir="ltr">{mad(totalExpenses)}</span>
            </div>
            {record.expenses.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">لا مصاريف</p>
            ) : (
              <div className="space-y-2">
                {record.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-stone-700">{e.label}</p>
                      <p className="text-xs text-stone-400">{dictLabel(EXPENSE_CATEGORY, e.category)} · {fdate(e.date)}</p>
                    </div>
                    <span className="font-semibold" dir="ltr">{mad(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* المستندات */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-display font-bold">
          <FileText size={17} className="text-brand-700" /> مستندات الملف ({record.documents.length})
        </h3>
        {record.documents.length === 0 ? (
          <p className="py-4 text-center text-sm text-stone-400">لا مستندات — ارفعها من صفحة «المستندات» واربطها بهذا الملف</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {record.documents.map((d) => (
              <a key={d.id} href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-lg border border-stone-100 p-3 text-sm transition hover:border-brand-300">
                <FileText size={16} className="shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1 truncate font-medium">{d.name}</span>
                <span className="text-xs text-stone-400">{fsize(d.size)}</span>
                <Download size={14} className="text-stone-400" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
