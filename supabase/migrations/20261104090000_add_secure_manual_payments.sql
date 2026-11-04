-- AchriLi manual payment flow. This migration is committed to the development branch only.
-- Apply only to a dedicated development Supabase project after review; do not run on production.
create table if not exists public."PaymentMethod" (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('CCP_TRANSFER', 'USDT_BEP20')),
  "displayName" text not null,
  enabled boolean not null default false,
  "accountHolder" text,
  "accountIdentifier" text,
  "qrImagePath" text,
  network text,
  "walletAddress" text,
  instructions text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint payment_method_enabled_has_details check (
    not enabled or (
      (code = 'CCP_TRANSFER' and nullif(btrim("accountHolder"), '') is not null
       and nullif(btrim("accountIdentifier"), '') is not null)
      or
      (code = 'USDT_BEP20' and network = 'BEP20'
       and "walletAddress" ~* '^0x[a-f0-9]{40}$')
    )
  ),
  constraint payment_method_network_matches_code check (
    (code = 'CCP_TRANSFER' and network is null)
    or (code = 'USDT_BEP20' and network = 'BEP20')
  )
);

create table if not exists public."Payment" (
  id uuid primary key default gen_random_uuid(),
  "customerId" uuid not null references auth.users(id) on delete restrict,
  "requestId" text not null references public."ProductRequest"(id) on delete restrict,
  "quoteId" text not null references public."Quote"(id) on delete restrict,
  "paymentMethodId" uuid not null references public."PaymentMethod"(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null check (currency in ('DZD', 'USD', 'EUR', 'USDT')),
  status text not null default 'PENDING' check (status in ('PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED')),
  "proofPath" text not null,
  "transactionReference" text,
  "reviewNote" text,
  "reviewedBy" uuid references auth.users(id) on delete set null,
  "reviewedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint payment_proof_path_not_empty check (length(btrim("proofPath")) > 0),
  constraint payment_reference_length check ("transactionReference" is null or length("transactionReference") <= 200),
  constraint payment_review_note_length check ("reviewNote" is null or length("reviewNote") <= 2000)
);

create index if not exists payment_customer_created_idx on public."Payment" ("customerId", "createdAt" desc);
create index if not exists payment_quote_idx on public."Payment" ("quoteId", "createdAt" desc);
create index if not exists payment_status_created_idx on public."Payment" (status, "createdAt" desc);

alter table public."PaymentMethod" enable row level security;
alter table public."Payment" enable row level security;

grant select on public."PaymentMethod" to anon, authenticated;
grant update on public."PaymentMethod" to authenticated;
grant select, insert, update on public."Payment" to authenticated;
grant all on public."PaymentMethod" to service_role;
grant all on public."Payment" to service_role;

drop policy if exists "PaymentMethod_read_enabled" on public."PaymentMethod";
create policy "PaymentMethod_read_enabled"
on public."PaymentMethod" for select
to anon, authenticated
using (enabled = true);

drop policy if exists "PaymentMethod_admin_manage" on public."PaymentMethod";
create policy "PaymentMethod_admin_manage"
on public."PaymentMethod" for all
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Payment_customer_read_own" on public."Payment";
create policy "Payment_customer_read_own"
on public."Payment" for select
to authenticated
using ("customerId" = (select auth.uid()));

drop policy if exists "Payment_customer_submit_own" on public."Payment";
create policy "Payment_customer_submit_own"
on public."Payment" for insert
to authenticated
with check (
  "customerId" = (select auth.uid())
  and status = 'PENDING'
  and "reviewedBy" is null
  and "reviewedAt" is null
);

drop policy if exists "Payment_admin_read_all" on public."Payment";
create policy "Payment_admin_read_all"
on public."Payment" for select
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Payment_admin_update" on public."Payment";
create policy "Payment_admin_update"
on public."Payment" for update
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and (
    (status in ('PENDING', 'UNDER_REVIEW') and "reviewedAt" is null and "reviewedBy" is null)
    or
    (status in ('CONFIRMED', 'REJECTED') and "reviewedAt" is not null and "reviewedBy" = (select auth.uid()))
  )
);

