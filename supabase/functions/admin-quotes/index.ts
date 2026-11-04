import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { calculateQuoteAmounts, isQuoteActive } from "./quote-domain.js";

function makeCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

Deno.serve(async (req) => {
  const configuredOrigin = Deno.env.get("APP_ALLOWED_ORIGIN");
  const requestOrigin = req.headers.get("Origin");
  const allowedOrigin = configuredOrigin && requestOrigin === configuredOrigin ? requestOrigin : null;
  const headers = makeCorsHeaders(allowedOrigin);
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers });

  if (!configuredOrigin) return json(500, { error: "APP_ALLOWED_ORIGIN is not configured" });
  if (requestOrigin && !allowedOrigin) return json(403, { error: "Origin is not allowed" });
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "Server configuration is incomplete" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(401, { error: "Authentication required" });
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return json(401, { error: "Authentication required" });

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: "Invalid session" });

  // Only trusted app_metadata is accepted; user_metadata is user-editable.
  if (authData.user.app_metadata?.role !== "admin") {
    return json(403, { error: "Administrator access required" });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json(400, { error: "A JSON object is required" });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.action === "list_submitted_requests") {
    // Scan past blocked requests so the first 100 active-quote rows cannot hide later quotable requests.
    const quotableRequests: Record<string, unknown>[] = [];
    const batchSize = 100;
    let offset = 0;

    while (quotableRequests.length < 100) {
      const { data: rows, error } = await admin.from("ProductRequest")
        .select("id,productUrl,productName,variant,quantity,notes,destination,status,createdAt")
        .in("status", ["SUBMITTED", "QUOTED"])
        .order("createdAt", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + batchSize - 1);
      if (error) return json(500, { error: "Could not load quotable requests" });

      const candidates = rows ?? [];
      if (candidates.length === 0) break;
      const { data: quotes, error: quotesError } = await admin.from("Quote")
        .select("requestId,status,expiresAt")
        .in("requestId", candidates.map((row) => row.id))
        .in("status", ["DRAFT", "SENT", "ACCEPTED"]);
      if (quotesError || !quotes) return json(500, { error: "Could not verify active quotes" });

      const activeRequestIds = new Set(quotes.filter((quote) => isQuoteActive(quote)).map((quote) => quote.requestId));
      quotableRequests.push(...candidates.filter((request) => !activeRequestIds.has(request.id)));
      if (candidates.length < batchSize) break;
      offset += batchSize;
    }

    return json(200, { requests: quotableRequests.slice(0, 100) });
  }

  if (body.action === "create_quote") {
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "";
    const productCost = body.productCost;
    const shippingCost = body.shippingCost;
    const customsEstimate = body.customsEstimate === undefined || body.customsEstimate === null
      ? 0
      : body.customsEstimate;
    const notes = body.notes === undefined || body.notes === null ? null : body.notes;
    const expiresAt = body.expiresAt === undefined || body.expiresAt === null ? null : body.expiresAt;

    if (!requestId || requestId.length > 200) return json(400, { error: "Valid requestId is required" });
    if (!["USD", "EUR", "DZD"].includes(currency)) return json(400, { error: "currency must be USD, EUR, or DZD" });
    if (!finiteNonNegative(productCost) || !finiteNonNegative(shippingCost) ||
        !finiteNonNegative(customsEstimate)) {
      return json(400, { error: "Quote amounts must be finite, non-negative numbers" });
    }
    if (typeof notes !== "string" && notes !== null) return json(400, { error: "notes must be a string or null" });
    if (typeof notes === "string" && notes.length > 4000) return json(400, { error: "notes is too long" });
    if (expiresAt !== null && (typeof expiresAt !== "string" || !Number.isFinite(Date.parse(expiresAt)))) {
      return json(400, { error: "expiresAt must be a valid date string or null" });
    }
    if (expiresAt !== null && Date.parse(expiresAt) <= Date.now()) {
      return json(400, { error: "expiresAt must be in the future" });
    }

    // Load protected pricing settings; quote creation and request transition happen atomically in Postgres.
    const { data: settingRows, error: settingsError } = await admin
      .from("AppSetting")
      .select("key,value")
      .in("key", ["service_fee_dzd", "usd_to_dzd_rate", "eur_to_dzd_rate"]);
    if (settingsError || !settingRows) return json(500, { error: "Could not load pricing settings" });
    const settings = new Map(settingRows.map((row) => [row.key, Number(row.value)]));
    const serviceFeeDzd = settings.get("service_fee_dzd");
    try {
      const amounts = calculateQuoteAmounts({
        currency,
        productCost: productCost as number,
        shippingCost: shippingCost as number,
        customsEstimate: customsEstimate as number,
        serviceFeeDzd: serviceFeeDzd as number,
        usdToDzdRate: settings.get("usd_to_dzd_rate") as number,
        eurToDzdRate: settings.get("eur_to_dzd_rate") as number,
      });

      const { data: quoteRows, error: createError } = await admin.rpc("create_quote_atomically", {
        p_request_id: requestId,
        p_currency: currency,
        p_product_cost: productCost,
        p_shipping_cost: shippingCost,
        p_service_fee: amounts.serviceFee,
        p_customs_estimate: customsEstimate,
        p_total: amounts.total,
        p_notes: notes,
        p_expires_at: expiresAt,
      });
      if (createError) {
        if (createError.code === "23505" || createError.code === "23514" ||
            createError.message?.includes("active_quote_exists") ||
            createError.message?.includes("request_not_quotable")) {
          return json(409, { error: "Request changed or an active quote already exists; reload and try again" });
        }
        if (createError.code === "P0002") return json(404, { error: "Product request not found" });
        if (createError.code === "22023") return json(400, { error: "Invalid quote details" });
        return json(500, { error: "Could not create quote" });
      }
      const quote = Array.isArray(quoteRows) ? quoteRows[0] : quoteRows;
      if (!quote) return json(500, { error: "Quote creation returned no result" });
      return json(201, { quote });
    } catch {
      return json(500, { error: "Pricing settings are missing or invalid" });
    }
  }

  if (body.action === "send_quote") {
    const quoteId = typeof body.quoteId === "string" ? body.quoteId.trim() : "";
    if (!quoteId || quoteId.length > 200) return json(400, { error: "Valid quoteId is required" });

    const { data: existing, error: readError } = await admin
      .from("Quote").select("id,status,expiresAt").eq("id", quoteId).maybeSingle();
    if (readError) return json(500, { error: "Could not verify quote" });
    if (!existing) return json(404, { error: "Quote not found" });
    if (existing.status !== "DRAFT") return json(409, { error: "Only draft quotes can be sent" });
    if (existing.expiresAt && Date.parse(existing.expiresAt) <= Date.now()) {
      return json(409, { error: "Cannot send an already expired quote" });
    }

    const { data: quote, error: updateError } = await admin.from("Quote")
      .update({ status: "SENT" }).eq("id", quoteId).eq("status", "DRAFT")
      .select("id,status").maybeSingle();
    if (updateError) return json(500, { error: "Could not send quote" });
    if (!quote) return json(409, { error: "Quote status changed; reload and try again" });
    return json(200, { quote });
  }

  return json(400, { error: "Unsupported action" });
});
