export type Dict = Record<string, { label: string; badge?: string }>;

export const CASE_STATUS: Dict = {
  NEW: { label: "جديد", badge: "bg-stone-100 text-stone-700" },
  IN_PROGRESS: { label: "قيد المرافعة", badge: "bg-blue-50 text-blue-700" },
  SUSPENDED: { label: "معلق", badge: "bg-amber-50 text-amber-700" },
  WON: { label: "مكسوب", badge: "bg-emerald-50 text-emerald-700" },
  LOST: { label: "خاسر", badge: "bg-red-50 text-red-700" },
  CLOSED: { label: "مغلق", badge: "bg-stone-100 text-stone-500" },
};

export const CASE_TYPES: Dict = {
  CIVIL: { label: "مدني" },
  CRIMINAL: { label: "جنائي" },
  COMMERCIAL: { label: "تجاري" },
  ADMINISTRATIVE: { label: "إداري" },
  FAMILY: { label: "أسري" },
  LABOR: { label: "شغل" },
  REAL_ESTATE: { label: "عقاري" },
  OTHER: { label: "أخرى" },
};

export const CASE_STATUS_OPEN = ["NEW", "IN_PROGRESS", "SUSPENDED"];

export const HEARING_STATUS: Dict = {
  SCHEDULED: { label: "منتظرة", badge: "bg-brand-50 text-brand-700" },
  POSTPONED: { label: "مؤجلة", badge: "bg-amber-50 text-amber-700" },
  HELD: { label: "منعقدة", badge: "bg-stone-100 text-stone-600" },
  CANCELLED: { label: "ملغاة", badge: "bg-red-50 text-red-600" },
};

export const TASK_STATUS: Dict = {
  TODO: { label: "قيد الانتظار", badge: "bg-stone-100 text-stone-700" },
  IN_PROGRESS: { label: "قيد التنفيذ", badge: "bg-blue-50 text-blue-700" },
  DONE: { label: "مكتملة", badge: "bg-emerald-50 text-emerald-700" },
};

export const PRIORITY: Dict = {
  LOW: { label: "منخفضة", badge: "bg-stone-100 text-stone-600" },
  MEDIUM: { label: "متوسطة", badge: "bg-amber-50 text-amber-700" },
  HIGH: { label: "عالية", badge: "bg-red-50 text-red-700" },
};

export const INVOICE_STATUS: Dict = {
  DRAFT: { label: "مسودة", badge: "bg-stone-100 text-stone-600" },
  SENT: { label: "مرسلة", badge: "bg-brand-50 text-brand-700" },
  PARTIAL: { label: "مدفوعة جزئياً", badge: "bg-blue-50 text-blue-700" },
  PAID: { label: "مدفوعة", badge: "bg-emerald-50 text-emerald-700" },
  OVERDUE: { label: "متأخرة", badge: "bg-red-50 text-red-700" },
  CANCELLED: { label: "ملغاة", badge: "bg-stone-100 text-stone-400" },
};

export const PAYMENT_METHOD: Dict = {
  CASH: { label: "نقداً" },
  CHECK: { label: "شيك" },
  TRANSFER: { label: "تحويل بنكي" },
  CARD: { label: "بطاقة" },
};

export const EXPENSE_CATEGORY: Dict = {
  COURT_FEES: { label: "رسوم قضائية" },
  BAILIFF: { label: "محضر قضائي" },
  EXPERT: { label: "خبير" },
  TRAVEL: { label: "تنقلات" },
  TRANSLATION: { label: "ترجمة" },
  STAMPS: { label: "طوابع" },
  OTHER: { label: "أخرى" },
};

export const ROLES: Dict = {
  ADMIN: { label: "مدير" },
  LAWYER: { label: "محامٍ" },
  ASSISTANT: { label: "مساعد" },
  ACCOUNTANT: { label: "محاسب" },
};

export const CLIENT_KIND: Dict = {
  INDIVIDUAL: { label: "شخص ذاتي" },
  COMPANY: { label: "شركة" },
};

export const COURTS = [
  "المحكمة الابتدائية",
  "المحكمة الإدارية",
  "المحكمة التجارية",
  "محكمة الاستئناف",
  "المحكمة العليا (محكمة النقض)",
  "المحكمة العمالية",
  "محكمة الأسرة",
];

export function dictLabel(d: Dict, k?: string | null) {
  return k ? d[k]?.label ?? k : "—";
}

export function badgeClass(d: Dict, k?: string | null) {
  return k ? d[k]?.badge ?? "bg-stone-100 text-stone-700" : "";
}
