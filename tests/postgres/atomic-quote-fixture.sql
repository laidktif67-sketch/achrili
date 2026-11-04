-- Minimal PostgreSQL fixture matching the columns/types used by atomic_quote_workflow.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;

create type public."RequestStatus" as enum (
  'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'QUOTED',
  'REJECTED', 'ACCEPTED', 'CANCELLED', 'PURCHASED', 'SHIPPED', 'DELIVERED'
);
create type public."QuoteStatus" as enum ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

create table public."ProductRequest" (
  id text primary key,
  status public."RequestStatus" not null default 'SUBMITTED',
  "updatedAt" timestamptz not null default now()
);
create table public."Quote" (
  id text primary key,
  "requestId" text not null references public."ProductRequest"(id),
  currency text not null default 'DZD',
  "productCost" numeric not null,
  "shippingCost" numeric not null,
  "serviceFee" numeric not null,
  "customsEstimate" numeric,
  total numeric not null,
  notes text,
  "expiresAt" timestamptz,
  status public."QuoteStatus" not null default 'DRAFT',
  "createdAt" timestamptz not null default now()
);
