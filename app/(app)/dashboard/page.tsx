import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mad, num, fdt, fdate, MONTHS_AR } from "@/lib/format";
import { dictLabel, CASE_TYPES, HEARING_STATUS, badgeClass } from "@/lib/labels";
import { BarMini, HBars } from "@/components/charts";
import {
  FolderKanban, CalendarClock, Users, Wallet, Gavel, ChevronLeft,
} from "lucide-react";
import { CASE_STATUS_OPEN } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم" };

export default async function DashboardPage() {
  const user = await requireUser();
  const tid = user.tenantId;

  const now = new Date();
  const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);

  const [
    activeCases, clientsN, weekHearings, openInvoices, payments, allCases, upcoming, tasksDue, activities,
  ] = await Promise.all([
    db.case.count({ where: { tenantId: tid, status: { in: CASE_STATUS_OPEN } } }),
    db.client.count({ where: { tenantId: tid } }),
    db.hearing.findMany({
      where: { tenantId: tid, dateTime: { gte: now, lte: in7 }, status: "SCHEDULED" },
      orderBy: { dateTime: "asc" },
      include: { case: { select: { id: true, reference: true, title: true } } },
    }),
    db.invoice.findMany({
      where: { tenantId: tid, status: { not: "CANCELLED" } },
      include: { payments: true },
    }),
    db.payment.findMany({
      where: { tenantId: tid, paidAt: { gte: eightMonthsAgo } },
      select: { amount: true, paidAt: true },
    }),
    db.case.findMany({ where: { tenantId: tid }, select: { type: true } }),
    db.hearing.findMany({
      where: { tenantId: tid, dateTime: { gte: now, lte: in7 }, status: "SCHEDULED" },
      orderBy: { dateTime: "asc" },
      take: 5,
      include: { case: { select: { id: true, reference: true, title: true } } },
    }),
    db.task.findMany({
      where: { tenantId: tid, status: { not: "DONE" }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.activity.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  // الإيرادات الشهرية (المدفوعات)
  const months: { label: string; value: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: MONTHS_AR[d.getMonth()], value: 0 });
  }
  for (const p of payments) {
    const d = new Date(p.paidAt);
    const idx = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (idx >= 0 && idx <= 7) months[7 - idx].value += p.amount;
  }

  // غير المحصل
  let unpaid = 0;
  for (const inv of openInvoices) {
    if (inv.status === "DRAFT") continue;
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    unpaid += Math.max(0, inv.total - paid);
  }

  // الملفات حسب النوع
  const byType = Object.entries(CASE_TYPES).map(([k, v]) => ({
    label: v.label,
    value: allCases.filter((c) => c.type === k).length,
  })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);

  const revenueThisMonth = payments
    .filter((p) => new Date(p.paidAt) >= monthStart)
    .reduce((s, p) => s + p.amount, 0);

  const kpis = [
    { label: "ملفات نشطة", value: num(activeCases), icon: FolderKanban, href: "/cases", color: "bg-brand-50 text-brand-700" },
    { label: "جلسات هذا الأسبوع", value: num(weekHearings.length), icon: CalendarClock, href: "/hearings", color: "bg-amber-50 text-amber-700" },
    { label: "الموكلون", value: num(clientsN), icon: Users, href: "/clients", color: "bg-blue-50 text-blue-700" },
    { label: "محصّل هذا الشهر", value: mad(revenueThisMonth), icon: Wallet, href: "/invoices", color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مرحباً، {user.fullName.split(" ").slice(-1)[0]} 👋</h1>
        <p className="mt-1 text-sm text-stone-500">نظرة سريعة على مكتبك اليوم.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card flex items-center gap-4 p-5 transition hover:border-brand-300">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${k.color}`}>
              <k.icon size={22} />
            </span>
            <div>
              <p className="text-sm text-stone-500">{k.label}</p>
              <p className="font-display text-xl font-extrabold text-stone-900">{k.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {unpaid > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-e-4 border-e-amber-400 p-4">
          <div className="flex items-center gap-3">
            <Wallet size={20} className="text-amber-500" />
            <p className="text-sm text-stone-700">
              لديك مبالغ غير محصّلة بقيمة <b dir="ltr">{mad(unpaid)}</b> — تابع فواتيرك المتأخرة.
            </p>
          </div>
          <Link href="/invoices" className="btn-outline btn-sm">
            عرض الفواتير <ChevronLeft size={14} />
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-display font-bold">التحصيل — آخر 8 أشهر</h3>
          <BarMini data={months} />
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-display font-bold">الملفات حسب النوع</h3>
          {byType.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-400">لا ملفات بعد</p>
          ) : (
            <HBars data={byType} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-bold">جلسات قادمة (7 أيام)</h3>
            <Link href="/hearings" className="text-xs font-semibold text-brand-700 hover:underline">الكل</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">لا جلسات هذا الأسبوع 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((h) => (
                <Link key={h.id} href={`/cases/${h.caseId}`} className="flex items-center gap-3 rounded-lg border border-stone-100 p-3 transition hover:border-brand-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Gavel size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{h.case.title}</p>
                    <p className="text-xs text-stone-500">{h.case.reference} — {h.courtName ?? "المحكمة"}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs font-bold text-stone-700">{fdt(h.dateTime)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-bold">مهام مستحقة</h3>
            <Link href="/tasks" className="text-xs font-semibold text-brand-700 hover:underline">الكل</Link>
          </div>
          {tasksDue.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">لا مهام مستحقة 👌</p>
          ) : (
            <div className="space-y-2.5">
              {tasksDue.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-stone-100 p-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.dueDate && new Date(t.dueDate) < now ? "bg-red-500" : "bg-amber-400"}`} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{t.title}</p>
                  <span className="text-xs text-stone-400">{fdate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 font-display font-bold">آخر النشاطات</h3>
        {activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-400">لا نشاطات بعد</p>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-300" />
                <p className="text-stone-600">
                  <b className="text-stone-800">{a.userName}</b> {a.action} — <span className="text-stone-500">{a.entity}</span>
                  <span className="ms-2 text-xs text-stone-400">{fdt(a.createdAt)}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
