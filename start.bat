@echo off
chcp 65001 >nul
title Qanoni - منصة إدارة مكاتب المحاماة
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo يتطلب تشغيل المنصة تثبيت Node.js من https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo تثبيت الاعتمادات... أول مرة فقط قد يستغرق دقائق
  call npm install --no-audit --no-fund
)

call npx prisma db push
if not exist prisma\dev.db call npm run db:seed

echo.
echo ✓ التشغيل جارٍ... افتح المتصفح على: http://localhost:3000
echo   حساب تجريبي: admin@demo.ma / Demo@1234
echo   لإيقاف المنصة: أغلق هذه النافذة
start http://localhost:3311
call npm run dev
