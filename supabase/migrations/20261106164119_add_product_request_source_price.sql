alter table public."ProductRequest"
  add column "productPrice" numeric(12,2),
  add column "productCurrency" text,
  add constraint "ProductRequest_product_price_currency_check"
    check (
      ("productPrice" is null and "productCurrency" is null)
      or
      ("productPrice" >= 0 and "productCurrency" in ('USD', 'EUR'))
    );
