import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { codesMatch, hashCode } from "@/lib/otp";
import { normEmail } from "@/lib/verification";

export const runtime = "nodejs";
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body.email);
  const code = String(body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "أدخل رمزاً من 6 أرقام" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: row } = await db.from("email_verifications").select("*")
    .eq("email", email).is("consumed_at", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!row) return NextResponse.json({ error: "لا يوجد رمز صالح. اطلب رمزاً جديداً." }, { status: 400 });
  if (new Date(row.expires_at) < new Date()) return NextResponse.json({ error: "انتهت صلاحية الرمز" }, { status: 400 });
  if (row.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: "محاولات كثيرة. اطلب رمزاً جديداً." }, { status: 429 });

  await db.from("email_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);
  if (!codesMatch(row.code_hash, hashCode(email, code)))
    return NextResponse.json({ error: "الرمز غير صحيح" }, { status: 400 });

  await db.from("email_verifications").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);
  const { error } = await db.auth.admin.updateUserById(row.user_id, { email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, verified: true });
}
