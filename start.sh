#!/usr/bin/env bash
# تشغيل المشروع محلياً بأمان — يصلح تلقائياً أي ملف تالف/منقوص.
set -e
cd "$(dirname "$0")"

echo "■ قانوني — تشغيل آمن"

# 1) التأكد من Node
if ! command -v node >/dev/null 2>&1; then
  echo "✘ يتطلب تثبيت Node.js من https://nodejs.org ثم إعادة التشغيل."
  exit 1
fi

# 2) إصلاح package.json إن استُبدل/تلف (يصلح أي مسح خارجي)
if ! grep -q '"next"' package.json 2>/dev/null; then
  echo "  ↻ إصلاح package.json..."
  cat > package.json << 'EOF'
{
  "name": "qanoni",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^6.16.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.9.6",
    "lucide-react": "^0.460.0",
    "next": "^15.5.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "sonner": "^1.7.4",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "prisma": "^6.16.0",
    "tailwindcss": "^4.1.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}
EOF
  echo "  ✓ أُصلح"
fi

# 3) تثبيت الاعتمادات إن نُقصت
if [ ! -d node_modules ] || [ ! -f node_modules/.bin/next ]; then
  echo "  ↻ تثبيت الاعتمادات (أول مرة قد تستغرق دقائق)..."
  npm install --no-audit --no-fund
fi

# 4) إنشاء قاعدة البيانات والبيانات التجريبية عند غيابها
npx prisma db push >/dev/null 2>&1 || echo "  ⚠ تعذر دفع المخطط — تحقق من DATABASE_URL"
if [ ! -f prisma/dev.db ] || [ "$(find prisma -name 'dev.db' -mmin +1 | wc -l)" -gt 0 ]; then
  # seed فقط إن كانت فارغة (لا تمحو بيانات المستخدم)
  if ! npx tsx -e "import('@prisma/client').then(async m=>{const d=new m.PrismaClient();const u=await d.user.count();console.log(u);await d.\$disconnect()})" 2>/dev/null | grep -qE '^[1-9]'; then
    echo "  ↻ ملء البيانات التجريبية..."
    npm run db:seed >/dev/null 2>&1 || echo "  ⚠ فشل seed (غير حاسم)"
  fi
fi

echo "✓ جاهز — افتح: http://localhost:3000  (حساب: admin@demo.ma / Demo@1234)"
if command -v start >/dev/null 2>&1; then start "http://localhost:3000" >/dev/null 2>&1 || true; fi
exec npm run dev