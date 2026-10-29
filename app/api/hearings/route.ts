import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "HEARINGS", "VIEW");
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // upcoming | past | all
    const now = new Date();
    const rows = await db.hearing.findMany({
      where: {
        tenantId: user.tenantId,
        ...(scope === "upcoming"
          ? { dateTime: { gte: now }, status: "SCHEDULED" }
          : scope === "past"
            ? { dateTime: { lt: now } }
            : {}),
      },
      orderBy: scope === "past" ? { dateTime: "desc" } : { dateTime: "asc" },
      include: {
        case: { select: { id: true, reference: true, title: true, client: { select: { name: true } } } },
      },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z.object({
  caseId: z.string().min(1, "اختر الملف"),
  dateTime: z.string().min(1, "حدد تاريخ ووقت الجلسة"),
  courtName: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  status: z.string().default("SCHEDULED"),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "HEARINGS", "CREATE");
    const body = createSchema.parse(await req.json());
    const parent = await db.case.findFirst({ where: { id: body.caseId, tenantId: user.tenantId } });
    if (!parent) throw new ApiError(404, "الملف غير موجود");
    const record = await db.hearing.create({
      data: {
        tenantId: user.tenantId,
        caseId: body.caseId,
        dateTime: new Date(body.dateTime),
        courtName: body.courtName || null,
        room: body.room || null,
        status: body.status,
        notes: body.notes || null,
      },
      include: { case: { select: { reference: true, title: true } } },
    });
    await logActivity(user, "أضاف جلسة جديدة", `${record.case.reference} — ${record.case.title}`, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}
