import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { planOf } from "@/lib/plans-data";
import { CASE_STATUS_OPEN } from "@/lib/labels";

export async function GET() {
  try {
    const user = await requireUser();
    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
      include: { plan: true },
    });
    if (!tenant) return fail(new Error("المكتب غير موجود"));

    const plan = planOf(tenant.planId);
    const trialDaysLeft = tenant.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000))
      : null;

    const [usersCount, activeCasesCount, invoicesCount] = await Promise.all([
      db.user.count({ where: { tenantId: user.tenantId } }),
      db.case.count({ where: { tenantId: user.tenantId, status: { in: CASE_STATUS_OPEN } } }),
      db.invoice.count({ where: { tenantId: user.tenantId, status: { not: "CANCELLED" } } }),
    ]);

    return ok({
      planId: plan.id,
      planName: plan.name,
      priceMonthly: plan.priceMonthly,
      maxUsers: plan.maxUsers,
      maxCases: plan.maxCases,
      trialDaysLeft,
      usage: { users: usersCount, activeCases: activeCasesCount, invoices: invoicesCount },
      features: plan.features,
    });
  } catch (e) {
    return fail(e);
  }
}