import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mad, fdate } from "@/lib/format";
import { dictLabel, badgeClass, CASE_STATUS, CLIENT_KIND } from "@/lib/labels";
import { Badge } from "@/components/status-badge";
import { Card, EmptyState } from "@/components/ui";
import { ArrowRight, Building2, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const client = await db.client.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      cases: { orderBy: { openedAt: "desc" } },
      invoices: { include: { payments: true }, orderBy: { issueDate: "desc" } },
    },
  });
  if (!client) notFound();

  const totalBilled = client.invoices.filter((i) => i.status !== "DRAFT").reduce((s, i) => s + i.total, 0);
  const totalPaid = client.invoices.reduce((s, i) => s + i.payments.reduce((x, p) => x + p.amount, 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-700">
        <ArrowRight size={15} /> عودة للموكلين
      </Link>

      <div className="card flex flex-wrap items-center gap-5 p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
          {client.kind === "COMPANY" ? <Building2 size={28} /> : <User size={28} />}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <Badge text={dictLabel(CLIENT_KIND, client.kind)} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {[client.phone, client.email, client.city].filter(Boolean).join(" · ") || "لا تفاصيل تواصل"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-xs text-stone-400">الملفات</p>
            <p className="font-display text-xl font-extrabold">{client.cases.length}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">إجمالي الفوترة</p>
            <p className="font-display text-xl font-extrabold" dir="ltr">{mad(totalBilled)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400">المحصّل</p>
            <p className="font-display text-xl font-extrabold text-brand-700" dir="ltr">{mad(totalPaid)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 font-display font-bold">ملفات الموكل</h3>
            {client.cases.length === 0 ? (
              <EmptyState title="لا ملفات لهذا الموكل بعد" />
            ) : (
              <div className="space-y-2.5">
                {client.cases.map((c) => (
                  <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 p-3 transition hover:border-brand-300">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <p className="text-xs text-stone-400" dir="ltr">{c.reference} · {dictLabel(CLIENT_KIND, client.kind) && ""}{fdate(c.openedAt)}</p>
                    </div>
                    <Badge text={dictLabel(CASE_STATUS, c.status)} cls={badgeClass(CASE_STATUS, c.status)} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {client.invoices.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-4 font-display font-bold">فواتير الموكل</h3>
              <div className="space-y-2.5">
                {client.invoices.map((i) => {
                  const paid = i.payments.reduce((s, p) => s + p.amount, 0);
                  return (
                    <Link key={i.id} href={`/invoices/${i.id}`} className="flex items-center justify-between rounded-lg border border-stone-100 p-3 transition hover:border-brand-300">
                      <span className="font-mono text-xs font-bold" dir="ltr">{i.number}</span>
                      <span className="text-sm" dir="ltr">{mad(i.total)}</span>
                      <span className="text-xs text-stone-400">مدفوع {mad(paid)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 font-display font-bold">معلومات تفصيلية</h3>
          <dl className="space-y-3 text-sm">
            {([
              ["الاسم", client.name],
              client.kind === "COMPANY" ? ["اسم الشركة", client.companyName ?? "—"] : null,
              [client.kind === "COMPANY" ? "ICE" : "CIN", (client.kind === "COMPANY" ? client.ice : client.cin) ?? "—"],
              ["الهاتف", client.phone ?? "—"],
              ["البريد", client.email ?? "—"],
              ["المدينة", client.city ?? "—"],
              ["العنوان", client.address ?? "—"],
              ["أضيف في", fdate(client.createdAt)],
            ].filter((x): x is [string, string] => x !== null)).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-stone-50 pb-2">
                <dt className="text-stone-400">{k}</dt>
                <dd className="text-end font-medium text-stone-700">{v}</dd>
              </div>
            ))}
          </dl>
          {client.notes && <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">{client.notes}</p>}
        </Card>
      </div>
    </div>
  );
}
