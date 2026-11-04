-- Atomically create one quote and move its request to QUOTED.
-- Only the trusted Edge Function service role may execute this RPC.
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
  if p_expires_at is not null and p_expires_at <= now() then
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
  if v_request.status <> 'SUBMITTED' then
    raise exception using errcode = '23514', message = 'request_not_submitted';
  end if;

  if exists (
    select 1
    from public."Quote" q
    where q."requestId" = p_request_id
      and (
        q.status in ('DRAFT', 'ACCEPTED')
        or (q.status = 'SENT' and (q."expiresAt" is null or q."expiresAt" > now()))
      )
  ) then
    raise exception using errcode = '23505', message = 'active_quote_exists';
  end if;

  insert into public."Quote" (
    "requestId", currency, "productCost", "shippingCost", "serviceFee",
    "customsEstimate", total, notes, "expiresAt", status
  ) values (
    p_request_id, p_currency, p_product_cost, p_shipping_cost, p_service_fee,
    p_customs_estimate, p_total, p_notes, p_expires_at, 'DRAFT'
  ) returning * into v_quote;

  update public."ProductRequest"
  set status = 'QUOTED', "updatedAt" = now()
  where id = p_request_id;

  return next v_quote;
end;
$$;

revoke all on function public.create_quote_atomically(text, text, numeric, numeric, numeric, numeric, numeric, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_quote_atomically(text, text, numeric, numeric, numeric, numeric, numeric, text, timestamptz) to service_role;
