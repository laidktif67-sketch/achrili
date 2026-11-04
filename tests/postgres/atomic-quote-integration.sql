\set ON_ERROR_STOP on

-- Basic success: creates quote and advances request in the same RPC.
insert into public."ProductRequest"(id, status) values ('success-1', 'SUBMITTED');
select * from public.create_quote_atomically('success-1', 'DZD', 100, 20, 5, 0, 125, 'integration test', now() + interval '1 day');
do $$
begin
  if (select status from public."ProductRequest" where id = 'success-1') <> 'QUOTED' then
    raise exception 'request status was not advanced to QUOTED';
  end if;
  if (select count(*) from public."Quote" where "requestId" = 'success-1') <> 1 then
    raise exception 'expected exactly one quote';
  end if;
end $$;

-- Active quote blocks a second quote.
do $$
begin
  begin
    perform * from public.create_quote_atomically('success-1', 'DZD', 100, 20, 5, 0, 125, null, now() + interval '1 day');
    raise exception 'expected active_quote_exists';
  exception when unique_violation then
    if sqlerrm not like '%active_quote_exists%' then raise; end if;
  end;
end $$;

-- Expired draft permits requoting.
insert into public."ProductRequest"(id, status) values ('expired-1', 'QUOTED');
insert into public."Quote"(id, "requestId", currency, "productCost", "shippingCost", "serviceFee", "customsEstimate", total, "expiresAt", status)
values ('old-expired', 'expired-1', 'DZD', 100, 20, 5, 0, 125, now() - interval '1 day', 'DRAFT');
select * from public.create_quote_atomically('expired-1', 'DZD', 110, 20, 5, 0, 135, null, null);
do $$
begin
  if (select count(*) from public."Quote" where "requestId" = 'expired-1') <> 2 then
    raise exception 'expected a replacement quote after expiry';
  end if;
end $$;

-- Rejected quote permits requoting.
insert into public."ProductRequest"(id, status) values ('rejected-1', 'QUOTED');
insert into public."Quote"(id, "requestId", currency, "productCost", "shippingCost", "serviceFee", "customsEstimate", total, status)
values ('old-rejected', 'rejected-1', 'DZD', 100, 20, 5, 0, 125, 'REJECTED');
select * from public.create_quote_atomically('rejected-1', 'EUR', 10, 2, 1, 0, 13, null, null);

-- Invalid input and non-quotable request must fail without inserting a quote.
insert into public."ProductRequest"(id, status) values ('invalid-1', 'SUBMITTED'), ('blocked-1', 'CANCELLED');
do $$
begin
  begin
    perform * from public.create_quote_atomically('invalid-1', 'GBP', 1, 1, 1, 0, 3, null, null);
    raise exception 'expected unsupported_currency';
  exception when sqlstate '22023' then
    if sqlerrm <> 'unsupported_currency' then raise; end if;
  end;
  begin
    perform * from public.create_quote_atomically('blocked-1', 'DZD', 1, 1, 1, 0, 3, null, null);
    raise exception 'expected request_not_quotable';
  exception when check_violation then
    if sqlerrm <> 'request_not_quotable' then raise; end if;
  end;
  begin
    perform * from public.create_quote_atomically('invalid-1', 'DZD', -1, 1, 1, 0, 1, null, null);
    raise exception 'expected invalid_quote_amount';
  exception when sqlstate '22023' then
    if sqlerrm <> 'invalid_quote_amount' then raise; end if;
  end;
  if (select count(*) from public."Quote" where "requestId" in ('invalid-1', 'blocked-1')) <> 0 then
    raise exception 'failed RPC left a quote behind';
  end if;
end $$;

-- Sending an active draft succeeds through the atomic send RPC.
insert into public."ProductRequest"(id, status) values ('send-active-1', 'SUBMITTED');
do $test$
declare
  v_quote_id text;
  v_status public."QuoteStatus";
begin
  select id into v_quote_id
  from public.create_quote_atomically('send-active-1', 'DZD', 100, 20, 5, 0, 125, null, now() + interval '1 day');
  select status into v_status from public.send_quote_atomically(v_quote_id);
  if v_status <> 'SENT' then
    raise exception 'active draft did not transition to SENT';
  end if;
end $test$;

-- Expired drafts cannot be sent, even if the caller's earlier check was stale.
insert into public."ProductRequest"(id, status) values ('send-expired-1', 'QUOTED');
insert into public."Quote"(id, "requestId", currency, "productCost", "shippingCost", "serviceFee", "customsEstimate", total, "expiresAt", status)
values ('expired-send-1', 'send-expired-1', 'DZD', 100, 20, 5, 0, 125, now() - interval '1 second', 'DRAFT');
do $test$
begin
  begin
    perform * from public.send_quote_atomically('expired-send-1');
    raise exception 'expected quote_not_sendable';
  exception when check_violation then
    if sqlerrm <> 'quote_not_sendable' then raise; end if;
  end;
  if (select status from public."Quote" where id = 'expired-send-1') <> 'DRAFT' then
    raise exception 'expired draft status changed unexpectedly';
  end if;
  begin
    perform * from public.send_quote_atomically('missing-send-1');
    raise exception 'expected quote_not_found';
  exception when no_data_found then
    if sqlerrm <> 'quote_not_found' then raise; end if;
  end;
end $test$;

-- Confirm RPC execute privilege is restricted to service_role.
do $$
begin
  if has_function_privilege('anon', 'public.create_quote_atomically(text,text,numeric,numeric,numeric,numeric,numeric,text,timestamp with time zone)', 'EXECUTE') then
    raise exception 'anon unexpectedly has execute privilege';
  end if;
  if has_function_privilege('authenticated', 'public.create_quote_atomically(text,text,numeric,numeric,numeric,numeric,numeric,text,timestamp with time zone)', 'EXECUTE') then
    raise exception 'authenticated unexpectedly has execute privilege';
  end if;
  if not has_function_privilege('service_role', 'public.create_quote_atomically(text,text,numeric,numeric,numeric,numeric,numeric,text,timestamp with time zone)', 'EXECUTE') then
    raise exception 'service_role lacks execute privilege';
  end if;
  if has_function_privilege('anon', 'public.send_quote_atomically(text)', 'EXECUTE') then
    raise exception 'anon unexpectedly has send RPC execute privilege';
  end if;
  if has_function_privilege('authenticated', 'public.send_quote_atomically(text)', 'EXECUTE') then
    raise exception 'authenticated unexpectedly has send RPC execute privilege';
  end if;
  if not has_function_privilege('service_role', 'public.send_quote_atomically(text)', 'EXECUTE') then
    raise exception 'service_role lacks send RPC execute privilege';
  end if;
end $$;

select 'atomic quote PostgreSQL integration tests passed' as result;
