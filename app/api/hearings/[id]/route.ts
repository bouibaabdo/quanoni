import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

const patchSchema = z.object({
  dateTime: z.string().optional(),
  courtName: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  decision: z.string().optional().nullable(),
});

async function findOwned(id: string, tenantId: string) {
  const record = await db.hearing.findFirst({ where: { id, tenantId }, include: { case: { select: { reference: true } } } });
  if (!record) throw new ApiError(404, "الجلسة غير موجودة");
  return record;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "HEARINGS", "EDIT");
    const { id } = await params;
    const existing = await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());
    const record = await db.hearing.update({
      where: { id },
      data: {
        ...body,
        ...(body.dateTime ? { dateTime: new Date(body.dateTime) } : {}),
      },
      include: { case: { select: { reference: true, title: true } } },
    });
    if (body.status && body.status !== existing.status)
      await logActivity(user, "حدّث حالة جلسة", record.case.reference, record.id, body.status);
    if (body.decision)
      await logActivity(user, "سجّل قرار المحكمة", record.case.reference, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "HEARINGS", "DELETE");
    const { id } = await params;
    const record = await findOwned(id, user.tenantId);
    await db.hearing.delete({ where: { id } });
    await logActivity(user, "حذف جلسة", record.case.reference, record.id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}
