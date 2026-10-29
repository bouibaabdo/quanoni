// الخطط — مصدر واحد تستخدمه صفحة التسعير و seed وحدود الاستخدام
export type PlanDef = {
  id: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxCases: number;
  features: string[];
};

export const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "الأساسية",
    priceMonthly: 0,
    maxUsers: 2,
    maxCases: 25,
    features: [
      "مستخدمان (2)",
      "حتى 25 ملفاً",
      "إدارة الموكلين والملفات",
      "تقويم الجلسات",
      "المهام والتنبيهات",
    ],
  },
  {
    id: "pro",
    name: "الاحترافية",
    priceMonthly: 499,
    maxUsers: 6,
    maxCases: 300,
    features: [
      "حتى 6 مستخدمين",
      "حتى 300 ملف",
      "الفوترة وإدارة المدفوعات (TVA)",
      "المصاريف القضائية",
      "المستندات وأرشيف الملفات",
      "تقارير وإحصائيات",
      "دعم ذو أولوية",
    ],
  },
  {
    id: "firm",
    name: "المكاتب الكبرى",
    priceMonthly: 1299,
    maxUsers: 1000,
    maxCases: 1000000,
    features: [
      "مستخدمون غير محدودين",
      "ملفات غير محدودة",
      "كل مميزات الخطة الاحترافية",
      "إعدادات مخصصة للفاتورة",
      "مساعد مخصص للإعداد",
      "اتفاقية مستوى خدمة (SLA)",
    ],
  },
];

export function planOf(id?: string | null): PlanDef {
  return PLANS.find((p) => p.id === id) ?? PLANS[2];
}
