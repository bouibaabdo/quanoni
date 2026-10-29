import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser, destroySession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { planOf } from "@/lib/plans-data";
import { onboardingProgress } from "@/lib/onboarding";
import { loadPermissions } from "@/lib/auth";
import { can, MODULES, type ModuleKey, type Action } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.uid },
    include: { tenant: { include: { plan: true, settings: true } } },
  });
  if (!user || !user.isActive) {
    await destroySession();
    redirect("/login");
  }

  const trialDaysLeft = user.tenant.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.tenant.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  const progress = onboardingProgress(user.tenant);

  const permRow = await loadPermissions(user.id, user.role);
  const allowedModules = MODULES.filter(
    (m) => user.role === "ADMIN" || can(permRow, m.key as ModuleKey, "VIEW" as Action)
  ).map((m) => m.key);

  return (
    <AppShell
      allowedModules={allowedModules}
      user={{ name: user.fullName, role: user.role }}
      tenant={{ name: user.tenant.name, planName: planOf(user.tenant.planId).name }}
      trialDaysLeft={trialDaysLeft}
      onboarding={{
        done: progress.done,
        total: progress.total,
        items: progress.items,
        tenant: {
          city: user.tenant.city ?? "",
          address: user.tenant.address ?? "",
          phone: user.tenant.phone ?? "",
          email: user.tenant.email ?? "",
          ice: user.tenant.ice ?? "",
          ifNumber: user.tenant.ifNumber ?? "",
          rcNumber: user.tenant.rcNumber ?? "",
          cnssNumber: user.tenant.cnssNumber ?? "",
          tpNumber: user.tenant.tpNumber ?? "",
          tvaRate: user.tenant.settings?.tvaRate ?? 20,
        },
      }}
    >
      {children}
    </AppShell>
  );
}
