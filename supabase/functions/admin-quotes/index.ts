import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { calculateQuoteAmounts } from "./quote-domain.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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
    const { data: rows, error } = await admin.from("ProductRequest")
      .select("id,productUrl,productName,variant,quantity,notes,destination,status,createdAt")
      .eq("status", "SUBMITTED").order("createdAt", { ascending: true }).limit(100);
    if (error) return json(500, { error: "Could not load submitted requests" });
    return json(200, { requests: rows ?? [] });
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

    const { data: requestRow, error: requestError } = await admin
      .from("ProductRequest").select("id,status").eq("id", requestId).maybeSingle();
    if (requestError) return json(500, { error: "Could not verify product request" });
    if (!requestRow) return json(404, { error: "Product request not found" });
    if (requestRow.status !== "SUBMITTED") {
      return json(409, { error: "A quote can only be created for a SUBMITTED request" });
    }

    // Service fee is always sourced from protected pricing settings, never from client input.
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
      const { serviceFee, total } = amounts;

      const { data: quote, error: insertError } = await admin.from("Quote").insert({
        requestId, currency, productCost, shippingCost, serviceFee, customsEstimate,
        total, notes, expiresAt, status: "DRAFT",
      }).select("id,requestId,currency,productCost,shippingCost,serviceFee,customsEstimate,total,notes,expiresAt,status,createdAt").single();
      if (insertError) return json(500, { error: "Could not create quote" });
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
