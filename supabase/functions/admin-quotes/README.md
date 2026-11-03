# Admin quote Edge Function

This function is source-only until it has been reviewed and tested in a non-production environment. It has **not** been deployed by this change.

## Authorization contract

- A caller must have a valid Supabase Auth access token.
- Authorization checks only the trusted JWT `app_metadata.role === "admin"`. It deliberately ignores `user_metadata`.
- Before deploying, provision the intended administrator through a trusted server-side Admin API process and set `app_metadata.role = "admin"`. Never let a browser client set this claim.
- The function uses `SUPABASE_SERVICE_ROLE_KEY` only in server runtime environment variables. Never put this key in frontend code, Git, logs, or client-visible settings.

## Actions

POST JSON to the function:
- `{"action":"create_quote","requestId":"…","currency":"USD","productCost":12.5,"shippingCost":0,"customsEstimate":0,"notes":"…","expiresAt":"2026-12-01T00:00:00Z"}`
- `{"action":"send_quote","quoteId":"…"}`

The service fee is not accepted from the caller. It is read from `AppSetting.service_fee_dzd` and converted into the quote currency using the configured USD/EUR-to-DZD rates. All quote line items are expected to use the same currency.

Creating a quote only accepts requests currently in `SUBMITTED` and creates a `DRAFT` quote. Sending only permits a non-expired `DRAFT` quote to transition to `SENT`. The conditional update guards against concurrent status changes.

## Before deployment

1. Confirm the actual deployed schema, enum values, and timestamp column names match the function's queries.
2. Add automated tests for unauthorized users, malformed payloads, invalid/missing pricing settings, quote arithmetic, request state checks, expiry, and concurrent status changes.
3. Run the function locally against a disposable Supabase project with test users and test data.
4. Configure CORS to the real application origin(s) instead of `*` before production use.
5. Decide how the admin claim is provisioned and audited; do not enable admin access until this process is in place.
6. Connect the admin UI only after the above checks pass.

No production function deployment, secret configuration, database policy change, or administrator provisioning is performed by this source addition.
