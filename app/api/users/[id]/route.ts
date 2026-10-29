import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity, hashPassword } from "@/lib/auth";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "LAWYER", "ASSISTANT", "ACCOUNTANT"]).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().min(3).optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
});

async function findOwned(id: string, tenantId: string) {
  const record = await db.user.findFirst({ where: { id, tenantId } });
  if (!record) throw new ApiError(404, "العضو غير موجود");
  return record;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "TEAM", "EDIT");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());

    if (id === user.id && body.isActive === false)
      throw new ApiError(400, "لا يمكنك إيقاف حسابك الخاص");

    const record = await db.user.update({
      where: { id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.fullName ? { fullName: body.fullName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
      },
    });
    await logActivity(
      user,
      body.isActive === false ? "أوقف حساب عضو" : body.isActive === true ? "أعاد تفعيل عضو" : "حدّث بيانات عضو",
      record.fullName,
      record.id
    );
    const { passwordHash: _p, ...rest } = record;
    return ok(rest);
  } catch (e) {
    return fail(e);
  }
}
