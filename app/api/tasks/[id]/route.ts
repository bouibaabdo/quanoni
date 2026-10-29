import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm } from "@/lib/auth";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.string().optional(),
  status: z.string().optional(),
  caseId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

async function findOwned(id: string, tenantId: string) {
  const record = await db.task.findFirst({ where: { id, tenantId } });
  if (!record) throw new ApiError(404, "المهمة غير موجودة");
  return record;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "TASKS", "EDIT");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());
    const record = await db.task.update({
      where: { id },
      data: {
        ...body,
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
        ...(body.caseId !== undefined ? { caseId: body.caseId || null } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId || null } : {}),
        ...(body.status === "DONE" ? { completedAt: new Date() } : {}),
        ...(body.status && body.status !== "DONE" ? { completedAt: null } : {}),
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
    await requirePerm(user.id, user.role, "TASKS", "DELETE");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    await db.task.delete({ where: { id } });
    return ok();
  } catch (e) {
    return fail(e);
  }
}
