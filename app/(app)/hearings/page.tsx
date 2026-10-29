import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CalendarView, type CalendarEvent } from "@/components/calendar-view";
import { PageHeader } from "@/components/ui";
import { dateKey, ftime } from "@/lib/format";
import { dictLabel, badgeClass, HEARING_STATUS, TASK_STATUS } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "الجلسات والتقويم" };

export default async function HearingsPage() {
  const user = await requireUser();
  const [hearings, tasks, allCases] = await Promise.all([
    db.hearing.findMany({
      where: { tenantId: user.tenantId, status: "SCHEDULED" },
      include: { case: { select: { id: true, reference: true, title: true } } },
    }),
    db.task.findMany({
      where: { tenantId: user.tenantId, status: { not: "DONE" }, dueDate: { not: null } },
      include: { case: { select: { id: true, reference: true, title: true } } },
    }),
    db.case.findMany({
      where: { tenantId: user.tenantId, status: { in: ["NEW", "IN_PROGRESS", "SUSPENDED"] } },
      select: { id: true, reference: true, title: true },
      orderBy: { openedAt: "desc" },
    }),
  ]);

  const events: CalendarEvent[] = [
    ...hearings.map((h) => ({
      id: h.id, kind: "hearing" as const, dateKey: dateKey(h.dateTime),
      time: ftime(h.dateTime), title: `جلسة: ${h.case.reference}`, sub: h.case.title,
      href: `/cases/${h.caseId}`,
      statusLabel: dictLabel(HEARING_STATUS, h.status), statusCls: badgeClass(HEARING_STATUS, h.status),
    })),
    ...tasks.map((t) => ({
      id: t.id, kind: "task" as const, dateKey: dateKey(t.dueDate as Date),
      time: ftime(t.dueDate as Date), title: t.title,
      sub: t.case ? `${t.case.reference} — ${t.case.title}` : "مهمة عامة",
      href: "/tasks",
      statusLabel: dictLabel(TASK_STATUS, t.status), statusCls: badgeClass(TASK_STATUS, t.status),
    })),
  ];

  return (
    <div>
      <PageHeader title="الجلسات والتقويم" sub="الجلسات القضائية (ذهبي) والمهام (أزرق) في تقويم واحد" />
      <CalendarView
        events={events}
        cases={allCases.map((c) => ({ id: c.id, label: `${c.reference} — ${c.title}` }))}
      />
    </div>
  );
}
