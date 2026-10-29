import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CasesTable } from "@/components/tables/cases-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "الملفات والقضايا" };

export default async function CasesPage() {
  const user = await requireUser();
  const [cases, clients, members] = await Promise.all([
    db.case.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { openedAt: "desc" },
      include: {
        client: { select: { name: true } },
        lawyer: { select: { fullName: true } },
      },
    }),
    db.client.findMany({ where: { tenantId: user.tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { tenantId: user.tenantId, isActive: true, role: { in: ["ADMIN", "LAWYER"] } },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="الملفات والقضايا" sub="كل ملفات المكتب مع حالتها وجلساتها ومصاريفها" />
      <CasesTable
        rows={cases.map((c) => ({
          id: c.id, reference: c.reference, title: c.title, type: c.type, status: c.status,
          priority: c.priority, clientId: c.clientId, clientName: c.client.name, lawyerName: c.lawyer?.fullName ?? null,
          courtName: c.courtName, openedAt: c.openedAt.toISOString(), feesAgreed: c.feesAgreed,
        }))}
        clients={clients}
        lawyers={members.map((m) => ({ id: m.id, name: m.fullName }))}
      />
    </div>
  );
}
