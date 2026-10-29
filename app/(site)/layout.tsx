import Link from "next/link";
import { Scale } from "lucide-react";
import { PLANS } from "@/lib/plans-data";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900 text-white">
              <Scale size={20} />
            </span>
            <span className="font-display text-xl font-extrabold text-brand-900">قانوني</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
            <a href="/#features" className="hover:text-brand-700">المميزات</a>
            <Link href="/pricing" className="hover:text-brand-700">الأسعار</Link>
            <a href="/#faq" className="hover:text-brand-700">أسئلة شائعة</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">دخول</Link>
            <Link href="/register" className="btn-primary">ابدأ مجاناً</Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="container-page grid gap-8 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-white">
                <Scale size={16} />
              </span>
              <span className="font-display text-lg font-extrabold text-brand-900">قانوني</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              منصة مغربية لإدارة مكاتب المحاماة: الملفات، الجلسات، الموكلون، الفوترة — في مكان واحد، بالعربية.
            </p>
          </div>
          <div className="text-sm">
            <h4 className="mb-3 font-semibold text-stone-700">المنصة</h4>
            <ul className="space-y-2 text-stone-500">
              <li><a href="/#features" className="hover:text-brand-700">المميزات</a></li>
              <li><Link href="/pricing" className="hover:text-brand-700">الأسعار والخطط</Link></li>
              <li><Link href="/register" className="hover:text-brand-700">تجربة مجانية 14 يوماً</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <h4 className="mb-3 font-semibold text-stone-700">تواصل معنا</h4>
            <ul className="space-y-2 text-stone-500">
              <li>contact@qanoni.ma</li>
              <li>+212 6 00 00 00 00</li>
              <li>الدار البيضاء، المغرب</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-200 py-4 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} قانوني — صُنع في المغرب 🇲🇦 — تجربة مجانية {PLANS.length > 0 ? "14" : "14"} يوماً دون بطاقة بنكية
        </div>
      </footer>
    </div>
  );
}
