import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "INVOICES", "VIEW");
    const status = new URL(req.url).searchParams.get("status");
    const rows = await db.invoice.findMany({
      where: { tenantId: user.tenantId, ...(status ? { status } : {}) },
      orderBy: { issueDate: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        case: { select: { id: true, reference: true } },
        payments: true,
      },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

const itemSchema = z.object({
  description: z.string().min(1, "أدخل وصف البند"),
  qty: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
});

const createSchema = z.object({
  clientId: z.string().min(1, "اختر الموكل"),
  caseId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT"]).default("DRAFT"),
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tvaRate: z.coerce.number().min(0).max(100).default(20),
  items: z.array(itemSchema).min(1, "أضف بنداً واحداً على الأقل"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "INVOICES", "CREATE");
    const body = createSchema.parse(await req.json());

    const client = await db.client.findFirst({ where: { id: body.clientId, tenantId: user.tenantId } });
    if (!client) throw new ApiError(404, "الموكل غير موجود");

    const tenant = await db.tenant.findUnique({ where: { id: user.tenantId }, include: { settings: true } });
    const prefix = tenant?.settings?.invoicePrefix ?? "FAC";

    const subtotal = body.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const tvaAmount = Math.round(subtotal * body.tvaRate) / 100 * 1; // precision 2
    const total = subtotal + subtotal * (body.tvaRate / 100);

    const number = await db.$transaction(async (tx) => {
      const count = await tx.invoice.count({ where: { tenantId: user.tenantId } });
      const year = new Date().getFullYear();
      return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
    });

    const record = await db.invoice.create({
      data: {
        tenantId: user.tenantId,
        number,
        clientId: body.clientId,
        caseId: body.caseId || null,
        status: body.status,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
        subtotal: Math.round(subtotal * 100) / 100,
        tvaRate: body.tvaRate,
        tvaAmount: Math.round(subtotal * (body.tvaRate / 100) * 100) / 100,
        total: Math.round(total * 100) / 100,
        items: {
          create: body.items.map((it) => ({
            description: it.description,
            qty: it.qty,
            unitPrice: it.unitPrice,
            amount: Math.round(it.qty * it.unitPrice * 100) / 100,
          })),
        },
      },
      include: { client: { select: { name: true } } },
    });
    await logActivity(user, "أنشأ فاتورة", `${record.number} — ${record.client.name}`, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}
