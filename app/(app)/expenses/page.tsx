import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userCan, requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ExpensesTable } from "@/components/tables/expenses-table";
import { mad } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "المصاريف" };

export default async function ExpensesPage() {
  const user = await requireUser();
  if (!(await userCan(user.id, user.role, "EXPENSES", "VIEW"))) redirect("/dashboard");

  const [expenses, cases] = await Promise.all([
    db.expense.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { date: "desc" },
      include: { case: { select: { reference: true } } },
    }),
    db.case.findMany({
      where: { tenantId: user.tenantId, status: { in: ["NEW", "IN_PROGRESS", "SUSPENDED"] } },
      select: { id: true, reference: true, title: true },
      orderBy: { openedAt: "desc" },
    }),
  ]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonth = expenses.filter((e) => e.date >= monthStart).reduce((s, e) => s + e.amount, 0);
  const reimbursable = expenses.filter((e) => e.reimbursable).reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="المصاريف القضائية"
        sub={`هذا الشهر: ${mad(thisMonth)} · قابل للاسترجاع من الموكلين: ${mad(reimbursable)}`}
      />
      <ExpensesTable
        rows={expenses.map((e) => ({
          id: e.id, label: e.label, category: e.category, amount: e.amount,
          date: e.date.toISOString(), caseRef: e.case?.reference ?? null, reimbursable: e.reimbursable,
        }))}
        cases={cases.map((c) => ({ id: c.id, label: `${c.reference} — ${c.title}` }))}
      />
    </div>
  );
}
