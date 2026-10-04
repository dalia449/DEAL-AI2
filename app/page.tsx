"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function call(path: string, body: object) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

export default function Home() {
  const [step, setStep] = useState<"signup" | "verify" | "done">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function signup() {
    setBusy(true); setMsg("");
    const { ok, data } = await call("/api/auth/signup", { email, password });
    setBusy(false);
    if (!ok) return setMsg(data.error + (data.detail ? ` — ${data.detail}` : ""));
    setStep("verify"); setMsg("تم إرسال الرمز إلى بريدك فعلياً.");
  }
  async function verify() {
    setBusy(true); setMsg("");
    const v = await call("/api/auth/verify", { email, code });
    if (!v.ok) { setBusy(false); return setMsg(v.data.error); }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    setStep("done");
  }
  async function resend() {
    const { ok, data } = await call("/api/auth/resend", { email });
    setMsg(ok ? "تمت محاولة إعادة الإرسال." : data.error);
  }

  const input = { width: "100%", padding: 12, margin: "6px 0", borderRadius: 8, border: "1px solid #a89f94", boxSizing: "border-box" as const, fontSize: 16 };
  const btn = { width: "100%", padding: 12, marginTop: 10, borderRadius: 8, border: 0, background: "#4a3f35", color: "#fff", fontSize: 16 };

  return (
    <main style={{ maxWidth: 380, margin: "60px auto", padding: 24, background: "#f5f2ee", borderRadius: 14 }}>
      <h1 style={{ textAlign: "center", letterSpacing: 8, fontWeight: 300 }}>DEAL</h1>
      {step === "signup" && (<>
        <input style={input} type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        <input style={input} type="password" placeholder="كلمة المرور (8 أحرف على الأقل)" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
        <button style={btn} disabled={busy} onClick={signup}>إنشاء حساب</button>
      </>)}
      {step === "verify" && (<>
        <p>أدخل الرمز المكوّن من 6 أرقام المرسل إلى {email}</p>
        <input style={{ ...input, letterSpacing: 8, textAlign: "center" }} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} dir="ltr" />
        <button style={btn} disabled={busy || code.length !== 6} onClick={verify}>تحقق</button>
        <button style={{ ...btn, background: "transparent", color: "#4a3f35" }} onClick={resend}>إعادة إرسال الرمز</button>
      </>)}
      {step === "done" && <p style={{ textAlign: "center" }}>✓ تم التحقق من حسابك وتسجيل دخولك.</p>}
      {msg && <p style={{ color: "#8a3b2f", fontSize: 14 }}>{msg}</p>}
    </main>
  );
}
