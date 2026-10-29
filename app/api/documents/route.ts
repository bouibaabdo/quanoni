import { db } from "@/lib/db";
import { createId } from "@/lib/db-helpers";
import { ok, fail, ApiError } from "@/lib/api";
import { requireUser, requirePerm, logActivity } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;

export async function GET() {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "DOCUMENTS", "VIEW");
    const rows = await db.document.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      include: { case: { select: { id: true, reference: true, title: true } } },
    });
    return ok(rows);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await requirePerm(user.id, user.role, "DOCUMENTS", "CREATE");
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const caseId = (form.get("caseId") as string) || null;
    const name = (form.get("name") as string)?.trim() || file?.name;

    if (!file) throw new ApiError(400, "اختر ملفاً للرفع");
    if (file.size > MAX_SIZE) throw new ApiError(413, "حجم الملف يتجاوز 5 ميغابايت");
    if (caseId) {
      const parent = await db.case.findFirst({ where: { id: caseId, tenantId: user.tenantId } });
      if (!parent) throw new ApiError(404, "الملف غير موجود");
    }

    const ext = path.extname(file.name).slice(0, 10);
    const dir = path.join(process.cwd(), "uploads", user.tenantId);
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${createId()}${ext}`;
    const filePath = path.join("uploads", user.tenantId, fileName);
    await fs.writeFile(path.join(process.cwd(), filePath), Buffer.from(await file.arrayBuffer()));

    const record = await db.document.create({
      data: {
        tenantId: user.tenantId,
        caseId,
        name: name || file.name,
        filePath,
        mimeType: file.type || null,
        size: file.size,
        uploadedBy: user.fullName,
      },
      include: { case: { select: { reference: true } } },
    });
    await logActivity(user, "رفع مستنداً", record.name, record.id);
    return ok(record);
  } catch (e) {
    return fail(e);
  }
}
