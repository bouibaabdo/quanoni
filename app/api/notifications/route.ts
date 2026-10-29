import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { fdt } from "@/lib/format";

export async function GET() {
  try {
    const user = await requireUser();
    const tid = user.tenantId;
    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [hearings, invoices, tasks] = await Promise.all([
      db.hearing.findMany({
        where: { tenantId: tid, dateTime: { gte: now, lte: in7 }, status: "SCHEDULED" },
        orderBy: { dateTime: "asc" },
        include: { case: { select: { id: true, reference: true, title: true } } },
      }),
      db.invoice.findMany({
        where: { tenantId: tid, status: "SENT", dueDate: { lt: now } },
        include: { payments: true, client: { select: { name: true } } },
      }),
      db.task.findMany({
        where: { tenantId: tid, status: { not: "DONE" }, dueDate: { lt: tomorrow } },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    const items: { type: string; title: string; body: string; href: string; severity: string; date: string }[] = [];

    for (const h of hearings) {
      items.push({
        type: "hearing",
        title: `جلسة قادمة: ${h.case.reference}`,
        body: `${h.case.title} — ${h.courtName ?? "المحكمة"} (${h.room ?? "—"})`,
        href: `/cases/${h.caseId}`,
        severity: "info",
        date: fdt(h.dateTime),
      });
    }
    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      if (paid < inv.total)
        items.push({
          type: "invoice",
          title: `فاتورة متأخرة: ${inv.number}`,
          body: `${inv.client.name} — المتبقي ${(inv.total - paid).toFixed(2)} د.م.`,
          href: `/invoices/${inv.id}`,
          severity: "danger",
          date: inv.dueDate ? fdt(inv.dueDate) : "",
        });
    }
    for (const t of tasks) {
      items.push({
        type: "task",
        title: t.dueDate && t.dueDate < now ? `مهمة متأخرة: ${t.title}` : `مهمة مستحقة اليوم: ${t.title}`,
        body: t.dueDate ? `الاستحقاق: ${fdt(t.dueDate)}` : "",
        href: "/tasks",
        severity: "warning",
        date: t.dueDate ? fdt(t.dueDate) : "",
      });
    }

    const order = { danger: 0, warning: 1, info: 2 } as Record<string, number>;
    items.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
    return ok(items);
  } catch (e) {
    return fail(e);
  }
}
