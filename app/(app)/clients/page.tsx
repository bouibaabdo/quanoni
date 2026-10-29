import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ClientsTable } from "@/components/tables/clients-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "الموكلون" };

export default async function ClientsPage() {
  const user = await requireUser();
  const rows = await db.client.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { cases: true } } },
  });

  return (
    <div>
      <PageHeader title="الموكلون" sub="ملف كامل لكل موكل مع قضاه وفواتيره" />
      <ClientsTable
        rows={rows.map((c) => ({
          id: c.id, kind: c.kind, name: c.name, phone: c.phone, city: c.city,
          cin: c.cin, ice: c.ice, createdAt: c.createdAt.toISOString(), caseCount: c._count.cases,
        }))}
      />
    </div>
  );
}
