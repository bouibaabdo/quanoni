import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { DocumentsTable } from "@/components/tables/documents-table";
import { UploadForm } from "@/components/forms/upload-form";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "المستندات" };

export default async function DocumentsPage() {
  const user = await requireUser();
  const [docs, cases] = await Promise.all([
    db.document.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      include: { case: { select: { reference: true } } },
    }),
    db.case.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true, reference: true, title: true },
      orderBy: { openedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="المستندات" sub="أرشيف المكتب — مقالات، أحكام، سندات، مراسلات" />
      <Card className="p-5">
        <UploadForm cases={cases.map((c) => ({ id: c.id, label: `${c.reference} — ${c.title}` }))} />
      </Card>
      <DocumentsTable
        rows={docs.map((d) => ({
          id: d.id, name: d.name, caseRef: d.case?.reference ?? null,
          size: d.size, uploadedBy: d.uploadedBy, createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
