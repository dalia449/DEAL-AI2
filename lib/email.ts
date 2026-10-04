// Real email delivery through the Resend REST API (server only).
// Throws unless Resend actually accepts the message and returns an id.
export async function sendVerificationEmail(to: string, code: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email provider not configured: set RESEND_API_KEY and EMAIL_FROM");

  const html = `
  <div style="font-family:Arial,sans-serif;background:#d4cdc4;padding:32px;text-align:center">
    <div style="max-width:420px;margin:auto;background:#fff;padding:32px;border-radius:12px">
      <h2 style="letter-spacing:6px;color:#4a3f35;margin:0 0 4px">DEAL</h2>
      <p style="color:#7a6e63;font-size:12px;margin:0 0 24px">Design · Engineering · Architecture · Living</p>
      <p style="color:#333">رمز التحقق الخاص بك / Your verification code</p>
      <div style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#4a3f35;margin:16px 0">${code}</div>
      <p style="color:#888;font-size:13px">صالح لمدة 10 دقائق / Valid for 10 minutes.<br/>إذا لم تطلب هذا الرمز تجاهل الرسالة.</p>
    </div>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to],
      subject: `${code} هو رمز التحقق الخاص بك في DEAL`,
      html,
      text: `Your DEAL verification code is ${code}. It expires in 10 minutes.`,
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.id) {
    throw new Error(`Resend rejected the email (${res.status}): ${data?.message || JSON.stringify(data)}`);
  }
  return data.id as string;
}
