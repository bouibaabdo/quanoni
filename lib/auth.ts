import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { ApiError } from "./api";
import { can, roleCan, type ModuleKey, type Action, type PermissionRow } from "./permissions";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "qanoni-dev-secret"
);
const COOKIE = "qanoni_session";

export type SessionPayload = {
  uid: string;
  tid: string;
  role: string;
  name: string;
};

export async function hashPassword(p: string) {
  return bcrypt.hash(p, 10);
}
export async function verifyPassword(p: string, h: string) {
  return bcrypt.compare(p, h);
}

export async function createSession(u: SessionPayload) {
  const token = await new SignJWT({ ...u })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const c = (await cookies()).get(COOKIE);
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c.value, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const s = await getSessionUser();
  if (!s) throw new ApiError(401, "الجلسة منتهية، يرجى تسجيل الدخول من جديد");
  const user = await db.user.findUnique({
    where: { id: s.uid },
    include: { tenant: { include: { plan: true, settings: true } } },
  });
  if (!user || !user.isActive)
    throw new ApiError(401, "الحساب موقوف أو غير موجود");
  return user;
}

export function requireRole(
  user: { role: string },
  roles: string[],
  message = "ليس لديك صلاحية للقيام بهذا الإجراء"
) {
  if (!roles.includes(user.role)) throw new ApiError(403, message);
}

export async function logActivity(
  user: { id: string; fullName: string; tenantId: string },
  action: string,
  entity: string,
  entityId?: string,
  meta?: string
) {
  await db.activity.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      userName: user.fullName,
      action,
      entity,
      entityId,
      meta,
    },
  });
}

// تحميل أذونات مستخدم من قاعدة البيانات مع خلفية دوره
export async function loadPermissions(userId: string, role: string): Promise<PermissionRow> {
  const perms = await db.userPermission.findMany({ where: { userId } });
  const overrides: Record<string, Record<string, boolean>> = {};
  for (const p of perms) {
    if (!overrides[p.module]) overrides[p.module] = {};
    overrides[p.module][p.action] = p.allowed;
  }
  return { userId, role, overrides };
}

// فحص صرامة للواجهات: إن لم تكن الصلاحية ممنوحة -> ApiError 403
export async function requirePerm(
  userId: string,
  role: string,
  module: ModuleKey,
  action: Action,
  message = "ليس لديك صلاحية لهذا الإجراء في هذه الوحدة"
) {
  // المدير صاحب كل شيء تلقائياً
  if (role === "ADMIN") return;
  const row = await loadPermissions(userId, role);
  if (!can(row, module, action)) throw new ApiError(403, message);
}

// فحص اسمي للقوائم/الواجهة (يعيد boolean، لا يرمي)
export async function userCan(
  userId: string,
  role: string,
  module: ModuleKey,
  action: Action
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const row = await loadPermissions(userId, role);
  return can(row, module, action);
}
