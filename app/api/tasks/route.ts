import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "TASKS", "VIEW");
    const status = new URL(req.url).searchParams.get("status");
    const rows = await db.task.findMany({
      where: {
        tenantId: user.tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        case: { select: { id: true, reference: true, title: true } },
        assignee: { select: { id: true, fullName: true } },
      },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z.object({
  title: z.string().min(2, "أدخل عنوان المهمة"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.string().default("MEDIUM"),
  status: z.string().default("TODO"),
  caseId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "TASKS", "CREATE");
    const body = createSchema.parse(await req.json());
    if (body.caseId) {
      const parent = await db.case.findFirst({ where: { id: body.caseId, tenantId: user.tenantId } });
      if (!parent) throw new ApiError(404, "الملف غير موجود");
    }
    const record = await db.task.create({
      data: {
        tenantId: user.tenantId,
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority,
        status: body.status,
        caseId: body.caseId || null,
        assigneeId: body.assigneeId || null,
      },
      include: { case: { select: { reference: true } }, assignee: { select: { fullName: true } } },
    });
    await logActivity(user, "أضاف مهمة", record.title, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}
