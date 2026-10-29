import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireUser, requirePerm } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "SETTINGS", "VIEW");
    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
      include: { settings: true },
    });
    return ok(tenant);
  } catch (e) {
    return fail(e);
  }
}

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  ice: z.string().optional().nullable(),
  ifNumber: z.string().optional().nullable(),
  rcNumber: z.string().optional().nullable(),
  cnssNumber: z.string().optional().nullable(),
  tpNumber: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1).max(10).optional(),
  invoiceLanguage: z.enum(["AR", "FR", "BI"]).optional(),
  tvaRate: z.coerce.number().min(0).max(100).optional(),
  reminderDays: z.coerce.number().int().min(1).max(30).optional(),
  footerNote: z.string().optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "SETTINGS", "EDIT");
    const body = schema.parse(await req.json());

    const { invoicePrefix, invoiceLanguage, tvaRate, reminderDays, footerNote, ...tenantData } = body;

    const tenant = await db.tenant.update({
      where: { id: user.tenantId },
      data: {
        ...tenantData,
        ...(tenantData.email !== undefined ? { email: tenantData.email || null } : {}),
      },
      include: { settings: true },
    });

    if (invoicePrefix !== undefined || invoiceLanguage !== undefined || tvaRate !== undefined || reminderDays !== undefined || footerNote !== undefined) {
      const settingsId = tenant.settings?.id;
      if (settingsId) {
        await db.tenantSettings.update({
          where: { id: settingsId },
          data: {
            ...(invoicePrefix !== undefined ? { invoicePrefix } : {}),
            ...(invoiceLanguage !== undefined ? { invoiceLanguage } : {}),
            ...(tvaRate !== undefined ? { tvaRate } : {}),
            ...(reminderDays !== undefined ? { reminderDays } : {}),
            ...(footerNote !== undefined ? { footerNote: footerNote || null } : {}),
          },
        });
      }
    }

    return ok(await db.tenant.findUnique({ where: { id: user.tenantId }, include: { settings: true } }));
  } catch (e) {
    return fail(e);
  }
}
