import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "أدخل اسمك"),
  email: z.string().email("بريد غير صالح").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  message: z.string().min(5, "اكتب رسالتك"),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await db.lead.create({
      data: { name: body.name, email: body.email || null, phone: body.phone || null, message: body.message },
    });
    return ok();
  } catch (e) {
    return fail(e);
  }
}
