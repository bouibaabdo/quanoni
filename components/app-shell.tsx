"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, CalendarClock, Users, ListTodo,
  Receipt, Wallet, FileText, UsersRound, Settings, Scale, Menu, X,
  LogOut, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { NotificationsBell } from "./notifications-bell";
import { OnboardingWizard, type OnboardingState } from "./onboarding-wizard";

const NAV = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, module: "DASHBOARD" },
  { href: "/cases", label: "الملفات والقضايا", icon: FolderKanban, module: "CASES" },
  { href: "/hearings", label: "الجلسات والتقويم", icon: CalendarClock, module: "HEARINGS" },
  { href: "/clients", label: "الموكلون", icon: Users, module: "CLIENTS" },
  { href: "/tasks", label: "المهام", icon: ListTodo, module: "TASKS" },
  { href: "/invoices", label: "الفواتير", icon: Receipt, module: "INVOICES" },
  { href: "/expenses", label: "المصاريف", icon: Wallet, module: "EXPENSES" },
  { href: "/documents", label: "المستندات", icon: FileText, module: "DOCUMENTS" },
  { href: "/team", label: "الفريق", icon: UsersRound, module: "TEAM" },
  { href: "/settings", label: "الإعدادات", icon: Settings, module: "SETTINGS" },
];

export function AppShell({
  user,
  tenant,
  trialDaysLeft,
  onboarding,
  allowedModules,
  children,
}: {
  user: { name: string; role: string };
  tenant: { name: string; planName: string };
  trialDaysLeft: number | null;
  onboarding: OnboardingState;
  allowedModules: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const nav = NAV.filter((n) => allowedModules.includes(n.module));
  const current = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  async function logout() {
    try {
      await api("/api/auth/logout", "POST");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("تعذر تسجيل الخروج");
    }
  }

  const sidebar = (
    <div className="flex h-full w-64 flex-col bg-brand-950 text-white">
      <Link href="/dashboard" className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Scale size={20} />
        </span>
        <div>
          <p className="font-display text-lg font-extrabold leading-5">قانوني</p>
          <p className="truncate text-[11px] text-brand-300">{tenant.name}</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((n) => {
          const active = current?.href === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/5"
              }`}
            >
              <n.icon size={18} className={active ? "text-gold-400" : ""} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-brand-200">
        <p>
          الخطة: <span className="font-bold text-white">{tenant.planName}</span>
        </p>
        {trialDaysLeft !== null && trialDaysLeft >= 0 && (
          <p className="mt-1">
            الفترة التجريبية: <span className="text-gold-400">{trialDaysLeft} يوماً متبقياً</span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden lg:block">{sidebar}</aside>
      {/* Sidebar mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 start-0">{sidebar}</div>
        </div>
      )}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="btn-ghost rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(true)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="font-display font-bold text-stone-800">{current?.label ?? "قانوني"}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationsBell />
            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="btn-ghost flex items-center gap-2 rounded-lg px-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                  {user.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                </span>
                <span className="hidden text-sm sm:block">{user.name}</span>
                <ChevronDown size={14} />
              </button>
              {userMenu && (
                <div className="card absolute end-0 top-12 z-50 w-44 p-2 shadow-lg">
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} /> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {trialDaysLeft !== null && trialDaysLeft >= 0 && trialDaysLeft <= 7 && (
          <div className="bg-amber-50 px-6 py-2.5 text-center text-sm text-amber-800">
            ⏳ الفترة التجريبية تنتهي بعد <b>{trialDaysLeft}</b> يوماً — للتفعيل تواصل معنا عبر contact@qanoni.ma
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <OnboardingWizard state={onboarding} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
