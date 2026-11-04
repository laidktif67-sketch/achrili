import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261103175000_atomic_quote_workflow.sql", import.meta.url),
  "utf8",
);
const sql = migration.replace(/\s+/g, " ").toLowerCase();

test("quote RPC is SECURITY DEFINER with an empty search_path", () => {
  assert.match(sql, /security definer set search_path = ''/);
});

test("quote RPC is executable only by service_role", () => {
  assert.match(sql, /revoke all on function public\.create_quote_atomically\([^;]+ from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.create_quote_atomically\([^;]+ to service_role/);
});

test("locks the request row before checking quote eligibility", () => {
  const lockAt = sql.indexOf('from public."productrequest" where id = p_request_id for update');
  const eligibilityAt = sql.indexOf("if v_request.status not in ('submitted', 'quoted')");
  const activeQuoteAt = sql.indexOf('from public."quote" q');
  assert.notEqual(lockAt, -1, "request row must be locked FOR UPDATE");
  assert.ok(eligibilityAt > lockAt, "status must be checked after acquiring the row lock");
  assert.ok(activeQuoteAt > eligibilityAt, "active quote check must follow request eligibility");
});

test("blocks accepted quotes and unexpired or non-expiring draft/sent quotes", () => {
  assert.match(sql, /q\.status = 'accepted'/);
  assert.match(sql, /q\.status = 'draft' and \(q\."expiresat" is null or q\."expiresat" > now\(\)\)/);
  assert.match(sql, /q\.status = 'sent' and \(q\."expiresat" is null or q\."expiresat" > now\(\)\)/);
});

test("creates a required text Quote.id and updates request status in the same RPC", () => {
  assert.match(sql, /insert into public\."quote" \( id, "requestid", currency/);
  assert.match(sql, /pg_catalog\.gen_random_uuid\(\)::text/);
  assert.match(sql, /update public\."productrequest" set status = 'quoted', "updatedat" = now\(\) where id = p_request_id/);
  assert.match(sql, /return next v_quote/);
});

test("rejects invalid currency, amounts, notes, and expired quote expiry", () => {
  assert.match(sql, /p_currency is null or p_currency not in \('usd', 'eur', 'dzd'\)/);
  assert.match(sql, /message = 'invalid_quote_amount'/);
  assert.match(sql, /length\(p_notes\) > 4000/);
  assert.match(sql, /p_expires_at <= now\(\)/);
});

test("send RPC checks expiry atomically and is restricted to service_role", () => {
  assert.match(sql, /create or replace function public\.send_quote_atomically\( p_quote_id text\)/);
  assert.match(sql, /and status = 'draft' and \("expiresat" is null or "expiresat" > now\(\)\)/);
  assert.match(sql, /message = 'quote_not_sendable'/);
  assert.match(sql, /revoke all on function public\.send_quote_atomically\(text\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.send_quote_atomically\(text\) to service_role/);
});
