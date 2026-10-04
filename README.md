# DEAL — Real email verification (6-digit code)

Flow: signup → account created **unverified** → real 6-digit code generated → **real email via Resend** → user enters code → server verifies → account confirmed → login.
The code is stored only as an HMAC hash, expires in 10 minutes, max 5 attempts. If Resend rejects the email, the API returns an error (never a fake "sent").

## Setup
1. **Supabase** → SQL Editor → run `supabase/migrations/001_email_verification.sql`.
   Auth → Providers → Email: keep **Confirm email = ON**.
2. **Resend** (resend.com) → Domains → add `deal.sa`, add the DNS records shown, wait for "Verified". Then API Keys → create a key.
   (Testing before the domain is verified: `EMAIL_FROM=onboarding@resend.dev` only delivers to your own Resend account email.)
3. **Vercel** → Project → Settings → Environment Variables: add everything in `.env.example`.
4. Deploy, then open `/api/health` — `ready` must be `true`.
5. Test with a brand-new email.

Change the sender later by editing `EMAIL_FROM` only.
