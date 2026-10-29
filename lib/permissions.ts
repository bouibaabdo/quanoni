// نظام الصلاحيات المركزي
// كل وحدة لها أذونات (VIEW/CREATE/EDIT/DELETE)
// الدور يعطي خلفية افتراضية، ثم أذونات مخصصة لكل عضو تتفوّق عليها (تسمح أو تمنع).

export type ModuleKey =
  | "DASHBOARD" | "CASES" | "HEARINGS" | "CLIENTS" | "TASKS"
  | "INVOICES" | "EXPENSES" | "DOCUMENTS" | "TEAM" | "SETTINGS";

export type Action = "VIEW" | "CREATE" | "EDIT" | "DELETE";

export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: "DASHBOARD", label: "لوحة التحكم" },
  { key: "CASES", label: "الملفات والقضايا" },
  { key: "HEARINGS", label: "الجلسات والتقويم" },
  { key: "CLIENTS", label: "الموكلون" },
  { key: "TASKS", label: "المهام" },
  { key: "INVOICES", label: "الفواتير والمدفوعات" },
  { key: "EXPENSES", label: "المصاريف القضائية" },
  { key: "DOCUMENTS", label: "المستندات" },
  { key: "TEAM", label: "الفريق والصلاحيات" },
  { key: "SETTINGS", label: "الإعدادات والفوترة" },
];

export const ACTIONS: { key: Action; label: string }[] = [
  { key: "VIEW", label: "عرض" },
  { key: "CREATE", label: "إنشاء" },
  { key: "EDIT", label: "تعديل" },
  { key: "DELETE", label: "حذف" },
];

// خلفية الأذونات الافتراضية لكل دور
const ROLE_DEFAULTS: Record<string, Partial<Record<ModuleKey, Action[]>>> = {
  ADMIN: {
    DASHBOARD: ["VIEW", "CREATE", "EDIT", "DELETE"],
    CASES: ["VIEW", "CREATE", "EDIT", "DELETE"],
    HEARINGS: ["VIEW", "CREATE", "EDIT", "DELETE"],
    CLIENTS: ["VIEW", "CREATE", "EDIT", "DELETE"],
    TASKS: ["VIEW", "CREATE", "EDIT", "DELETE"],
    INVOICES: ["VIEW", "CREATE", "EDIT", "DELETE"],
    EXPENSES: ["VIEW", "CREATE", "EDIT", "DELETE"],
    DOCUMENTS: ["VIEW", "CREATE", "EDIT", "DELETE"],
    TEAM: ["VIEW", "CREATE", "EDIT", "DELETE"],
    SETTINGS: ["VIEW", "EDIT"],
  },
  LAWYER: {
    DASHBOARD: ["VIEW"],
    CASES: ["VIEW", "CREATE", "EDIT"],
    HEARINGS: ["VIEW", "CREATE", "EDIT"],
    CLIENTS: ["VIEW", "CREATE", "EDIT"],
    TASKS: ["VIEW", "CREATE", "EDIT", "DELETE"],
    DOCUMENTS: ["VIEW", "CREATE", "DELETE"],
  },
  ASSISTANT: {
    DASHBOARD: ["VIEW"],
    CASES: ["VIEW", "CREATE", "EDIT"],
    HEARINGS: ["VIEW", "CREATE", "EDIT"],
    CLIENTS: ["VIEW", "CREATE", "EDIT"],
    TASKS: ["VIEW", "CREATE", "EDIT"],
    DOCUMENTS: ["VIEW", "CREATE"],
  },
  ACCOUNTANT: {
    DASHBOARD: ["VIEW"],
    CASES: ["VIEW"],
    HEARINGS: ["VIEW"],
    CLIENTS: ["VIEW"],
    TASKS: ["VIEW", "EDIT"],
    INVOICES: ["VIEW", "CREATE", "EDIT"],
    EXPENSES: ["VIEW", "CREATE", "EDIT"],
    DOCUMENTS: ["VIEW"],
  },
};

export function roleCan(role: string, module: ModuleKey, action: Action): boolean {
  return ROLE_DEFAULTS[role]?.[module]?.includes(action) ?? false;
}

export function isModuleAllowedForRole(role: string, module: ModuleKey): boolean {
  return !!ROLE_DEFAULTS[role]?.[module];
}

export type PermissionRow = {
  userId: string;
  role: string;
  overrides: Record<string, Record<string, boolean>>;
};

// التقييم النهائي: خلفية الدور، ثم تتغلّب التجاوزات المخصصة
export function can(
  perm: PermissionRow,
  module: ModuleKey,
  action: Action
): boolean {
  const override = perm.overrides[module]?.[action];
  if (override !== undefined) return override;
  return roleCan(perm.role, module, action);
}