import { ok, fail } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return ok();
  } catch (e) {
    return fail(e);
  }
}
