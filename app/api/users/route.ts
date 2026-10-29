import { z } from "zod";
import { db } from "@/lib/db";

import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "TEAM", "VIEW");
    const rows = await db.user.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "asc" },
    });
    return ok(rows.map(({ passwordHash: _p, ...rest }) => rest));
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z.object({
  fullName: z.string().min(3, "أدخل الاسم الكامل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
  role: z.enum(["ADMIN", "LAWYER", "ASSISTANT", "ACCOUNTANT"]),
  phone: z.string().optional().nullable(),
  barNumber: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "TEAM", "CREATE");
    const body = createSchema.parse(await req.json());

    const tenant = await db.tenant.findUnique({ where: { id: user.tenantId }, include: { plan: true } });
    const count = await db.user.count({ where: { tenantId: user.tenantId } });
    if (tenant?.plan && count >= tenant.plan.maxUsers)
      throw new ApiError(403, `بلغتَ الحد الأقصى لمستخدمي خطتك (${tenant.plan.maxUsers}). رقِّ خطتك لإضافة المزيد.`);

    const exists = await db.user.findUnique({ where: { email: body.email } });
    if (exists) throw new ApiError(409, "هذا البريد مستخدم مسبقاً");

    const record = await db.user.create({
      data: {
        tenantId: user.tenantId,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        fullName: body.fullName,
        role: body.role,
        phone: body.phone || null,
        barNumber: body.barNumber || null,
      },
    });
    await logActivity(user, "أضاف عضواً للفريق", `${record.fullName} (${body.role})`, record.id);
    const { passwordHash: _p, ...rest } = record;
    return ok(rest);
  } catch (e) {
    return fail(e);
  }
}
