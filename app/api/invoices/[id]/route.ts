import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "CANCELLED"]).optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function findOwned(id: string, tenantId: string) {
  const record = await db.invoice.findFirst({ where: { id, tenantId } });
  if (!record) throw new ApiError(404, "الفاتورة غير موجودة");
  return record;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const record = await db.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        case: { select: { id: true, reference: true, title: true } },
        items: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    });
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "INVOICES", "EDIT");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());
    const record = await db.invoice.update({
      where: { id },
      data: {
        ...body,
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      },
    });
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "INVOICES", "DELETE");
    const { id } = await params;
    const record = await findOwned(id, user.tenantId);
    const pays = await db.payment.count({ where: { invoiceId: id } });
    if (pays > 0) throw new ApiError(409, "لا يمكن حذف فاتورة لها دفعات مسجلة. ألغِها بدلاً من ذلك.");
    await db.invoice.delete({ where: { id } });
    await logActivity(user, "حذف فاتورة", record.number, record.id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}
