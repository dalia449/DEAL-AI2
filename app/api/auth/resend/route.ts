import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { issueAndSendCode, normEmail, validEmail } from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body.email);
  if (!validEmail(email)) return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: last } = await db.from("email_verifications").select("user_id, created_at")
    .eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (last) {
    if (Date.now() - new Date(last.created_at).getTime() < 60_000)
      return NextResponse.json({ error: "انتظر دقيقة قبل إعادة الإرسال" }, { status: 429 });
    const { data: u } = await db.auth.admin.getUserById(last.user_id);
    if (u?.user && !u.user.email_confirmed_at) {
      try {
        const messageId = await issueAndSendCode(last.user_id, email);
        return NextResponse.json({ ok: true, messageId });
      } catch (e: any) {
        console.error("[resend] email failed:", e.message);
        return NextResponse.json({ error: "تعذر إرسال البريد الإلكتروني", detail: e.message }, { status: 502 });
      }
    }
  }
  // Same response either way: don't reveal which emails are registered.
  return NextResponse.json({ ok: true });
}
