import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL("../supabase/migrations/20261106164119_add_product_request_source_price.sql", import.meta.url),
  "utf8",
);
const sql = migration.replace(/\s+/g, " ").toLowerCase();

test("stores optional source product price and currency on product requests", () => {
  assert.match(sql, /add column "productprice" numeric\(12,2\)/);
  assert.match(sql, /add column "productcurrency" text/);
});

test("requires price and currency to be provided together and validates both", () => {
  assert.match(sql, /"productprice" is null and "productcurrency" is null/);
  assert.match(sql, /"productprice" >= 0/);
  assert.match(sql, /"productcurrency" in \('usd', 'eur'\)/);
});
