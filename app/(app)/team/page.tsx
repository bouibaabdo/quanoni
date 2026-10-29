import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userCan, requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { TeamTable } from "@/components/tables/team-table";
import { planOf } from "@/lib/plans-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفريق" };

export default async function TeamPage() {
  const user = await requireUser();
  if (!(await userCan(user.id, user.role, "TEAM", "VIEW"))) redirect("/dashboard");

  const [users, tenant] = await Promise.all([
    db.user.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: "asc" } }),
    db.tenant.findUnique({ where: { id: user.tenantId }, include: { plan: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="فريق المكتب"
        sub={`${users.length} من ${planOf(tenant?.planId).maxUsers > 100 ? "غير محدود" : planOf(tenant?.planId).maxUsers} مستخدم في خطتك`}
      />
      <TeamTable
        rows={users.map((u) => ({
          id: u.id, fullName: u.fullName, email: u.email, role: u.role, isActive: u.isActive,
          phone: u.phone, barNumber: u.barNumber, createdAt: u.createdAt.toISOString(), isSelf: u.id === user.id,
        }))}
      />
    </div>
  );
}
