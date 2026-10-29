import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CLIENTS", "VIEW");
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const rows = await db.client.findMany({
      where: {
        tenantId: user.tenantId,
        ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { cin: { contains: q } }, { ice: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { cases: true } } },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z.object({
  kind: z.enum(["INDIVIDUAL", "COMPANY"]),
  name: z.string().min(2, "أدخل اسم الموكل"),
  companyName: z.string().optional().nullable(),
  email: z.string().email("بريد غير صالح").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  ice: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "CLIENTS", "CREATE");
    const body = createSchema.parse(await req.json());
    const client = await db.client.create({
      data: { ...body, email: body.email || null, tenantId: user.tenantId },
    });
    await logActivity(user, "أضاف موكلاً جديداً", client.name, client.id);
    return ok(client);
  } catch (e) {
    return fail(e);
  }
}
