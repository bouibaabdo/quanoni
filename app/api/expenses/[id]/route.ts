import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm } from "@/lib/auth";

const patchSchema = z.object({
  label: z.string().min(2).optional(),
  category: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  date: z.string().optional(),
  caseId: z.string().optional().nullable(),
  reimbursable: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

async function findOwned(id: string, tenantId: string) {
  const record = await db.expense.findFirst({ where: { id, tenantId } });
  if (!record) throw new ApiError(404, "المصروف غير موجود");
  return record;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "EXPENSES", "EDIT");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());
    const record = await db.expense.update({
      where: { id },
      data: {
        ...body,
        ...(body.date ? { date: new Date(body.date) } : {}),
        ...(body.caseId !== undefined ? { caseId: body.caseId || null } : {}),
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
    await requirePerm(user.id, user.role, "EXPENSES", "DELETE");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    await db.expense.delete({ where: { id } });
    return ok();
  } catch (e) {
    return fail(e);
  }
}
