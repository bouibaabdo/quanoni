// قائمة إكمال ملف المكتب — 7 بنود للمعرفات القانونية المغربية
export type OnboardingTenant = {
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  ice?: string | null;
  ifNumber?: string | null;
  rcNumber?: string | null;
  cnssNumber?: string | null;
  tpNumber?: string | null;
};

export type OnboardingItem = { key: string; label: string; done: boolean };

export function onboardingItems(t: OnboardingTenant): OnboardingItem[] {
  return [
    { key: "location", label: "المدينة والعنوان", done: !!(t.city && t.address) },
    { key: "contact", label: "الهاتف والبريد الإلكتروني", done: !!(t.phone && t.email) },
    { key: "ice", label: "التعريف الموحد للمقاولة (ICE)", done: !!t.ice },
    { key: "if", label: "الرقم التعريفي الضريبي (IF)", done: !!t.ifNumber },
    { key: "rc", label: "السجل التجاري (RC)", done: !!t.rcNumber },
    { key: "cnss", label: "الانتماء للضمان الاجتماعي (CNSS)", done: !!t.cnssNumber },
    { key: "tp", label: "الضريبة المهنية / الباتنت (TP)", done: !!t.tpNumber },
  ];
}

export function onboardingProgress(t: OnboardingTenant) {
  const items = onboardingItems(t);
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}
