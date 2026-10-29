#!/usr/bin/env bash
# إعداد الإنتاج على PostgreSQL + النشر على Vercel — خطوة واحدة بعد تهيئة المتغيرات.
set -e
cd "$(dirname "$0")"

echo "■ قانوني — الإعداد للإنتاج (PostgreSQL)"
echo "  المتطلبات: رابط قاعدة Postgres في متغير DATABASE_URL و AUTH_SECRET."
echo "  أنشئ قاعدة مجانية على: https://neon.tech  ثم ضع الرابط في Vercel Settings → Environment Variables."

# 1) التحقق من وجود المتغير
if [ -z "${DATABASE_URL:-}" ] && ! grep -q 'postgres' .env 2>/dev/null; then
  echo "✘ لم يُعثر على DATABASE_URL من نوع PostgreSQL."
  echo "  إما:  export DATABASE_URL=\"postgresql://...\"   أو اكتبه في ملف .env"
  exit 1
fi

# 2) ضمان نسخة احتياطية كاملة للمخطط قبل أي تبديل
if [ ! -f prisma/schema.prisma.bak ]; then
  cp prisma/schema.prisma prisma/schema.prisma.bak
  echo "  ↻ نسخة احتياطية: prisma/schema.prisma.bak"
fi

echo "  ↻ تركيب مخطط PostgreSQL (من النسخة الاحتياطية الكاملة)..."

# نبني schema بروفاً: تبديل مزود sqlite → postgresql في النسخة الاحتياطية الكاملة
mkdir -p prisma
cp prisma/schema.prisma.bak prisma/schema.prisma
if command -v sed >/dev/null 2>&1; then
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
else
  echo "  ⚠ sed غير متاح — عدّل provider يدوياً إلى postgresql في prisma/schema.prisma"
fi

# 3) إنشاء الجداول على Postgres
echo "  ↻ إنشاء الجداول على Postgres..."
npx prisma db push

# 4) ملء البيانات التجريبية (اختياري — أزل السطر إن أردت قاعدة فارغة)
echo "  ↻ ملء البيانات التجريبية (اختياري)..."
npm run db:seed || echo "  ⚠ seed فشل — قاعدة فارغة جاهزة للاستخدام مباشرة"

# 5) تعليمات النشر
echo ""
echo "✓ أُعدّ كل شيء. للنشر على Vercel:"
echo "  1) في لوحة Vercel: Settings → Environment Variables → أضف DATABASE_URL و AUTH_SECRET"
echo "  2) أعد النشر (Redeploy) من المشروع quanoni"
echo ""
echo "  للإرجاع إلى SQLite محلياً: mv prisma/schema.prisma.bak prisma/schema.prisma"