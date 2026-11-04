import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapCreateQuoteError, mapSendQuoteError } from "./quote-http-contract.ts";

Deno.test("create quote maps duplicate and state conflicts to 409", () => {
  assertEquals(mapCreateQuoteError("23505", "duplicate"), {
    status: 409,
    body: { error: "Request changed or an active quote already exists; reload and try again" },
  });
  assertEquals(mapCreateQuoteError("P0001", "request_not_quotable"), {
    status: 409,
    body: { error: "Request changed or an active quote already exists; reload and try again" },
  });
  assertEquals(mapCreateQuoteError("P0001", "active_quote_exists").status, 409);
});

Deno.test("create quote maps missing requests and invalid input", () => {
  assertEquals(mapCreateQuoteError("P0002", "private database details").status, 404);
  assertEquals(mapCreateQuoteError("22023", "unsupported currency").status, 400);
});

Deno.test("create quote hides unexpected database failures", () => {
  assertEquals(mapCreateQuoteError("XX000", "sensitive SQL detail"), {
    status: 500,
    body: { error: "Could not create quote" },
  });
});

Deno.test("send quote maps missing quotes, invalid state, and invalid arguments", () => {
  assertEquals(mapSendQuoteError("P0002", "quote_not_found").status, 404);
  assertEquals(mapSendQuoteError("23514", "quote_not_sendable").status, 409);
  assertEquals(mapSendQuoteError("22023", "quote_id_required").status, 400);
});

Deno.test("send quote hides unexpected database failures", () => {
  assertEquals(mapSendQuoteError("XX000", "sensitive SQL detail"), {
    status: 500,
    body: { error: "Could not send quote" },
  });
});
