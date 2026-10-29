import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

const patchSchema = z.object({
  kind: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
  name: z.string().min(2).optional(),
  companyName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  ice: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function findOwned(id: string, tenantId: string) {
  const client = await db.client.findFirst({ where: { id, tenantId } });
  if (!client) throw new ApiError(404, "الموكل غير موجود");
  return client;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CLIENTS", "VIEW");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const client = await db.client.findUnique({
      where: { id },
      include: {
        cases: { orderBy: { openedAt: "desc" } },
        invoices: { include: { payments: true }, orderBy: { issueDate: "desc" } },
      },
    });
    return ok(client);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CLIENTS", "EDIT");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());
    const client = await db.client.update({
      where: { id },
      data: {
        ...body,
        ...(body.email !== undefined ? { email: body.email || null } : {}),
      },
    });
    await logActivity(user, "حدّث بيانات موكل", client.name, client.id);
    return ok(client);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CLIENTS", "DELETE");
    const { id } = await params;
    const client = await findOwned(id, user.tenantId);
    const caseCount = await db.case.count({ where: { clientId: id } });
    if (caseCount > 0)
      throw new ApiError(409, `لا يمكن حذف الموكل: مرتبط بـ ${caseCount} ملف. احذف ملفاته أولاً أو أغلقها.`);
    const invoiceCount = await db.invoice.count({ where: { clientId: id } });
    if (invoiceCount > 0)
      throw new ApiError(409, `لا يمكن حذف الموكل: لديه ${invoiceCount} فاتورة مسجلة. احذفها أولاً.`);
    await db.client.delete({ where: { id } });
    await logActivity(user, "حذف موكلاً", client.name, client.id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}
