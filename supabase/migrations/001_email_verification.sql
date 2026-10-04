create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_verifications_email_idx
  on public.email_verifications (email, created_at desc);

-- No policies on purpose: only the server (service role) can read/write.
alter table public.email_verifications enable row level security;
