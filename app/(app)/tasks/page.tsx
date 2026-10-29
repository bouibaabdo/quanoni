import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { TasksTable } from "@/components/tables/tasks-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "المهام" };

export default async function TasksPage() {
  const user = await requireUser();
  const now = new Date();
  const [tasks, allCases, members] = await Promise.all([
    db.task.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: {
        case: { select: { reference: true } },
        assignee: { select: { fullName: true } },
      },
    }),
    db.case.findMany({
      where: { tenantId: user.tenantId, status: { in: ["NEW", "IN_PROGRESS", "SUSPENDED"] } },
      select: { id: true, reference: true, title: true },
      orderBy: { openedAt: "desc" },
    }),
    db.user.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="المهام" sub="ما يجب فعله في المكتب — انقر سهم الحالة للتحديث" />
      <TasksTable
        rows={tasks.map((t) => ({
          id: t.id, title: t.title, status: t.status, priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          caseRef: t.case?.reference ?? null, assigneeName: t.assignee?.fullName ?? null,
          overdue: !!t.dueDate && t.dueDate < now,
        }))}
        cases={allCases.map((c) => ({ id: c.id, label: `${c.reference} — ${c.title}` }))}
        members={members.map((m) => ({ id: m.id, name: m.fullName }))}
      />
    </div>
  );
}
