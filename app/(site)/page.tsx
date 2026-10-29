import Link from "next/link";
import {
  Scale, FolderKanban, CalendarClock, Users, FileText, Receipt,
  Bell, Wallet, ShieldCheck, ArrowLeft, Check,
} from "lucide-react";
import { PLANS } from "@/lib/plans-data";

const FEATURES = [
  { icon: FolderKanban, title: "إدارة الملفات والقضايا", desc: "سجّل كل ملف بنوعه (مدني، جنائي، تجاري، شغل…) ومحكمته وحالته وأتعابه، مع مرجع تلقائي وتتبع كامل." },
  { icon: CalendarClock, title: "تقويم الجلسات", desc: "تقويم شهري بالجلسات والمواعيد القادمة، مع تمييز المؤجلة والمنعقدة، حتى لا تفوتك جلسة أبداً." },
  { icon: Users, title: "ملفات الموكلين", desc: "بطاقة كاملة لكل موكل (شخص أو شركة) مع CIN / ICE، وكل ملفاته وفواتيره في صفحة واحدة." },
  { icon: Receipt, title: "الفوترة والمدفوعات", desc: "فواتير بأتعابكم مع TVA 20%، حساب تلقائي للمدفوع والمتبقي، وطباعة فاتورة رسمية بالتفقيط." },
  { icon: Wallet, title: "المصاريف القضائية", desc: "رسوم، طوابع، محضر قضائي، خبير، تنقلات — ربطها بالملف ومعرفة ما يُسترجع من الموكل." },
  { icon: FileText, title: "أرشيف المستندات", desc: "ارفع كل وثيقة واربطها بالملف: مقالات، أحكام، سندات — متاحة لأي عضو في المكتب." },
  { icon: Bell, title: "تنبيهات ذكية", desc: "إشعارات تلقائية للجلسات القادمة، الفواتير المتأخرة، والمهام المستحقة." },
  { icon: ShieldCheck, title: "أدوار وصلاحيات", desc: "مدير، محامٍ، مساعد، محاسب — كل واحد يرى ما يخصه فقط، وبيانات كل مكتب معزولة تماماً." },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-950 to-brand-800 text-white">
        <div className="container-page py-20 text-center md:py-28">
          <span className="badge border border-white/20 bg-white/10 text-brand-100">صُنع خصيصاً للمحامين في المغرب 🇲🇦</span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            مكتب محاماتك بأكمله…<br />
            <span className="text-gold-400">في منصة واحدة</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-brand-100">
            الملفات والقضايا، تقويم الجلسات، الموكلون، الفواتير والمصاريف — منظمة تلقائياً، بالعربية، ومن هاتفك أو حاسوبك.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn h-12 bg-gold-500 px-8 text-base text-brand-950 hover:bg-gold-400">
              جرّب مجاناً 14 يوماً <ArrowLeft size={18} />
            </Link>
            <Link href="/pricing" className="btn h-12 border border-white/30 px-8 text-base text-white hover:bg-white/10">
              اطّلع على الأسعار
            </Link>
          </div>
          <p className="mt-4 text-sm text-brand-200">دون بطاقة بنكية — إلغاء في أي وقت</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl">كل ما يحتاجه مكتبك، لا أكثر ولا أقل</h2>
          <p className="mt-4 text-stone-500">صممنا المنصة مع محامين مغاربة لتغطي العمل اليومي الحقيقي للمكتب.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <f.icon size={22} />
              </span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-stone-50 py-20">
        <div className="container-page">
          <h2 className="text-center text-3xl">ابدأ في أقل من 5 دقائق</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["أنشئ حساب مكتبك", "سجّل باسم المكتب وبريدك — تحصل على مساحة خاصة بك فوراً."],
              ["أضف موكليك وملفاتك", "أدخل الملفات الجارية والجلسات القادمة في دقائق."],
              ["ودّع الأوراق المتناثرة", "تقويم، تنبيهات، فواتير، تقارير — كل شيء يشتغل تلقائياً."],
            ].map(([t, d], i) => (
              <div key={i} className="card p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 font-display text-xl font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 font-bold">{t}</h3>
                <p className="mt-2 text-sm text-stone-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl">أسعار واضحة، بدون مفاجآت</h2>
          <p className="mt-4 text-stone-500">خطط شهرية تناسب المكاتب الفردية والكبرى على حد سواء.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`card p-8 ${p.id === "pro" ? "ring-2 ring-brand-600" : ""}`}>
              {p.id === "pro" && <span className="badge mb-3 bg-brand-700 text-white">الأكثر اختياراً</span>}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-black">{p.priceMonthly}</span>
                <span className="text-stone-500">د.م. / شهرياً</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-stone-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={16} className="text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`mt-8 w-full ${p.id === "pro" ? "btn-primary" : "btn-outline"}`}>
                ابدأ الآن
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-stone-50 py-20">
        <div className="container-page max-w-3xl">
          <h2 className="text-center text-3xl">أسئلة شائعة</h2>
          <div className="mt-10 space-y-4">
            {[
              ["هل بيانات مكتبي محمية؟", "نعم — كل مكتب له مساحة معزولة تماماً عن غيره، والوصول محمي بكلمة مرور وأدوار صلاحيات دقيقة."],
              ["هل تعمل المنصة بالعربية؟", "نعم، المنصة مصممة أولاً بالعربية وبواجهة من اليمين إلى اليسار، مع الفلوس بالدرهم و TVA المغربية."],
              ["هل يمكنني تجربتها قبل الشراء؟", "بالطبع — 14 يوماً كاملة بكل المميزات ودون بطاقة بنكية."],
              ["هل تطبع الفواتير رسمياً؟", "نعم — فاتورة رسمية بترقيم تلقائي و TVA ومبلغ مفقّط بالحروف، جاهزة للطباعة PDF."],
            ].map(([q, a]) => (
              <details key={q} className="card group p-5">
                <summary className="cursor-pointer list-none font-semibold text-stone-800 marker:hidden">
                  {q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-stone-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-950 py-16 text-center text-white">
        <div className="container-page">
          <Scale size={36} className="mx-auto text-gold-400" />
          <h2 className="mt-4 text-3xl">جاهز لتنظيم مكتبك؟</h2>
          <p className="mt-3 text-brand-100">انضم إلى المحامين الذين يديرون مكاتبهم بذكاء.</p>
          <Link href="/register" className="btn mt-6 h-12 bg-gold-500 px-8 text-base text-brand-950 hover:bg-gold-400">
            ابدأ تجربتك المجانية
          </Link>
        </div>
      </section>
    </main>
  );
}
