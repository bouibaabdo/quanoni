import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans-data";

export const metadata = { title: "الأسعار" };

export default function PricingPage() {
  return (
    <main className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl">خطط تناسب كل مكتب</h1>
        <p className="mt-4 text-stone-500">
          ابدأ مجاناً، ورقِّ عندما يكبر مكتبك. كل الخطط تشمل 14 يوماً تجريبية بكل المميزات.
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`card flex flex-col p-8 ${p.id === "pro" ? "ring-2 ring-brand-600" : ""}`}>
            {p.id === "pro" && <span className="badge mb-3 w-fit bg-brand-700 text-white">الأكثر اختياراً</span>}
            <h2 className="font-display text-xl font-bold">{p.name}</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-5xl font-black">{p.priceMonthly}</span>
              <span className="text-stone-500">د.م. / شهرياً</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-600">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check size={16} className="shrink-0 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className={`mt-8 w-full ${p.id === "pro" ? "btn-primary" : "btn-outline"}`}>
              {p.priceMonthly === 0 ? "ابدأ مجاناً" : "اشترك الآن"}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-stone-400">
        الأسعار دون ضريبة على القيمة المضافة. للترقية أو الدفع السنوي تواصل معنا: contact@qanoni.ma
      </p>
    </main>
  );
}
