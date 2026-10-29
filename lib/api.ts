import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown = null) {
  return NextResponse.json({ ok: true, data });
}

export function fail(e: unknown) {
  if (e instanceof ApiError)
    return NextResponse.json({ ok: false, error: e.message }, { status: e.status });
  if (e instanceof ZodError) {
    const msg = e.errors[0]?.message || "بيانات غير صالحة";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json(
    { ok: false, error: "حدث خطأ غير متوقع" },
    { status: 500 }
  );
}
