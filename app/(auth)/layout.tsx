import Link from "next/link";
import { Scale } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-950 to-brand-800 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <Scale size={22} />
          </span>
          <span className="font-display text-2xl font-extrabold">قانوني</span>
        </Link>
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
