import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

const FINANCE = ["ADMIN", "ACCOUNTANT"];

export async function GET() {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "EXPENSES", "VIEW");
    const rows = await db.expense.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { date: "desc" },
      include: { case: { select: { id: true, reference: true, title: true } } },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z.object({
  label: z.string().min(2, "أدخل وصف المصروف"),
  category: z.string().default("OTHER"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون موجباً"),
  date: z.string().min(1, "حدد التاريخ"),
  caseId: z.string().optional().nullable(),
  reimbursable: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "EXPENSES", "CREATE");
    const body = createSchema.parse(await req.json());
    if (body.caseId) {
      const parent = await db.case.findFirst({ where: { id: body.caseId, tenantId: user.tenantId } });
      if (!parent) throw new ApiError(404, "الملف غير موجود");
    }
    const record = await db.expense.create({
      data: {
        tenantId: user.tenantId,
        label: body.label,
        category: body.category,
        amount: body.amount,
        date: new Date(body.date),
        caseId: body.caseId || null,
        reimbursable: body.reimbursable,
        notes: body.notes || null,
      },
      include: { case: { select: { reference: true } } },
    });
    await logActivity(user, "أضاف مصروفاً", `${record.label} — ${body.amount} د.م.`, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}
