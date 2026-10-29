import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { verifyPassword, createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await db.user.findUnique({
      where: { email: body.email },
      include: { tenant: true },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash)))
      throw new ApiError(401, "البريد أو كلمة المرور غير صحيحة");
    if (!user.isActive) throw new ApiError(403, "تم إيقاف هذا الحساب — اتصل بمدير المكتب");

    await createSession({ uid: user.id, tid: user.tenantId, role: user.role, name: user.fullName });
    return ok({ userId: user.id });
  } catch (e) {
    return fail(e);
  }
}
