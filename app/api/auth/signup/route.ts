import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { issueAndSendCode, normEmail, validEmail } from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body.email);
  const password = String(body.password ?? "");
  if (!validEmail(email)) return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "كلمة المرور يجب ألا تقل عن 8 أحرف" }, { status: 400 });

  const db = supabaseAdmin();
  // Account is created UNVERIFIED (email_confirm false) until the code is entered.
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: false });
  if (error || !data.user) {
    const exists = /already|registered|exists/i.test(error?.message ?? "");
    return NextResponse.json(
      { error: exists ? "هذا البريد مسجل مسبقاً. سجّل الدخول أو أعد إرسال الرمز." : error?.message ?? "تعذر إنشاء الحساب" },
      { status: exists ? 409 : 400 }
    );
  }

  try {
    const messageId = await issueAndSendCode(data.user.id, email);
    return NextResponse.json({ ok: true, messageId });
  } catch (e: any) {
    await db.auth.admin.deleteUser(data.user.id); // let the user retry cleanly
    console.error("[signup] email failed:", e.message);
    return NextResponse.json({ error: "تعذر إرسال البريد الإلكتروني", detail: e.message }, { status: 502 });
  }
}
