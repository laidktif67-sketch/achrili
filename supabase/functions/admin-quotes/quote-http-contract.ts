export interface HttpErrorResponse {
  status: number;
  body: { error: string };
}

/** Translate database RPC failures into a stable, non-sensitive HTTP contract. */
export function mapCreateQuoteError(
  code: string | null | undefined,
  message: string | null | undefined,
): HttpErrorResponse {
  if (
    code === "23505" || code === "23514" ||
    message?.includes("active_quote_exists") ||
    message?.includes("request_not_quotable")
  ) {
    return {
      status: 409,
      body: { error: "Request changed or an active quote already exists; reload and try again" },
    };
  }
  if (code === "P0002") {
    return { status: 404, body: { error: "Product request not found" } };
  }
  if (code === "22023") {
    return { status: 400, body: { error: "Invalid quote details" } };
  }
  return { status: 500, body: { error: "Could not create quote" } };
}

/** Translate atomic send RPC failures without leaking database details. */
export function mapSendQuoteError(
  code: string | null | undefined,
  message: string | null | undefined,
): HttpErrorResponse {
  if (code === "P0002" || message?.includes("quote_not_found")) {
    return { status: 404, body: { error: "Quote not found" } };
  }
  if (code === "23514" || message?.includes("quote_not_sendable")) {
    return { status: 409, body: { error: "Only a non-expired draft quote can be sent" } };
  }
  if (code === "22023") {
    return { status: 400, body: { error: "Valid quoteId is required" } };
  }
  return { status: 500, body: { error: "Could not send quote" } };
}
