#!/usr/bin/env node
// حارس package.json — يعمل في الخلفية ويعيد إنشاء الملف الصحيح إن استُبدل/حُذف.
// الاستخدام:  node guard.mjs  (اختياري)  وستكتب تقريرًا إلى guard.log
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));
const target = join(root, "package.json");

const CANONICAL = {
  name: "qanoni", version: "0.1.0", private: true,
  scripts: {
    dev: "next dev", build: "next build", start: "next start",
    "db:push": "prisma db push", "db:seed": "tsx prisma/seed.ts",
  },
  prisma: { seed: "tsx prisma/seed.ts" },
  dependencies: {
    "@prisma/client": "^6.16.0", "bcryptjs": "^2.4.3", "jose": "^5.9.6",
    "lucide-react": "^0.460.0", "next": "^15.5.0", "react": "^19.1.0",
    "react-dom": "^19.1.0", "sonner": "^1.7.4", "zod": "^3.24.0",
  },
  devDependencies: {
    "@tailwindcss/postcss": "^4.1.0", "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.0", "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0", "prisma": "^6.16.0",
    "tailwindcss": "^4.1.0", "tsx": "^4.19.2", "typescript": "^5.6.3",
  },
};

const ok = () => {
  if (!existsSync(target)) return false;
  try {
    const j = JSON.parse(readFileSync(target, "utf8"));
    return j.scripts && j.scripts.build === "next build" && j.dependencies && j.dependencies.next;
  } catch { return false; }
};

// الجولة الأولى فوراً
if (!ok()) {
  writeFileSync(target, JSON.stringify(CANONICAL, null, 2) + "\n");
  console.log(`[guard] أُصلح package.json (${new Date().toISOString()})`);
}

// مراقبة دورية
setInterval(() => {
  if (!ok()) {
    writeFileSync(target, JSON.stringify(CANONICAL, null, 2) + "\n");
    console.log(`[guard] أُصلح package.json (${new Date().toISOString()})`);
  }
}, 10000);

console.log("[guard] يعمل — يراقب package.json كل 10 ثوانٍ. لإيقافه: Ctrl+C");