import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { onboardingProgress } from "@/lib/onboarding";

export async function GET() {
  try {
    const user = await requireUser();
    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
      include: { settings: true },
    });
    if (!tenant) return fail(new Error("المكتب غير موجود"));
    const progress = onboardingProgress(tenant);
    return ok({
      done: progress.done,
      total: progress.total,
      items: progress.items,
      tenant: {
        city: tenant.city ?? "",
        address: tenant.address ?? "",
        phone: tenant.phone ?? "",
        email: tenant.email ?? "",
        ice: tenant.ice ?? "",
        ifNumber: tenant.ifNumber ?? "",
        rcNumber: tenant.rcNumber ?? "",
        cnssNumber: tenant.cnssNumber ?? "",
        tpNumber: tenant.tpNumber ?? "",
        tvaRate: tenant.settings?.tvaRate ?? 20,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
