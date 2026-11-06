import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { calculateQuoteAmounts, isQuoteActive } from "./quote-domain.js";
import { mapCreateQuoteError, mapSendQuoteError } from "./quote-http-contract.ts";

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
        .select("id,customerId,productUrl,productName,productPrice,productCurrency,variant,quantity,notes,destination,status,createdAt")
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

    const requestsWithContact = await Promise.all(quotableRequests.slice(0, 100).map(async (request) => {
      const customerId = typeof request.customerId === "string" ? request.customerId : "";
      let customerPhone: string | null = null;
      if (customerId) {
        const { data: customerResult } = await admin.auth.admin.getUserById(customerId);
        const rawPhone = customerResult.user?.user_metadata?.phone;
        if (typeof rawPhone === "string" && rawPhone.trim()) customerPhone = rawPhone.trim();
      }
      let shop = "متجر غير معروف";
      try {
        const hostname = new URL(String(request.productUrl)).hostname.toLowerCase().replace(/\.$/, "");
        const shops: Record<string, string> = {
          "temu.com": "Temu",
          "aliexpress.com": "AliExpress",
          "alibaba.com": "Alibaba",
          "amazon.com": "Amazon",
          "amazon.co.uk": "Amazon",
          "amazon.fr": "Amazon",
          "amazon.de": "Amazon",
          "amazon.it": "Amazon",
          "amazon.es": "Amazon",
          "amazon.ca": "Amazon",
          "amazon.ae": "Amazon",
          "amazon.sa": "Amazon",
          "amazon.com.tr": "Amazon",
          "amazon.co.jp": "Amazon",
          "amazon.com.mx": "Amazon",
          "amazon.in": "Amazon",
          "amazon.nl": "Amazon",
          "amazon.com.au": "Amazon",
          "amazon.sg": "Amazon",
          "amazon.com.br": "Amazon",
          "amazon.pl": "Amazon",
          "amazon.se": "Amazon",
          "amazon.eg": "Amazon",
          "shein.com": "SHEIN",
          "ebay.com": "eBay",
          "ebay.co.uk": "eBay",
          "ebay.fr": "eBay",
          "ebay.de": "eBay",
          "ebay.it": "eBay",
          "ebay.es": "eBay",
          "ebay.ca": "eBay",
          "ebay.com.au": "eBay",
          "ebay.ie": "eBay",
          "ebay.nl": "eBay",
          "ebay.be": "eBay",
          "ebay.at": "eBay",
          "ebay.ch": "eBay",
          "ebay.com.sg": "eBay",
          "walmart.com": "Walmart",
          "etsy.com": "Etsy",
          "asos.com": "ASOS",
          "banggood.com": "Banggood",
          "bestbuy.com": "Best Buy",
          "bestbuy.ca": "Best Buy",
          "bhphotovideo.com": "B&H Photo",
          "carrefour.com": "Carrefour",
          "carrefour.fr": "Carrefour",
          "carrefour.es": "Carrefour",
          "carrefouruae.com": "Carrefour",
          "carrefourksa.com": "Carrefour",
          "cdiscount.com": "Cdiscount",
          "costco.com": "Costco",
          "costco.ca": "Costco",
          "costco.co.uk": "Costco",
          "costco.com.au": "Costco",
          "decathlon.com": "Decathlon",
          "decathlon.fr": "Decathlon",
          "decathlon.co.uk": "Decathlon",
          "decathlon.de": "Decathlon",
          "decathlon.es": "Decathlon",
          "decathlon.it": "Decathlon",
          "decathlon.ca": "Decathlon",
          "depop.com": "Depop",
          "dhgate.com": "DHgate",
          "flipkart.com": "Flipkart",
          "fnac.com": "Fnac",
          "fnac.fr": "Fnac",
          "fnac.es": "Fnac",
          "fnac.pt": "Fnac",
          "fnac.be": "Fnac",
          "fruugo.com": "Fruugo",
          "fruugo.fr": "Fruugo",
          "fruugo.co.uk": "Fruugo",
          "geekbuying.com": "Geekbuying",
          "goat.com": "GOAT",
          "homedepot.com": "Home Depot",
          "homedepot.ca": "Home Depot",
          "ikea.com": "IKEA",
          "ikea.fr": "IKEA",
          "ikea.de": "IKEA",
          "ikea.co.uk": "IKEA",
          "ikea.es": "IKEA",
          "ikea.it": "IKEA",
          "ikea.ca": "IKEA",
          "ikea.ae": "IKEA",
          "ikea.sa": "IKEA",
          "joom.com": "Joom",
          "lazada.com": "Lazada",
          "lazada.sg": "Lazada",
          "lazada.com.my": "Lazada",
          "lazada.co.th": "Lazada",
          "lazada.co.id": "Lazada",
          "lazada.com.ph": "Lazada",
          "lazada.vn": "Lazada",
          "lightinthebox.com": "LightInTheBox",
          "macys.com": "Macy's",
          "mercari.com": "Mercari",
          "mercari.jp": "Mercari",
          "newegg.com": "Newegg",
          "newegg.ca": "Newegg",
          "nike.com": "Nike",
          "noon.com": "Noon",
          "noon.sa": "Noon",
          "noon.ae": "Noon",
          "noon.com.eg": "Noon",
          "nordstrom.com": "Nordstrom",
          "nordstromrack.com": "Nordstrom",
          "onbuy.com": "OnBuy",
          "poshmark.com": "Poshmark",
          "poshmark.ca": "Poshmark",
          "rakuten.com": "Rakuten",
          "rakuten.co.jp": "Rakuten",
          "rakuten.fr": "Rakuten",
          "rakuten.de": "Rakuten",
          "romwe.com": "Romwe",
          "sephora.com": "Sephora",
          "sephora.fr": "Sephora",
          "sephora.co.uk": "Sephora",
          "sephora.ae": "Sephora",
          "sephora.sa": "Sephora",
          "shopee.com": "Shopee",
          "shopee.sg": "Shopee",
          "shopee.com.my": "Shopee",
          "shopee.co.th": "Shopee",
          "shopee.co.id": "Shopee",
          "shopee.ph": "Shopee",
          "shopee.vn": "Shopee",
          "shopee.tw": "Shopee",
          "shopee.com.br": "Shopee",
          "stockx.com": "StockX",
          "target.com": "Target",
          "trendyol.com": "Trendyol",
          "vinted.com": "Vinted",
          "vinted.fr": "Vinted",
          "vinted.co.uk": "Vinted",
          "vinted.de": "Vinted",
          "vinted.es": "Vinted",
          "vinted.it": "Vinted",
          "vinted.pl": "Vinted",
          "vinted.nl": "Vinted",
          "wayfair.com": "Wayfair",
          "wayfair.co.uk": "Wayfair",
          "wayfair.ca": "Wayfair",
          "wayfair.de": "Wayfair",
          "zalando.com": "Zalando",
          "zalando.co.uk": "Zalando",
          "zalando.de": "Zalando",
          "zalando.fr": "Zalando",
          "zalando.es": "Zalando",
          "zalando.it": "Zalando",
          "zalando.nl": "Zalando",
          "zalando.pl": "Zalando",
          "zalando.se": "Zalando",
          "zara.com": "Zara",
          "adidas.com": "Adidas",
          "puma.com": "Puma",
          "lowes.com": "Lowe's",
          "ulta.com": "Ulta Beauty",
          "iherb.com": "iHerb",
          "boohoo.com": "Boohoo",
          "farfetch.com": "Farfetch",
          "mytheresa.com": "Mytheresa",
          "ssense.com": "SSENSE",
          "revolve.com": "Revolve",
          "kohls.com": "Kohl's",
          "overstock.com": "Overstock",
          "allegro.pl": "Allegro",
          "ozon.ru": "Ozon",
          "wildberries.ru": "Wildberries",
          "wildberries.com": "Wildberries",
          "hepsiburada.com": "Hepsiburada",
          "myntra.com": "Myntra",
          "emag.ro": "eMAG",
          "emag.hu": "eMAG",
          "emag.bg": "eMAG",
          "coolblue.nl": "Coolblue",
          "coolblue.be": "Coolblue",
          "mediamarkt.de": "MediaMarkt",
          "mediamarkt.nl": "MediaMarkt",
          "mediamarkt.es": "MediaMarkt",
          "mediamarkt.at": "MediaMarkt",
          "boulanger.com": "Boulanger",
          "boulanger.fr": "Boulanger",
          "darty.com": "Darty",
          "darty.fr": "Darty",
          "fnac-darty.com": "Fnac Darty",
          "shop.app": "Shopify Store",
        };
        const matched = Object.entries(shops).find(([domain]) => hostname === domain || hostname.endsWith("." + domain));
        if (matched) shop = matched[1];
      } catch { /* Invalid legacy URL: keep unknown shop label. */ }
      return { ...request, customerPhone, shop };
    }));
    return json(200, { requests: requestsWithContact });
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
        const mapped = mapCreateQuoteError(createError.code, createError.message);
        return json(mapped.status, mapped.body);
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

    // The database checks status and expiry in the same statement to avoid a
    // stale pre-read allowing an already-expired draft to be sent.
    const { data: quoteRows, error: sendError } = await admin.rpc("send_quote_atomically", {
      p_quote_id: quoteId,
    });
    if (sendError) {
      const mapped = mapSendQuoteError(sendError.code, sendError.message);
      return json(mapped.status, mapped.body);
    }

    const quote = Array.isArray(quoteRows) ? quoteRows[0] : quoteRows;
    if (!quote) return json(500, { error: "Quote sending returned no result" });
    return json(200, { quote: { id: quote.id, status: quote.status } });
  }

  return json(400, { error: "Unsupported action" });
});
