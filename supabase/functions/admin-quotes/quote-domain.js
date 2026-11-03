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
