import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { hashPassword, createSession } from "@/lib/auth";

const schema = z.object({
  cabinetName: z.string().min(2, "اسم المكتب قصير جداً"),
  fullName: z.string().min(3, "أدخل اسمك الكامل"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const exists = await db.user.findUnique({ where: { email: body.email } });
    if (exists) throw new ApiError(409, "هذا البريد مستخدم مسبقاً");

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    trialEndsAt.setHours(23, 59, 59, 999);

    const tenant = await db.tenant.create({
      data: {
        name: body.cabinetName,
        email: body.email,
        planId: "pro",
        trialEndsAt,
        settings: { create: {} },
      },
    });

    const user = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        fullName: body.fullName,
        role: "ADMIN",
      },
    });

    await db.activity.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        userName: user.fullName,
        action: "أنشأ حساب المكتب",
        entity: body.cabinetName,
      },
    });

    await createSession({ uid: user.id, tid: tenant.id, role: user.role, name: user.fullName });
    return ok({ userId: user.id, tenantId: tenant.id });
  } catch (e) {
    return fail(e);
  }
}
