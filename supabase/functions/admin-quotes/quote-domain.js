// Keep this definition aligned with the active-quote check in the PostgreSQL RPC.
export function isQuoteActive({ status, expiresAt }, now = Date.now()) {
  if (status === "ACCEPTED") return true;
  if (status !== "DRAFT" && status !== "SENT") return false;
  if (expiresAt == null) return true;
  const expiry = Date.parse(expiresAt);
  // Fail closed for malformed timestamps rather than making a possibly active quote re-quotable.
  return !Number.isFinite(expiry) || expiry > now;
}

export function calculateQuoteAmounts({
  currency,
  productCost,
  shippingCost,
  customsEstimate = 0,
  serviceFeeDzd,
  usdToDzdRate,
  eurToDzdRate,
}) {
  const supported = new Set(["USD", "EUR", "DZD"]);
  if (!supported.has(currency)) throw new Error("Unsupported currency");
  for (const [name, value] of Object.entries({ productCost, shippingCost, customsEstimate, serviceFeeDzd })) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a finite non-negative number`);
    }
  }
  const rate = currency === "DZD" ? 1 : currency === "USD" ? usdToDzdRate : eurToDzdRate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("A valid exchange rate is required");
  }
  const serviceFee = Math.round((serviceFeeDzd / rate) * 100) / 100;
  const total = Math.round((productCost + shippingCost + serviceFee + customsEstimate) * 100) / 100;
  return { serviceFee, total };
}
