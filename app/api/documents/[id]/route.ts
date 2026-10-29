import { db } from "@/lib/db";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

async function findOwned(id: string, tenantId: string) {
  const record = await db.document.findFirst({ where: { id, tenantId } });
  if (!record) throw new ApiError(404, "المستند غير موجود");
  return record;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "DOCUMENTS", "VIEW");
    const { id } = await params;
    const record = await findOwned(id, user.tenantId);
    const abs = path.join(process.cwd(), record.filePath);
    try {
      const buf = await fs.readFile(abs);
      return new Response(new Uint8Array(buf), {
        headers: {
          "content-type": record.mimeType || "application/octet-stream",
          "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(record.name)}`,
        },
      });
    } catch {
      throw new ApiError(410, "الملف غير متوفر على القرص");
    }
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "DOCUMENTS", "DELETE");
    const { id } = await params;
    const record = await findOwned(id, user.tenantId);
    await fs.rm(path.join(process.cwd(), record.filePath), { force: true });
    await db.document.delete({ where: { id } });
    await logActivity(user, "حذف مستنداً", record.name, record.id);
    return ok();
  } catch (e) {
    return fail(e);
  }
}
