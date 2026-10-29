"use client";

import { useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";

export function PrintButton() {
  const [downloadMode] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("dl")
  );

  useEffect(() => {
    if (!downloadMode) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
    // في وضع التنزيل نفتح حوار الطباعة فوراً بعد أن تظهر الوثيقة
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, [downloadMode]);

  return (
    <div className="no-print fixed bottom-6 start-6">
      {downloadMode ? (
        <p className="card mb-2 max-w-xs bg-amber-50 p-3 text-xs text-amber-800 shadow-lg">
          💾 في نافذة الطباعة اختر <b>«حفظ كـ PDF»</b> (وجهة الحفظ) ثم احفظ — تُنزَّل الفاتورة كملف PDF جاهز للورق.
        </p>
      ) : null}
      <button className="btn-primary shadow-lg" onClick={() => window.print()}>
        {downloadMode ? <Download size={16} /> : <Printer size={16} />}
        {downloadMode ? "تنزيل PDF" : "طباعة / حفظ PDF"}
      </button>
    </div>
  );
}
