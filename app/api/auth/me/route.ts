import { ok, fail } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const { passwordHash: _p, ...rest } = user;
    return ok(rest);
  } catch (e) {
    return fail(e);
  }
}
