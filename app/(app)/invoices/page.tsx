import { db } from "@/lib/db";
import { requireUser, userCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { mad } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفواتير" };

export default async function InvoicesPage() {
  const user = await requireUser();
  if (!(await userCan(user.id, user.role, "INVOICES", "VIEW"))) redirect("/dashboard");

  const [invoices, clients, cases, tenant] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { issueDate: "desc" },
      include: {
        client: { select: { name: true } },
        case: { select: { reference: true } },
        payments: true,
      },
    }),
    db.client.findMany({ where: { tenantId: user.tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.case.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, reference: true, title: true, clientId: true },
      orderBy: { openedAt: "desc" },
    }),
    db.tenant.findUnique({ where: { id: user.tenantId }, include: { settings: true } }),
  ]);

  const now = new Date();
  const rows = invoices.map((i) => {
    const paid = i.payments.reduce((s, p) => s + p.amount, 0);
    let displayStatus = i.status;
    let displayCls = i.status === "SENT" ? "bg-brand-50 text-brand-700" : "bg-stone-100 text-stone-600";
    if (i.status === "SENT") {
      if (paid >= i.total - 0.01) { displayStatus = "PAID"; displayCls = "bg-emerald-50 text-emerald-700"; }
      else if (paid > 0) { displayStatus = "PARTIAL"; displayCls = "bg-blue-50 text-blue-700"; }
      else if (i.dueDate && i.dueDate < now) { displayStatus = "OVERDUE"; displayCls = "bg-red-50 text-red-700"; }
    }
    return {
      id: i.id, number: i.number, clientName: i.client.name, caseRef: i.case?.reference ?? null,
      total: i.total, paid, displayStatus: displayStatus === "SENT" ? "مرسلة" : displayStatus === "DRAFT" ? "مسودة" : displayStatus === "PAID" ? "مدفوعة" : displayStatus === "PARTIAL" ? "مدفوعة جزئياً" : displayStatus === "OVERDUE" ? "متأخرة" : "ملغاة",
      displayCls, dueDate: i.dueDate ? i.dueDate.toISOString() : null, issueDate: i.issueDate.toISOString(),
    };
  });

  const unpaidTotal = rows.filter((r) => r.displayCls !== "bg-emerald-50 text-emerald-700" && r.displayStatus !== "مسودة" && r.displayStatus !== "ملغاة").reduce((s, r) => s + (r.total - r.paid), 0);

  return (
    <div>
      <PageHeader
        title="الفواتير"
        sub={unpaidTotal > 0 ? `المتبقي غير المحصّل: ${mad(unpaidTotal)}` : "فواتير أتعاب المكتب مع TVA"}
      />
      <InvoicesTable
        rows={rows}
        clients={clients}
        cases={cases.map((c) => ({ id: c.id, label: `${c.reference} — ${c.title}`, clientId: c.clientId }))}
        tvaRate={tenant?.settings?.tvaRate ?? 20}
      />
    </div>
  );
}
