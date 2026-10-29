import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "قانوني — منصة إدارة مكاتب المحاماة في المغرب",
    template: "%s | قانوني",
  },
  description:
    "نظام متكامل لإدارة ملفات القضايا والجلسات والموكلين والفوترة والمصاريف، مصمم خصيصاً لمكاتب المحاماة في المغرب.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
