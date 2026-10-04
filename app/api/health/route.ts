import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Open /api/health after deploying: shows which variables are missing (never their values).
export async function GET() {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "EMAIL_FROM", "OTP_SECRET"];
  const status = Object.fromEntries(names.map((n) => [n, Boolean(process.env[n])]));
  return NextResponse.json({ ready: Object.values(status).every(Boolean), status });
}
