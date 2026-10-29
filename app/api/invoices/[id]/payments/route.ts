import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

const createSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون موجباً"),
  method: z.enum(["CASH", "CHECK", "TRANSFER", "CARD"]).default("CASH"),
  reference: z.string().optional().nullable(),
  paidAt: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "INVOICES", "CREATE");
    const { id } = await params;
    const invoice = await db.invoice.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!invoice) throw new ApiError(404, "الفاتورة غير موجودة");

    const body = createSchema.parse(await req.json());
    const paid = await db.payment.aggregate({ where: { invoiceId: id }, _sum: { amount: true } });
    const alreadyPaid = paid._sum.amount ?? 0;
    if (alreadyPaid + body.amount > invoice.total + 0.01)
      throw new ApiError(400, "مجموع الدفعات سيتجاوز مبلغ الفاتورة");

    const payment = await db.payment.create({
      data: {
        tenantId: user.tenantId,
        invoiceId: id,
        amount: body.amount,
        method: body.method,
        reference: body.reference || null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
      },
    });
    await logActivity(user, "سجّل دفعة", `${invoice.number} — ${body.amount} د.م.`, invoice.id);
    return ok(payment);
  } catch (e) {
    return fail(e);
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const invoice = await db.invoice.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!invoice) throw new ApiError(404, "الفاتورة غير موجودة");
    const rows = await db.payment.findMany({ where: { invoiceId: id }, orderBy: { paidAt: "desc" } });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}
