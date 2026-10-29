import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";
import { CASE_STATUS_OPEN } from "@/lib/labels";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CASES", "VIEW");
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const rows = await db.case.findMany({
      where: {
        tenantId: user.tenantId,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { reference: { contains: q } },
                { opposingParty: { contains: q } },
                { client: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      orderBy: { openedAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        lawyer: { select: { id: true, fullName: true } },
        _count: { select: { hearings: true, tasks: true, documents: true } },
      },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z.object({
  title: z.string().min(3, "أدخل عنوان الملف"),
  clientId: z.string().min(1, "اختر الموكل"),
  type: z.string().min(1),
  status: z.string().min(1).default("NEW"),
  priority: z.string().min(1).default("MEDIUM"),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  opposingParty: z.string().optional().nullable(),
  courtName: z.string().optional().nullable(),
  courtCity: z.string().optional().nullable(),
  lawyerId: z.string().optional().nullable(),
  feesAgreed: z.coerce.number().min(0).default(0),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CASES", "CREATE");
    const body = createSchema.parse(await req.json());

    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
      include: { plan: true },
    });
    if (tenant?.plan) {
      const active = await db.case.count({
        where: { tenantId: user.tenantId, status: { in: CASE_STATUS_OPEN } },
      });
      if (active >= tenant.plan.maxCases)
        throw new ApiError(
          403,
          `بلغتَ الحد الأقصى لملفات خطتك (${tenant.plan.maxCases} ملف). رقِّ خطتك أو أغلق الملفات المنتهية.`
        );
    }

    let reference = body.reference?.trim() || "";
    if (!reference) {
      const year = new Date().getFullYear();
      const count = await db.case.count({ where: { tenantId: user.tenantId } });
      reference = `D-${year}-${String(count + 1).padStart(3, "0")}`;
    }
    const dupe = await db.case.findUnique({
      where: { tenantId_reference: { tenantId: user.tenantId, reference } },
    });
    if (dupe) throw new ApiError(409, `المرجع ${reference} مستخدم مسبقاً في هذا المكتب`);

    const client = await db.client.findFirst({ where: { id: body.clientId, tenantId: user.tenantId } });
    if (!client) throw new ApiError(404, "الموكل غير موجود");

    const record = await db.case.create({
      data: { ...body, reference, tenantId: user.tenantId, lawyerId: body.lawyerId || null },
      include: { client: { select: { name: true } } },
    });
    await logActivity(user, "أنشأ الملف", `${record.reference} — ${record.title}`, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}
