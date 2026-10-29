import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";
import {
  MODULES, ACTIONS, roleCan, type ModuleKey, type Action,
} from "@/lib/permissions";

// يعيد مصفوفة الأذونات الكاملة لعضو: لكل وحدة وكل فعل: allowed (من خلفية الدور أو تجاوز مخصص)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireUser();
    await requirePerm(admin.id, admin.role, "TEAM", "EDIT", "وحده من يملك صلاحية إدارة الفريق يعدّل الصلاحيات");
    const { id } = await params;
    const member = await db.user.findFirst({ where: { id, tenantId: admin.tenantId } });
    if (!member) throw new ApiError(404, "العضو غير موجود");

    const overrides = await db.userPermission.findMany({ where: { userId: id } });
    const ov: Record<string, Record<string, boolean>> = {};
    for (const o of overrides) {
      if (!ov[o.module]) ov[o.module] = {};
      ov[o.module][o.action] = o.allowed;
    }

    const matrix = MODULES.map((m) => ({
      module: m.key,
      moduleLabel: m.label,
      actions: ACTIONS.map((a) => {
        const base = roleCan(member.role, m.key as ModuleKey, a.key as Action);
        const override = ov[m.key]?.[a.key];
        return {
          action: a.key,
          actionLabel: a.label,
          base,
          allowed: override !== undefined ? override : base,
          overridden: override !== undefined,
        };
      }),
    }));

    return ok({ userId: id, role: member.role, matrix });
  } catch (e) {
    return fail(e);
  }
}

// الحفظ: يرسل قائمة {module, action, allowed} فيطبّقها المدير، وينشئ أو يحدّث أو يحذف كل تجاوز
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireUser();
    await requirePerm(admin.id, admin.role, "TEAM", "EDIT", "وحده من يملك صلاحية إدارة الفريق يعدّل الصلاحيات");
    const { id } = await params;

    if (id === admin.id)
      throw new ApiError(400, "لا يمكنك تغيير صلاحيات حساب المدير الرئيسي");

    const member = await db.user.findFirst({ where: { id, tenantId: admin.tenantId } });
    if (!member) throw new ApiError(404, "العضو غير موجود");

    const body = (await req.json()) as { overrides: { module: string; action: string; allowed: boolean }[] };
    const overrides = body.overrides ?? [];

    // تحقق من صحة الوحدات والأفعال
    for (const o of overrides) {
      if (!MODULES.some((m) => m.key === o.module))
        throw new ApiError(400, `وحدة غير معروفة: ${o.module}`);
      if (!ACTIONS.some((a) => a.key === o.action))
        throw new ApiError(400, `إجراء غير معروف: ${o.action}`);
    }

    await db.$transaction([
      db.userPermission.deleteMany({ where: { userId: id } }),
      ...overrides.map((o) =>
        db.userPermission.create({
          data: { userId: id, module: o.module, action: o.action, allowed: o.allowed },
        })
      ),
    ]);

    await logActivity(admin, "عدّل صلاحيات عضو", member.fullName, member.id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}