import { supabaseAdmin } from "./supabase-admin";
import { generateCode, hashCode } from "./otp";
import { sendVerificationEmail } from "./email";

export const CODE_TTL_MIN = 10;

// Creates a fresh code, stores only its hash, then sends the real email.
// If sending fails, the stored code is removed and the error is thrown.
export async function issueAndSendCode(userId: string, email: string): Promise<string> {
  const db = supabaseAdmin();
  await db.from("email_verifications").update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId).is("consumed_at", null);

  const code = generateCode();
  const { data, error } = await db.from("email_verifications").insert({
    user_id: userId, email,
    code_hash: hashCode(email, code),
    expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
  }).select("id").single();
  if (error) throw new Error(`DB error: ${error.message}`);

  try {
    return await sendVerificationEmail(email, code); // provider message id
  } catch (e) {
    await db.from("email_verifications").delete().eq("id", data.id);
    throw e;
  }
}

export const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
