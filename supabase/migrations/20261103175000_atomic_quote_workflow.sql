-- Atomically create one quote and move its request to QUOTED.
-- Only the trusted Edge Function service role may execute these RPCs.
create or replace function public.create_quote_atomically(
  p_request_id text,
  p_currency text,
  p_product_cost numeric,
  p_shipping_cost numeric,
  p_service_fee numeric,
  p_customs_estimate numeric,
  p_total numeric,
  p_notes text default null,
  p_expires_at timestamptz default null
)
returns setof public."Quote"
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public."ProductRequest"%rowtype;
  v_quote public."Quote"%rowtype;
begin
  if p_request_id is null or length(btrim(p_request_id)) = 0 then
    raise exception using errcode = '22023', message = 'request_id_required';
  end if;
  if p_currency is null or p_currency not in ('USD', 'EUR', 'DZD') then
    raise exception using errcode = '22023', message = 'unsupported_currency';
  end if;
  if p_product_cost is null or p_product_cost < 0
     or p_shipping_cost is null or p_shipping_cost < 0
     or p_service_fee is null or p_service_fee < 0
     or p_customs_estimate is null or p_customs_estimate < 0
     or p_total is null or p_total < 0 then
    raise exception using errcode = '22023', message = 'invalid_quote_amount';
  end if;
  if p_notes is not null and length(p_notes) > 4000 then
    raise exception using errcode = '22023', message = 'notes_too_long';
  end if;
  if p_expires_at is not null and p_expires_at <= clock_timestamp() then
    raise exception using errcode = '22023', message = 'quote_expiry_must_be_future';
  end if;

  -- Serialize all quote creation attempts for this request.
  select * into v_request
  from public."ProductRequest"
  where id = p_request_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'product_request_not_found';
  end if;
  -- A lock wait may have consumed the remaining lifetime of the requested quote.
  if p_expires_at is not null and p_expires_at <= clock_timestamp() then
    raise exception using errcode = '22023', message = 'quote_expiry_must_be_future';
  end if;
  -- QUOTED requests may be quoted again only after their previous quote is no longer active.
  if v_request.status not in ('SUBMITTED', 'QUOTED') then
    raise exception using errcode = '23514', message = 'request_not_quotable';
  end if;

  if exists (
    select 1
    from public."Quote" q
    where q."requestId" = p_request_id
      and (
        q.status = 'ACCEPTED'
        or (q.status = 'DRAFT' and (q."expiresAt" is null or q."expiresAt" > clock_timestamp()))
        or (q.status = 'SENT' and (q."expiresAt" is null or q."expiresAt" > clock_timestamp()))
      )
  ) then
    raise exception using errcode = '23505', message = 'active_quote_exists';
  end if;

  -- Quote.id is required text without a database default in the current schema.
  insert into public."Quote" (
    id, "requestId", currency, "productCost", "shippingCost", "serviceFee",
    "customsEstimate", total, notes, "expiresAt", status
  ) values (
    pg_catalog.gen_random_uuid()::text, p_request_id, p_currency, p_product_cost, p_shipping_cost, p_service_fee,
    p_customs_estimate, p_total, p_notes, p_expires_at, 'DRAFT'
  ) returning * into v_quote;

  update public."ProductRequest"
  set status = 'QUOTED', "updatedAt" = now()
  where id = p_request_id;

  return next v_quote;
end;
$$;

-- Check expiry inside PostgreSQL at the moment of the status update, not only
-- in the Edge Function before the network round-trip.
create or replace function public.send_quote_atomically(
  p_quote_id text
)
returns setof public."Quote"
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public."Quote"%rowtype;
begin
  if p_quote_id is null or length(btrim(p_quote_id)) = 0 then
    raise exception using errcode = '22023', message = 'quote_id_required';
  end if;

  update public."Quote"
  set status = 'SENT'
  where id = p_quote_id
    and status = 'DRAFT'
    and ("expiresAt" is null or "expiresAt" > clock_timestamp())
  returning * into v_quote;

  if found then
    return next v_quote;
    return;
  end if;

  if not exists (select 1 from public."Quote" where id = p_quote_id) then
    raise exception using errcode = 'P0002', message = 'quote_not_found';
  end if;

  raise exception using errcode = '23514', message = 'quote_not_sendable';
end;
$$;

revoke all on function public.create_quote_atomically(text, text, numeric, numeric, numeric, numeric, numeric, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_quote_atomically(text, text, numeric, numeric, numeric, numeric, numeric, text, timestamptz) to service_role;

revoke all on function public.send_quote_atomically(text) from public, anon, authenticated;
grant execute on function public.send_quote_atomically(text) to service_role;