create or replace function public.enforce_payment_submission()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  quote_row public."Quote"%rowtype;
  method_row public."PaymentMethod"%rowtype;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'Authentication required' using errcode = '42501';
    end if;

    select q.*
      into quote_row
      from public."Quote" q
      join public."ProductRequest" pr on pr.id = q."requestId"
     where q.id = new."quoteId"
       and pr."customerId" = auth.uid()
       and q.status = 'SENT'
       and (q."expiresAt" is null or q."expiresAt" > now())
     limit 1;

    if not found then
      raise exception 'Quote is unavailable for payment' using errcode = '42501';
    end if;

    select * into method_row
      from public."PaymentMethod"
     where id = new."paymentMethodId" and enabled = true;

    if not found then
      raise exception 'Payment method is unavailable' using errcode = '42501';
    end if;

    if method_row.code = 'USDT_BEP20' then
      if quote_row.currency <> 'USD' then
        raise exception 'USDT payment requires a quote denominated in USD; no DZD/EUR to USDT rate is configured' using errcode = '22023';
      end if;
      new.currency := 'USDT';
    else
      if quote_row.currency <> 'DZD' then
        raise exception 'CCP transfer requires a quote denominated in DZD; no payment conversion rate is configured' using errcode = '22023';
      end if;
      new.currency := 'DZD';
    end if;
    if split_part(new."proofPath", '/', 1) <> auth.uid()::text then
      raise exception 'Proof path must belong to the authenticated customer' using errcode = '42501';
    end if;
    new."customerId" := auth.uid();
    new."requestId" := quote_row."requestId";
    new.amount := quote_row.total;
    new.status := 'PENDING';
    new."reviewedBy" := null;
    new."reviewedAt" := null;
    new."reviewNote" := null;
    new."createdAt" := now();
    new."updatedAt" := now();
    return new;
  end if;

  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'Only an administrator can review payments' using errcode = '42501';
  end if;

  if new.id is distinct from old.id
     or new."customerId" is distinct from old."customerId"
     or new."requestId" is distinct from old."requestId"
     or new."quoteId" is distinct from old."quoteId"
     or new."paymentMethodId" is distinct from old."paymentMethodId"
     or new.amount is distinct from old.amount
     or new.currency is distinct from old.currency
     or new."proofPath" is distinct from old."proofPath"
     or new."transactionReference" is distinct from old."transactionReference"
     or new."createdAt" is distinct from old."createdAt" then
    raise exception 'Payment details are immutable after submission' using errcode = '42501';
  end if;

  if new.status not in ('PENDING', 'UNDER_REVIEW', 'CONFIRMED', 'REJECTED') then
    raise exception 'Invalid payment status';
  end if;
  if old.status in ('CONFIRMED', 'REJECTED') and new.status is distinct from old.status then
    raise exception 'A reviewed terminal payment cannot be reopened or reversed';
  end if;
  if new.status in ('CONFIRMED', 'REJECTED') then
    new."reviewedBy" := auth.uid();
    new."reviewedAt" := now();
  else
    new."reviewedBy" := null;
    new."reviewedAt" := null;
  end if;
  new."updatedAt" := now();
  return new;
end;
$$;

drop trigger if exists enforce_payment_submission_trigger on public."Payment";
create trigger enforce_payment_submission_trigger
before insert or update on public."Payment"
for each row execute function public.enforce_payment_submission();

-- Proofs are private. Customer can upload only to their own UUID folder; no public reads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "Payment proof upload own folder" on storage.objects;
create policy "Payment proof upload own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Payment proof read owner or admin" on storage.objects;
create policy "Payment proof read owner or admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- Seed methods disabled: account holder, CCP/RIP, and wallet address have not been provided.
insert into public."PaymentMethod" (code, "displayName", enabled, network, instructions)
values
  ('CCP_TRANSFER', 'CCP / تحويل بريدي', false, null, 'ستظهر بيانات التحويل بعد أن يضبطها المدير.'),
  ('USDT_BEP20', 'USDT (BEP20)', false, 'BEP20', 'تحقق من الشبكة والعنوان قبل الإرسال؛ لا ترسل عبر شبكة أخرى.')
on conflict (code) do nothing;
