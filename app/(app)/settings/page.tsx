import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { userCan, requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/forms/settings-form";
import { planOf } from "@/lib/plans-data";
import { Card } from "@/components/ui";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const user = await requireUser();
  if (!(await userCan(user.id, user.role, "SETTINGS", "VIEW"))) redirect("/dashboard");

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    include: { settings: true, plan: true },
  });
  if (!tenant) redirect("/login");

  const plan = planOf(tenant.planId);
  const trialDays = tenant.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="إعدادات المكتب" sub="بيانات المكتب كما ستظهر في الفواتير الرسمية" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <SettingsForm
            tenant={{
              name: tenant.name, phone: tenant.phone, email: tenant.email,
              address: tenant.address, city: tenant.city, ice: tenant.ice,
              ifNumber: tenant.ifNumber, rcNumber: tenant.rcNumber,
              cnssNumber: tenant.cnssNumber, tpNumber: tenant.tpNumber,
              settings: tenant.settings
                ? {
                    invoicePrefix: tenant.settings.invoicePrefix,
                    invoiceLanguage: tenant.settings.invoiceLanguage,
                    tvaRate: tenant.settings.tvaRate,
                    reminderDays: tenant.settings.reminderDays,
                    footerNote: tenant.settings.footerNote,
                  }
                : null,
            }}
          />
        </Card>

        <Card className="h-fit p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-gold-500" />
            <h3 className="font-display font-bold">الاشتراك</h3>
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold text-brand-800">{plan.name}</p>
          <p className="text-sm text-stone-500">
            {plan.priceMonthly === 0 ? "مجانية" : `${plan.priceMonthly} د.م. / شهرياً`}
          </p>
          {trialDays !== null && trialDays > 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-center text-sm text-amber-800">
              الفترة التجريبية: متبقي {trialDays} يوماً
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            {plan.features.map((f) => <li key={f}>• {f}</li>)}
          </ul>
          <p className="mt-5 rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-500">
            للترقية أو التجديد تواصل معنا: <b dir="ltr">contact@qanoni.ma</b> — الدفع عبر تحويل بنكي أو بطاقة (قريباً).
          </p>
        </Card>
      </div>
    </div>
  );
}
