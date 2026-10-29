import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  clientId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  description: z.string().optional().nullable(),
  opposingParty: z.string().optional().nullable(),
  courtName: z.string().optional().nullable(),
  courtCity: z.string().optional().nullable(),
  lawyerId: z.string().optional().nullable(),
  feesAgreed: z.coerce.number().min(0).optional(),
});

async function findOwned(id: string, tenantId: string) {
  const record = await db.case.findFirst({ where: { id, tenantId } });
  if (!record) throw new ApiError(404, "الملف غير موجود");
  return record;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CASES", "VIEW");
    const { id } = await params;
    await findOwned(id, user.tenantId);
    const record = await db.case.findUnique({
      where: { id },
      include: {
        client: true,
        lawyer: { select: { id: true, fullName: true } },
        hearings: { orderBy: { dateTime: "desc" } },
        tasks: { orderBy: { createdAt: "desc" }, include: { assignee: { select: { fullName: true } } } },
        expenses: { orderBy: { date: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { issueDate: "desc" }, include: { payments: true } },
      },
    });
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CASES", "EDIT");
    const { id } = await params;
    const existing = await findOwned(id, user.tenantId);
    const body = patchSchema.parse(await req.json());
    const closing = body.status && ["WON", "LOST", "CLOSED"].includes(body.status);
    const reopening = body.status && ["NEW", "IN_PROGRESS", "SUSPENDED"].includes(body.status);
    const record = await db.case.update({
      where: { id },
      data: {
        ...body,
        lawyerId: body.lawyerId || null,
        ...(closing ? { closedAt: new Date() } : {}),
        ...(reopening ? { closedAt: null } : {}),
      },
    });
    if (body.status && body.status !== existing.status) {
      await logActivity(user, "حدّث حالة الملف", `${record.reference} — ${record.title}`, record.id, body.status);
    }
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CASES", "DELETE");
    const { id } = await params;
    const record = await findOwned(id, user.tenantId);
    await db.case.delete({ where: { id } });
    await logActivity(user, "حذف الملف", `${record.reference} — ${record.title}`, record.id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}
